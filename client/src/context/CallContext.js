'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import {
  createPeerConnection,
  getLocalAudioStream,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  closePeerConnection,
  stopStream,
} from '@/lib/webrtc';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

// Call states
export const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  INCOMING: 'incoming',
  CONNECTED: 'connected',
};

export function CallProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callTimerRef = useRef(null);
  const incomingOfferRef = useRef(null);

  // Set up socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    // Request online users on connect
    const handleConnect = () => {
      socket.emit('get-online-users');
    };

    // Online users list
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    // User came online
    const handleUserOnline = (userData) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.callId === userData.callId)) return prev;
        return [...prev, userData];
      });
    };

    // User went offline
    const handleUserOffline = ({ callId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.callId !== callId));
    };

    // Incoming call
    const handleIncomingCall = async ({ from, offer }) => {
      if (callState !== CALL_STATES.IDLE) {
        // Busy — reject
        socket.emit('reject-call', { targetCallId: from.callId });
        return;
      }
      setRemoteUser(from);
      incomingOfferRef.current = offer;
      setCallState(CALL_STATES.INCOMING);
    };

    // Call answered
    const handleCallAnswered = async ({ from, answer }) => {
      try {
        if (peerConnectionRef.current) {
          await setRemoteDescription(peerConnectionRef.current, answer);
        }
        setCallState(CALL_STATES.CONNECTED);
        startCallTimer();
      } catch (error) {
        console.error('Error handling call answer:', error);
        cleanupCall();
      }
    };

    // ICE candidate
    const handleIceCandidate = ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        addIceCandidate(peerConnectionRef.current, candidate);
      }
    };

    // Call rejected
    const handleCallRejected = () => {
      cleanupCall();
    };

    // Call ended
    const handleCallEnded = () => {
      cleanupCall();
    };

    // Call error
    const handleCallError = ({ message }) => {
      console.error('Call error:', message);
      cleanupCall();
    };

    socket.on('connect', handleConnect);
    socket.on('online-users', handleOnlineUsers);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-answered', handleCallAnswered);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-error', handleCallError);

    // If already connected, request online users
    if (socket.connected) {
      socket.emit('get-online-users');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('online-users', handleOnlineUsers);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-answered', handleCallAnswered);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-error', handleCallError);
    };
  }, [isAuthenticated, callState]);

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanupCall = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    closePeerConnection(peerConnectionRef.current);
    peerConnectionRef.current = null;

    stopStream(localStreamRef.current);
    localStreamRef.current = null;

    incomingOfferRef.current = null;

    setCallState(CALL_STATES.IDLE);
    setRemoteUser(null);
    setIsMuted(false);
    setCallDuration(0);
  }, []);

  // Start a call
  const startCall = useCallback(async (targetCallId, targetDisplayName) => {
    const socket = getSocket();
    if (!socket) return;

    try {
      setCallState(CALL_STATES.CALLING);
      setRemoteUser({ callId: targetCallId, displayName: targetDisplayName });

      // Get local audio stream
      const localStream = await getLocalAudioStream();
      localStreamRef.current = localStream;

      // Create peer connection
      const pc = await createPeerConnection(
        // onIceCandidate
        (candidate) => {
          socket.emit('ice-candidate', { targetCallId, candidate });
        },
        // onTrack
        (remoteStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        },
        // onConnectionStateChange
        (state) => {
          console.log('Connection state:', state);
          if (state === 'disconnected' || state === 'failed') {
            cleanupCall();
          }
        }
      );

      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Create and send offer
      const offer = await createOffer(pc);
      socket.emit('call-user', { targetCallId, offer });
    } catch (error) {
      console.error('Failed to start call:', error);
      cleanupCall();
    }
  }, [cleanupCall]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    const socket = getSocket();
    if (!socket || !incomingOfferRef.current || !remoteUser) return;

    try {
      const localStream = await getLocalAudioStream();
      localStreamRef.current = localStream;

      const pc = await createPeerConnection(
        (candidate) => {
          socket.emit('ice-candidate', { targetCallId: remoteUser.callId, candidate });
        },
        (remoteStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        },
        (state) => {
          console.log('Connection state:', state);
          if (state === 'disconnected' || state === 'failed') {
            cleanupCall();
          }
        }
      );

      peerConnectionRef.current = pc;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      await setRemoteDescription(pc, incomingOfferRef.current);
      const answer = await createAnswer(pc);

      socket.emit('call-answer', { targetCallId: remoteUser.callId, answer });

      setCallState(CALL_STATES.CONNECTED);
      startCallTimer();
    } catch (error) {
      console.error('Failed to answer call:', error);
      cleanupCall();
    }
  }, [remoteUser, cleanupCall]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const socket = getSocket();
    if (socket && remoteUser) {
      socket.emit('reject-call', { targetCallId: remoteUser.callId });
    }
    cleanupCall();
  }, [remoteUser, cleanupCall]);

  // End active call
  const endCall = useCallback(() => {
    const socket = getSocket();
    if (socket && remoteUser) {
      socket.emit('end-call', { targetCallId: remoteUser.callId });
    }
    cleanupCall();
  }, [remoteUser, cleanupCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        remoteUser,
        isMuted,
        callDuration,
        onlineUsers,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        remoteAudioRef,
      }}
    >
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
