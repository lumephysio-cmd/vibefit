export default function Landing({ onSignup, onLogin }) {
  const features = [
    { icon: "🧘", title: "Habit Challenges", desc: "Desk stretches, hydration, mindfulness — trackable daily habits built for office workers." },
    { icon: "💡", title: "Physio-Led Education", desc: "Evidence-based tips from a registered physiotherapist, not a generic wellness app." },
    { icon: "🏆", title: "Team Competitions", desc: "Leaderboards, reactions and DMs keep your team engaged and accountable all week." },
    { icon: "📊", title: "Weekly Challenges", desc: "Fresh challenges every week — steps, stretches, water, mindfulness and more." },
    { icon: "✨", title: "AI Challenge Generator", desc: "Generate custom challenges for your team's specific goals using Claude AI." },
    { icon: "🔒", title: "Private Tracking", desc: "Personal weight, mood and journal tracking — completely private to each user." },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#e8e8f0', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #ffffff08' }}>
        <div style={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          VIBE<span style={{ WebkitTextFillColor: '#e8e8f0' }}>FIT</span>
        </div>
        <button onClick={onLogin} style={{ background: 'transparent', border: '1px solid #ffffff20', color: '#e8e8f0', borderRadius: 9, padding: '7px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Sign In
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '72px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#6EE7B715', border: '1px solid #6EE7B733', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#6EE7B7', fontWeight: 700, marginBottom: 24 }}>
          👩‍⚕️ Built by a Physiotherapist
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Workplace wellness that
          <span style={{ display: 'block', background: 'linear-gradient(90deg,#6EE7B7,#93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            actually works
          </span>
        </h1>
        <p style={{ fontSize: 17, color: '#888', lineHeight: 1.7, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          VibeFit brings physio-backed challenges, team accountability and real habit science to your workplace — not just a step counter.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onSignup} style={{ background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Get Your Team Started →
          </button>
          <button onClick={onLogin} style={{ background: '#ffffff0a', border: '1px solid #ffffff18', color: '#e8e8f0', borderRadius: 12, padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </div>

      {/* App preview bar */}
      <div style={{ background: 'linear-gradient(180deg,#080810,#0d0d1a)', borderTop: '1px solid #ffffff08', borderBottom: '1px solid #ffffff08', padding: '16px 0', overflowX: 'auto', marginBottom: 72 }}>
        <div style={{ display: 'flex', gap: 10, padding: '0 24px', width: 'max-content', margin: '0 auto' }}>
          {['📣 Feed','🏆 Train','🥇 Board','💬 DMs','✨ AI','💡 Physio Tips','👤 Profile'].map(t =>
            <div key={t} style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: 9, padding: '7px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{t}</div>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Everything your team needs</h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginBottom: 48 }}>Designed around how real office bodies work — by someone who treats them every day.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {features.map(f =>
            <div key={f.title} style={{ background: '#ffffff05', border: '1px solid #ffffff0f', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          )}
        </div>
      </div>

      {/* Physio credibility */}
      <div style={{ background: 'linear-gradient(135deg,#6EE7B710,#93C5FD08)', borderTop: '1px solid #6EE7B720', borderBottom: '1px solid #6EE7B720', padding: '48px 24px', marginBottom: 72 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👩‍⚕️</div>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 12 }}>Led by a registered physiotherapist</div>
          <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.7, marginBottom: 20 }}>
            Every challenge, every tip and every habit in VibeFit is designed with real physio expertise. We're not guessing what's good for your team's bodies — we know.
          </div>
          <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Evidence-based','Injury prevention','Desk ergonomics','Habit science'].map(t =>
              <span key={t} style={{ background: '#6EE7B715', border: '1px solid #6EE7B730', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#6EE7B7', fontWeight: 700 }}>{t}</span>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 24px 96px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: 30, marginBottom: 12 }}>Ready to move your team?</h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>Get your workplace wellness program running in minutes.</p>
        <button onClick={onSignup} style={{ background: 'linear-gradient(135deg,#6EE7B7,#93C5FD)', color: '#080810', border: 'none', borderRadius: 12, padding: '15px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer', width: '100%', maxWidth: 320 }}>
          Get Started Free →
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #ffffff08', padding: '20px 24px', textAlign: 'center', fontSize: 12, color: '#444' }}>
        © 2026 VibeFit · Built for workplace wellness
      </div>
    </div>
  )
}
