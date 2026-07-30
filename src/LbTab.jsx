import { useState, useMemo, useEffect } from 'react'
import { supabase } from './supabase'
import { BADGE_DEFS } from './badges'

// ── HELPERS ──
const ini = n => n ? n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '?'
const Av = ({ u, s = 32 }) => (
  <div style={{
    width: s, height: s, borderRadius: '50%',
    background: `linear-gradient(135deg,${u.color || '#6EE7B7'}33,${u.color || '#6EE7B7'}66)`,
    border: `2px solid ${u.color || '#6EE7B7'}55`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: s * .34, fontWeight: 700, color: u.color || '#6EE7B7', flexShrink: 0,
  }}>{ini(u.name)}</div>
)

const TrendArrow = ({ curr, prev }) => {
  if (prev == null || curr == null) return null
  const diff = prev - curr // positive = moved up
  if (diff === 0) return <span style={{ fontSize: 9, color: '#555' }}>—</span>
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: diff > 0 ? '#6EE7B7' : '#F87171' }}>
      {diff > 0 ? '↑' : '↓'}{Math.abs(diff)}
    </span>
  )
}

// ── PODIUM ──
const Podium = ({ top3, users }) => {
  const slots = [
    { rank: 2, height: 72, color: '#93C5FD', medal: '🥈', idx: 1 },
    { rank: 1, height: 100, color: '#FCD34D', medal: '🥇', idx: 0 },
    { rank: 3, height: 52, color: '#FB923C', medal: '🥉', idx: 2 },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 20, paddingTop: 12 }}>
      {slots.map(({ rank, height, color, medal, idx }) => {
        const entry = top3[idx]
        const user = entry ? users.find(u => u.id === entry.uid) : null
        if (!user && !entry) return (
          <div key={rank} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ffffff08', border: '2px solid #ffffff10', marginBottom: 8 }} />
            <div style={{ height, background: `${color}18`, border: `1px solid ${color}22`, borderRadius: '8px 8px 0 0', width: '100%' }} />
          </div>
        )
        return (
          <div key={rank} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{medal}</div>
            {user && <Av u={user} s={rank === 1 ? 48 : 38} />}
            <div style={{ fontSize: 10, fontWeight: 700, color: color, marginTop: 5, marginBottom: 6, textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0] || '?'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 700 }}>
              {entry?.pts?.toLocaleString() || 0}
            </div>
            <div style={{
              height,
              width: '100%',
              background: `linear-gradient(180deg,${color}44,${color}18)`,
              border: `1px solid ${color}44`,
              borderRadius: '8px 8px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: rank === 1 ? 18 : 14,
            }}>{rank}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── MAIN LEADERBOARD TAB ──
export default function LbTab({ lb, feed, users, challenges, cu, teams, badges: allBadges }) {
  const [view, setView] = useState('week')
  const [challengeFilter, setChallengeFilter] = useState(null)

  // Compute weekly leaderboard
  const weekLb = useMemo(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const pts = {}
    feed.filter(p => new Date(p.ts) >= weekStart).forEach(post => {
      const ch = challenges.find(c => String(c.id) === String(post.cid))
      if (!ch) return
      const p = ch.type === 'habit' ? 100 : (post.val || 0)
      pts[post.uid] = (pts[post.uid] || 0) + p
    })
    return Object.entries(pts).map(([uid, p]) => ({ uid, pts: p })).sort((a, b) => b.pts - a.pts)
  }, [feed, challenges])

  // Compute previous week for trend arrows
  const prevWeekLb = useMemo(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const prevStart = new Date(weekStart)
    prevStart.setDate(prevStart.getDate() - 7)
    const pts = {}
    feed.filter(p => {
      const ts = new Date(p.ts)
      return ts >= prevStart && ts < weekStart
    }).forEach(post => {
      const ch = challenges.find(c => String(c.id) === String(post.cid))
      if (!ch) return
      const p = ch.type === 'habit' ? 100 : (post.val || 0)
      pts[post.uid] = (pts[post.uid] || 0) + p
    })
    return Object.entries(pts).map(([uid, p]) => ({ uid, pts: p })).sort((a, b) => b.pts - a.pts)
  }, [feed, challenges])

  // Team leaderboard
  const teamLb = useMemo(() => {
    if (!teams?.length) return []
    const teamMap = {}
    teams.forEach(t => { teamMap[t.id] = { team: t, pts: 0, members: 0, avgPts: 0 } })
    const allUsers = users
    allUsers.forEach(u => {
      if (!u.team_id || !teamMap[u.team_id]) return
      const entry = lb.find(e => e.uid === u.id)
      teamMap[u.team_id].pts += entry?.pts || 0
      teamMap[u.team_id].members++
    })
    // Include cu in team calc
    if (cu?.team_id && teamMap[cu.team_id]) {
      const myEntry = lb.find(e => e.uid === cu.id)
      teamMap[cu.team_id].pts += myEntry?.pts || 0
      teamMap[cu.team_id].members++
    }
    return Object.values(teamMap)
      .filter(t => t.members > 0)
      .map(t => ({ ...t, avgPts: t.members > 0 ? Math.round(t.pts / t.members) : 0 }))
      .sort((a, b) => b.pts - a.pts)
  }, [lb, teams, users, cu])

  // Streak leaderboard — users sorted by checkin_streak
  const streakLb = useMemo(() => {
    const allUsers = [cu, ...users].filter(Boolean)
    return allUsers
      .map(u => ({ uid: u.id, name: u.name, color: u.color, streak: u.checkin_streak || 0 }))
      .filter(u => u.streak > 0)
      .sort((a, b) => b.streak - a.streak)
  }, [users, cu])

  // Active board (switch by view)
  const activeLb = view === 'week' ? weekLb : view === 'alltime' ? lb : []
  const medals = ['🥇', '🥈', '🥉']
  const maxPts = activeLb[0]?.pts || 1

  // Badge pills for a user
  const userBadges = uid => (allBadges || []).filter(b => b.user_id === uid).slice(0, 3)

  const [timeFilter, setTimeFilter] = useState('week') // 'week' | 'alltime' within people view

  const MAIN_TABS = [
    { id: 'people',  label: 'People',  icon: '👤' },
    { id: 'teams',   label: 'Teams',   icon: '👥' },
    { id: 'streaks', label: 'Streaks', icon: '🔥' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Leaderboard</div>

      {/* Main toggle: People | Teams | Streaks */}
      <div style={{ display: 'flex', gap: 5, background: '#ffffff07', borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flex: 1, padding: '9px 4px', borderRadius: 9,
            border: view === t.id ? '1px solid #6EE7B733' : '1px solid transparent',
            background: view === t.id ? '#6EE7B728' : 'transparent',
            color: view === t.id ? '#6EE7B7' : '#666',
            fontSize: 12, fontWeight: view === t.id ? 700 : 400,
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* People: week / all-time sub-toggle */}
      {view === 'people' && (
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {[['week','This Week','📅'],['alltime','All Time','🏆']].map(([id,lbl,icon]) => (
            <button key={id} onClick={() => setTimeFilter(id)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              border: `1px solid ${timeFilter===id ? '#6EE7B755' : '#ffffff15'}`,
              background: timeFilter===id ? '#6EE7B722' : 'transparent',
              color: timeFilter===id ? '#6EE7B7' : '#666',
            }}>{icon} {lbl}</button>
          ))}
        </div>
      )}

      {/* ── WEEK / ALL TIME VIEW ── */}
      {(view === 'week' || view === 'alltime') && (
        <>
          {/* Podium top 3 */}
          {activeLb.length >= 2 && (
            <div style={{ background: 'linear-gradient(135deg,#ffffff08,#ffffff04)', border: '1px solid #ffffff10', borderRadius: 18, padding: '16px 12px 0', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textAlign: 'center', marginBottom: 2 }}>
                {view === 'week' ? '🏆 THIS WEEK\'S PODIUM' : '🏆 ALL TIME TOP 3'}
              </div>
              <Podium top3={activeLb.slice(0, 3)} users={[cu, ...users].filter(Boolean)} />
            </div>
          )}

          {/* Challenge filter pills */}
          {challenges.filter(c => c.active).length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
              <button onClick={() => setChallengeFilter(null)} style={{
                flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 11,
                border: `1px solid ${challengeFilter == null ? '#6EE7B755' : '#ffffff18'}`,
                background: challengeFilter == null ? '#6EE7B722' : 'transparent',
                color: challengeFilter == null ? '#6EE7B7' : '#888', fontWeight: 700,
              }}>All</button>
              {challenges.filter(c => c.active).map(c => (
                <button key={c.id} onClick={() => setChallengeFilter(c.id)} style={{
                  flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 11,
                  border: `1px solid ${challengeFilter === c.id ? c.color + '55' : '#ffffff18'}`,
                  background: challengeFilter === c.id ? c.color + '22' : 'transparent',
                  color: challengeFilter === c.id ? c.color : '#888', fontWeight: 700,
                }}>{c.icon} {c.title}</button>
              ))}
            </div>
          )}

          {/* Full ranked list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {activeLb.map((entry, i) => {
              const allUsers = [cu, ...users].filter(Boolean)
              const u = allUsers.find(x => x.id === entry.uid)
              if (!u) return null
              const me = u.id === cu?.id
              const pct = Math.min(1, entry.pts / maxPts)
              const prevRank = view === 'week' ? prevWeekLb.findIndex(e => e.uid === entry.uid) : null
              const ubadges = userBadges(entry.uid)

              return (
                <div key={entry.uid} style={{
                  background: me ? `${u.color || '#6EE7B7'}0d` : '#ffffff08',
                  border: `1px solid ${me ? (u.color || '#6EE7B7') + '44' : '#ffffff10'}`,
                  borderRadius: 14, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rank */}
                    <div style={{ fontWeight: 900, fontSize: i < 3 ? 20 : 13, width: 28, textAlign: 'center', flexShrink: 0, color: i === 0 ? '#FCD34D' : i === 1 ? '#93C5FD' : i === 2 ? '#FB923C' : '#666' }}>
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </div>
                    {/* Avatar */}
                    <Av u={u} s={36} />
                    {/* Name + badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>
                          {u.name?.split(' ')[0]}
                          {me && <span style={{ fontSize: 10, color: u.color || '#6EE7B7', marginLeft: 5 }}>you</span>}
                        </span>
                        {ubadges.map(b => {
                          const def = BADGE_DEFS[b.badge_type]
                          return def ? <span key={b.badge_type} title={def.label} style={{ fontSize: 12 }}>{def.icon}</span> : null
                        })}
                        {u.checkin_streak >= 3 && (
                          <span style={{ fontSize: 10, color: '#FB923C', fontWeight: 700, background: '#FB923C18', borderRadius: 10, padding: '1px 5px' }}>
                            🔥{u.checkin_streak}
                          </span>
                        )}
                        {view === 'week' && prevRank != null && (
                          <TrendArrow curr={i} prev={prevRank} />
                        )}
                      </div>
                      {/* Progress bar */}
                      <div style={{ background: '#ffffff10', borderRadius: 4, height: 4, marginTop: 6 }}>
                        <div style={{
                          width: `${pct * 100}%`, height: '100%',
                          background: `linear-gradient(90deg,${u.color || '#6EE7B7'},${u.color || '#6EE7B7'}88)`,
                          borderRadius: 4,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                    {/* Points */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: u.color || '#6EE7B7' }}>{entry.pts.toLocaleString()}</div>
                      <div style={{ fontSize: 9, color: '#555' }}>pts</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {activeLb.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No activity {view === 'week' ? 'this week' : 'yet'}</div>
              <div style={{ fontSize: 12 }}>Log a challenge to appear on the board!</div>
            </div>
          )}

          {/* Your position if not in top list */}
          {cu && activeLb.length > 0 && !activeLb.find(e => e.uid === cu.id) && (
            <div style={{ marginTop: 12, background: `${cu.color || '#6EE7B7'}0d`, border: `1px solid ${cu.color || '#6EE7B7'}33`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#888', width: 28 }}>—</div>
              <Av u={cu} s={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{cu.name?.split(' ')[0]} <span style={{ fontSize: 10, color: cu.color || '#6EE7B7' }}>you</span></div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Log activity to get on the board!</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#555' }}>0</div>
            </div>
          )}
        </>
      )}

      {/* ── TEAMS VIEW ── */}
      {view === 'teams' && (
        <>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Total challenge points aggregated by team</div>
          {teamLb.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No team scores yet</div>
              <div style={{ fontSize: 12 }}>Teams need members and activity logs to compete.</div>
            </div>
          ) : (
            <>
              {/* Team podium — top 3 */}
              {teamLb.length >= 2 && (
                <div style={{ background: 'linear-gradient(135deg,#ffffff08,#ffffff04)', border: '1px solid #ffffff10', borderRadius: 18, padding: '14px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textAlign: 'center', marginBottom: 12 }}>🏆 TEAM BATTLE</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
                    {[
                      { idx: 1, height: 70, medal: '🥈' },
                      { idx: 0, height: 100, medal: '🥇' },
                      { idx: 2, height: 50, medal: '🥉' },
                    ].map(({ idx, height, medal }) => {
                      const t = teamLb[idx]
                      if (!t) return <div key={idx} style={{ flex: 1 }} />
                      const c = t.team.color || '#6EE7B7'
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: 16, marginBottom: 3 }}>{medal}</div>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{t.team.emoji || '👥'}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: c, textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{t.team.name}</div>
                          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>{t.pts.toLocaleString()} pts</div>
                          <div style={{ height, width: '100%', background: `linear-gradient(180deg,${c}44,${c}18)`, border: `1px solid ${c}44`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: c, fontWeight: 700 }}>
                            {t.members} 👤
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Team list */}
              {teamLb.map((t, i) => {
                const c = t.team.color || '#6EE7B7'
                const isMyTeam = cu?.team_id === t.team.id
                const pct = Math.min(1, t.pts / (teamLb[0]?.pts || 1))
                return (
                  <div key={t.team.id} style={{
                    background: isMyTeam ? `${c}0d` : '#ffffff08',
                    border: `1px solid ${isMyTeam ? c + '44' : '#ffffff10'}`,
                    borderRadius: 14, padding: '14px', marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontWeight: 900, fontSize: i < 3 ? 18 : 13, width: 28, textAlign: 'center', color: i === 0 ? '#FCD34D' : i === 1 ? '#93C5FD' : i === 2 ? '#FB923C' : '#666' }}>
                        {i < 3 ? medals[i] : `#${i + 1}`}
                      </div>
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: `${c}22`, border: `1px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{t.team.emoji || '👥'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{t.team.name}</span>
                          {isMyTeam && <span style={{ fontSize: 9, color: c, background: `${c}22`, borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>YOUR TEAM</span>}
                        </div>
                        <div style={{ background: '#ffffff10', borderRadius: 4, height: 5 }}>
                          <div style={{ width: `${pct * 100}%`, height: '100%', background: `linear-gradient(90deg,${c},${c}88)`, borderRadius: 4, transition: 'width .6s' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: c }}>{t.pts.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>{t.members} members</div>
                        <div style={{ fontSize: 9, color: '#555' }}>~{t.avgPts}/person</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </>
      )}

      {/* ── STREAKS VIEW ── */}
      {view === 'streaks' && (
        <>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Consecutive daily check-in streaks 🔥</div>

          {streakLb.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔥</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No streaks yet!</div>
              <div style={{ fontSize: 12 }}>Complete a daily check-in to start your streak.</div>
            </div>
          ) : (
            streakLb.map((e, i) => {
              const allUsers = [cu, ...users].filter(Boolean)
              const u = allUsers.find(x => x.id === e.uid)
              if (!u) return null
              const me = u.id === cu?.id
              const maxStreak = streakLb[0]?.streak || 1
              const pct = Math.min(1, e.streak / maxStreak)
              const streakColor = e.streak >= 14 ? '#C4B5FD' : e.streak >= 7 ? '#FB923C' : e.streak >= 3 ? '#FCD34D' : '#6EE7B7'
              return (
                <div key={e.uid} style={{
                  background: me ? `${u.color || '#6EE7B7'}0d` : '#ffffff08',
                  border: `1px solid ${me ? (u.color || '#6EE7B7') + '44' : '#ffffff10'}`,
                  borderRadius: 14, padding: '12px 14px', marginBottom: 7,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 900, fontSize: i < 3 ? 20 : 13, width: 28, textAlign: 'center', flexShrink: 0, color: i === 0 ? '#FCD34D' : i === 1 ? '#93C5FD' : i === 2 ? '#FB923C' : '#666' }}>
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </div>
                    <Av u={u} s={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {u.name?.split(' ')[0]}
                        {me && <span style={{ fontSize: 10, color: u.color || '#6EE7B7', marginLeft: 5 }}>you</span>}
                      </div>
                      <div style={{ background: '#ffffff10', borderRadius: 4, height: 4, marginTop: 5 }}>
                        <div style={{ width: `${pct * 100}%`, height: '100%', background: `linear-gradient(90deg,${streakColor},${streakColor}88)`, borderRadius: 4, transition: 'width .6s' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 20, color: streakColor }}>🔥{e.streak}</div>
                      <div style={{ fontSize: 9, color: '#555' }}>day streak</div>
                    </div>
                  </div>
                  {/* Streak milestone label */}
                  {e.streak >= 3 && (
                    <div style={{ marginTop: 8, fontSize: 10, color: streakColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {e.streak >= 30 ? '⭐ Month Master' : e.streak >= 14 ? '💪 Two Week Titan' : e.streak >= 7 ? '🔥🔥 Week Warrior' : '🔥 On a Roll'}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Streak tips */}
          <div style={{ marginTop: 16, background: '#FB923C0d', border: '1px solid #FB923C22', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FB923C', marginBottom: 6 }}>🔥 How streaks work</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
              Complete your daily check-in every day to build a streak. Miss a day and your streak resets to 0. Streaks earn you 🔥 fire badges!
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {[['3 days', '🔥 On a Roll', '#FCD34D'], ['7 days', '🔥🔥 Week Warrior', '#FB923C'], ['30 days', '⭐ Month Master', '#C4B5FD']].map(([days, label, c]) => (
                <div key={days} style={{ background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 8, padding: '4px 8px', fontSize: 10, color: c, fontWeight: 700 }}>{days} → {label}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
