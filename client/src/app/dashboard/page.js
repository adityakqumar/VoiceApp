'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCall, ROOM_STATES } from '@/context/CallContext';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { 
    roomState, 
    activeUsers, 
    roomEvents, 
    isMuted, 
    joinRoom, 
    leaveRoom, 
    toggleMute 
  } = useCall();
  const eventsEndRef = useRef(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Auto-scroll events
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomEvents]);

  if (loading || !isAuthenticated) {
    return (
      <div
        className="gradient-bg"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      </div>
    );
  }

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Navbar />

      <div className="gradient-bg" style={{ minHeight: '100vh', paddingTop: 90 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>

          {/* User card */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              marginBottom: 24,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              alignItems: 'center',
            }}
          >
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
                flexShrink: 0,
              }}
            >
              {user.displayName?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
                Welcome, {user.displayName}
              </h1>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Join the global room to start talking with everyone.
              </p>
            </div>

            {/* Main Action Button */}
            <div>
              {roomState === ROOM_STATES.IDLE && (
                <button
                  onClick={joinRoom}
                  className="btn-success"
                  style={{
                    padding: '16px 32px',
                    fontSize: '1.1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  🎧 Join Global Room
                </button>
              )}
              {roomState === ROOM_STATES.JOINING && (
                <button disabled className="btn-success" style={{ padding: '16px 32px', opacity: 0.7 }}>
                  Joining...
                </button>
              )}
              {roomState === ROOM_STATES.CONNECTED && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={toggleMute}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 600,
                      background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      color: isMuted ? '#ef4444' : '#e2e8f0',
                      border: isMuted ? '2px solid rgba(239, 68, 68, 0.4)' : '2px solid rgba(30, 58, 95, 0.5)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                  </button>
                  <button
                    onClick={leaveRoom}
                    className="btn-danger"
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    📵 Leave Room
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grid: Events & Online users when connected */}
          {roomState === ROOM_STATES.CONNECTED && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {/* Event Feed */}
              <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>📜</span>
                  Room Events
                </h2>
                
                <div 
                  style={{
                    flex: 1,
                    minHeight: '200px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {roomEvents.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', margin: 'auto' }}>
                      No events yet.
                    </div>
                  ) : (
                    roomEvents.map((ev) => (
                      <div 
                        key={ev.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <span style={{ color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                          [{formatTime(ev.timestamp)}]
                        </span>
                        <span style={{ 
                          color: ev.type === 'join' ? '#10b981' : '#ef4444',
                          fontWeight: 500
                        }}>
                          {ev.message}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={eventsEndRef} />
                </div>
              </div>

              {/* Active Users */}
              <div className="glass-card" style={{ padding: '28px' }}>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span className="status-dot status-online" style={{ width: 12, height: 12 }} />
                  In Room
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#64748b',
                      marginLeft: 'auto',
                    }}
                  >
                    {activeUsers.length + 1} participants
                  </span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Self User */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'white',
                        marginRight: 12
                      }}
                    >
                      {user.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#60a5fa' }}>
                        {user.displayName} (You)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Joined just now
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>
                      {isMuted ? '🔇' : '🎤'}
                    </div>
                  </div>

                  {/* Remote Users */}
                  {activeUsers.map((u) => (
                    <div
                      key={u.callId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(30, 58, 95, 0.3)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'white',
                          marginRight: 12
                        }}
                      >
                        {u.displayName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {u.displayName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Joined at {formatTime(u.timestamp || u.joinTime || new Date())}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* How it works (when not connected) */}
          {roomState === ROOM_STATES.IDLE && (
            <div className="glass-card" style={{ padding: '28px', marginTop: 24 }}>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                Welcome to the Global Room
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 20,
                }}
              >
                {[
                  { icon: '🌍', title: 'One Room', desc: 'Everyone connects to the same common space' },
                  { icon: '🎧', title: 'Speak & Listen', desc: 'Real-time multi-way voice chat' },
                  { icon: '🔒', title: 'Private & Secure', desc: 'Emails are hidden, only names are shown' },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center',
                      padding: '20px 16px',
                      borderRadius: 12,
                      background: 'rgba(30, 41, 59, 0.3)',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
