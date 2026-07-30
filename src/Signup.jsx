import { useState } from 'react'
import { supabase } from './supabase'

export default function Signup({ onSwitch, inviteCode, inviteTeamId, inviteCompanyId, inviteIsAdmin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    setResending(true)
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: inviteCode ? `${siteUrl}/join/${inviteCode}` : siteUrl } })
    setResent(true)
    setResending(false)
  }

  const handleSignup = async () => {
    if (!name || !email || !password) return
    setLoading(true)
    setError('')
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          // Store invite info in metadata so profile update can be applied after email confirmation
          pending_team_id: inviteTeamId || null,
          pending_company_id: inviteCompanyId || null,
          pending_is_admin: inviteIsAdmin || false,
        },
        emailRedirectTo: inviteCode ? `${siteUrl}/join/${inviteCode}` : siteUrl,
      }
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    // Fire Day 1 onboarding email (non-blocking)
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ to: email, name: name || email.split('@')[0], day: 1 }),
    }).catch(() => {});
    if (data.user && data.session) {
      // Session exists (email confirmation disabled in this project) — apply profile update now
      // and skip the "check your email" screen since no email was sent.
      const updates = {}
      if (inviteTeamId) updates.team_id = inviteTeamId
      if (inviteCompanyId) updates.company_id = inviteCompanyId
      if (inviteIsAdmin) updates.is_admin = true
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', data.user.id)
      }
      setLoading(false)
      return
    }
    // No session yet — email confirmation is required, invite info is stored
    // in user metadata and will be applied in main.jsx on SIGNED_IN event
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340,background:'linear-gradient(135deg,#ffffff09,#ffffff04)',border:'1px solid #ffffff12',borderRadius:20,padding:32,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>📧</div>
        <div style={{fontWeight:800,fontSize:20,color:'#e8e8f0',marginBottom:8}}>Check your email!</div>
        <div style={{fontSize:13,color:'#888',lineHeight:1.6,marginBottom:20}}>
          We sent a confirmation link to{' '}
          <span style={{color:'#6EE7B7'}}>{email}</span>.
          Click it to activate your account, then come back and sign in.
        </div>
        {resent ? (
          <div style={{fontSize:13,color:'#6EE7B7',fontWeight:700}}>✅ New link sent!</div>
        ) : (
          <div style={{fontSize:12,color:'#666'}}>
            Didn't get it?{' '}
            <span
              onClick={!resending ? handleResend : undefined}
              style={{color:'#6EE7B7',cursor:resending?'default':'pointer',fontWeight:700,opacity:resending?0.5:1}}
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </span>
          </div>
        )}
        <div style={{marginTop:20,borderTop:'1px solid #ffffff10',paddingTop:16}}>
          <span onClick={onSwitch} style={{fontSize:13,color:'#888',cursor:'pointer'}}>
            Already verified? <span style={{color:'#6EE7B7',fontWeight:700}}>Sign in →</span>
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340,background:'linear-gradient(135deg,#ffffff09,#ffffff04)',border:'1px solid #ffffff12',borderRadius:20,padding:32}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontWeight:800,fontSize:28,background:'linear-gradient(90deg,#6EE7B7,#93C5FD)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:6}}>WELLCREW</div>
          <div style={{fontSize:13,color:'#888'}}>{inviteCode ? "You've been invited! Create your account" : 'Create your account'}</div>
        </div>
        {error && <div style={{background:'#F9A8D420',border:'1px solid #F9A8D444',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F9A8D4',marginBottom:14}}>{error}</div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Full Name</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name here" style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Role / Job Title</div>
          <input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Physiotherapist" style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Password</div>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password" style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
        </div>
        <button onClick={handleSignup} disabled={loading} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#6EE7B7,#93C5FD)',color:'#080810',fontWeight:800,fontSize:15,cursor:'pointer'}}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'#888'}}>
          Already have an account?{' '}
          <span onClick={onSwitch} style={{color:'#6EE7B7',cursor:'pointer',fontWeight:700}}>Sign in</span>
        </div>
      </div>
    </div>
  )
}
