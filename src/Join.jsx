import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Signup from './Signup'

export default function Join({ code }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const fetchInvite = async () => {
      const { data: invite, error } = await supabase
        .from('invite_links')
        .select('*, teams(*), companies(*)')
        .eq('code', code)
        .eq('active', true)
        .single()
      if (error || !invite) {
        setInvalid(true)
      } else {
        setData(invite)
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

  // Admin invite (company-level)
  const isAdminInvite = data.invite_type === 'admin'
  const company = data.companies
  const team = data.teams

  // Determine display entity
  const displayEntity = isAdminInvite ? company : (team || company)
  const displayColor = displayEntity?.color || '#6EE7B7'
  const displayEmoji = displayEntity?.emoji || '🏢'
  const displayName = displayEntity?.name || 'your team'

  return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:340}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:18,background:`${displayColor}22`,border:`2px solid ${displayColor}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 12px'}}>{displayEmoji}</div>
          {isAdminInvite ? (
            <>
              <div style={{fontWeight:800,fontSize:18,color:'#e8e8f0',marginBottom:4}}>You're invited as an Admin of</div>
              <div style={{fontWeight:800,fontSize:22,color:displayColor}}>{displayName}</div>
              <div style={{fontSize:13,color:'#888',marginTop:6}}>on VibeFit — create your admin account below</div>
              <div style={{marginTop:10,background:'#C4B5FD15',border:'1px solid #C4B5FD33',borderRadius:10,padding:'8px 14px',display:'inline-block'}}>
                <span style={{fontSize:12,color:'#C4B5FD',fontWeight:700}}>👑 Company Admin Access</span>
              </div>
            </>
          ) : (
            <>
              <div style={{fontWeight:800,fontSize:18,color:'#e8e8f0',marginBottom:4}}>You're invited to join</div>
              <div style={{fontWeight:800,fontSize:22,color:displayColor}}>{displayName}</div>
              <div style={{fontSize:13,color:'#888',marginTop:6}}>on VibeFit — create your account below</div>
            </>
          )}
        </div>
        <Signup
          inviteCode={code}
          inviteTeamId={team?.id || null}
          inviteCompanyId={data.company_id}
          inviteIsAdmin={isAdminInvite}
          onSwitch={()=>{}}
        />
      </div>
    </div>
  )
}
