import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── HELPERS ──
const SURVEY_QUESTIONS = [
  { key: 'workload',   label: 'Workload',           icon: '⚡', color: '#FB923C', q: 'My workload feels manageable this week' },
  { key: 'balance',    label: 'Work-Life Balance',  icon: '⚖️', color: '#6EE7B7', q: 'I have a healthy balance between work and personal life' },
  { key: 'connection', label: 'Team Connection',    icon: '🤝', color: '#93C5FD', q: 'I feel connected and supported by my team' },
  { key: 'physical',   label: 'Physical Comfort',   icon: '💪', color: '#C4B5FD', q: 'My physical workspace and comfort at work is good' },
  { key: 'overall',    label: 'Overall Wellbeing',  icon: '🌟', color: '#FCD34D', q: 'Overall, I feel good about my wellbeing at work' },
]

const PULSE_EMOJIS = ['😫', '😕', '😐', '🙂', '😄']
const AGREE_LABELS  = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']

const scoreColor = s => s >= 4 ? '#6EE7B7' : s >= 3 ? '#FCD34D' : s >= 2 ? '#FB923C' : '#F87171'

const Pill = ({ color, text }) => (
  <span style={{ fontSize: 10, background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
    {text}
  </span>
)

// ── TREND SPARKLINE ──
const TrendLine = ({ data, color = '#6EE7B7' }) => {
  if (!data || data.length < 2) return null
  const W = 200, H = 44
  const vals = data.map(d => d.avg || 0)
  const mn = Math.min(...vals, 0), mx = Math.max(...vals, 5)
  const rng = mx - mn || 1
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - ((v - mn) / rng) * (H - 8) - 4}`).join(' ')
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* zone bands */}
      <rect x="0" y="0" width={W} height={H * 0.3} fill="#F8717108" />
      <rect x="0" y={H * 0.3} width={W} height={H * 0.4} fill="#FCD34D08" />
      <rect x="0" y={H * 0.7} width={W} height={H * 0.3} fill="#6EE7B708" />
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#tlg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => {
        const cx = (i / (vals.length - 1)) * W
        const cy = H - ((v - mn) / rng) * (H - 8) - 4
        return <circle key={i} cx={cx} cy={cy} r="3.5" fill={scoreColor(v)} />
      })}
    </svg>
  )
}

// ── SCORE RING ──
const ScoreRing = ({ score, size = 60 }) => {
  const c = scoreColor(score)
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 5) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff0f" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontWeight: 900, fontSize: size * 0.26, color: c, lineHeight: 1 }}>{score?.toFixed(1) || '–'}</span>
        <span style={{ fontSize: size * 0.12, color: '#555', lineHeight: 1 }}>/5</span>
      </div>
    </div>
  )
}

// ── MAIN INSIGHTS SECTION ──
export default function InsightsSection({ cu, session, users }) {
  const [view, setView] = useState('pulse')

  // Pulse state
  const [pulses, setPulses]           = useState([])
  const [pulseHistory, setPulseHistory] = useState([])
  const [pulseResults, setPulseResults] = useState({}) // keyed by pulse_id
  const [newQuestion, setNewQuestion] = useState('How is the team feeling this week?')
  const [creatingPulse, setCreatingPulse] = useState(false)

  // Survey state
  const [surveys, setSurveys]         = useState([])
  const [surveyResults, setSurveyResults] = useState({})
  const [newSurveyTitle, setNewSurveyTitle] = useState('Monthly Wellbeing Check')
  const [creatingSurvey, setCreatingSurvey] = useState(false)

  // Load pulses + history
  useEffect(() => {
    if (!cu?.company_id) return
    supabase.from('mood_pulses').select('*').eq('company_id', cu.company_id)
      .order('week_of', { ascending: false }).limit(12)
      .then(({ data }) => { if (data) setPulses(data) })
    supabase.rpc('get_pulse_history', { company_uuid: cu.company_id })
      .then(({ data }) => { if (data) setPulseHistory(Array.isArray(data) ? data : []) })
  }, [cu?.company_id])

  // Load surveys
  useEffect(() => {
    if (!cu?.company_id) return
    supabase.from('wellbeing_surveys').select('*').eq('company_id', cu.company_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setSurveys(data) })
  }, [cu?.company_id])

  const loadPulseResult = async (pulseId) => {
    if (pulseResults[pulseId]) return
    const { data } = await supabase.rpc('get_pulse_results', { pulse_uuid: pulseId })
    if (data) setPulseResults(r => ({ ...r, [pulseId]: data }))
  }

  const loadSurveyResult = async (surveyId) => {
    if (surveyResults[surveyId]) return
    const { data } = await supabase.rpc('get_survey_results', { survey_uuid: surveyId })
    if (data) setSurveyResults(r => ({ ...r, [surveyId]: data }))
  }

  const createPulse = async () => {
    if (!newQuestion.trim() || !cu?.company_id) return
    setCreatingPulse(true)
    const weekOf = new Date()
    weekOf.setDate(weekOf.getDate() - weekOf.getDay()) // Monday
    const { data, error } = await supabase.from('mood_pulses').insert({
      company_id: cu.company_id,
      question: newQuestion.trim(),
      week_of: weekOf.toISOString().slice(0, 10),
      created_by: session.user.id,
      is_active: true,
    }).select().single()
    if (!error && data) {
      setPulses(p => [data, ...p])
      setNewQuestion('How is the team feeling this week?')
    }
    setCreatingPulse(false)
  }

  const createSurvey = async () => {
    if (!cu?.company_id) return
    setCreatingSurvey(true)
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data, error } = await supabase.from('wellbeing_surveys').insert({
      company_id: cu.company_id,
      title: newSurveyTitle.trim() || 'Monthly Wellbeing Check',
      period,
      created_by: session.user.id,
      is_active: true,
    }).select().single()
    if (!error && data) setSurveys(s => [data, ...s])
    setCreatingSurvey(false)
  }

  const toggleActive = async (table, id, current) => {
    await supabase.from(table).update({ is_active: !current }).eq('id', id)
    if (table === 'mood_pulses') setPulses(ps => ps.map(p => p.id === id ? { ...p, is_active: !current } : p))
    else setSurveys(sv => sv.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  const totalMembers = (users?.length || 0) + 1

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🧠 Team Insights</span>
        <Pill color="#C4B5FD" text="ANONYMOUS" />
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>
        Anonymous pulse & survey data — you see <strong style={{ color: '#e8e8f0' }}>team averages only</strong>. Individual responses are never visible.
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#ffffff08', borderRadius: 11, padding: 3, marginBottom: 18 }}>
        {[['pulse', '🌡️ Mood Pulse'], ['surveys', '📋 Surveys']].map(([id, lbl]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex: 1, padding: '7px', borderRadius: 8, border: 'none',
            background: view === id ? '#C4B5FD22' : 'transparent',
            color: view === id ? '#C4B5FD' : '#666', fontSize: 11, fontWeight: view === id ? 700 : 400,
          }}>{lbl}</button>
        ))}
      </div>

      {/* ── MOOD PULSE ── */}
      {view === 'pulse' && (
        <>
          {/* Trend chart */}
          {pulseHistory.length >= 2 && (
            <div style={{ background: '#ffffff08', border: '1px solid #ffffff10', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>📈 8-Week Sentiment Trend</div>
                <div style={{ fontSize: 11, color: '#888' }}>{pulseHistory.length} weeks</div>
              </div>
              <TrendLine data={pulseHistory} color={scoreColor(pulseHistory[pulseHistory.length - 1]?.avg || 3)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#444', marginTop: 4 }}>
                <span>8 weeks ago</span><span>this week</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {[['🔴 Low', '<2.5', '#F87171'], ['🟡 OK', '2.5–3.5', '#FCD34D'], ['🟢 Good', '>3.5', '#6EE7B7']].map(([lbl, rng, c]) => (
                  <span key={lbl} style={{ fontSize: 9, color: c, background: `${c}15`, borderRadius: 6, padding: '2px 7px' }}>{lbl} ({rng})</span>
                ))}
              </div>
            </div>
          )}

          {/* Create new pulse */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff10', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>➕ New Weekly Pulse</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>Question (or use the default)</div>
            <textarea
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              rows={2}
              style={{ resize: 'none', width: '100%', marginBottom: 10, fontSize: 13 }}
            />
            <button onClick={createPulse} disabled={creatingPulse || !newQuestion.trim()} style={{
              width: '100%', padding: '10px', borderRadius: 10,
              border: '1px solid #C4B5FD44', background: '#C4B5FD22', color: '#C4B5FD',
              fontWeight: 700, fontSize: 13,
            }}>{creatingPulse ? 'Creating…' : '🌡️ Launch Pulse'}</button>
          </div>

          {/* Past pulses */}
          {pulses.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '30px 0', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌡️</div>
              No pulses yet — create your first one above!
            </div>
          )}
          {pulses.map(p => {
            const res = pulseResults[p.id]
            const avg = res?.avg
            const dist = res?.distribution || {}
            const maxDist = Math.max(1, ...Object.values(dist).map(Number))
            return (
              <div key={p.id} style={{ background: '#ffffff08', border: `1px solid ${p.is_active ? '#C4B5FD33' : '#ffffff10'}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, marginRight: 10 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      {p.is_active && <Pill color="#6EE7B7" text="ACTIVE" />}
                      <span style={{ fontSize: 10, color: '#555' }}>
                        {new Date(p.week_of + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })} week
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#d4d4d4' }}>{p.question}</div>
                  </div>
                  <button
                    onClick={() => { loadPulseResult(p.id) }}
                    style={{ background: '#ffffff10', border: '1px solid #ffffff18', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#888', flexShrink: 0 }}
                  >View Results</button>
                </div>

                {res && (
                  <div style={{ background: '#ffffff07', borderRadius: 11, padding: '12px 14px', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                      <ScoreRing score={avg} size={56} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: scoreColor(avg) }}>
                          {avg >= 4 ? '🟢 Team is thriving' : avg >= 3 ? '🟡 Doing OK' : avg >= 2 ? '🟠 Needs attention' : '🔴 Struggling'}
                        </div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          {res.total} response{res.total !== 1 ? 's' : ''} · {Math.round((res.total / totalMembers) * 100)}% participation
                        </div>
                      </div>
                    </div>

                    {/* Distribution bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {[5, 4, 3, 2, 1].map(s => {
                        const cnt = Number(dist[s] || 0)
                        const pct = Math.round((cnt / maxDist) * 100)
                        return (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>{PULSE_EMOJIS[s - 1]}</span>
                            <div style={{ flex: 1, background: '#ffffff0f', borderRadius: 4, height: 8 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: scoreColor(s), borderRadius: 4, transition: 'width .5s' }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#666', width: 18, textAlign: 'right', flexShrink: 0 }}>{cnt}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => toggleActive('mood_pulses', p.id, p.is_active)} style={{
                    background: 'transparent', border: '1px solid #ffffff15', borderRadius: 7,
                    padding: '4px 10px', fontSize: 10, color: '#666',
                  }}>{p.is_active ? 'Deactivate' : 'Re-activate'}</button>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── WELLBEING SURVEYS ── */}
      {view === 'surveys' && (
        <>
          {/* Create survey */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff10', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>➕ Launch Monthly Survey</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>
              Sends a 5-question wellbeing check to your team. Results are aggregated — no individual answers are visible.
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>Survey title</div>
            <input
              value={newSurveyTitle}
              onChange={e => setNewSurveyTitle(e.target.value)}
              style={{ width: '100%', marginBottom: 10 }}
            />
            <div style={{ background: '#ffffff08', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Default questions (5-point scale)</div>
              {SURVEY_QUESTIONS.map(q => (
                <div key={q.key} style={{ fontSize: 11, color: '#bbb', padding: '4px 0', borderBottom: '1px solid #ffffff06', display: 'flex', gap: 7 }}>
                  <span>{q.icon}</span><span>{q.q}</span>
                </div>
              ))}
            </div>
            <button onClick={createSurvey} disabled={creatingSurvey} style={{
              width: '100%', padding: '10px', borderRadius: 10,
              border: '1px solid #93C5FD44', background: '#93C5FD22', color: '#93C5FD',
              fontWeight: 700, fontSize: 13,
            }}>{creatingSurvey ? 'Launching…' : '📋 Launch Survey'}</button>
          </div>

          {surveys.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '30px 0', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              No surveys yet — launch your first one above!
            </div>
          )}

          {surveys.map(sv => {
            const res = surveyResults[sv.id]
            return (
              <div key={sv.id} style={{ background: '#ffffff08', border: `1px solid ${sv.is_active ? '#93C5FD33' : '#ffffff10'}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                      {sv.is_active && <Pill color="#93C5FD" text="ACTIVE" />}
                      <span style={{ fontSize: 10, color: '#555' }}>{sv.period}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{sv.title}</div>
                  </div>
                  <button onClick={() => loadSurveyResult(sv.id)} style={{ background: '#ffffff10', border: '1px solid #ffffff18', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#888', flexShrink: 0 }}>
                    View Results
                  </button>
                </div>

                {res && (
                  <div style={{ background: '#ffffff07', borderRadius: 11, padding: '12px 14px', marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Results</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{res.total} responses · {Math.round((res.total / totalMembers) * 100)}% participation</div>
                    </div>

                    {/* Category bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {SURVEY_QUESTIONS.map(q => {
                        const score = res[q.key]
                        if (score == null) return null
                        const pct = (score / 5) * 100
                        return (
                          <div key={q.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                <span style={{ fontSize: 13 }}>{q.icon}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#d4d4d4' }}>{q.label}</span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(score) }}>{score?.toFixed(1)}/5</span>
                            </div>
                            <div style={{ background: '#ffffff0f', borderRadius: 5, height: 8 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${scoreColor(score)},${scoreColor(score)}88)`, borderRadius: 5, transition: 'width .6s' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Overall interpretation */}
                    {res.overall != null && (
                      <div style={{ marginTop: 12, background: `${scoreColor(res.overall)}10`, border: `1px solid ${scoreColor(res.overall)}22`, borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: scoreColor(res.overall), fontWeight: 700, marginBottom: 4 }}>
                          👩‍⚕️ Physio read
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                          {res.overall >= 4
                            ? 'Team wellbeing is strong this month. Keep building on these habits — consistency is the key to lasting workplace wellness.'
                            : res.overall >= 3
                              ? 'Team is broadly OK but there\'s room to grow. Consider targeted stretch challenges and a check-in on workload balance.'
                              : 'Some areas need attention. Low physical comfort and workload scores often signal ergonomics or burnout risk — consider a team wellbeing session.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => toggleActive('wellbeing_surveys', sv.id, sv.is_active)} style={{ background: 'transparent', border: '1px solid #ffffff15', borderRadius: 7, padding: '4px 10px', fontSize: 10, color: '#666' }}>
                    {sv.is_active ? 'Close Survey' : 'Re-open'}
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
