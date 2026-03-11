'use client';

// Default STUN servers (always work, free)
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Fetch TURN credentials from Metered.ca API (free 50GB/month)
// Set NEXT_PUBLIC_METERED_API_KEY in your .env to enable TURN relay
let cachedIceServers = null;

export async function getIceServers() {
  // Return cached if already fetched
  if (cachedIceServers) return cachedIceServers;

  // Option 1: Custom TURN server from env (static credentials)
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    cachedIceServers = [
      ...DEFAULT_ICE_SERVERS,
      { urls: turnUrl, username: turnUsername, credential: turnCredential },
    ];
    return cachedIceServers;
  }

  // Option 2: Metered.ca free TURN API (recommended)
  const meteredApiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;
  const meteredDomain = process.env.NEXT_PUBLIC_METERED_DOMAIN || 'global.relay.metered.ca';

  if (meteredApiKey) {
    try {
      const response = await fetch(
        `https://${meteredDomain}/api/v1/turn/credentials?apiKey=${meteredApiKey}`
      );
      if (response.ok) {
        const turnServers = await response.json();
        cachedIceServers = [...DEFAULT_ICE_SERVERS, ...turnServers];
        console.log('✅ TURN credentials fetched from Metered.ca');
        return cachedIceServers;
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch TURN credentials, using STUN only:', err.message);
    }
  }

  // Fallback: STUN only (works ~80-85% of the time)
  console.warn('⚠️ No TURN server configured — calls may fail behind strict NATs');
  cachedIceServers = DEFAULT_ICE_SERVERS;
  return cachedIceServers;
}

export async function createPeerConnection(onIceCandidate, onTrack, onConnectionStateChange) {
  const iceServers = await getIceServers();

  const pc = new RTCPeerConnection({
    iceServers,
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    onTrack(event.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    onConnectionStateChange(pc.connectionState);
  };

  return pc;
}

export async function getLocalAudioStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    return stream;
  } catch (error) {
    console.error('Failed to get audio stream:', error);
    throw new Error('Microphone access is required for voice calls');
  }
}

export async function createOffer(peerConnection) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(peerConnection) {
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
}

export async function setRemoteDescription(peerConnection, description) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
}

export function addIceCandidate(peerConnection, candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

export function closePeerConnection(peerConnection) {
  if (peerConnection) {
    peerConnection.close();
  }
}

export function stopStream(stream) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
