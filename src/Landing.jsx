export default function Landing({ onSignup, onLogin }) {

  const outcomes = [
    { stat: '34%', label: 'reduction in sick days', sub: 'avg across corporate clients', col: '#6EE7B7' },
    { stat: '81%', label: 'staff engagement rate', sub: 'within the first 30 days', col: '#93C5FD' },
    { stat: '2 min', label: 'daily check-in time', sub: 'zero friction for busy teams', col: '#F9A8D4' },
  ]

  const painPoints = [
    { icon: '📋', prob: 'EAP programs nobody uses', fix: 'Daily micro-habits staff actually do — 2 minutes, on their phone' },
    { icon: '😶', prob: 'No visibility into team wellbeing', fix: 'HR dashboard with engagement rates, readiness trends and risk flags' },
    { icon: '💸', prob: 'Wellness spend with no ROI data', fix: 'Exportable reports you can present to your CFO' },
    { icon: '🤕', prob: 'Sick days and presenteeism creeping up', fix: 'Physio-backed habits that prevent the injuries causing most absences' },
  ]

  const features = [
    { icon: '📊', title: 'HR Wellness Dashboard', desc: 'Real-time engagement rates, team readiness scores, sleep and mood trends. The data your board wants to see.' },
    { icon: '👩‍⚕️', title: 'Physio-Backed Content', desc: 'Every challenge and tip is designed by a registered physiotherapist — not AI-generated generic wellness content.' },
    { icon: '🏆', title: 'Team Challenges & Leaderboards', desc: 'Desk stretches, hydration, mindfulness and step challenges that teams actually compete in.' },
    { icon: '😴', title: 'Sleep & Mindfulness Programmes', desc: 'Dedicated sleep tracking with science-backed routines. Mindfulness tools that show up when staff need them.' },
    { icon: '⚠️', title: 'Wellness Risk Flags', desc: 'Anonymised alerts when team members show signs of burnout, poor sleep or recurring pain — so you can act early.' },
    { icon: '🔒', title: 'Private Individual Tracking', desc: 'Staff track mood, energy and symptoms privately. Builds trust. You see team trends, never individual data.' },
  ]

  const steps = [
    { n: '1', title: 'Register your company', desc: 'Takes 2 minutes. No IT team needed.' },
    { n: '2', title: 'Invite your team', desc: 'Share one link. Staff sign up themselves.' },
    { n: '3', title: 'Watch the data roll in', desc: 'Your HR dashboard updates in real time.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#e8e8f0', fontFamily: "'Inter',system-ui,sans-serif", overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #ffffff08', position: 'sticky', top: 0, background: '#080810cc', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          WELLCREW
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onLogin} style={{ background: 'transparent', border: '1px solid #ffffff20', color: '#aaa', borderRadius: 9, padding: '7px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={onSignup} style={{ background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 9, padding: '7px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            Start Free Trial
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#6EE7B715', border: '1px solid #6EE7B733', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#6EE7B7', fontWeight: 700, marginBottom: 24 }}>
          👩‍⚕️ Designed by a Registered Physiotherapist
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          The workplace wellness app
          <span style={{ display: 'block', background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            your team will actually use.
          </span>
        </h1>
        <p style={{ fontSize: 17, color: '#888', lineHeight: 1.75, marginBottom: 14, maxWidth: 540, margin: '0 auto 14px' }}>
          Wellcrew gives HR teams real-time wellbeing data, and gives staff 2-minute daily habits that prevent sick days before they happen.
        </p>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 36 }}>14-day free trial · No credit card · Set up in under 5 minutes</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onSignup} style={{ background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 12, padding: '15px 36px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Start Your Free Trial →
          </button>
          <button onClick={onLogin} style={{ background: '#ffffff0a', border: '1px solid #ffffff18', color: '#e8e8f0', borderRadius: 12, padding: '15px 28px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </div>

      {/* Outcome stats */}
      <div style={{ maxWidth: 760, margin: '0 auto 72px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {outcomes.map(o => (
            <div key={o.stat} style={{ background: '#ffffff06', border: `1px solid ${o.col}22`, borderRadius: 16, padding: '20px 22px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 36, color: o.col, marginBottom: 4 }}>{o.stat}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#ddd', marginBottom: 3 }}>{o.label}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{o.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pain points → solutions */}
      <div style={{ background: 'linear-gradient(180deg,#080810,#0d0d1a)', borderTop: '1px solid #ffffff08', borderBottom: '1px solid #ffffff08', padding: '64px 24px', marginBottom: 72 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6EE7B7', letterSpacing: 2, marginBottom: 10 }}>THE PROBLEM</div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 4vw, 34px)', marginBottom: 10 }}>Most wellness programs fail HR teams.</h2>
            <p style={{ color: '#666', fontSize: 14, maxWidth: 460, margin: '0 auto' }}>Here's what we hear from People & Culture leads — and what Wellcrew does differently.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {painPoints.map(p => (
              <div key={p.prob} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid #ffffff0f' }}>
                <div style={{ background: '#ffffff05', padding: '16px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{p.prob}</div>
                </div>
                <div style={{ background: '#6EE7B70a', borderLeft: '1px solid #6EE7B720', padding: '16px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#6EE7B7', fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <div style={{ fontSize: 13, color: '#bbb', lineHeight: 1.5 }}>{p.fix}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', letterSpacing: 2, marginBottom: 10 }}>WHAT YOU GET</div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 4vw, 32px)', marginBottom: 8 }}>Built for HR. Loved by teams.</h2>
          <p style={{ color: '#888', fontSize: 14 }}>Everything you need. Nothing you don't.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#ffffff05', border: '1px solid #ffffff0f', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#e8e8f0' }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#777', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Physio credibility */}
      <div style={{ background: 'linear-gradient(135deg,#6EE7B710,#93C5FD08)', borderTop: '1px solid #6EE7B720', borderBottom: '1px solid #6EE7B720', padding: '56px 24px', marginBottom: 72 }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>👩‍⚕️</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 12 }}>Not another generic wellness app.</h2>
          <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.75, marginBottom: 24 }}>
            Wellcrew was built by a registered physiotherapist who treats corporate workers every day. Every challenge, every tip and every habit is grounded in real clinical knowledge — because we've seen what actually causes sick days, and what prevents them.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['Evidence-based habits','Injury prevention','Desk ergonomics','Burnout early warning','Physio-reviewed content','Sleep science'].map(t => (
              <span key={t} style={{ background: '#6EE7B715', border: '1px solid #6EE7B730', borderRadius: 20, padding: '5px 13px', fontSize: 11, color: '#6EE7B7', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#F9A8D4', letterSpacing: 2, marginBottom: 10 }}>HOW IT WORKS</div>
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 4vw, 32px)', marginBottom: 40 }}>Up and running in under 5 minutes.</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#ffffff06', border: '1px solid #ffffff0f', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#080810', flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#777' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ background: 'linear-gradient(135deg,#6EE7B710,#93C5FD08)', borderTop: '1px solid #6EE7B720', padding: '64px 24px 80px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(24px, 4vw, 36px)', marginBottom: 12 }}>Start your free trial today.</h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>No credit card. No IT setup. No commitment.</p>
        <p style={{ color: '#555', fontSize: 12, marginBottom: 32 }}>Join forward-thinking People & Culture teams already using Wellcrew.</p>
        <button onClick={onSignup} style={{ background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 13, padding: '16px 48px', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'inline-block' }}>
          Register Your Company Free →
        </button>
        <div style={{ marginTop: 16, fontSize: 12, color: '#444' }}>14-day trial · Setup in 5 minutes · Cancel anytime</div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #ffffff08', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WELLCREW</div>
        <div style={{ fontSize: 11, color: '#444' }}>© 2026 Wellcrew · Built for workplace wellness · By a physiotherapist</div>
        <button onClick={onLogin} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}>Sign In</button>
      </div>

    </div>
  )
}
