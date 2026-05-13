import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Signup from './Signup'

export default function Join({ code }) {
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from('invite_links')
        .select('*, teams(*)')
        .eq('code', code)
        .eq('active', true)
        .single()
      if (error || !data) {
        setInvalid(true)
      } else {
        setTeam(data.teams)
      }
      setLoading(false)
    }
    fetchInvite()
  }, [code])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#6EE7B7',fontSize:14}}>Loading invite…</div>
    </div>
  )

  if (invalid) return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340,background:'linear-gradient(135deg,#ffffff09,#ffffff04)',border:'1px solid #ffffff12',borderRadius:20,padding:32,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>❌</div>
        <div style={{fontWeight:800,fontSize:20,color:'#e8e8f0',marginBottom:8}}>Invalid invite link</div>
        <div style={{fontSize:13,color:'#888'}}>This link may have expired or been disabled. Ask your admin for a new one.</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:18,background:`${team.color}22`,border:`2px solid ${team.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 12px'}}>{team.emoji}</div>
          <div style={{fontWeight:800,fontSize:18,color:'#e8e8f0',marginBottom:4}}>You're invited to join</div>
          <div style={{fontWeight:800,fontSize:22,color:team.color}}>{team.name}</div>
          <div style={{fontSize:13,color:'#888',marginTop:6}}>on VibeFit — create your account below</div>
        </div>
        <Signup inviteCode={code} inviteTeamId={team.id} onSwitch={()=>{}}/>
      </div>
    </div>
  )
}