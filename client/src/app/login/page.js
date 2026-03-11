'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, updateUser, isAuthenticated, isProfileComplete } = useAuth();

  const [step, setStep] = useState('email'); // email | otp | displayName
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated && isProfileComplete) {
    router.push('/dashboard');
    return null;
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.sendOtp(email);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.verifyOtp(email, otp);
      login(data.token, data.user);

      if (data.isNewUser || !data.user.isProfileComplete) {
        setStep('displayName');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDisplayName = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.setDisplayName(displayName);
      updateUser(data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="gradient-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div className="glass-card" style={{ padding: '48px 40px', maxWidth: 440, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 16px',
            }}
          >
            📞
          </div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 8,
            }}
          >
            VoiceApp
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            {step === 'email' && 'Sign in to start making voice calls'}
            {step === 'otp' && 'Enter the verification code'}
            {step === 'displayName' && 'Choose your display name'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Email step */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{ marginBottom: 20 }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !email}
              style={{ width: '100%' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="spinner" /> Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              Code sent to <strong style={{ color: '#3b82f6' }}>{email}</strong>
            </div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: 8,
              }}
            >
              Verification Code
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              autoFocus
              style={{
                marginBottom: 20,
                textAlign: 'center',
                letterSpacing: '0.5em',
                fontSize: '1.3rem',
                fontWeight: 600,
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || otp.length !== 6}
              style={{ width: '100%', marginBottom: 12 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="spinner" /> Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        {/* Display name step */}
        {step === 'displayName' && (
          <form onSubmit={handleSetDisplayName}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: 8,
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Choose a display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              required
              autoFocus
              style={{ marginBottom: 8 }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 20 }}>
              This is what other users will see. 2-30 characters. Letters, numbers, spaces, hyphens, underscores only.
            </p>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || displayName.length < 2}
              style={{ width: '100%' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="spinner" /> Setting up...
                </span>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>
        )}

        {/* Privacy notice */}
        <p
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#475569',
          }}
        >
          🔒 Your email is private and never visible to other users
        </p>
      </div>
    </div>
  );
}
