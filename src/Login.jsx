import { useState } from 'react'
import { supabase } from './supabase'

const inp = {
  width: '100%',
  background: '#ffffff08',
  border: '1px solid #ffffff15',
  color: '#e8e8f0',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
}
const card = {
  width: 340,
  background: 'linear-gradient(135deg,#ffffff09,#ffffff04)',
  border: '1px solid #ffffff12',
  borderRadius: 20,
  padding: 32,
}
const wrap = {
  minHeight: '100vh',
  background: '#080810',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  fontFamily: "'Inter',system-ui,sans-serif",
}

export default function Login({ onSwitch }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState('login')   // 'login' | 'forgot'
  const [forgotSent, setForgotSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    // Always redirect to the live site, not localhost
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: siteUrl,
    })
    if (error) setError(error.message)
    else setForgotSent(true)
    setLoading(false)
  }

  // ── Forgot password — sent confirmation ──
  if (mode === 'forgot' && forgotSent) return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#e8e8f0', marginBottom: 10 }}>
          Check your email!
        </div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65, marginBottom: 24 }}>
          We sent a password reset link to{' '}
          <span style={{ color: '#6EE7B7', fontWeight: 700 }}>{email}</span>.
          Click the link to set a new password, then come back and sign in.
        </div>
        <button
          onClick={() => { setMode('login'); setForgotSent(false); setError(''); }}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #6EE7B744', background: '#6EE7B722', color: '#6EE7B7', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  )

  // ── Forgot password — email input ──
  if (mode === 'forgot') return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 28, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            WELLCREW
          </div>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🔑</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#e8e8f0', marginBottom: 4 }}>Forgot your password?</div>
          <div style={{ fontSize: 13, color: '#888' }}>No worries — we'll email you a reset link.</div>
        </div>

        {error && (
          <div style={{ background: '#F9A8D420', border: '1px solid #F9A8D444', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F9A8D4', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>Email address</div>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            type="email"
            onKeyDown={e => e.key === 'Enter' && handleForgot()}
            style={inp}
          />
        </div>

        <button
          onClick={handleForgot}
          disabled={loading || !email.trim()}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: (!email.trim() ? 0.6 : 1) }}
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
          Remembered it?{' '}
          <span onClick={() => { setMode('login'); setError(''); }} style={{ color: '#6EE7B7', cursor: 'pointer', fontWeight: 700 }}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  )

  // ── Regular login ──
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 28, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            WELLCREW
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>Sign in to your account</div>
        </div>

        {error && (
          <div style={{ background: '#F9A8D420', border: '1px solid #F9A8D444', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F9A8D4', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>Email</div>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            type="email"
            style={inp}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>Password</div>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inp}
          />
        </div>

        {/* Forgot password link */}
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <span
            onClick={() => { setMode('forgot'); setError(''); }}
            style={{ fontSize: 12, color: '#6EE7B7', cursor: 'pointer', fontWeight: 600 }}
          >
            Forgot password?
          </span>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
          Don't have an account?{' '}
          <span onClick={onSwitch} style={{ color: '#6EE7B7', cursor: 'pointer', fontWeight: 700 }}>Sign up</span>
        </div>
      </div>
    </div>
  )
}
