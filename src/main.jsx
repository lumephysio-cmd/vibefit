import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabase'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import Join from './Join'

function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)

  // Check for invite link in URL
  const path = window.location.pathname
  const joinMatch = path.match(/^\/join\/(.+)$/)
  const joinCode = joinMatch ? joinMatch[1] : null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontWeight:800,fontSize:24,background:'linear-gradient(90deg,#6EE7B7,#93C5FD)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VIBEFIT</div>
    </div>
  )

  // If someone visits /join/xxxxx show the join page
  if (joinCode) return <Join code={joinCode}/>

  // If not logged in show login or signup
  if (!session) {
    if (showSignup) return <Signup onSwitch={()=>setShowSignup(false)}/>
    return <Login onSwitch={()=>setShowSignup(true)}/>
  }

  // Logged in — show the main app
  return <App session={session}/>
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>)
