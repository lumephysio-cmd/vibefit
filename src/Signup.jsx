import { useState } from 'react'
import { supabase } from './supabase'

export default function Signup({ onSwitch, inviteCode, inviteTeamId }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSignup = async () => {
    if (!name || !email || !password) return
    setLoading(true)
    setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        role,
        team_id: inviteTeamId || null,
        color: '#6EE7B7',
        is_admin: false,
      })
    }
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340,background:'linear-gradient(135deg,#ffffff09,#ffffff04)',border:'1px solid #ffffff12',borderRadius:20,padding:32,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>📧</div>
        <div style={{fontWeight:800,fontSize:20,color:'#e8e8f0',marginBottom:8}}>Check your email!</div>
        <div style={{fontSize:13,color:'#888',lineHeight:1.6}}>We sent a confirmation link to <span style={{color:'#6EE7B7'}}>{email}</span>. Click it to activate your account then come back and sign in.</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340,background:'linear-gradient(135deg,#ffffff09,#ffffff04)',border:'1px solid #ffffff12',borderRadius:20,padding:32}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontWeight:800,fontSize:28,background:'linear-gradient(90deg,#6EE7B7,#93C5FD)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:6}}>VIBEFIT</div>
          <div style={{fontSize:13,color:'#888'}}>{inviteCode ? 'You\'ve been invited! Create your account' : 'Create your account'}</div>
        </div>
        {error && <div style={{background:'#F9A8D420',border:'1px solid #F9A8D444',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F9A8D4',marginBottom:14}}>{error}</div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Full Name</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Brooke Cassar" style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
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