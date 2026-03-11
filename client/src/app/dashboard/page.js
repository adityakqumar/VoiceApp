'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCall, CALL_STATES } from '@/context/CallContext';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import IncomingCall from '@/components/IncomingCall';
import ActiveCall from '@/components/ActiveCall';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isProfileComplete, loading } = useAuth();
  const { callState, onlineUsers, startCall } = useCall();

  const [targetCallId, setTargetCallId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [callError, setCallError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && isAuthenticated && !isProfileComplete) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isProfileComplete, router]);

  if (loading || !isAuthenticated || !isProfileComplete) {
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

  const handleLookup = async () => {
    if (!targetCallId.trim()) return;
    setLookupError('');
    setLookupResult(null);

    try {
      const data = await api.lookupUser(targetCallId.trim().toUpperCase());
      setLookupResult(data);
    } catch (err) {
      setLookupError(err.message);
    }
  };

  const handleCall = async () => {
    if (!lookupResult) return;
    setCallError('');
    try {
      await startCall(lookupResult.callId, lookupResult.displayName);
    } catch (err) {
      setCallError(err.message);
    }
  };

  const handleDirectCall = async (targetUser) => {
    setCallError('');
    try {
      await startCall(targetUser.callId, targetUser.displayName);
    } catch (err) {
      setCallError(err.message);
    }
  };

  const copyCallId = () => {
    navigator.clipboard.writeText(user.callId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Navbar />
      <IncomingCall />
      <ActiveCall />

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
                {user.displayName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#3b82f6',
                    fontFamily: 'monospace',
                  }}
                >
                  📋 {user.callId}
                </span>
                <button
                  onClick={copyCallId}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.7)',
                    border: copied
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(30, 58, 95, 0.5)',
                    color: copied ? '#10b981' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 8 }}>
                Share your Call ID with others so they can reach you
              </p>
            </div>
          </div>

          {/* Grid: Dial & Online */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {/* Dial section */}
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
                <span style={{ fontSize: '1.3rem' }}>📱</span>
                Make a Call
              </h2>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter Call ID (e.g. CALL-A3F8K2)"
                  value={targetCallId}
                  onChange={(e) => {
                    setTargetCallId(e.target.value.toUpperCase());
                    setLookupResult(null);
                    setLookupError('');
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleLookup}
                  className="btn-primary"
                  disabled={!targetCallId.trim()}
                  style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
                >
                  Find
                </button>
              </div>

              {lookupError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginBottom: 12,
                  }}
                >
                  {lookupError}
                </div>
              )}

              {callError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginBottom: 12,
                  }}
                >
                  {callError}
                </div>
              )}

              {lookupResult && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'white',
                      }}
                    >
                      {lookupResult.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {lookupResult.displayName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {lookupResult.callId}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCall}
                    className="btn-success"
                    style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                  >
                    📞 Call
                  </button>
                </div>
              )}
            </div>

            {/* Online users */}
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
                <span className="status-dot status-online" />
                Online Users
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#64748b',
                    marginLeft: 'auto',
                  }}
                >
                  {onlineUsers.length} online
                </span>
              </h2>

              {onlineUsers.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    color: '#64748b',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>👥</div>
                  <p style={{ fontSize: '0.9rem' }}>No other users online</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>
                    Share your Call ID to connect
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {onlineUsers.map((u) => (
                    <div
                      key={u.callId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(30, 58, 95, 0.3)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                          }}
                        >
                          {u.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {u.displayName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {u.callId}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDirectCall(u)}
                        disabled={callState !== CALL_STATES.IDLE}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        📞
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card" style={{ padding: '28px', marginTop: 24 }}>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              How It Works
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 20,
              }}
            >
              {[
                { icon: '📋', title: 'Share Your ID', desc: 'Copy your Call ID and share it with friends' },
                { icon: '📞', title: 'Make a Call', desc: 'Enter their Call ID and hit Call' },
                { icon: '🔒', title: 'Private & Secure', desc: 'Peer-to-peer encrypted voice — emails stay private' },
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
        </div>
      </div>
    </>
  );
}
