import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340,background:'linear-gradient(135deg,#ffffff09,#ffffff04)',border:'1px solid #ffffff12',borderRadius:20,padding:32}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontWeight:800,fontSize:28,background:'linear-gradient(90deg,#6EE7B7,#93C5FD)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:6}}>VIBEFIT</div>
          <div style={{fontSize:13,color:'#888'}}>Sign in to your account</div>
        </div>
        {error && <div style={{background:'#F9A8D420',border:'1px solid #F9A8D444',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F9A8D4',marginBottom:14}}>{error}</div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'#888',marginBottom:5}}>Password</div>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password" onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={{width:'100%',background:'#ffffff08',border:'1px solid #ffffff15',color:'#e8e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,outline:'none'}}/>
        </div>
        <button onClick={handleLogin} disabled={loading} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#6EE7B7,#93C5FD)',color:'#080810',fontWeight:800,fontSize:15,cursor:'pointer'}}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'#888'}}>
          Don't have an account?{' '}
          <span onClick={onSwitch} style={{color:'#6EE7B7',cursor:'pointer',fontWeight:700}}>Sign up</span>
        </div>
      </div>
    </div>
  )
}