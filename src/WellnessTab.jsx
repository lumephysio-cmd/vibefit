import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const FLOW_OPTS = [
  { val: "none", label: "None", icon: "⬜", color: "#666" },
  { val: "spotting", label: "Spotting", icon: "🔴", color: "#F9A8D4" },
  { val: "light", label: "Light", icon: "🩷", color: "#F472B6" },
  { val: "medium", label: "Medium", icon: "❤️", color: "#E11D48" },
  { val: "heavy", label: "Heavy", icon: "🔴", color: "#9F1239" },
];

const PERIOD_SYMPTOMS = [
  { val: "cramps", label: "Cramps", icon: "⚡" },
  { val: "bloating", label: "Bloating", icon: "💧" },
  { val: "headache", label: "Headache", icon: "🤯" },
  { val: "fatigue", label: "Fatigue", icon: "😴" },
  { val: "mood_swings", label: "Mood Swings", icon: "🌊" },
  { val: "back_pain", label: "Back Pain", icon: "🔙" },
];

const MOOD_OPTS = ["😫", "😕", "😐", "🙂", "😄"];
const TIRED_OPTS = ["🪫", "😮‍💨", "😌", "⚡", "🚀"];
const SLEEP_Q_OPTS = ["😵", "😪", "😴", "🛌", "⭐"];

const STEPS = [
  { k: "period", label: "Period", icon: "🌸", color: "#F9A8D4" },
  { k: "mood", label: "Mood", icon: "😊", color: "#C4B5FD" },
  { k: "tiredness", label: "Energy", icon: "⚡", color: "#FCD34D" },
  { k: "sleep", label: "Sleep", icon: "🌙", color: "#6EE7B7" },
];

const stepBtn = (col, dis) => ({
  width: 38, height: 38, borderRadius: 10,
  border: `1px solid ${col}33`, background: `${col}18`,
  color: col, fontWeight: 900, fontSize: 22,
  display: "flex", alignItems: "center", justifyContent: "center",
  opacity: dis ? 0.3 : 1, cursor: dis ? "default" : "pointer",
});

const EmojiRow = ({ opts, value, onChange, color }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {opts.map((emoji, i) => {
      const v = i + 1, sel = value === v;
      return (
        <button key={i} onClick={() => onChange(v)} style={{
          flex: 1, padding: "10px 4px", borderRadius: 12,
          border: `2px solid ${sel ? color : "#ffffff15"}`,
          background: sel ? `${color}22` : "transparent",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
          <span style={{ fontSize: 22 }}>{emoji}</span>
          <span style={{ fontSize: 9, color: sel ? color : "#555" }}>{v}</span>
        </button>
      );
    })}
  </div>
);

const Dots = ({ step, total, color, title }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ fontWeight: 800, fontSize: 13 }}>{title}</div>
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ width: 18, height: 3, borderRadius: 2, background: i <= step ? color : "#ffffff15" }} />
      ))}
    </div>
  </div>
);

const wrap = {
  background: "linear-gradient(135deg,#F9A8D415,#C4B5FD0a)",
  border: "1px solid #F9A8D433", borderRadius: 18, padding: 18, marginBottom: 14,
};

function LogForm({ cu, onSaved, notify }) {
  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState("none");
  const [symptoms, setSymptoms] = useState([]);
  const [mood, setMood] = useState(null);
  const [tiredness, setTiredness] = useState(null);
  const [sleepQ, setSleepQ] = useState(null);
  const [sleepHours, setSleepHours] = useState(7);
  const [bedtime, setBedtime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [saving, setSaving] = useState(false);

  const cur = STEPS[step];

  const toggleSymptom = (val) =>
    setSymptoms(s => s.includes(val) ? s.filter(x => x !== val) : [...s, val]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("wellness_logs").insert({
      user_id: cu.id,
      company_id: cu.company_id || null,
      log_date: new Date().toISOString().split("T")[0],
      period_flow: flow,
      period_symptoms: symptoms,
      mood,
      tiredness,
      sleep_hours: sleepHours,
      sleep_quality: sleepQ,
      bedtime,
      wake_time: wakeTime,
    });
    setSaving(false);
    if (error) { notify("❌ Couldn't save — try again"); return; }
    notify("✅ Wellness logged!");
    onSaved();
  };

  // Done screen
  if (step >= STEPS.length) {
    return (
      <div style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>All done! Here's your summary:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginBottom: 20 }}>
          {flow !== "none" && (
            <span style={{ background: "#F9A8D415", border: "1px solid #F9A8D433", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#F9A8D4", fontWeight: 700 }}>
              🌸 {FLOW_OPTS.find(f => f.val === flow)?.label} flow
            </span>
          )}
          {mood && <span style={{ background: "#C4B5FD15", border: "1px solid #C4B5FD33", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#C4B5FD", fontWeight: 700 }}>
            {MOOD_OPTS[mood - 1]} Mood {mood}/5
          </span>}
          {tiredness && <span style={{ background: "#FCD34D15", border: "1px solid #FCD34D33", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#FCD34D", fontWeight: 700 }}>
            {TIRED_OPTS[tiredness - 1]} Energy {tiredness}/5
          </span>}
          <span style={{ background: "#6EE7B715", border: "1px solid #6EE7B733", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#6EE7B7", fontWeight: 700 }}>
            🌙 {sleepHours}h sleep
          </span>
        </div>
        <button onClick={save} disabled={saving} style={{
          background: "linear-gradient(135deg,#F9A8D433,#C4B5FD22)",
          border: "1px solid #F9A8D455", color: "#F9A8D4",
          borderRadius: 11, padding: "11px 28px", fontWeight: 800, fontSize: 14,
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? "Saving…" : "Save log ✨"}
        </button>
      </div>
    );
  }

  // Period step
  if (cur.k === "period") return (
    <div style={wrap}>
      <Dots step={step} total={STEPS.length} color={cur.color} title="🌸 Wellness Check-In" />
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Period flow today?</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {FLOW_OPTS.map(opt => {
          const sel = flow === opt.val;
          return (
            <button key={opt.val} onClick={() => setFlow(opt.val)} style={{
              flex: 1, padding: "10px 4px", borderRadius: 12,
              border: `2px solid ${sel ? opt.color : "#ffffff15"}`,
              background: sel ? `${opt.color}22` : "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span style={{ fontSize: 9, color: sel ? opt.color : "#555" }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
      {flow !== "none" && (
        <>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>Any symptoms?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {PERIOD_SYMPTOMS.map(s => {
              const sel = symptoms.includes(s.val);
              return (
                <button key={s.val} onClick={() => toggleSymptom(s.val)} style={{
                  padding: "5px 10px", borderRadius: 20, fontSize: 11,
                  border: `1px solid ${sel ? "#F9A8D4" : "#ffffff20"}`,
                  background: sel ? "#F9A8D420" : "transparent",
                  color: sel ? "#F9A8D4" : "#777",
                }}>
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>
        </>
      )}
      <button onClick={() => setStep(s => s + 1)} style={{
        width: "100%", padding: 11, borderRadius: 11,
        border: `1px solid ${cur.color}44`, background: `${cur.color}18`,
        color: cur.color, fontWeight: 800, fontSize: 14,
      }}>Next →</button>
    </div>
  );

  // Mood step
  if (cur.k === "mood") return (
    <div style={wrap}>
      <Dots step={step} total={STEPS.length} color={cur.color} title="🌸 Wellness Check-In" />
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>How's your mood?</div>
      <EmojiRow opts={MOOD_OPTS} value={mood} onChange={v => { setMood(v); setTimeout(() => setStep(s => s + 1), 220); }} color={cur.color} />
    </div>
  );

  // Tiredness/energy step
  if (cur.k === "tiredness") return (
    <div style={wrap}>
      <Dots step={step} total={STEPS.length} color={cur.color} title="🌸 Wellness Check-In" />
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Energy level right now?</div>
      <EmojiRow opts={TIRED_OPTS} value={tiredness} onChange={v => { setTiredness(v); setTimeout(() => setStep(s => s + 1), 220); }} color={cur.color} />
    </div>
  );

  // Sleep step
  if (cur.k === "sleep") return (
    <div style={wrap}>
      <Dots step={step} total={STEPS.length} color={cur.color} title="🌸 Wellness Check-In" />
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Sleep last night?</div>
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>Quality</div>
      <EmojiRow opts={SLEEP_Q_OPTS} value={sleepQ} onChange={setSleepQ} color={cur.color} />
      <div style={{ fontSize: 12, color: "#aaa", margin: "14px 0 8px" }}>Hours slept</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <button onClick={() => setSleepHours(h => Math.max(3, parseFloat((h - 0.5).toFixed(1))))} style={stepBtn(cur.color, sleepHours <= 3)}>−</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontWeight: 900, fontSize: 34, color: cur.color }}>{sleepHours}</span>
          <span style={{ fontSize: 13, color: "#888" }}> hrs</span>
        </div>
        <button onClick={() => setSleepHours(h => Math.min(12, parseFloat((h + 0.5).toFixed(1))))} style={stepBtn(cur.color, sleepHours >= 12)}>+</button>
      </div>
      <div style={{ background: "#ffffff10", borderRadius: 4, height: 5, margin: "0 0 4px" }}>
        <div style={{ width: `${Math.min(100, (sleepHours / 8) * 100)}%`, height: "100%", background: cur.color, borderRadius: 4, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 11, textAlign: "center", marginBottom: 14, color: sleepHours >= 7 ? cur.color : "#888" }}>
        {sleepHours >= 8 ? "✅ Great sleep!" : sleepHours >= 7 ? "Good rest" : "Aim for 7–9 hours"}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Bedtime</div>
          <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} style={{
            width: "100%", background: "#ffffff08", border: "1px solid #ffffff15",
            borderRadius: 9, padding: "7px 10px", color: "#e8e8f0", fontSize: 13,
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Wake time</div>
          <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={{
            width: "100%", background: "#ffffff08", border: "1px solid #ffffff15",
            borderRadius: 9, padding: "7px 10px", color: "#e8e8f0", fontSize: 13,
          }} />
        </div>
      </div>
      <button disabled={!sleepQ} onClick={() => setStep(s => s + 1)} style={{
        width: "100%", padding: 11, borderRadius: 11,
        border: `1px solid ${cur.color}44`,
        background: sleepQ ? `${cur.color}18` : "#ffffff08",
        color: sleepQ ? cur.color : "#555",
        fontWeight: 800, fontSize: 14, opacity: sleepQ ? 1 : 0.5,
      }}>Review & Save →</button>
    </div>
  );

  return null;
}

function HistoryList({ logs }) {
  if (!logs.length) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
      <div style={{ fontSize: 14 }}>No logs yet — start your first check-in!</div>
    </div>
  );

  return logs.map(log => {
    const d = new Date(log.log_date + "T12:00:00");
    const flowOpt = FLOW_OPTS.find(f => f.val === log.period_flow);
    return (
      <div key={log.id} style={{
        background: "#ffffff08", border: "1px solid #ffffff12",
        borderRadius: 14, padding: "13px 14px", marginBottom: 9,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {log.period_flow && log.period_flow !== "none" && (
              <span style={{ fontSize: 9, background: "#F9A8D415", color: "#F9A8D4", border: "1px solid #F9A8D430", borderRadius: 20, padding: "2px 7px", fontWeight: 700 }}>
                🌸 {flowOpt?.label}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {log.mood && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 15 }}>{MOOD_OPTS[log.mood - 1]}</span>
              <span style={{ fontSize: 10, color: "#888" }}>Mood {log.mood}/5</span>
            </div>
          )}
          {log.tiredness && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 15 }}>{TIRED_OPTS[log.tiredness - 1]}</span>
              <span style={{ fontSize: 10, color: "#888" }}>Energy {log.tiredness}/5</span>
            </div>
          )}
          {log.sleep_hours && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14 }}>🌙</span>
              <span style={{ fontSize: 10, color: "#888" }}>{log.sleep_hours}h</span>
            </div>
          )}
          {log.bedtime && log.wake_time && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "#555" }}>{log.bedtime} → {log.wake_time}</span>
            </div>
          )}
        </div>
        {log.period_symptoms?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {log.period_symptoms.map(s => {
              const sym = PERIOD_SYMPTOMS.find(x => x.val === s);
              return sym ? (
                <span key={s} style={{ fontSize: 9, background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 20, padding: "2px 7px", color: "#aaa" }}>
                  {sym.icon} {sym.label}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    );
  });
}

function InsightsView({ logs }) {
  if (logs.length < 2) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 14 }}>Log at least 2 entries to see insights.</div>
    </div>
  );

  const recent = logs.slice(0, 7);
  const avgMood = recent.filter(l => l.mood).reduce((a, l) => a + l.mood, 0) / (recent.filter(l => l.mood).length || 1);
  const avgEnergy = recent.filter(l => l.tiredness).reduce((a, l) => a + l.tiredness, 0) / (recent.filter(l => l.tiredness).length || 1);
  const avgSleep = recent.filter(l => l.sleep_hours).reduce((a, l) => a + parseFloat(l.sleep_hours), 0) / (recent.filter(l => l.sleep_hours).length || 1);
  const periodDays = recent.filter(l => l.period_flow && l.period_flow !== "none").length;

  const Stat = ({ label, val, color, icon, sub }) => (
    <div style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 13, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 20, color }}>{val}</div>
      <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "#555", marginTop: 1 }}>{sub}</div>}
    </div>
  );

  const Bar = ({ label, value, max, color, icon }) => {
    const pct = Math.round((value / max) * 100);
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: "#aaa" }}>{icon} {label}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color }}>{value.toFixed(1)}/5</div>
        </div>
        <div style={{ background: "#ffffff10", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s" }} />
        </div>
      </div>
    );
  };

  const sympCounts = {};
  recent.forEach(l => (l.period_symptoms || []).forEach(s => { sympCounts[s] = (sympCounts[s] || 0) + 1; }));
  const topSymps = Object.entries(sympCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#aaa" }}>Last 7 days</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Stat label="Avg Mood" val={avgMood.toFixed(1)} color="#C4B5FD" icon="😊" sub="out of 5" />
        <Stat label="Avg Energy" val={avgEnergy.toFixed(1)} color="#FCD34D" icon="⚡" sub="out of 5" />
        <Stat label="Avg Sleep" val={`${avgSleep.toFixed(1)}h`} color="#6EE7B7" icon="🌙" sub="per night" />
      </div>

      <div style={{ background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 12 }}>Trends</div>
        <Bar label="Mood" value={avgMood} max={5} color="#C4B5FD" icon="😊" />
        <Bar label="Energy" value={avgEnergy} max={5} color="#FCD34D" icon="⚡" />
        <Bar label="Sleep quality" value={recent.filter(l => l.sleep_quality).reduce((a, l) => a + l.sleep_quality, 0) / (recent.filter(l => l.sleep_quality).length || 1)} max={5} color="#6EE7B7" icon="🛌" />
      </div>

      {periodDays > 0 && (
        <div style={{ background: "#F9A8D410", border: "1px solid #F9A8D430", borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>🌸 Period — last 7 days</div>
          <div style={{ fontSize: 12, color: "#F9A8D4" }}>{periodDays} day{periodDays !== 1 ? "s" : ""} with flow tracked</div>
          {topSymps.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: "#aaa", marginBottom: 5 }}>Most common symptoms:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {topSymps.map(([sym, cnt]) => {
                  const s = PERIOD_SYMPTOMS.find(x => x.val === sym);
                  return s ? (
                    <span key={sym} style={{ fontSize: 10, background: "#F9A8D415", border: "1px solid #F9A8D430", borderRadius: 20, padding: "3px 9px", color: "#F9A8D4" }}>
                      {s.icon} {s.label} ×{cnt}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 14, padding: "13px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>🌙 Sleep routine</div>
        {recent.filter(l => l.bedtime && l.wake_time).slice(0, 5).map((l, i) => {
          const d = new Date(l.log_date + "T12:00:00");
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <div style={{ fontSize: 11, color: "#888" }}>{d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
              <div style={{ fontSize: 11, color: "#6EE7B7" }}>{l.bedtime} → {l.wake_time} · {l.sleep_hours}h</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WellnessTab({ cu, notify }) {
  const [view, setView] = useState("log");
  const [logs, setLogs] = useState([]);
  const [loggedToday, setLoggedToday] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!cu) return;
    supabase
      .from("wellness_logs")
      .select("*")
      .eq("user_id", cu.id)
      .order("log_date", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (data) {
          setLogs(data);
          const today = new Date().toISOString().split("T")[0];
          setLoggedToday(data.some(l => l.log_date === today));
        }
      });
  }, [cu?.id]);

  const handleSaved = () => {
    setShowForm(false);
    setLoggedToday(true);
    supabase
      .from("wellness_logs")
      .select("*")
      .eq("user_id", cu.id)
      .order("log_date", { ascending: false })
      .limit(60)
      .then(({ data }) => { if (data) setLogs(data); });
  };

  const VIEWS = [
    ["log", "Log", "📝"],
    ["history", "History", "📋"],
    ["insights", "Insights", "📊"],
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Wellness Tracker</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>Period · Mood · Energy · Sleep</div>
        </div>
        {!showForm && view === "log" && (
          <button onClick={() => setShowForm(true)} style={{
            background: "linear-gradient(135deg,#F9A8D422,#C4B5FD15)",
            border: "1px solid #F9A8D444", color: "#F9A8D4",
            borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700,
          }}>
            + Log
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 2, background: "#ffffff07", borderRadius: 11, padding: 3, marginBottom: 16 }}>
        {VIEWS.map(([id, lbl, ic]) => (
          <button key={id} onClick={() => { setView(id); setShowForm(false); }} style={{
            flex: 1, padding: "7px", borderRadius: 8, border: "none",
            background: view === id ? "#F9A8D422" : "transparent",
            color: view === id ? "#F9A8D4" : "#666",
            fontSize: 11, fontWeight: view === id ? 700 : 400,
          }}>
            {ic} {lbl}
          </button>
        ))}
      </div>

      {view === "log" && (
        showForm
          ? <LogForm cu={cu} notify={notify} onSaved={handleSaved} />
          : (
            <div>
              {loggedToday ? (
                <div style={{
                  background: "linear-gradient(135deg,#6EE7B710,#F9A8D408)",
                  border: "1px solid #6EE7B730", borderRadius: 16, padding: "16px 18px", marginBottom: 14,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 26 }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#6EE7B7" }}>Already logged today</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Check History to see your entry</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "linear-gradient(135deg,#F9A8D415,#C4B5FD0a)",
                  border: "1px solid #F9A8D433", borderRadius: 16, padding: "20px 18px",
                  textAlign: "center", marginBottom: 14,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Daily Wellness Check-In</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>Track your period, mood, energy, and sleep in under a minute</div>
                  <button onClick={() => setShowForm(true)} style={{
                    background: "linear-gradient(135deg,#F9A8D433,#C4B5FD22)",
                    border: "1px solid #F9A8D455", color: "#F9A8D4",
                    borderRadius: 11, padding: "11px 28px", fontWeight: 800, fontSize: 14,
                  }}>
                    Start check-in →
                  </button>
                </div>
              )}

              {logs.length > 0 && (
                <div style={{ background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 14, padding: "13px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: "#aaa" }}>Recent entries</div>
                  {logs.slice(0, 3).map(log => {
                    const d = new Date(log.log_date + "T12:00:00");
                    return (
                      <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 11 }}>{d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {log.mood && <span style={{ fontSize: 14 }}>{MOOD_OPTS[log.mood - 1]}</span>}
                          {log.tiredness && <span style={{ fontSize: 14 }}>{TIRED_OPTS[log.tiredness - 1]}</span>}
                          {log.sleep_hours && <span style={{ fontSize: 10, color: "#6EE7B7" }}>🌙{log.sleep_hours}h</span>}
                          {log.period_flow && log.period_flow !== "none" && <span style={{ fontSize: 10, color: "#F9A8D4" }}>🌸</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
      )}

      {view === "history" && <HistoryList logs={logs} />}
      {view === "insights" && <InsightsView logs={logs} />}
    </div>
  );
}
