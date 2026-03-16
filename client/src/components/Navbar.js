'use client';

import { useAuth } from '@/context/AuthContext';
import { useCall, ROOM_STATES } from '@/context/CallContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { roomState } = useCall();

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(30, 58, 95, 0.3)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          📞
        </div>
        <span
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          VoiceApp
        </span>
        {roomState === ROOM_STATES.CONNECTED && (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            ● In Call
          </span>
        )}
      </div>

      {/* User info & logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.displayName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {user.callId}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(30, 58, 95, 0.5)',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(239, 68, 68, 0.15)')}
            onMouseLeave={(e) => (e.target.style.background = 'rgba(30, 41, 59, 0.7)')}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
