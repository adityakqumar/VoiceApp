'use client';

import { useCall, CALL_STATES } from '@/context/CallContext';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ActiveCall() {
  const { callState, remoteUser, isMuted, callDuration, endCall, toggleMute } = useCall();

  if (callState !== CALL_STATES.CONNECTED && callState !== CALL_STATES.CALLING) {
    return null;
  }

  const isCalling = callState === CALL_STATES.CALLING;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0e1a 0%, #0f172a 50%, #0a0e1a 100%)',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: isCalling
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 32,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {isCalling ? (
          <>
            <span className="blink" style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
              ●
            </span>
            <span style={{ color: '#f59e0b', fontSize: '0.95rem', fontWeight: 500 }}>
              Calling...
            </span>
          </>
        ) : (
          <>
            <span style={{ color: '#10b981', fontSize: '0.9rem' }}>●</span>
            <span style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: 500 }}>
              Connected
            </span>
            <span
              style={{
                color: '#94a3b8',
                fontSize: '1.1rem',
                fontWeight: 600,
                marginLeft: 8,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatDuration(callDuration)}
            </span>
          </>
        )}
      </div>

      {/* Remote user avatar */}
      <div
        className={isCalling ? 'float-animation' : ''}
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          fontWeight: 700,
          color: 'white',
          marginBottom: 20,
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {remoteUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* Remote user name */}
      <h2
        style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          marginBottom: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {remoteUser?.displayName || 'Unknown'}
      </h2>
      <p
        style={{
          color: '#64748b',
          fontSize: '0.85rem',
          marginBottom: 48,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {remoteUser?.callId}
      </p>

      {/* Call controls */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Mute button */}
        <button
          onClick={toggleMute}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            background: isMuted
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(30, 41, 59, 0.7)',
            color: isMuted ? '#ef4444' : '#e2e8f0',
            border: isMuted
              ? '2px solid rgba(239, 68, 68, 0.4)'
              : '2px solid rgba(30, 58, 95, 0.5)',
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        {/* End call button */}
        <button
          onClick={endCall}
          className="btn-danger"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            padding: 0,
            fontSize: '1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📵
        </button>
      </div>
    </div>
  );
}
