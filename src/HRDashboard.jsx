import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const col = r => r >= 80 ? '#6EE7B7' : r >= 60 ? '#93C5FD' : r >= 40 ? '#FCD34D' : '#F87171'

export default function HRDashboard({ cu }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    if (!cu?.company_id) return
    const since = new Date(Date.now() - range * 864e5).toISOString()

    Promise.all([
      supabase.from('profiles').select('id,name,role,checkin_streak,last_checkin_date').eq('company_id', cu.company_id),
      supabase.from('checkins').select('user_id,readiness,sleep,sleep_hours,energy,mood,water,created_at').eq('user_id', cu.id).gte('created_at', since).limit(500),
      supabase.from('checkins').select('user_id,readiness,sleep,sleep_hours,energy,mood,water,created_at').gte('created_at', since).limit(500),
      supabase.from('activity_logs').select('user_id,created_at').gte('created_at', since).limit(500),
      supabase.from('symptom_logs').select('user_id,intensity,body_area,created_at').eq('company_id', cu.company_id).gte('created_at', since).limit(200),
      supabase.from('companies').select('name,plan,subscription_status,trial_ends_at').eq('id', cu.company_id).single(),
    ]).then(([profiles, _myCheckins, allCheckins, logs, symptoms, company]) => {
      const members = profiles.data || []
      const checkins = allCheckins.data || []
      const actLogs = logs.data || []
      const symLogs = symptoms.data || []
      const co = company.data

      // Filter checkins to this company's members
      const memberIds = new Set(members.map(m => m.id))
      const compCheckins = checkins.filter(c => memberIds.has(c.user_id))

      // Engagement: members who checked in at least once in the period
      const activeIds = new Set(compCheckins.map(c => c.user_id))
      const actLogIds = new Set(actLogs.filter(l => memberIds.has(l.user_id)).map(l => l.user_id))
      const engagedIds = new Set([...activeIds, ...actLogIds])
      const engagementRate = members.length ? Math.round((engagedIds.size / members.length) * 100) : 0

      // Avg readiness
      const avgReadiness = compCheckins.length
        ? Math.round(compCheckins.reduce((s, c) => s + (c.readiness || 0), 0) / compCheckins.length)
        : null

      // Readiness trend by week
      const weeks = {}
      compCheckins.forEach(c => {
        const d = new Date(c.created_at)
        const wk = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`
        if (!weeks[wk]) weeks[wk] = []
        weeks[wk].push(c.readiness || 0)
      })
      const weeklyTrend = Object.entries(weeks).slice(-6).map(([wk, vals]) => ({
        label: 'Wk ' + wk.split('-W')[1],
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }))

      // Per-metric averages
      const avgSleep = compCheckins.filter(c => c.sleep_hours).length
        ? +(compCheckins.filter(c => c.sleep_hours).reduce((s, c) => s + c.sleep_hours, 0) / compCheckins.filter(c => c.sleep_hours).length).toFixed(1)
        : null
      const avgMood = compCheckins.length ? +(compCheckins.reduce((s, c) => s + (c.mood || 0), 0) / compCheckins.length).toFixed(1) : null
      const avgEnergy = compCheckins.length ? +(compCheckins.reduce((s, c) => s + (c.energy || 0), 0) / compCheckins.length).toFixed(1) : null

      // Risk flags — members with consistently low scores
      const memberCheckins = {}
      compCheckins.forEach(c => {
        if (!memberCheckins[c.user_id]) memberCheckins[c.user_id] = []
        memberCheckins[c.user_id].push(c)
      })
      const risks = []
      members.forEach(m => {
        const mc = memberCheckins[m.id] || []
        if (mc.length < 3) return
        const avgR = mc.reduce((s, c) => s + (c.readiness || 0), 0) / mc.length
        const avgS = mc.filter(c => c.sleep_hours).length ? mc.filter(c => c.sleep_hours).reduce((s, c) => s + c.sleep_hours, 0) / mc.filter(c => c.sleep_hours).length : null
        const avgMd = mc.reduce((s, c) => s + (c.mood || 0), 0) / mc.length
        const flags = []
        if (avgR < 45) flags.push('Low readiness')
        if (avgS && avgS < 6) flags.push('Poor sleep')
        if (avgMd < 2.5) flags.push('Low mood')
        const highPain = symLogs.filter(s => s.user_id === m.id && s.intensity >= 7)
        if (highPain.length >= 2) flags.push('Recurring pain')
        if (flags.length) risks.push({ member: m, flags, avgR: Math.round(avgR) })
      })

      // Top performers (highest avg readiness, min 3 checkins)
      const performers = members
        .map(m => {
          const mc = memberCheckins[m.id] || []
          if (mc.length < 3) return null
          return { member: m, avgR: Math.round(mc.reduce((s, c) => s + (c.readiness || 0), 0) / mc.length), count: mc.length }
        })
        .filter(Boolean)
        .sort((a, b) => b.avgR - a.avgR)
        .slice(0, 5)

      setData({ members, engagementRate, engagedIds, avgReadiness, weeklyTrend, avgSleep, avgMood, avgEnergy, risks, performers, compCheckins, co, symLogs })
      setLoading(false)
    })
  }, [cu?.company_id, range])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading HR report…</div>
  if (!data) return null

  const { members, engagementRate, engagedIds, avgReadiness, weeklyTrend, avgSleep, avgMood, avgEnergy, risks, performers, co } = data
  const trialDays = co?.trial_ends_at ? Math.max(0, Math.ceil((new Date(co.trial_ends_at) - Date.now()) / 864e5)) : null

  return (
    <div>
      {/* Trial banner */}
      {co?.subscription_status === 'trial' && trialDays !== null && (
        <div style={{ background: trialDays <= 3 ? '#F8717115' : '#FCD34D10', border: `1px solid ${trialDays <= 3 ? '#F87171' : '#FCD34D'}33`, borderRadius: 11, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: trialDays <= 3 ? '#F87171' : '#FCD34D', fontWeight: 700 }}>
            🗓 {trialDays} day{trialDays !== 1 ? 's' : ''} left on your free trial
          </div>
          <div style={{ fontSize: 11, color: '#666' }}>Upgrade to keep access</div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>📊 HR Wellness Report</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{co?.name} · {members.length} member{members.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => { setLoading(true); setRange(d) }}
              style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${range === d ? '#6EE7B755' : '#ffffff15'}`, background: range === d ? '#6EE7B720' : 'transparent', color: range === d ? '#6EE7B7' : '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Engagement Rate', val: `${engagementRate}%`, sub: `${engagedIds.size} of ${members.length} active`, col: engagementRate >= 70 ? '#6EE7B7' : engagementRate >= 40 ? '#FCD34D' : '#F87171', icon: '👥' },
          { label: 'Avg Readiness', val: avgReadiness ?? '–', sub: avgReadiness ? (avgReadiness >= 70 ? 'Team is thriving 💚' : avgReadiness >= 50 ? 'Room to improve 💛' : 'Needs attention 🔴') : 'No data yet', col: avgReadiness ? col(avgReadiness) : '#888', icon: '⚡' },
          { label: 'Avg Sleep', val: avgSleep ? `${avgSleep}h` : '–', sub: avgSleep ? (avgSleep >= 7 ? 'Healthy range ✓' : 'Below target') : 'No data', col: avgSleep ? (avgSleep >= 7 ? '#6EE7B7' : '#FCD34D') : '#888', icon: '😴' },
          { label: 'Avg Mood', val: avgMood ? `${avgMood}/5` : '–', sub: avgMood ? (avgMood >= 3.5 ? 'Positive team culture' : 'Worth monitoring') : 'No data', col: avgMood ? (avgMood >= 3.5 ? '#F9A8D4' : '#FCD34D') : '#888', icon: '😊' },
        ].map(m => (
          <div key={m.label} style={{ background: '#ffffff07', borderRadius: 12, padding: '12px 13px', border: `1px solid ${m.col}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{m.label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 22, color: m.col }}>{m.val}</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Readiness trend */}
      {weeklyTrend.length >= 2 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📈 Readiness Trend</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 56 }}>
            {weeklyTrend.map((w, i) => {
              const pct = w.avg / 100
              const c = col(w.avg)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ fontSize: 9, color: c, fontWeight: 700 }}>{w.avg}</div>
                  <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: c, height: `${Math.max(6, pct * 40)}px`, opacity: 0.85 }} />
                  <div style={{ fontSize: 8, color: '#555' }}>{w.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Risk flags */}
      {risks.length > 0 && (
        <div className="card" style={{ marginBottom: 12, borderColor: '#F8717130' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#F87171' }}>⚠️ Wellness Watch List</div>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>Members showing signs that may need support — data is anonymised in team views</div>
          {risks.map(({ member, flags, avgR }) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8717108', borderRadius: 10, padding: '9px 11px', marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F8717122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#F87171', flexShrink: 0 }}>{avgR}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>{member.name}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {flags.map(f => <span key={f} style={{ fontSize: 9, background: '#F8717120', color: '#F87171', borderRadius: 5, padding: '2px 6px', fontWeight: 600 }}>{f}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top performers */}
      {performers.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🏆 Top Performers</div>
          {performers.map(({ member, avgR, count }, i) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 13, color: i === 0 ? '#FCD34D' : '#555', width: 18, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{member.name}</div>
                <div style={{ fontSize: 10, color: '#666' }}>{member.role || 'Team member'} · {count} check-ins</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: col(avgR) }}>{avgR}</div>
            </div>
          ))}
        </div>
      )}

      {/* Energy avg */}
      {avgEnergy && (
        <div style={{ background: '#FCD34D10', border: '1px solid #FCD34D22', borderRadius: 11, padding: '11px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#FCD34D' }}>⚡ Avg Team Energy</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{avgEnergy >= 3.5 ? 'Team is energised' : 'Energy levels are low — consider lighter challenges this week'}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#FCD34D' }}>{avgEnergy}/5</div>
        </div>
      )}

      {/* No data state */}
      {!data.compCheckins.length && (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#666', fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          No check-in data yet for this period. Share the invite link with your team to get started.
        </div>
      )}
    </div>
  )
}
