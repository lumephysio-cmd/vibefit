import { useState } from 'react'
import { supabase } from './supabase'

const EMOJIS = ['🏢','🚀','💼','🌿','⚡','🎯','🏆','💡','🌊','🔥','🎪','🏋️']

export default function RegisterCompany({ onBack }) {
  const [step, setStep] = useState(1) // 1=company info, 2=admin account, 3=done
  const [companyName, setCompanyName] = useState('')
  const [companyEmoji, setCompanyEmoji] = useState('🏢')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const handleRegister = async () => {
    if (!name || !email || !password) return
    setLoading(true)
    setError('')
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin

      // 1. Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { name, role, pending_is_admin: true },
          emailRedirectTo: siteUrl,
        }
      })
      if (authErr) throw authErr

      const userId = authData.user?.id
      if (!userId) throw new Error('Could not create account')

      // 2. Create company with 14-day trial
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .insert({ name: companyName, emoji: companyEmoji, created_by: userId, plan: 'trial', subscription_status: 'trial' })
        .select().single()
      if (compErr) throw compErr

      // 3. Update profile with company + admin
      await supabase.from('profiles')
        .update({ company_id: company.id, is_admin: true, name, role })
        .eq('id', userId)

      // 4. Create a default "General" team
      const { data: team } = await supabase.from('teams')
        .insert({ name: 'General', emoji: '👥', color: '#6EE7B7', company_id: company.id })
        .select().single()

      // 5. Generate team invite link
      const code = Math.random().toString(36).slice(2, 10).toUpperCase()
      await supabase.from('invite_links').insert({
        company_id: company.id,
        team_id: team?.id || null,
        code,
        created_by: userId,
        active: true,
        invite_type: 'member',
      })
      setInviteLink(`${siteUrl}/join/${code}`)
      setStep(3)
    } catch (e) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  if (step === 3) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ width: 380, background: 'linear-gradient(135deg,#ffffff09,#ffffff04)', border: '1px solid #ffffff12', borderRadius: 20, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#e8e8f0', marginBottom: 8 }}>You're all set!</div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7, marginBottom: 24 }}>
          <span style={{ color: '#6EE7B7', fontWeight: 700 }}>{companyName}</span> is live on Wellcrew.<br/>
          Check your email to confirm your account, then sign in.
        </div>

        <div style={{ background: '#6EE7B710', border: '1px solid #6EE7B730', borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#6EE7B7', marginBottom: 6 }}>📋 Team invite link — share this with your staff:</div>
          <div style={{ fontSize: 11, color: '#aaa', wordBreak: 'break-all', marginBottom: 10 }}>{inviteLink}</div>
          <button onClick={() => { navigator.clipboard.writeText(inviteLink) }} style={{ background: '#6EE7B722', border: '1px solid #6EE7B744', color: '#6EE7B7', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Copy Link
          </button>
        </div>

        <div style={{ background: '#93C5FD10', border: '1px solid #93C5FD25', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#93C5FD', marginBottom: 20 }}>
          🗓 Your 14-day free trial has started. No credit card needed yet.
        </div>

        <button onClick={onBack} style={{ width: '100%', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 11, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          Go to Sign In →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui,sans-serif', color: '#e8e8f0' }}>
      <div style={{ width: 400 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 22, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>WELLCREW</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#e8e8f0', marginBottom: 4 }}>Register your company</div>
          <div style={{ fontSize: 12, color: '#666' }}>14-day free trial · No credit card required</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: step >= s ? '#6EE7B7' : '#ffffff15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: step >= s ? '#080810' : '#555' }}>{s}</div>
              {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? '#6EE7B7' : '#ffffff10', borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,#ffffff09,#ffffff04)', border: '1px solid #ffffff12', borderRadius: 18, padding: 24 }}>

          {step === 1 && <>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#6EE7B7' }}>① Company details</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Company name</div>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Corp" style={inp}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Pick an emoji for your company</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMOJIS.map(em => (
                  <button key={em} onClick={() => setCompanyEmoji(em)} style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${companyEmoji === em ? '#6EE7B755' : '#ffffff15'}`, background: companyEmoji === em ? '#6EE7B720' : '#ffffff08', fontSize: 18, cursor: 'pointer' }}>{em}</button>
                ))}
              </div>
            </div>

            <button onClick={() => { if (companyName.trim()) setStep(2) }} disabled={!companyName.trim()}
              style={{ ...btn, opacity: companyName.trim() ? 1 : 0.4 }}>
              Next →
            </button>
          </>}

          {step === 2 && <>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#6EE7B7' }}>② Your admin account</div>

            {[
              { label: 'Your name', val: name, set: setName, ph: 'Sarah Jones' },
              { label: 'Work email', val: email, set: setEmail, ph: 'sarah@acmecorp.com', type: 'email' },
              { label: 'Job title (optional)', val: role, set: setRole, ph: 'Head of People & Culture' },
              { label: 'Password', val: password, set: setPassword, ph: '••••••••', type: 'password' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>{f.label}</div>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type={f.type || 'text'} style={inp} />
              </div>
            ))}

            {error && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 12, background: '#F8717115', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#ffffff0a', border: '1px solid #ffffff15', color: '#888', borderRadius: 11, padding: '11px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Back</button>
              <button onClick={handleRegister} disabled={loading || !name || !email || !password}
                style={{ ...btn, flex: 2, opacity: (!name || !email || !password) ? 0.4 : 1 }}>
                {loading ? 'Setting up…' : 'Launch Wellcrew 🚀'}
              </button>
            </div>
          </>}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}>
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = { width: '100%', background: '#ffffff0a', border: '1px solid #ffffff18', borderRadius: 10, padding: '10px 13px', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const btn = { width: '100%', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 11, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }
