'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

export const ROOM_STATES = {
  IDLE: 'idle',
  JOINING: 'joining',
  CONNECTED: 'connected',
};

export function CallProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [roomState, setRoomState] = useState(ROOM_STATES.IDLE);
  const [activeUsers, setActiveUsers] = useState([]);
  const [roomEvents, setRoomEvents] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Map: socketId -> RTCPeerConnection
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);

  // We play audio by creating Audio elements dynamically
  const audioElementsRef = useRef(new Map());

  const addRoomEvent = useCallback((event) => {
    setRoomEvents((prev) => [...prev, event]);
  }, []);

  const createPeerConnection = useCallback((targetSocketId, isInitiator) => {
    const socket = getSocket();
    if (!socket) return null;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { targetSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (!audioElementsRef.current.has(targetSocketId)) {
        const audioEl = new Audio();
        audioEl.autoplay = true;
        audioElementsRef.current.set(targetSocketId, audioEl);
      }
      const audioEl = audioElementsRef.current.get(targetSocketId);
      audioEl.srcObject = event.streams[0];
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanupPeer(targetSocketId);
      }
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  }, []);

  const cleanupPeer = useCallback((targetSocketId) => {
    const pc = peerConnectionsRef.current.get(targetSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(targetSocketId);
    }
    const audioEl = audioElementsRef.current.get(targetSocketId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioElementsRef.current.delete(targetSocketId);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const handleRoomActiveUsers = async (users) => {
      setActiveUsers(users);
      setRoomState(ROOM_STATES.CONNECTED);
      
      // We are connecting to all existing users
      for (const user of users) {
        const pc = createPeerConnection(user.socketId, true);
        if (pc) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { targetSocketId: user.socketId, offer });
          } catch (e) {
            console.error('Error creating offer for', user.displayName, e);
          }
        }
      }
    };

    const handleUserJoined = (user) => {
      setActiveUsers((prev) => [...prev, user]);
      addRoomEvent({
        id: Math.random().toString(),
        type: 'join',
        message: `${user.displayName} joined the room`,
        timestamp: user.timestamp
      });
      // We wait for the new user to send us an offer
    };

    const handleUserLeft = (user) => {
      setActiveUsers((prev) => prev.filter((u) => u.callId !== user.callId));
      addRoomEvent({
        id: Math.random().toString(),
        type: 'leave',
        message: `${user.displayName} left the room`,
        timestamp: user.timestamp
      });
      
      // Cleanup peer connection based on socketId if we had it mapped
      // For simplicity, we can clean up any disconnected peers automatically 
      // via iceConnectionState change, but if we had their socketId, we could do it here.
    };

    // Signaling
    const handleOffer = async ({ fromSocketId, fromCallId, displayName, offer }) => {
      try {
        let pc = peerConnectionsRef.current.get(fromSocketId);
        if (!pc) {
          pc = createPeerConnection(fromSocketId, false);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { targetSocketId: fromSocketId, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const handleAnswer = async ({ fromSocketId, answer }) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    socket.on('room-active-users', handleRoomActiveUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('room-active-users', handleRoomActiveUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [isAuthenticated, createPeerConnection, addRoomEvent]);

  const joinRoom = useCallback(async () => {
    try {
      setRoomState(ROOM_STATES.JOINING);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const socket = getSocket();
      if (socket) {
        socket.emit('join-room');
      }
    } catch (err) {
      console.error('Failed to get local stream or join room:', err);
      setRoomState(ROOM_STATES.IDLE);
    }
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('leave-room');
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    
    // Stop local audio
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Cleanup audio elements
    audioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioElementsRef.current.clear();

    setRoomState(ROOM_STATES.IDLE);
    setActiveUsers([]);
    setRoomEvents([]);
    setIsMuted(false);
  }, []);

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
        roomState,
        activeUsers,
        roomEvents,
        isMuted,
        joinRoom,
        leaveRoom,
        toggleMute,
      }}
    >
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
