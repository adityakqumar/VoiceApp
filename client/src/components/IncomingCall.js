'use client';

import { useCall, CALL_STATES } from '@/context/CallContext';

export default function IncomingCall() {
  const { callState, remoteUser, answerCall, rejectCall } = useCall();

  if (callState !== CALL_STATES.INCOMING || !remoteUser) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '48px',
          textAlign: 'center',
          maxWidth: 400,
          width: '90%',
        }}
      >
        {/* Animated ring */}
        <div
          style={{
            position: 'relative',
            width: 100,
            height: 100,
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Pulse rings */}
          <div
            className="pulse-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.4)',
            }}
          />
          <div
            className="pulse-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              animationDelay: '0.5s',
            }}
          />
          <div
            className="pulse-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.2)',
              animationDelay: '1s',
            }}
          />
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'white',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {remoteUser.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>

        {/* Caller info */}
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 6 }}>
          Incoming Voice Call
        </p>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {remoteUser.displayName}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 36 }}>
          {remoteUser.callId}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={rejectCall}
            className="btn-danger"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              padding: 0,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <button
            onClick={answerCall}
            className="btn-success"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              padding: 0,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
