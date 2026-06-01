import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabase'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import Join from './Join'
import Landing from './Landing'

// ── RESET PASSWORD SCREEN ──
// Shown when user clicks the reset link in their email (Supabase fires PASSWORD_RECOVERY)
function ResetPassword({ onDone }) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  const inp = {
    width: '100%',
    background: '#ffffff08',
    border: '1px solid #ffffff15',
    color: '#e8e8f0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'system-ui,sans-serif',
  }

  const handleReset = async () => {
    if (!password) { setError('Please enter a new password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError("Passwords don't match."); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  const wrap = {
    minHeight: '100vh',
    background: '#080810',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'system-ui,sans-serif',
    color: '#e8e8f0',
  }
  const card = {
    width: 340,
    background: 'linear-gradient(135deg,#ffffff09,#ffffff04)',
    border: '1px solid #ffffff12',
    borderRadius: 20,
    padding: 32,
  }

  // Success state
  if (done) return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#e8e8f0', marginBottom: 10 }}>
          Password updated!
        </div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65, marginBottom: 24 }}>
          Your new password is set. Click below to sign in.
        </div>
        <button
          onClick={onDone}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
        >
          Sign In →
        </button>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 28, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            VIBEFIT
          </div>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🔑</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Set a new password</div>
          <div style={{ fontSize: 13, color: '#888' }}>Choose something memorable!</div>
        </div>

        {error && (
          <div style={{ background: '#F9A8D420', border: '1px solid #F9A8D444', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F9A8D4', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>New password</div>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            style={inp}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>Confirm new password</div>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            type="password"
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            style={inp}
          />
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
        >
          {loading ? 'Updating…' : 'Set New Password'}
        </button>
      </div>
    </div>
  )
}

// ── ROOT ──
function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen]   = useState('landing') // 'landing' | 'login' | 'signup'
  const [resetMode, setResetMode] = useState(false)  // true = show ResetPassword screen

  // Check for invite link in URL
  const path = window.location.pathname
  const joinMatch = path.match(/^\/join\/(.+)$/)
  const joinCode = joinMatch ? joinMatch[1] : null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      // When user clicks the reset link in their email, Supabase fires this event
      if (event === 'PASSWORD_RECOVERY') {
        setResetMode(true)
      }
      // After they update their password, clear reset mode
      if (event === 'USER_UPDATED') {
        setResetMode(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ fontWeight: 800, fontSize: 24, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        VIBEFIT
      </div>
    </div>
  )

  // Password recovery — show reset form (takes priority over everything)
  if (resetMode) return (
    <ResetPassword onDone={() => { setResetMode(false); setScreen('login') }} />
  )

  // Invite link
  if (joinCode) return <Join code={joinCode} />

  // Not logged in
  if (!session) {
    if (screen === 'signup') return <Signup onSwitch={() => setScreen('login')} inviteCode={null} inviteTeamId={null} />
    if (screen === 'login')  return <Login onSwitch={() => setScreen('signup')} />
    return <Landing onSignup={() => setScreen('signup')} onLogin={() => setScreen('login')} />
  }

  // Logged in
  return <App session={session} />
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
