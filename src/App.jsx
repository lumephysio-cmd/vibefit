import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from './supabase';
import PhysioTab from './PhysioTab';
import LbTab from './LbTab';
import { BADGE_DEFS } from './badges';
import InsightsSection from './InsightsSection';
import HRDashboard from './HRDashboard';

// ── CONSTANTS ──
const TC=["#6EE7B7","#93C5FD","#F9A8D4","#FCD34D","#C4B5FD","#FB923C","#34D399","#F472B6"];
const RX=["🔥","💪","👏","❤️","🎉"];
const N=Date.now();
const BP_COLORS={general:"#6EE7B7",lower_back:"#F9A8D4",shoulders:"#93C5FD",neck:"#FCD34D",hips:"#C4B5FD",wrists:"#FB923C",eyes:"#34D399"};
const BP_LABELS={general:"General",lower_back:"Lower Back",shoulders:"Shoulders",neck:"Neck & Upper Back",hips:"Hips",wrists:"Wrists",eyes:"Eyes"};

// ── INITIAL DATA ──
const IC=[];
const ILB=[];
const IF=[];
const IM={};
const IP={mood:[{date:"Mar 17",val:3},{date:"Mar 20",val:5},{date:"Mar 23",val:5}],notes:["Feeling great after the run!"]};

// ── HELPERS ──
const ago=ts=>{const d=Date.now()-ts;if(d<60000)return"just now";if(d<3600000)return`${Math.floor(d/60000)}m`;if(d<86400000)return`${Math.floor(d/3600000)}h`;if(d<604800000)return`${Math.floor(d/86400000)}d`;return`${Math.floor(d/604800000)}w`;};
const ini=n=>n?n.split(" ").map(p=>p[0]).join("").toUpperCase().slice(0,2):"?";
let _c=0;const uid=()=>++_c;
const todayStr=()=>new Date().toDateString();
// sleep 35%, energy 30%, mood 20%, hydration 15%
const calcReadiness=s=>Math.round(((s.sleep-1)/4*35+(s.energy-1)/4*30+(s.mood-1)/4*20+(s.water-1)/4*15));
const readinessColor=r=>r>=80?"#93C5FD":r>=60?"#6EE7B7":r>=40?"#FCD34D":"#F87171";
const readinessLabel=r=>r>=80?"Peak Readiness":r>=60?"Ready to Go":r>=40?"Take It Easy":"Rest & Recover";

// ── THEME ──
const DK={bg:"#080810",card:"#ffffff0a",cb:"#ffffff12",tx:"#e8e8f0",sub:"#666",inp:"#ffffff08",inpb:"#ffffff15",nb:"#ffffff07",na:"#ffffff18"};
const LT={bg:"#f0f4f8",card:"#ffffff",cb:"#e2e8f0",tx:"#1a202c",sub:"#718096",inp:"#ffffff",inpb:"#cbd5e0",nb:"#e2e8f0",na:"#ffffff"};
const makeCSS=t=>`*{box-sizing:border-box;margin:0;padding:0}body{background:${t.bg};color:${t.tx};font-family:system-ui,sans-serif;overscroll-behavior:none}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:4px}input,textarea,select{background:${t.inp};border:1px solid ${t.inpb};color:${t.tx};border-radius:10px;padding:9px 12px;font-family:inherit;font-size:13px;outline:none;width:100%}input:focus,textarea:focus{border-color:#6EE7B755}select option{background:#13131f}button{cursor:pointer;font-family:inherit;transition:all 0.15s}button:active{transform:scale(0.97)}@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes ti{0%{opacity:0;transform:translateX(-50%) translateY(-10px)}10%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0}}.fu{animation:fu 0.3s ease both}.card{background:${t.card};border:1px solid ${t.cb};border-radius:16px;padding:16px}`;

// ── ATOMS ──
const Av=({u,s=32})=><div style={{width:s,height:s,borderRadius:"50%",background:`linear-gradient(135deg,${u.color||"#6EE7B7"}33,${u.color||"#6EE7B7"}66)`,border:`2px solid ${u.color||"#6EE7B7"}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s*.34,fontWeight:700,color:u.color||"#6EE7B7",flexShrink:0}}>{ini(u.name)}</div>;
const Ring=({pct,color,size=60})=>{const s=5,r=(size-s*2)/2,c=2*Math.PI*r,d=c*Math.min(pct,1);return<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ffffff0f" strokeWidth={s}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={s} strokeDasharray={`${d} ${c}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s"}}/></svg>;};
const Pill=({color,text})=><span style={{fontSize:10,background:`${color}22`,color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 8px",fontWeight:700,whiteSpace:"nowrap"}}>{text}</span>;
const Btn=({color="#6EE7B7",text,style,...p})=><button {...p} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${color}33`,background:`${color}22`,color,fontWeight:700,fontSize:13,...style}}>{text}</button>;
const Inp=({label,...p})=><div style={{marginBottom:10}}>{label&&<div style={{fontSize:11,color:"#888",marginBottom:4}}>{label}</div>}<input {...p} style={{width:"100%",...p.style}}/></div>;
const Modal=({onClose,children})=><div style={{position:"fixed",inset:0,background:"#000c",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onMouseDown={onClose}><div style={{background:"#13131f",border:"1px solid #ffffff18",borderRadius:18,padding:20,width:340,maxWidth:"95vw",maxHeight:"88vh",overflowY:"auto"}} onMouseDown={e=>e.stopPropagation()}>{children}</div></div>;
const Spk=({data,color,sid})=>{const w=200,h=44,vs=data.map(d=>d.val),mn=Math.min(...vs),mx=Math.max(...vs),rng=mx-mn||1;const pts=vs.map((v,i)=>`${(i/Math.max(vs.length-1,1))*w},${h-((v-mn)/rng)*(h-6)-3}`).join(" ");return<svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><defs><linearGradient id={`g${sid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g${sid})`}/><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>{vs.map((v,i)=><circle key={i} cx={(i/Math.max(vs.length-1,1))*w} cy={h-((v-mn)/rng)*(h-6)-3} r="2.5" fill={color}/>)}</svg>;};

// ── PHYSIO TIP CARD ──
const TipCard=({tip})=>{
  const c=BP_COLORS[tip.body_part]||"#6EE7B7";
  return<div className="card fu" style={{marginBottom:12,borderLeft:`3px solid ${c}`,padding:"14px 16px"}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:9}}>
      <div style={{width:38,height:38,borderRadius:11,background:`${c}20`,border:`1px solid ${c}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{tip.emoji||"💡"}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:2}}>
          <Pill color="#6EE7B7" text="PHYSIO TIP"/>
          {tip.body_part&&<Pill color={c} text={BP_LABELS[tip.body_part]||tip.body_part}/>}
        </div>
        <div style={{fontSize:10,color:"#555",marginTop:1}}>by Physio Brooke 👩‍⚕️</div>
      </div>
    </div>
    <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{tip.title}</div>
    <div style={{fontSize:12,color:"#aaa",lineHeight:1.65}}>{tip.content}</div>
  </div>;
};

// ── CHECK-IN ──
const CheckIn=({onDone})=>{
  const [step,setStep]=useState(0);
  const [scores,setScores]=useState({});
  const [sleepHours,setSleepHours]=useState(7);
  const [waterGlasses,setWaterGlasses]=useState(4);
  const STEPS=[
    {k:"sleep",q:"Sleep quality last night?",subQ:"How long did you sleep?",hasHours:true,opts:["😵","😪","😴","🛌","⭐"],color:"#6EE7B7"},
    {k:"energy",q:"Energy level right now?",opts:["🪫","😮‍💨","😌","⚡","🚀"],color:"#FCD34D"},
    {k:"mood",q:"How's your mood?",opts:["😴","😕","😐","🙂","😄"],color:"#F9A8D4"},
    {k:"water",q:"How much water today?",isWater:true,color:"#93C5FD"},
  ];
  const stepBtn=(col,dis)=>({width:38,height:38,borderRadius:10,border:`1px solid ${col}33`,background:`${col}18`,color:col,fontWeight:900,fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",opacity:dis?.3:1,cursor:dis?"default":"pointer"});
  const wrap={background:"linear-gradient(135deg,#6EE7B715,#93C5FD0a)",border:"1px solid #6EE7B733",borderRadius:18,padding:18,marginBottom:14};
  const Dots=({c})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontWeight:800,fontSize:13}}>🌅 Daily Check-In</div>
      <div style={{display:"flex",gap:4}}>{STEPS.map((_,i)=><div key={i} style={{width:18,height:3,borderRadius:2,background:i<step?c.color:"#ffffff15"}}/>)}</div>
    </div>
  );
  // Done screen
  if(step>=STEPS.length) return(
    <div style={{...wrap,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>✅</div>
      <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>Check-in complete!</div>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:18}}>
        <span style={{background:"#6EE7B715",border:"1px solid #6EE7B730",borderRadius:20,padding:"5px 13px",fontSize:12,color:"#6EE7B7",fontWeight:700}}>😴 {sleepHours}h sleep</span>
        <span style={{background:"#93C5FD15",border:"1px solid #93C5FD30",borderRadius:20,padding:"5px 13px",fontSize:12,color:"#93C5FD",fontWeight:700}}>💧 {waterGlasses*250}ml water</span>
      </div>
      <button onClick={()=>onDone({...scores,sleepHours,waterGlasses})} style={{background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",border:"1px solid #6EE7B755",color:"#6EE7B7",borderRadius:11,padding:"11px 28px",fontWeight:800,fontSize:14}}>
        See my readiness →
      </button>
    </div>
  );
  const cur=STEPS[step];
  // Water step — actual glasses count
  if(cur.isWater) return(
    <div style={wrap}>
      <Dots c={cur}/>
      <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{cur.q}</div>
      <div style={{fontSize:11,color:"#888",marginBottom:14}}>1 glass ≈ 250ml</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:6}}>
        <button onClick={()=>setWaterGlasses(w=>Math.max(0,w-1))} style={stepBtn(cur.color,waterGlasses<=0)}>−</button>
        <div style={{textAlign:"center",minWidth:80}}>
          <div style={{fontWeight:900,fontSize:52,color:cur.color,lineHeight:1}}>{waterGlasses}</div>
          <div style={{fontSize:11,color:"#888",marginTop:3}}>glasses · <span style={{color:cur.color,fontWeight:700}}>{waterGlasses*250}ml</span></div>
        </div>
        <button onClick={()=>setWaterGlasses(w=>Math.min(15,w+1))} style={stepBtn(cur.color,waterGlasses>=15)}>+</button>
      </div>
      <div style={{background:"#ffffff10",borderRadius:4,height:6,margin:"6px 0 4px"}}>
        <div style={{width:`${Math.min(100,(waterGlasses/8)*100)}%`,height:"100%",background:cur.color,borderRadius:4,transition:"width .3s"}}/>
      </div>
      <div style={{fontSize:11,textAlign:"center",color:waterGlasses>=8?cur.color:"#888",marginBottom:14}}>{waterGlasses>=8?"✅ Daily goal reached!":"Target: 8 glasses (2,000ml)"}</div>
      <button onClick={()=>{const s=waterGlasses>=8?5:waterGlasses>=5?4:waterGlasses>=3?3:waterGlasses>=1?2:1;setScores(sc=>({...sc,water:s}));setStep(st=>st+1);}} style={{width:"100%",padding:"11px",borderRadius:11,border:`1px solid ${cur.color}44`,background:`${cur.color}18`,color:cur.color,fontWeight:800,fontSize:14}}>Next →</button>
    </div>
  );
  // Sleep step — quality emoji + actual hours
  if(cur.hasHours) return(
    <div style={wrap}>
      <Dots c={cur}/>
      <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>{cur.q}</div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {cur.opts.map((emoji,i)=>{const v=i+1,sel=scores[cur.k]===v;return(
          <button key={i} onClick={()=>setScores(s=>({...s,[cur.k]:v}))} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${sel?cur.color:"#ffffff15"}`,background:sel?`${cur.color}22`:"transparent",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:22}}>{emoji}</span>
          </button>
        );})}
      </div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>{cur.subQ}</div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
        <button onClick={()=>setSleepHours(h=>Math.max(3,parseFloat((h-.5).toFixed(1))))} style={stepBtn(cur.color,sleepHours<=3)}>−</button>
        <div style={{flex:1,textAlign:"center"}}>
          <span style={{fontWeight:900,fontSize:34,color:cur.color}}>{sleepHours}</span>
          <span style={{fontSize:13,color:"#888"}}> hrs</span>
        </div>
        <button onClick={()=>setSleepHours(h=>Math.min(12,parseFloat((h+.5).toFixed(1))))} style={stepBtn(cur.color,sleepHours>=12)}>+</button>
      </div>
      <div style={{background:"#ffffff10",borderRadius:4,height:5,margin:"0 0 5px"}}>
        <div style={{width:`${Math.min(100,(sleepHours/8)*100)}%`,height:"100%",background:cur.color,borderRadius:4,transition:"width .3s"}}/>
      </div>
      <div style={{fontSize:11,textAlign:"center",marginBottom:14,color:sleepHours>=7?cur.color:"#888"}}>{sleepHours>=8?"✅ Great sleep!":sleepHours>=7?"Good rest — above average":"Aim for 7–9 hours"}</div>
      <button disabled={!scores[cur.k]} onClick={()=>setStep(s=>s+1)} style={{width:"100%",padding:"11px",borderRadius:11,border:`1px solid ${cur.color}44`,background:scores[cur.k]?`${cur.color}18`:"#ffffff08",color:scores[cur.k]?cur.color:"#555",fontWeight:800,fontSize:14,opacity:scores[cur.k]?1:.5}}>Next →</button>
    </div>
  );
  // Energy / mood — emoji, auto-advance
  return(
    <div style={wrap}>
      <Dots c={cur}/>
      <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>{cur.q}</div>
      <div style={{display:"flex",gap:6}}>
        {cur.opts.map((emoji,i)=>{const v=i+1,sel=scores[cur.k]===v;return(
          <button key={i} onClick={()=>{setScores(s=>({...s,[cur.k]:v}));setTimeout(()=>setStep(s=>s+1),220);}} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${sel?cur.color:"#ffffff15"}`,background:sel?`${cur.color}22`:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:22}}>{emoji}</span>
          </button>
        );})}
      </div>
    </div>
  );
};

// ── READINESS CARD (shown in feed after check-in) ──
const ReadinessCard=({checkin})=>{
  const [showSleepPanel,setShowSleepPanel]=useState(false);
  const [showMindPanel,setShowMindPanel]=useState(false);
  const r=checkin.readiness;
  const col=readinessColor(r);
  const label=readinessLabel(r);
  const hour=checkin.check_in_hour??new Date(checkin.created_at||Date.now()).getHours();
  const timeLabel=hour<11?"☀️ Morning":hour<14?"🌤 Midday":hour<18?"🌇 Afternoon":"🌙 Evening";
  // Factor display — show actual measurements when available, else 1–5 rating
  const FACTORS=[
    {k:"sleep",label:"Sleep",icon:"😴",col:"#6EE7B7",
      disp:v=>checkin.sleep_hours!=null?`${checkin.sleep_hours}h`:`${v}/5`,
      pct:v=>checkin.sleep_hours!=null?Math.min(1,checkin.sleep_hours/8):(v-1)/4},
    {k:"energy",label:"Energy",icon:"⚡",col:"#FCD34D",disp:v=>`${v}/5`,pct:v=>(v-1)/4},
    {k:"mood",label:"Mood",icon:"😊",col:"#F9A8D4",disp:v=>`${v}/5`,pct:v=>(v-1)/4},
    {k:"water",label:"Hydration",icon:"💧",col:"#93C5FD",
      disp:v=>checkin.water_ml!=null?(checkin.water_ml>=1000?`${(checkin.water_ml/1000).toFixed(1)}L`:`${checkin.water_ml}ml`):`${v}/5`,
      pct:v=>checkin.water_ml!=null?Math.min(1,checkin.water_ml/2000):(v-1)/4},
  ];
  const weakest=FACTORS.reduce((a,b)=>checkin[a.k]<=checkin[b.k]?a:b);
  const INSIGHTS={
    sleep:[
      "Sleep deprivation raises pain sensitivity and tightens your muscles. Take extra movement breaks and avoid heavy lifting today.",
      "Excellent sleep = better tissue repair and spinal disc rehydration overnight. Your body is primed to move! 💪"
    ],
    energy:[
      "Low energy increases injury risk — muscles fatigue faster and form breaks down. Stick to gentle movement today.",
      "High energy signals your nervous system is dialled in. A great day for a challenging workout or long walk."
    ],
    mood:[
      "Stress physically contracts your neck, jaw and traps. Try 3 slow deep breaths right now — it genuinely releases that tension.",
      "Positive mood correlates with better motor patterns and more motivated movement. Let your body express it today!"
    ],
    water:[
      "Spinal discs are 80% water — under-hydration compresses them faster and stiffens your joints. Drink a big glass before your next task.",
      "Well hydrated joints move freely and muscles fire efficiently. Keep topping up throughout the day! 💧"
    ],
  };
  // Time-of-day secondary note
  const timeNotes={
    evening:"Evening check-in — your recovery for tomorrow starts now. Wind down, hydrate and protect your sleep tonight.",
    afternoon:"Afternoon check-in — if energy is dipping, a 5-min movement break beats caffeine every time.",
    midday:"Midday check-in — halfway through! Keep your hydration up and take a movement break soon.",
  };
  const timeKey=hour>=17?"evening":hour>=13?"afternoon":hour>=11?"midday":null;
  const mainInsight=r<45
    ?"Your readiness is low today. Prioritise the basics: hydrate, gentle movement and rest. Your body is asking for recovery."
    :INSIGHTS[weakest.k][checkin[weakest.k]>=3?1:0];

  // Sleep routine tips — shown when sleep quality is poor or hours are short
  const sleepHrs=checkin.sleep_hours;
  const sleepQ=checkin.sleep;
  const showSleepRoutine=sleepHrs!=null&&sleepHrs<7||sleepQ!=null&&sleepQ<=2;
  const SLEEP_TIPS=[
    {icon:"🌙",tip:"Set a consistent bedtime — even on weekends. Your circadian rhythm thrives on routine."},
    {icon:"📵",tip:"Put your phone away 30–60 min before bed. Blue light delays melatonin by up to 2 hours."},
    {icon:"🌡️",tip:"Keep your room cool (16–19°C). A drop in core temp triggers deeper sleep stages."},
    {icon:"🧘",tip:"Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Activates your rest-and-digest system."},
    {icon:"☕",tip:"Avoid caffeine after 2pm — its half-life is ~5 hours, so it's still active at bedtime."},
    {icon:"🚿",tip:"A warm shower 1–2h before bed helps lower core body temp, signalling it's time to sleep."},
  ];
  // Pick 3 tips that rotate daily so it feels fresh
  const dayIdx=new Date().getDate();
  const tips=SLEEP_TIPS.slice(dayIdx%SLEEP_TIPS.length).concat(SLEEP_TIPS).slice(0,3);

  // Mindfulness tips — shown when mood is low
  const showMindfulness=checkin.mood!=null&&checkin.mood<=2;
  const MINDFULNESS_TIPS=[
    {icon:"🌬️",tip:"Box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times to calm your nervous system fast."},
    {icon:"🖐️",tip:"5-4-3-2-1 grounding: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Stops a spiral instantly."},
    {icon:"🧠",tip:"Name the emotion out loud — 'I feel anxious'. Labelling activates your prefrontal cortex and dials down the amygdala."},
    {icon:"🚶",tip:"A 10-minute walk outside lowers cortisol more reliably than most other quick interventions. Even a slow one counts."},
    {icon:"✍️",tip:"Write 3 things you're grateful for — specific ones, not generic. This actively shifts your brain's attention filter."},
    {icon:"💧",tip:"Drink a full glass of water slowly. Dehydration amplifies negative mood by up to 20% — it's often overlooked."},
    {icon:"📞",tip:"Send a voice note to someone you care about. Social connection is the fastest mood regulator we have."},
    {icon:"🎵",tip:"Put on music that matches how you want to feel, not how you feel now. Your brain will follow the rhythm."},
  ];
  const mindfulnessTips=MINDFULNESS_TIPS.slice((dayIdx+3)%MINDFULNESS_TIPS.length).concat(MINDFULNESS_TIPS).slice(0,3);

  return<div className="card fu" style={{marginBottom:12,background:"linear-gradient(135deg,#6EE7B710,#93C5FD08)",borderColor:"#6EE7B730"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
      <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
        <Ring pct={r/100} color={col} size={64}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:col}}>{r}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
          <span style={{fontWeight:800,fontSize:16,color:col}}>{label}</span>
          <Pill color="#6EE7B7" text="TODAY"/>
          <Pill color="#555" text={timeLabel}/>
        </div>
        <div style={{fontSize:11,color:"#888"}}>Daily readiness · by Physio Brooke 👩‍⚕️</div>
      </div>
    </div>
    <div style={{display:"flex",gap:5,marginBottom:10}}>
      {FACTORS.map(f=>{
        const v=checkin[f.k];
        return<div key={f.k} style={{flex:1,background:"#ffffff07",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
          <div style={{fontSize:17,marginBottom:4}}>{f.icon}</div>
          <div style={{height:3,borderRadius:2,background:"#ffffff10",margin:"0 3px 3px"}}>
            <div style={{width:`${f.pct(v)*100}%`,height:"100%",background:f.col,borderRadius:2,transition:"width .6s"}}/>
          </div>
          <div style={{fontSize:8,color:"#666"}}>{f.label}</div>
          <div style={{fontSize:10,color:f.col,fontWeight:700}}>{f.disp(v)}</div>
        </div>;
      })}
    </div>
    <div style={{background:"#ffffff08",borderRadius:11,padding:"10px 13px",display:"flex",gap:8,alignItems:"flex-start"}}>
      <span style={{fontSize:18,flexShrink:0}}>👩‍⚕️</span>
      <div>
        <div style={{fontSize:12,color:"#bbb",lineHeight:1.6,marginBottom:timeKey?6:0}}>{mainInsight}</div>
        {timeKey&&<div style={{fontSize:11,color:"#666",lineHeight:1.5,borderTop:"1px solid #ffffff0f",paddingTop:5}}>{timeNotes[timeKey]}</div>}
      </div>
    </div>
    {showSleepRoutine&&<div style={{marginTop:8}}>
      <button onClick={()=>setShowSleepPanel(v=>!v)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#6EE7B710",border:"1px solid #6EE7B725",borderRadius:10,padding:"9px 13px",cursor:"pointer",color:"#6EE7B7",fontWeight:700,fontSize:12}}>
        <span>😴 Sleep Routine Tips</span>
        <span style={{fontSize:10,color:"#555"}}>{showSleepPanel?"▲ hide":"▼ show"}</span>
      </button>
      {showSleepPanel&&<div style={{background:"#6EE7B708",border:"1px solid #6EE7B718",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
        {tips.map((t,i)=>(
          <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",background:"#ffffff06",borderRadius:9,padding:"8px 10px"}}>
            <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{t.icon}</span>
            <div style={{fontSize:11,color:"#aaa",lineHeight:1.55}}>{t.tip}</div>
          </div>
        ))}
      </div>}
    </div>}
    {showMindfulness&&<div style={{marginTop:8}}>
      <button onClick={()=>setShowMindPanel(v=>!v)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F9A8D410",border:"1px solid #F9A8D425",borderRadius:10,padding:"9px 13px",cursor:"pointer",color:"#F9A8D4",fontWeight:700,fontSize:12}}>
        <span>🧘 Mindfulness Toolkit</span>
        <span style={{fontSize:10,color:"#555"}}>{showMindPanel?"▲ hide":"▼ show"}</span>
      </button>
      {showMindPanel&&<div style={{background:"#F9A8D408",border:"1px solid #F9A8D418",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
        {mindfulnessTips.map((t,i)=>(
          <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",background:"#ffffff06",borderRadius:9,padding:"8px 10px"}}>
            <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{t.icon}</span>
            <div style={{fontSize:11,color:"#aaa",lineHeight:1.55}}>{t.tip}</div>
          </div>
        ))}
      </div>}
    </div>}
  </div>;
};

// ── SLEEP TAB ──
const SLEEP_COL="#93C5FD";
const ALL_SLEEP_TIPS=[
  {icon:"🌙",category:"Routine",title:"Lock in a bedtime",body:"Pick a consistent bedtime and wake time — even on weekends. Your circadian clock is a habit engine; it thrives on regularity."},
  {icon:"📵",category:"Environment",title:"Phone-free bedroom",body:"Blue light from screens delays melatonin production by up to 2 hours. Charge your phone outside the bedroom or use Night Shift from 8pm."},
  {icon:"🌡️",category:"Environment",title:"Cool your room down",body:"Core body temperature must drop ~1°C to trigger deep sleep. Keep your room between 16–19°C. A cool room is one of the most powerful sleep levers."},
  {icon:"☕",category:"Nutrition",title:"Caffeine curfew: 2pm",body:"Caffeine's half-life is 5–6 hours — a 3pm coffee is still half-active at 9pm. For sensitive people, even a 12pm cutoff makes a noticeable difference."},
  {icon:"🍷",category:"Nutrition",title:"Alcohol disrupts deep sleep",body:"Alcohol may help you fall asleep but it fragments REM sleep and reduces deep sleep by up to 20%. It's a sedative, not a sleep aid."},
  {icon:"🚿",category:"Routine",title:"Warm shower 1–2h before bed",body:"A warm shower causes your blood vessels to dilate, rapidly dropping core body temp afterward — the exact signal your brain needs to initiate sleep."},
  {icon:"🧘",category:"Mindfulness",title:"4-7-8 breathing",body:"Inhale for 4 seconds, hold for 7, exhale slowly for 8. This activates your parasympathetic nervous system and reliably reduces sleep-onset time."},
  {icon:"✍️",category:"Mindfulness",title:"Brain dump before bed",body:"Write down tomorrow's tasks and any lingering thoughts before you sleep. Studies show this offloads mental load and reduces time to fall asleep by ~9 minutes."},
  {icon:"🏃",category:"Movement",title:"Exercise — but not too late",body:"Regular exercise improves deep sleep quality significantly. Aim to finish intense workouts by 6pm; even a 20-min evening walk is beneficial."},
  {icon:"🌅",category:"Routine",title:"Morning light first thing",body:"Get natural light within 30 minutes of waking. This anchors your circadian rhythm, making it easier to feel sleepy at the right time at night."},
  {icon:"😴",category:"Science",title:"You need 7–9 hours",body:"Adults who consistently get under 6 hours show measurably impaired cognition, increased injury risk, and elevated cortisol. There's no such thing as 'sleep training' to need less."},
  {icon:"🫀",category:"Science",title:"Sleep debt is real",body:"You can't fully 'catch up' on lost sleep. Chronic short sleep accumulates a physiological debt — one lie-in won't fix a week of 5-hour nights."},
];

const WIND_DOWN=[
  {time:"60 min",icon:"📵",action:"Put your phone on charge outside the bedroom"},
  {time:"45 min",icon:"🚿",action:"Warm shower or bath"},
  {time:"30 min",icon:"📖",action:"Light reading, journalling, or gentle stretching"},
  {time:"15 min",icon:"🌡️",action:"Lower thermostat, close blinds, prepare your room"},
  {time:"10 min",icon:"🧘",action:"4-7-8 breathing or a quick body scan meditation"},
  {time:"Bedtime",icon:"🌙",action:"Lights off — no scrolling"},
];

const SleepTab=({cu,lastCheckin})=>{
  const [history,setHistory]=useState([]);
  const [activeCategory,setActiveCategory]=useState("All");
  useEffect(()=>{
    supabase.from('checkins').select('sleep,sleep_hours,created_at').eq('user_id',cu.id)
      .order('created_at',{ascending:false}).limit(14)
      .then(({data})=>{ if(data?.length) setHistory([...data].reverse()); });
  },[cu.id]);

  const avgHrs=history.length?+(history.reduce((a,c)=>a+(c.sleep_hours||0),0)/history.length).toFixed(1):null;
  const avgQ=history.length?+(history.reduce((a,c)=>a+(c.sleep||0),0)/history.length).toFixed(1):null;
  const categories=["All",...[...new Set(ALL_SLEEP_TIPS.map(t=>t.category))]];
  const filtered=activeCategory==="All"?ALL_SLEEP_TIPS:ALL_SLEEP_TIPS.filter(t=>t.category===activeCategory);

  return<div>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#93C5FD15,#6EE7B710)",border:"1px solid #93C5FD25",borderRadius:14,padding:"16px 16px 14px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <span style={{fontSize:26}}>😴</span>
        <div>
          <div style={{fontWeight:800,fontSize:18,color:SLEEP_COL}}>Sleep Centre</div>
          <div style={{fontSize:11,color:"#666"}}>Track, learn & optimise your sleep</div>
        </div>
      </div>
      {avgHrs&&<div style={{display:"flex",gap:8,marginTop:10}}>
        <div style={{flex:1,background:"#ffffff08",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:SLEEP_COL}}>{avgHrs}h</div>
          <div style={{fontSize:9,color:"#666",marginTop:2}}>avg hours (14d)</div>
          <div style={{fontSize:9,color:avgHrs>=7?"#6EE7B7":"#F87171",fontWeight:700,marginTop:2}}>{avgHrs>=8?"Great":avgHrs>=7?"Good":avgHrs>=6?"Below avg":"Too low"}</div>
        </div>
        <div style={{flex:1,background:"#ffffff08",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:SLEEP_COL}}>{avgQ}/5</div>
          <div style={{fontSize:9,color:"#666",marginTop:2}}>avg quality (14d)</div>
          <div style={{fontSize:9,color:avgQ>=4?"#6EE7B7":avgQ>=3?"#FCD34D":"#F87171",fontWeight:700,marginTop:2}}>{avgQ>=4?"Excellent":avgQ>=3?"Okay":"Needs work"}</div>
        </div>
        <div style={{flex:1,background:"#ffffff08",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:900,color:SLEEP_COL}}>{history.filter(c=>c.sleep_hours>=7).length}</div>
          <div style={{fontSize:9,color:"#666",marginTop:2}}>good nights (14d)</div>
          <div style={{fontSize:9,color:"#6EE7B7",fontWeight:700,marginTop:2}}>≥7 hours</div>
        </div>
      </div>}
    </div>

    {/* Sleep history bars */}
    {history.length>0&&<div className="card" style={{marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📊 Sleep History</div>
      <div style={{display:"flex",gap:3,alignItems:"flex-end",height:60}}>
        {history.slice(-10).map((c,i)=>{
          const h=c.sleep_hours||0;
          const pct=Math.min(1,h/9);
          const col=h>=8?"#6EE7B7":h>=7?SLEEP_COL:h>=6?"#FCD34D":"#F87171";
          return<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{width:"100%",borderRadius:"3px 3px 0 0",background:col,height:`${Math.max(4,pct*52)}px`,transition:"height .4s"}}/>
            <div style={{fontSize:7,color:"#555"}}>{new Date(c.created_at).toLocaleDateString('en',{weekday:'short'})}</div>
          </div>;
        })}
      </div>
      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
        {[["#6EE7B7","8h+"],["#93C5FD","7–8h"],["#FCD34D","6–7h"],["#F87171","<6h"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:c}}/><span style={{fontSize:9,color:"#666"}}>{l}</span></div>
        ))}
      </div>
    </div>}

    {/* Tonight's wind-down routine */}
    <div className="card" style={{marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🌙 Tonight's Wind-Down Routine</div>
      <div style={{fontSize:11,color:"#666",marginBottom:10}}>Follow this in the hour before bed</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {WIND_DOWN.map((step,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"center",background:"#ffffff06",borderRadius:9,padding:"9px 11px"}}>
            <div style={{minWidth:52,fontSize:9,color:SLEEP_COL,fontWeight:700,textAlign:"center",background:"#93C5FD15",borderRadius:6,padding:"3px 4px"}}>{step.time}</div>
            <span style={{fontSize:16,flexShrink:0}}>{step.icon}</span>
            <div style={{fontSize:11,color:"#bbb",lineHeight:1.4}}>{step.action}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Tips library */}
    <div className="card" style={{marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>💡 Sleep Tips Library</div>
      <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setActiveCategory(c)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${activeCategory===c?SLEEP_COL+"55":"#ffffff15"}`,background:activeCategory===c?"#93C5FD20":"transparent",color:activeCategory===c?SLEEP_COL:"#666",fontSize:10,fontWeight:activeCategory===c?700:400,cursor:"pointer"}}>{c}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map((t,i)=>(
          <div key={i} style={{background:"#ffffff06",borderRadius:11,padding:"11px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:"#ddd"}}>{t.title}</div>
                <div style={{fontSize:9,color:SLEEP_COL,fontWeight:600}}>{t.category}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:"#999",lineHeight:1.6}}>{t.body}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Science callout */}
    <div style={{background:"linear-gradient(135deg,#93C5FD10,#6EE7B708)",border:"1px solid #93C5FD20",borderRadius:12,padding:"13px 14px",marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:12,color:SLEEP_COL,marginBottom:6}}>🔬 Why Sleep Is Non-Negotiable</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[
          ["🧠","Memory & learning","Deep sleep consolidates everything you learned that day into long-term memory."],
          ["💪","Muscle & tissue repair","Growth hormone is released almost exclusively during deep sleep — critical for recovery."],
          ["🛡️","Immune function","Even one night of poor sleep reduces natural killer cell activity by up to 70%."],
          ["❤️","Heart health","Chronic short sleep (< 6h) raises cardiovascular disease risk by 48%."],
          ["⚖️","Weight & metabolism","Sleep deprivation spikes ghrelin (hunger hormone) and drops leptin (satiety) — making overeating almost inevitable."],
        ].map(([icon,title,body],i)=>(
          <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{icon}</span>
            <div><span style={{fontSize:11,fontWeight:700,color:"#ccc"}}>{title} — </span><span style={{fontSize:11,color:"#888",lineHeight:1.5}}>{body}</span></div>
          </div>
        ))}
      </div>
    </div>
  </div>;
};

// ── READINESS HISTORY CARD (shown in Profile tab) ──
const ReadinessHistoryCard=({cu})=>{
  const [history,setHistory]=useState([]);
  useEffect(()=>{
    supabase.from('checkins').select('*').eq('user_id',cu.id)
      .order('created_at',{ascending:false}).limit(7)
      .then(({data})=>{ if(data&&data.length) setHistory([...data].reverse()); });
  },[cu.id]);
  if(!history.length) return null;
  const avg=Math.round(history.reduce((a,c)=>a+c.readiness,0)/history.length);
  const latest=history[history.length-1];
  const col=readinessColor(avg);
  const trend=history.length>=4
    ? (history.slice(-3).reduce((a,c)=>a+c.readiness,0)/3 - history.slice(0,3).reduce((a,c)=>a+c.readiness,0)/3)
    : 0;
  const FACTORS=[
    {k:"sleep",label:"Sleep",icon:"😴",col:"#6EE7B7"},
    {k:"energy",label:"Energy",icon:"⚡",col:"#FCD34D"},
    {k:"mood",label:"Mood",icon:"😊",col:"#F9A8D4"},
    {k:"water",label:"Hydration",icon:"💧",col:"#93C5FD"},
  ];
  return<div className="card" style={{marginBottom:9}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div style={{fontWeight:700,fontSize:13}}>⚡ Readiness Trend</div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        <span style={{fontSize:12,color:col,fontWeight:700}}>{avg} avg</span>
        {Math.abs(trend)>2&&<Pill color={trend>0?"#6EE7B7":"#F87171"} text={`${trend>0?"↑":"↓"} ${Math.abs(Math.round(trend))}`}/>}
      </div>
    </div>
    <Spk sid="rd" data={history.map(c=>({date:new Date(c.created_at).toLocaleDateString('en',{weekday:'short'}),val:c.readiness}))} color={col}/>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:4,marginBottom:10,fontSize:9,color:"#555"}}>
      <span>{history.length} day{history.length>1?"s":""} ago</span><span>today</span>
    </div>
    <div style={{fontWeight:700,fontSize:11,color:"#888",marginBottom:6}}>Today's factors</div>
    <div style={{display:"flex",gap:5}}>
      {FACTORS.map(f=>{
        const v=latest[f.k];
        return<div key={f.k} style={{flex:1,background:"#ffffff07",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
          <div style={{fontSize:16,marginBottom:3}}>{f.icon}</div>
          <div style={{height:2,borderRadius:1,background:"#ffffff08",margin:"0 2px 3px"}}>
            <div style={{width:`${((v-1)/4)*100}%`,height:"100%",background:f.col,borderRadius:1}}/>
          </div>
          <div style={{fontSize:8,color:"#666",marginBottom:1}}>{f.label}</div>
          <div style={{fontSize:10,color:f.col,fontWeight:700}}>{v}/5</div>
        </div>;
      })}
    </div>
  </div>;
};

// ── ERGONOMICS CHECK ──
const ErgonomicsCheck=({cu,notify,awardBadge})=>{
  const [existing,setExisting]=useState(null);
  const [loading,setLoading]=useState(true);
  const [step,setStep]=useState(0);
  const [retaking,setRetaking]=useState(false);
  const [saving,setSaving]=useState(false);
  const [ans,setAns]=useState({workstation_type:null,screen_height:null,screen_distance:null,seating_position:null,pain_areas:[]});
  useEffect(()=>{
    supabase.from('ergonomics_assessments').select('*').eq('user_id',cu.id)
      .order('created_at',{ascending:false}).limit(1)
      .then(({data})=>{if(data&&data.length)setExisting(data[0]);setLoading(false);});
  },[cu.id]);
  const STEPS=[
    {key:'workstation_type',q:'What best describes your workstation?',icon:'🖥️',opts:[
      {v:'desktop',l:'Desktop + monitor',i:'🖥️'},{v:'laptop',l:'Laptop only',i:'💻'},
      {v:'standing_desk',l:'Standing desk',i:'🏗️'},{v:'flexible',l:'Flexible / hot-desk',i:'☁️'}]},
    {key:'screen_height',q:'Where is the top of your screen relative to your eyes?',icon:'📺',opts:[
      {v:'below',l:'Below eye level',i:'⬇️',n:'looking down'},{v:'eye_level',l:'At eye level',i:'👀',n:'ideal'},
      {v:'above',l:'Above eye level',i:'⬆️',n:'looking up'}]},
    {key:'screen_distance',q:'How far is your screen from your eyes?',icon:'📏',opts:[
      {v:'too_close',l:'Less than 50cm',i:'😰',n:'Too close'},{v:'ideal',l:'50 – 70cm',i:'✅',n:'Ideal range'},
      {v:'too_far',l:'More than 70cm',i:'🔍',n:'Too far'}]},
    {key:'seating_position',q:'How would you describe your typical seated posture?',icon:'🪑',opts:[
      {v:'slumped',l:'Slumped / slouched',i:'😮‍💨'},{v:'upright',l:'Upright, back supported',i:'💪'},
      {v:'forward_lean',l:'Leaning forward',i:'🏋️'},{v:'varies',l:'Changes often',i:'🔄'}]},
    {key:'pain_areas',q:'Any areas of discomfort at work? (select all)',icon:'🩺',multi:true,opts:[
      {v:'none',l:'None — all good!',i:'🎉'},{v:'neck',l:'Neck / upper back',i:'🤔'},
      {v:'lower_back',l:'Lower back',i:'😣'},{v:'shoulders',l:'Shoulders',i:'🏋️'},
      {v:'wrists',l:'Wrists / hands',i:'✋'},{v:'eyes',l:'Eye strain',i:'👁️'}]},
  ];
  const calcRisk=a=>{
    let s=0;
    if(a.workstation_type==='laptop')s+=2;if(a.workstation_type==='flexible')s+=1;
    if(a.screen_height==='above'||a.screen_height==='below')s+=2;
    if(a.screen_distance==='too_close')s+=2;
    if(a.seating_position==='slumped')s+=3;if(a.seating_position==='forward_lean')s+=2;
    s+=(a.pain_areas||[]).filter(x=>x!=='none').length*1.5;
    return s>=7?'high':s>=4?'moderate':'low';
  };
  const genRecs=a=>{
    const r=[];
    if(a.screen_height==='below')r.push({i:'📺',t:'Raise your screen',d:"Looking down compresses cervical vertebrae. Use a monitor stand or books so the screen top aligns with eye level."});
    if(a.screen_height==='above')r.push({i:'⬇️',t:'Lower your monitor',d:"Looking up strains posterior neck muscles. Bring the screen down so your natural gaze falls slightly downward."});
    if(a.screen_distance==='too_close')r.push({i:'📏',t:'Move your screen back',d:"Under 50cm causes eye strain and forward head posture. Aim for arm's length — 50–70cm from your face."});
    if(a.workstation_type==='laptop')r.push({i:'💻',t:'Get an external keyboard',d:"Laptop-only work forces sustained neck flexion. An external keyboard + laptop stand dramatically reduces neck and shoulder load."});
    if(a.seating_position==='slumped')r.push({i:'🪑',t:'Reset your posture hourly',d:"Slumping unevenly loads your spinal discs. Set a 30-min timer: feet flat, hips at 90°, lumbar curve gently supported."});
    if(a.seating_position==='forward_lean')r.push({i:'🔄',t:'Reduce forward reach',d:"Leaning toward your screen raises disc pressure 3×. Move your keyboard closer so elbows stay relaxed at 90°."});
    if((a.pain_areas||[]).includes('wrists'))r.push({i:'✋',t:'Neutral wrist position',d:"Keep wrists flat — not angled up or down. Avoid resting on the wrist rest while actively typing; use it only for pauses."});
    if((a.pain_areas||[]).includes('eyes'))r.push({i:'👁️',t:'20-20-20 rule',d:"Every 20 minutes, look at something 20 feet away for 20 seconds. This is the evidence-based gold standard for digital eye strain."});
    if(r.length<2)r.push({i:'🚶',t:'Movement break every hour',d:"Even with great ergonomics, sustained sitting reduces spinal disc nutrition by up to 25%. Stand or walk 2 minutes each hour."});
    if(r.length<2)r.push({i:'💧',t:'Stay hydrated',d:"Spinal discs are 80% water. Dehydration accelerates disc degeneration — aim for 2L/day and sip consistently throughout the day."});
    return r.slice(0,4);
  };
  const save=async()=>{
    setSaving(true);
    const risk=calcRisk(ans);const recs=genRecs(ans);
    const payload={user_id:cu.id,...ans,pain_areas:ans.pain_areas||[],risk_level:risk,recommendations:recs,updated_at:new Date().toISOString()};
    if(existing){
      const{data}=await supabase.from('ergonomics_assessments').update(payload).eq('id',existing.id).select().single();
      if(data){setExisting(data);notify("✅ Ergonomics assessment updated!");}
    } else {
      const{data}=await supabase.from('ergonomics_assessments').insert(payload).select().single();
      if(data){setExisting(data);notify("✅ Ergonomics assessment saved!");if(awardBadge)awardBadge('posture_check');}
    }
    setRetaking(false);setSaving(false);
  };
  const riskCfg={low:{col:"#6EE7B7",label:"Low Risk",icon:"✅"},moderate:{col:"#FCD34D",label:"Moderate Risk",icon:"⚠️"},high:{col:"#F87171",label:"High Risk",icon:"🚨"}};
  const wrap={background:"linear-gradient(135deg,#C4B5FD10,#6EE7B708)",border:"1px solid #C4B5FD25",borderRadius:18,padding:18,marginBottom:14};
  if(loading)return null;
  // Show results if we have an assessment and not retaking
  if(existing&&!retaking){
    const risk=existing.risk_level||'low';const cfg=riskCfg[risk]||riskCfg.low;
    const recs=existing.recommendations||[];
    return<div style={wrap}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13}}>🪑 Ergonomics Assessment</div>
        <button onClick={()=>{setStep(0);setAns({workstation_type:null,screen_height:null,screen_distance:null,seating_position:null,pain_areas:[]});setRetaking(true);}} style={{background:"#ffffff08",border:"1px solid #ffffff15",color:"#888",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700}}>Retake</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:52,height:52,borderRadius:14,background:`${cfg.col}20`,border:`2px solid ${cfg.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{cfg.icon}</div>
        <div><div style={{fontWeight:800,fontSize:15,color:cfg.col}}>{cfg.label}</div><div style={{fontSize:11,color:"#888",marginTop:1}}>Worksite ergonomics · by Physio Brooke 👩‍⚕️</div></div>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Top Recommendations</div>
      {recs.map((rec,i)=><div key={i} style={{background:"#ffffff07",borderRadius:11,padding:"10px 12px",marginBottom:8,display:"flex",gap:9,alignItems:"flex-start"}}>
        <span style={{fontSize:18,flexShrink:0}}>{rec.i}</span>
        <div><div style={{fontWeight:700,fontSize:12,marginBottom:3,color:"#d4d4d4"}}>{rec.t}</div><div style={{fontSize:11,color:"#888",lineHeight:1.55}}>{rec.d}</div></div>
      </div>)}
    </div>;
  }
  // Show questionnaire
  const cur=STEPS[step];
  const isLast=step===STEPS.length-1;
  const curVal=ans[cur?.key];
  const canNext=cur?.multi?(ans.pain_areas||[]).length>0:!!curVal;
  if(step>=STEPS.length){
    const risk=calcRisk(ans);const cfg=riskCfg[risk];
    return<div style={{...wrap,textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:6}}>{cfg.icon}</div>
      <div style={{fontWeight:800,fontSize:16,color:cfg.col,marginBottom:4}}>{cfg.label}</div>
      <div style={{fontSize:12,color:"#888",marginBottom:16}}>Based on your responses, here are your personalised recommendations.</div>
      {genRecs(ans).map((r,i)=><div key={i} style={{background:"#ffffff07",borderRadius:10,padding:"9px 12px",marginBottom:8,textAlign:"left",display:"flex",gap:8}}>
        <span style={{fontSize:16,flexShrink:0}}>{r.i}</span>
        <div><div style={{fontWeight:700,fontSize:12,color:"#d4d4d4",marginBottom:2}}>{r.t}</div><div style={{fontSize:11,color:"#888",lineHeight:1.5}}>{r.d}</div></div>
      </div>)}
      <button onClick={save} disabled={saving} style={{width:"100%",marginTop:10,padding:"11px",borderRadius:11,border:"1px solid #C4B5FD44",background:"#C4B5FD18",color:"#C4B5FD",fontWeight:800,fontSize:14}}>{saving?"Saving…":"💾 Save Assessment"}</button>
    </div>;
  }
  return<div style={wrap}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontWeight:800,fontSize:13}}>🪑 Ergonomics Check</div>
      <div style={{display:"flex",gap:3}}>{STEPS.map((_,i)=><div key={i} style={{width:18,height:3,borderRadius:2,background:i<step?"#C4B5FD":"#ffffff15"}}/>)}</div>
    </div>
    <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>{cur.q}</div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {cur.opts.map(o=>{
        const sel=cur.multi?(ans.pain_areas||[]).includes(o.v):ans[cur.key]===o.v;
        return<button key={o.v} onClick={()=>{
          if(cur.multi){
            if(o.v==='none'){setAns(a=>({...a,pain_areas:['none']}));}
            else{setAns(a=>{const prev=(a.pain_areas||[]).filter(x=>x!=='none');const next=prev.includes(o.v)?prev.filter(x=>x!==o.v):[...prev,o.v];return{...a,pain_areas:next};});}
          }else{
            setAns(a=>({...a,[cur.key]:o.v}));
            if(!cur.multi)setTimeout(()=>setStep(s=>s+1),200);
          }
        }} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:11,border:`1px solid ${sel?"#C4B5FD44":"#ffffff12"}`,background:sel?"#C4B5FD18":"#ffffff05",textAlign:"left"}}>
          <span style={{fontSize:20,flexShrink:0}}>{o.i}</span>
          <div><div style={{fontWeight:700,fontSize:13,color:sel?"#C4B5FD":"#d4d4d4"}}>{o.l}</div>{o.n&&<div style={{fontSize:10,color:"#888"}}>{o.n}</div>}</div>
          {sel&&<span style={{marginLeft:"auto",color:"#C4B5FD",fontSize:14}}>✓</span>}
        </button>;
      })}
    </div>
    {cur.multi&&<button onClick={()=>setStep(s=>s+1)} disabled={!canNext} style={{width:"100%",marginTop:12,padding:"11px",borderRadius:11,border:`1px solid ${canNext?"#C4B5FD44":"#ffffff10"}`,background:canNext?"#C4B5FD18":"#ffffff05",color:canNext?"#C4B5FD":"#555",fontWeight:800,fontSize:14,opacity:canNext?1:.5}}>Next →</button>}
  </div>;
};

// ── PULSE CARD (shown in feed) ──
const PULSE_EMOJIS=['😫','😕','😐','🙂','😄'];
const PulseCard=({pulse,cu,onVoted})=>{
  const[voted,setVoted]=useState(false);
  const[voting,setVoting]=useState(false);
  const vote=async(score)=>{
    if(voting||voted)return;
    setVoting(true);
    const{error}=await supabase.from('pulse_responses').insert({pulse_id:pulse.id,user_id:cu.id,score});
    if(!error){setVoted(true);if(onVoted)onVoted();}
    setVoting(false);
  };
  if(voted) return(
    <div style={{background:"linear-gradient(135deg,#C4B5FD10,#6EE7B708)",border:"1px solid #C4B5FD22",borderRadius:16,padding:"16px",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:6}}>💙</div>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Response recorded!</div>
      <div style={{fontSize:12,color:"#888"}}>Thanks for helping shape the team's wellbeing data.</div>
    </div>
  );
  return(
    <div style={{background:"linear-gradient(135deg,#C4B5FD10,#6EE7B708)",border:"1px solid #C4B5FD33",borderRadius:16,padding:"16px",marginBottom:12}}>
      <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:2}}>
        <span style={{fontSize:16}}>🌡️</span>
        <div style={{fontWeight:800,fontSize:13,color:"#C4B5FD"}}>WEEKLY PULSE</div>
        <span style={{fontSize:9,background:"#6EE7B722",color:"#6EE7B7",border:"1px solid #6EE7B733",borderRadius:20,padding:"1px 7px",fontWeight:700}}>ANONYMOUS</span>
      </div>
      <div style={{fontWeight:700,fontSize:15,color:"#e8e8f0",marginBottom:4}}>{pulse.question}</div>
      <div style={{fontSize:11,color:"#888",marginBottom:14}}>Your vote is completely anonymous — the admin only sees the team average.</div>
      <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
        {PULSE_EMOJIS.map((em,i)=>(
          <button key={i} onClick={()=>vote(i+1)} disabled={voting} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 4px",borderRadius:12,border:"1px solid #ffffff18",background:"#ffffff06",cursor:"pointer",transition:"all .15s"}}>
            <span style={{fontSize:26}}>{em}</span>
            <span style={{fontSize:9,color:"#555"}}>{i+1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── SURVEY CARD (shown in feed) ──
const SURVEY_QS=[
  {key:"workload",icon:"⚡",color:"#FB923C",q:"My workload feels manageable this week"},
  {key:"balance",icon:"⚖️",color:"#6EE7B7",q:"I have a healthy work-life balance"},
  {key:"connection",icon:"🤝",color:"#93C5FD",q:"I feel connected and supported by my team"},
  {key:"physical",icon:"💪",color:"#C4B5FD",q:"My physical workspace and comfort is good"},
  {key:"overall",icon:"🌟",color:"#FCD34D",q:"Overall I feel good about my wellbeing at work"},
];
const AGREE=['Strongly Disagree','Disagree','Neutral','Agree','Strongly Agree'];
const SurveyCard=({survey,cu,onDone})=>{
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState({});
  const[done,setDone]=useState(false);
  const[saving,setSaving]=useState(false);
  const cur=SURVEY_QS[step];
  const submit=async()=>{
    if(Object.keys(answers).length<SURVEY_QS.length)return;
    setSaving(true);
    await supabase.from('survey_responses').insert({survey_id:survey.id,user_id:cu.id,scores:answers});
    setDone(true);setSaving(false);if(onDone)onDone();
  };
  if(done) return(
    <div style={{background:"linear-gradient(135deg,#93C5FD10,#6EE7B708)",border:"1px solid #93C5FD22",borderRadius:16,padding:"18px",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>✅</div>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Survey complete!</div>
      <div style={{fontSize:12,color:"#888"}}>Your anonymous responses help the team thrive. Thank you!</div>
    </div>
  );
  return(
    <div style={{background:"linear-gradient(135deg,#93C5FD10,#6EE7B708)",border:"1px solid #93C5FD33",borderRadius:16,padding:"16px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:16}}>📋</span>
          <span style={{fontWeight:800,fontSize:12,color:"#93C5FD"}}>{survey.title||"WELLBEING SURVEY"}</span>
          <span style={{fontSize:9,background:"#6EE7B722",color:"#6EE7B7",border:"1px solid #6EE7B733",borderRadius:20,padding:"1px 7px",fontWeight:700}}>ANONYMOUS</span>
        </div>
        <div style={{display:"flex",gap:4}}>{SURVEY_QS.map((_,i)=><div key={i} style={{width:18,height:3,borderRadius:2,background:i<step?"#93C5FD":i===step?"#93C5FD88":"#ffffff15"}}/>)}</div>
      </div>
      <div style={{fontWeight:700,fontSize:14,color:"#e8e8f0",marginBottom:14,marginTop:8}}>{cur.icon} {cur.q}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        {[1,2,3,4,5].map(v=>{const sel=answers[cur.key]===v;return(
          <button key={v} onClick={()=>setAnswers(a=>({...a,[cur.key]:v}))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:11,border:`1px solid ${sel?cur.color+"44":"#ffffff12"}`,background:sel?`${cur.color}18`:"#ffffff05",textAlign:"left"}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:sel?`${cur.color}33`:"#ffffff0f",border:`2px solid ${sel?cur.color:"#ffffff18"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:sel?cur.color:"#555",flexShrink:0}}>{v}</div>
            <span style={{fontSize:12,color:sel?cur.color:"#888",fontWeight:sel?700:400}}>{AGREE[v-1]}</span>
            {sel&&<span style={{marginLeft:"auto",color:cur.color,fontSize:13}}>✓</span>}
          </button>
        );})}
      </div>
      {step<SURVEY_QS.length-1
        ?<button onClick={()=>setStep(s=>s+1)} disabled={!answers[cur.key]} style={{width:"100%",padding:"11px",borderRadius:11,border:`1px solid ${answers[cur.key]?"#93C5FD44":"#ffffff10"}`,background:answers[cur.key]?"#93C5FD18":"#ffffff05",color:answers[cur.key]?"#93C5FD":"#555",fontWeight:800,fontSize:14,opacity:answers[cur.key]?1:.5}}>Next →</button>
        :<button onClick={submit} disabled={saving||!answers[cur.key]} style={{width:"100%",padding:"11px",borderRadius:11,border:"1px solid #93C5FD44",background:"#93C5FD22",color:"#93C5FD",fontWeight:800,fontSize:14}}>{saving?"Submitting…":"Submit Survey ✅"}</button>
      }
    </div>
  );
};

// ── AI TAB ──
const AiTab=({challenges,setChallenges,notify,cu})=>{
  const [prompt,setPrompt]=useState("");const [loading,setLoading]=useState(false);const [sugg,setSugg]=useState([]);const [err,setErr]=useState("");const [done,setDone]=useState({});
  const QP=["Morning movement challenge","Mindfulness for stressed teams","Desk-friendly exercises","Summer hydration push"];
  const dc={Easy:"#6EE7B7",Medium:"#FCD34D",Hard:"#F9A8D4"};
  const gen=async()=>{if(!prompt.trim())return;setLoading(true);setSugg([]);setErr("");try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});const data=await r.json();if(data.error)throw new Error(data.error);setSugg(data.suggestions);}catch(e){setErr("Couldn't generate — try again!");}setLoading(false);};
  const launch=async(s,i)=>{
    const today=new Date().toISOString().split("T")[0],end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
    const{data,error}=await supabase.from('challenges').insert({
      title:s.title,icon:s.icon,unit:s.unit,goal:s.goal,color:s.color,
      active:true,type:'count',start_date:today,end_date:end,
      company_id:cu?.company_id||null
    }).select().single();
    if(!error&&data){
      setChallenges(c=>[...c,{...data,desc:data.description,physioNote:data.physio_note,endDate:data.end_date}]);
      setDone(d=>({...d,[i]:true}));
      notify(`🚀 "${data.title}" launched!`);
    } else {
      notify("❌ Couldn't launch — try again.");
    }
  };
  return<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontWeight:700,fontSize:17}}>✨ AI Challenges</span><Pill color="#C4B5FD" text="CLAUDE"/></div><div style={{fontSize:12,color:"#888",marginBottom:14}}>Describe your team's goals and get challenge ideas instantly.</div><div style={{background:"#ffffff08",border:"1px solid #ffffff12",borderRadius:16,padding:16,marginBottom:14}}><div style={{fontWeight:700,marginBottom:8,fontSize:12}}>Quick prompts</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{QP.map(p=><button key={p} onClick={()=>setPrompt(p)} style={{background:prompt===p?"#C4B5FD22":"transparent",border:`1px solid ${prompt===p?"#C4B5FD55":"#ffffff15"}`,borderRadius:20,padding:"4px 10px",fontSize:11,color:prompt===p?"#C4B5FD":"#888",fontWeight:prompt===p?700:400}}>{p}</button>)}</div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Or describe your own…" rows={3} style={{resize:"none",width:"100%",marginBottom:10}}/><button onClick={gen} disabled={loading||!prompt.trim()} style={{width:"100%",padding:"11px",borderRadius:10,border:"1px solid #C4B5FD33",background:prompt.trim()?"#C4B5FD22":"#ffffff08",color:prompt.trim()?"#C4B5FD":"#555",fontWeight:700,fontSize:13}}>{loading?"✨ Generating…":"✨ Generate Ideas"}</button>{err&&<div style={{marginTop:8,fontSize:12,color:"#F9A8D4",textAlign:"center"}}>{err}</div>}</div>{sugg.map((s,i)=><div key={i} style={{background:"#ffffff08",border:`1px solid ${s.color}33`,borderRadius:16,padding:16,marginBottom:10}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:44,height:44,borderRadius:12,background:`${s.color}20`,border:`1px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.icon}</div><div style={{flex:1}}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><span style={{fontWeight:700,color:s.color}}>{s.title}</span><Pill color={dc[s.difficulty]||"#888"} text={s.difficulty}/></div><div style={{fontSize:12,color:"#888",marginBottom:4}}>{s.desc}</div><div style={{fontSize:11,color:"#666"}}>🎯 {s.goal?.toLocaleString()} {s.unit}</div></div></div><button onClick={()=>launch(s,i)} disabled={done[i]} style={{marginTop:10,width:"100%",background:done[i]?"#6EE7B722":`${s.color}18`,border:`1px solid ${done[i]?"#6EE7B744":s.color+"44"}`,color:done[i]?"#6EE7B7":s.color,padding:"8px",borderRadius:9,fontWeight:700,fontSize:12,opacity:done[i]?.7:1}}>{done[i]?"✅ Launched!":"🚀 Launch"}</button></div>)}{!loading&&sugg.length===0&&<div style={{textAlign:"center",padding:"36px 0",color:"#555"}}><div style={{fontSize:40,marginBottom:10}}>✨</div><div style={{fontSize:13}}>Pick a prompt or write your own above.</div></div>}</div>;
};

// ── CHALLENGE INTRO MODAL ──
const CHALLENGE_RESEARCH={
  steps:{icon:"🦶",headline:"Walking is the most underrated medicine.",fact:"Research published in JAMA shows that every 1,000 extra steps per day is associated with a 15% reduction in cardiovascular mortality. Just 7,500 steps/day is enough to significantly cut premature death risk — no gym required.",stat:"7,500 steps cuts mortality risk by up to 36%",source:"JAMA Internal Medicine, 2019"},
  hydration:{icon:"💧",headline:"Dehydration hits your brain before your body.",fact:"Even mild dehydration (just 1–2% body weight loss) impairs concentration, short-term memory and reaction time. A 2011 study found dehydrated workers made significantly more errors on cognitive tasks. Most office workers are chronically under-hydrated.",stat:"1–2% dehydration impairs cognition by up to 20%",source:"Journal of Nutrition, 2011"},
  stretch:{icon:"🧘",headline:"Sitting still is slowly injuring your body.",fact:"Prolonged sitting increases disc pressure in your spine by up to 40% compared to standing. Regular desk stretching reduces musculoskeletal pain by 72% in office workers and lowers sick leave by 28%, according to a systematic review of workplace intervention studies.",stat:"Desk stretching reduces pain by 72% in office workers",source:"Journal of Occupational Health, 2020"},
  posture:{icon:"🪑",headline:"Poor posture is costing your team more than you think.",fact:"Forward head posture (common from screen use) adds up to 27kg of force on the cervical spine for every inch the head moves forward. This leads to neck pain, headaches and fatigue — the #1 cause of presenteeism in office environments.",stat:"60% of office workers report neck/shoulder pain from posture",source:"Applied Ergonomics, 2018"},
  sleep:{icon:"😴",headline:"Sleep is when your body does its repair work.",fact:"A landmark study of 10,000 workers found that poor sleep costs employers an average of 11 lost productivity days per employee per year. Just one extra hour of sleep per night is associated with a 16% wage increase — because cognitive performance improves that significantly.",stat:"Poor sleep costs 11 productivity days per employee per year",source:"Sleep, Harvard Medical School, 2011"},
  mindfulness:{icon:"🧠",headline:"Two minutes of breathing changes your brain chemistry.",fact:"A 2018 meta-analysis of 47 trials found mindfulness reduces anxiety by 38% and depression symptoms by 30% in workplace settings. Even brief breathing exercises activate the parasympathetic nervous system within 90 seconds, reducing cortisol measurably.",stat:"Mindfulness reduces workplace anxiety by 38%",source:"JAMA Internal Medicine meta-analysis, 2018"},
  water:{icon:"💧",headline:"Dehydration hits your brain before your body.",fact:"Even mild dehydration (just 1–2% body weight loss) impairs concentration, short-term memory and reaction time. A 2011 study found dehydrated workers made significantly more errors on cognitive tasks. Most office workers are chronically under-hydrated.",stat:"1–2% dehydration impairs cognition by up to 20%",source:"Journal of Nutrition, 2011"},
  walk:{icon:"🦶",headline:"Walking is the most underrated medicine.",fact:"Research published in JAMA shows that every 1,000 extra steps per day is associated with a 15% reduction in cardiovascular mortality. Just 7,500 steps/day is enough to significantly cut premature death risk — no gym required.",stat:"7,500 steps cuts mortality risk by up to 36%",source:"JAMA Internal Medicine, 2019"},
  movement:{icon:"🏃",headline:"Movement breaks rewire your energy levels.",fact:"Sedentary bouts longer than 30 minutes cause measurable drops in insulin sensitivity and energy. A University of Queensland study found that taking a 2-minute walk every 20 minutes reduced blood sugar spikes by 30% and significantly improved afternoon energy and focus.",stat:"2-min movement breaks every 20 mins reduce blood sugar by 30%",source:"Diabetes Care, University of Queensland, 2014"},
  exercise:{icon:"💪",headline:"Exercise is the single most effective stress drug.",fact:"30 minutes of moderate exercise produces the same anxiety-reduction effect as 400mg of diazepam (Valium), without the side effects. It also increases BDNF — the brain's growth hormone — improving memory, focus and resilience to workplace stress.",stat:"Exercise reduces anxiety as effectively as anti-anxiety medication",source:"Frontiers in Psychiatry, 2019"},
  eye:{icon:"👁️",headline:"Your eyes weren't built for screens.",fact:"The average office worker blinks 66% less while using a screen. The 20-20-20 rule (every 20 min, look 20 feet away for 20 sec) reduces digital eye strain by up to 62%. Unmanaged eye strain causes headaches, blurred vision and fatigue that compound through the day.",stat:"Screen users blink 66% less — causing chronic eye strain",source:"American Optometric Association, 2020"},
  default:{icon:"👩‍⚕️",headline:"Small habits compound into major health outcomes.",fact:"Behavioural science shows that habit stacking — attaching a new behaviour to an existing routine — increases follow-through by 248% compared to motivation-based approaches alone. A week of consistent effort is enough to start wiring a new neural pathway.",stat:"Habit stacking increases follow-through by 248%",source:"British Journal of General Practice, 2012"},
};
const getChallengeResearch=(challenge)=>{
  const t=(challenge.title||"").toLowerCase();
  const keys=Object.keys(CHALLENGE_RESEARCH).filter(k=>k!=="default");
  const match=keys.find(k=>t.includes(k));
  return CHALLENGE_RESEARCH[match||"default"];
};
const ChallengeIntroModal=({challenge,onDone})=>{
  const [slide,setSlide]=useState(0);
  const research=getChallengeResearch(challenge);
  const slides=[
    {icon:challenge.icon||"🏆",title:"This week's challenge",body:challenge.title,sub:"Your team has a new weekly challenge. Here's what it's all about.",color:challenge.color||"#6EE7B7"},
    {
      icon:research.icon,title:"Why this matters",
      body:research.headline,
      sub:challenge.physio_note||research.fact,
      extra:{stat:research.stat,source:research.source},
      color:"#93C5FD"
    },
    {icon:"📊",title:"How to complete it",body:challenge.type==="habit"?"Check it off each day to build the streak. Small steps compound into big changes.":challenge.goal?`Log your progress daily. The goal is ${challenge.goal.toLocaleString()} ${challenge.unit||"points"} by the end of the week.`:"Log your activity daily and watch your progress grow.",sub:"You can log from the Home tab anytime.",color:"#F9A8D4"},
    {icon:"🚀",title:"You're all set!",body:"Let's do this. Your team is counting on you.",sub:"Good luck this week 💪",color:"#FCD34D"},
  ];
  const s=slides[slide];
  const isLast=slide===slides.length-1;
  return<div style={{position:"fixed",inset:0,background:"#000d",zIndex:950,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#13131f",border:`1px solid ${s.color}33`,borderRadius:22,padding:28,width:340,maxWidth:"95vw",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>{s.icon}</div>
      <div style={{fontSize:11,fontWeight:700,color:s.color,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>{s.title}</div>
      <div style={{fontWeight:800,fontSize:20,color:"#e8e8f0",marginBottom:10,lineHeight:1.3}}>{s.body}</div>
      <div style={{fontSize:13,color:"#999",lineHeight:1.65,marginBottom:s.extra?12:24}}>{s.sub}</div>
      {s.extra&&<div style={{background:"#ffffff08",border:"1px solid #ffffff12",borderRadius:12,padding:"10px 14px",marginBottom:24,textAlign:"left"}}>
        <div style={{fontSize:12,fontWeight:700,color:s.color,marginBottom:3}}>📊 {s.extra.stat}</div>
        <div style={{fontSize:10,color:"#555"}}>Source: {s.extra.source}</div>
      </div>}
      <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>
        {slides.map((_,i)=><div key={i} style={{width:i===slide?22:7,height:7,borderRadius:4,background:i===slide?s.color:"#ffffff18",transition:"all .25s"}}/>)}
      </div>
      <button onClick={()=>isLast?onDone():setSlide(s=>s+1)} style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${s.color},${s.color}bb)`,color:"#080810",fontWeight:800,fontSize:15,cursor:"pointer"}}>
        {isLast?"Let's go! 🎉":"Next →"}
      </button>
      {slide>0&&<button onClick={()=>setSlide(s=>s-1)} style={{marginTop:8,background:"transparent",border:"none",color:"#555",fontSize:12,cursor:"pointer"}}>← Back</button>}
    </div>
  </div>;
};

// ── FEED TAB ──
// ── KUDOS MODAL ──
const KudosModal=({cu,users,onClose,onSent})=>{
  const [receiver,setReceiver]=useState("");
  const [message,setMessage]=useState("");
  const [emoji,setEmoji]=useState("🙌");
  const [sending,setSending]=useState(false);
  const KUDOS_EMOJIS=["🙌","🔥","💪","⭐","❤️","🎉","👏","🏆"];
  const teammates=users.filter(u=>u.id!==cu.id);

  const send=async()=>{
    if(!receiver||!message.trim())return;
    setSending(true);
    const{error}=await supabase.from('kudos').insert({sender_id:cu.id,receiver_id:receiver,message:message.trim(),emoji,company_id:cu.company_id});
    if(!error){onSent({id:Date.now(),sender_id:cu.id,receiver_id:receiver,message:message.trim(),emoji,created_at:new Date().toISOString()});onClose();}
    setSending(false);
  };

  return<div style={{position:"fixed",inset:0,background:"#000000aa",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{width:"100%",maxWidth:360,background:"#13131f",border:"1px solid #ffffff18",borderRadius:18,padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:15}}>🙌 Give Kudos</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#888",fontSize:18,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{fontSize:11,color:"#888",marginBottom:6}}>Who deserves a shoutout?</div>
      <select value={receiver} onChange={e=>setReceiver(e.target.value)} style={{width:"100%",background:"#ffffff0a",border:"1px solid #ffffff18",borderRadius:10,padding:"10px 12px",color:receiver?"#e8e8f0":"#555",fontSize:13,marginBottom:12,outline:"none",boxSizing:"border-box"}}>
        <option value="">Select a teammate…</option>
        {teammates.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <div style={{fontSize:11,color:"#888",marginBottom:6}}>Pick an emoji</div>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {KUDOS_EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{flex:1,padding:"7px 0",borderRadius:9,border:`1px solid ${emoji===e?"#6EE7B755":"#ffffff15"}`,background:emoji===e?"#6EE7B720":"#ffffff08",fontSize:16,cursor:"pointer"}}>{e}</button>)}
      </div>
      <div style={{fontSize:11,color:"#888",marginBottom:6}}>Your message</div>
      <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Crushed that hydration challenge this week! 💧" rows={3} style={{width:"100%",background:"#ffffff0a",border:"1px solid #ffffff18",borderRadius:10,padding:"10px 12px",color:"#e8e8f0",fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",marginBottom:14}}/>
      <button onClick={send} disabled={sending||!receiver||!message.trim()} style={{width:"100%",background:"linear-gradient(135deg,#6EE7B7,#93C5FD)",color:"#080810",border:"none",borderRadius:11,padding:"12px",fontWeight:800,fontSize:14,cursor:"pointer",opacity:(!receiver||!message.trim())?0.4:1}}>
        {sending?"Sending…":`Send Kudos ${emoji}`}
      </button>
    </div>
  </div>;
};

// ── KUDOS CARD (in feed) ──
const KudosCard=({kudos,users})=>{
  const sender=users.find(u=>u.id===kudos.sender_id)||{name:"Someone",color:"#6EE7B7"};
  const receiver=users.find(u=>u.id===kudos.receiver_id)||{name:"a teammate",color:"#93C5FD"};
  return<div className="card" style={{marginBottom:10,background:"linear-gradient(135deg,#6EE7B710,#93C5FD08)",borderColor:"#6EE7B730",padding:"12px 14px"}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
      <Av u={sender} s={28}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12,color:"#aaa"}}>
          <span style={{fontWeight:700,color:sender.color}}>{sender.name?.split(" ")[0]}</span>
          {" gave kudos to "}
          <span style={{fontWeight:700,color:receiver.color}}>{receiver.name?.split(" ")[0]}</span>
        </div>
        <div style={{fontSize:10,color:"#555"}}>{ago(new Date(kudos.created_at).getTime())}</div>
      </div>
      <span style={{fontSize:22}}>{kudos.emoji}</span>
    </div>
    <div style={{background:"#ffffff08",borderRadius:10,padding:"9px 12px",fontSize:13,color:"#ccc",lineHeight:1.5,fontStyle:"italic"}}>"{kudos.message}"</div>
  </div>;
};

const FeedTab=({feed,setFeed,challenges,users,cu,notify,tips=[]})=>{
  const [ct,setCt]=useState({});
  const [expanded,setExpanded]=useState({});
  const [kudosList,setKudosList]=useState([]);
  const [showKudos,setShowKudos]=useState(false);
  const react=(pid,emoji)=>setFeed(f=>f.map(p=>{if(p.id!==pid)return p;const cur=p.rx[emoji]||[],has=cur.includes(cu.id);return{...p,rx:{...p.rx,[emoji]:has?cur.filter(x=>x!==cu.id):[...cur,cu.id]}};}));
  const comment=pid=>{const t=ct[pid];if(!t?.trim())return;setFeed(f=>f.map(p=>p.id!==pid?p:{...p,comments:[...p.comments,{uid:cu.id,text:t}]}));setCt(c=>({...c,[pid]:""}));};
  const toggle=pid=>setExpanded(e=>({...e,[pid]:!e[pid]}));

  useEffect(()=>{
    if(!cu?.company_id)return;
    supabase.from('kudos').select('*').eq('company_id',cu.company_id).order('created_at',{ascending:false}).limit(30)
      .then(({data})=>{ if(data) setKudosList(data); });
  },[cu?.company_id]);

  const items=[
    ...tips.map(t=>({...t,_kind:"tip",_ts:new Date(t.created_at).getTime()||0})),
    ...feed.map(p=>({...p,_kind:"post",_ts:p.ts})),
    ...kudosList.map(k=>({...k,_kind:"kudos",_ts:new Date(k.created_at).getTime()})),
  ].sort((a,b)=>b._ts-a._ts);

  return<div>
    {showKudos&&<KudosModal cu={cu} users={users} onClose={()=>setShowKudos(false)} onSent={k=>setKudosList(l=>[k,...l])}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:15}}>Team Feed</div>
      <button onClick={()=>setShowKudos(true)} style={{background:"linear-gradient(135deg,#6EE7B722,#93C5FD18)",border:"1px solid #6EE7B740",borderRadius:20,padding:"6px 14px",color:"#6EE7B7",fontWeight:700,fontSize:12,cursor:"pointer"}}>🙌 Give Kudos</button>
    </div>
    {items.map(item=>{
      if(item._kind==="tip") return<TipCard key={`tip-${item.id}`} tip={item}/>;
      if(item._kind==="kudos") return<KudosCard key={`kudos-${item.id}`} kudos={item} users={users}/>;
      const post=item;
      const u=users.find(x=>x.id===post.uid)||{name:"Unknown",color:"#888"};
      const ch=challenges.find(x=>String(x.id)===String(post.cid));
      if(!ch)return null;
      const isHabit=ch.type==="habit";
      const totalRx=RX.reduce((s,e)=>(post.rx[e]||[]).length?s+(post.rx[e]||[]).length:s,0);
      const isOpen=expanded[post.id];
      const hasComments=post.comments.length>0;

      return<div key={post.id} className="card" style={{marginBottom:10,padding:"12px 14px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Av u={u} s={30}/>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
              <div style={{fontSize:10,color:"#888"}}>{ago(post.ts)}</div>
            </div>
          </div>
          <span style={{fontSize:10,background:`${ch.color}18`,color:ch.color,border:`1px solid ${ch.color}33`,borderRadius:10,padding:"2px 8px",fontWeight:700}}>{ch.icon} {ch.title}</span>
        </div>

        {/* Content */}
        {isHabit
          ?<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <span style={{fontSize:22}}>✅</span>
              <span style={{fontWeight:700,fontSize:14,color:ch.color}}>Completed!</span>
            </div>
          :<div style={{marginBottom:8}}>
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:4}}>
              <span style={{fontWeight:900,fontSize:24,color:ch.color}}>{post.val.toLocaleString()}</span>
              <span style={{fontSize:12,color:"#888"}}>{ch.unit}</span>
              <span style={{fontSize:10,color:"#555",marginLeft:"auto"}}>/ {ch.goal.toLocaleString()}</span>
            </div>
            <div style={{background:"#ffffff08",borderRadius:4,height:3}}>
              <div style={{width:`${Math.min(100,(post.val/ch.goal)*100)}%`,height:"100%",background:ch.color,borderRadius:4}}/>
            </div>
          </div>
        }
        {post.note&&<div style={{fontSize:12,color:"#888",marginBottom:8,fontStyle:"italic"}}>"{post.note}"</div>}

        {/* Reactions row */}
        <div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
          {RX.map(e=>{const us=post.rx[e]||[],a=us.includes(cu.id);return(
            <button key={e} onClick={()=>react(post.id,e)} style={{background:a?"#ffffff14":"transparent",border:`1px solid ${a?"#ffffff28":"transparent"}`,borderRadius:16,padding:"2px 7px",fontSize:12,color:a?"#e8e8f0":"#666",display:"flex",gap:2,alignItems:"center",minWidth:28}}>
              {e}{us.length>0&&<span style={{fontSize:9,color:a?"#aaa":"#666"}}>{us.length}</span>}
            </button>
          );})}
          {/* Comment toggle */}
          <button onClick={()=>toggle(post.id)} style={{marginLeft:"auto",background:"transparent",border:"none",fontSize:11,color:isOpen?"#6EE7B7":"#555",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            💬{hasComments&&<span style={{fontSize:10}}>{post.comments.length}</span>}
          </button>
        </div>

        {/* Comments (expanded) */}
        {isOpen&&<div style={{marginTop:10,borderTop:"1px solid #ffffff08",paddingTop:10}}>
          {post.comments.map((c,i)=>{const u2=users.find(x=>x.id===c.uid)||{name:"?",color:"#888"};return(
            <div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
              <Av u={u2} s={20}/>
              <div style={{background:"#ffffff07",borderRadius:9,padding:"5px 9px",flex:1,fontSize:12,color:"#aaa"}}>
                <span style={{color:u2.color,fontWeight:600}}>{u2.name?.split(" ")[0]} </span>{c.text}
              </div>
            </div>
          );})}
          <div style={{display:"flex",gap:6,marginTop:6}}>
            <Av u={cu} s={20}/>
            <input placeholder="Reply…" value={ct[post.id]||""} onChange={e=>setCt(c=>({...c,[post.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&comment(post.id)} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
          </div>
        </div>}
      </div>;
    })}
    {items.length===0&&<div style={{textAlign:"center",color:"#888",padding:"40px 0",fontSize:13}}>
      <div style={{fontSize:36,marginBottom:8}}>👥</div>No team activity yet.
    </div>}
  </div>;
};

// ── HOME TAB ──
const HomeTab=({cu,checked,onCheckin,lastCheckin,feed,challenges,onLog,users,setTab,activePulse,myPulseVoted,setMyPulseVoted,activeSurvey,mySurveyDone,setMySurveyDone,iLoggedToday,nudgeCount})=>{
  const h=new Date().getHours();
  const greeting=h<5?"Up late 🌙":h<12?"Good morning":"Good afternoon";
  const firstName=cu.name?.split(" ")[0]||cu.name;
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
  const active=challenges.filter(c=>c.active);
  const recentPosts=[...feed].sort((a,b)=>b.ts-a.ts).filter(p=>{
    const ch=challenges.find(c=>String(c.id)===String(p.cid));
    return ch&&p.uid!==cu.id;
  }).slice(0,3);

  return<div>
    {/* Greeting */}
    <div style={{marginBottom:20}}>
      <div style={{fontSize:22,fontWeight:800,marginBottom:3}}>{greeting}, {firstName} 👋</div>
      <div style={{fontSize:12,color:"#888"}}>{new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}</div>
    </div>

    {/* Nudge */}
    {!iLoggedToday&&nudgeCount>0&&<div style={{background:"#6EE7B70d",border:"1px solid #6EE7B730",borderRadius:14,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>👀</span>
      <div style={{flex:1,fontSize:12,color:"#aaa"}}><span style={{fontWeight:700,color:"#6EE7B7"}}>{nudgeCount} teammate{nudgeCount!==1?"s":""}</span> already logged today</div>
      <button onClick={()=>onLog(true)} style={{background:"#6EE7B722",border:"1px solid #6EE7B744",color:"#6EE7B7",borderRadius:9,padding:"5px 12px",fontSize:11,fontWeight:700}}>Log now</button>
    </div>}

    {/* Pulse / Survey */}
    {activePulse&&!myPulseVoted&&<PulseCard pulse={activePulse} cu={cu} onVoted={()=>setMyPulseVoted(true)}/>}
    {activeSurvey&&!mySurveyDone&&<SurveyCard survey={activeSurvey} cu={cu} onDone={()=>setMySurveyDone(true)}/>}

    {/* Check-in */}
    {!checked&&<CheckIn onDone={onCheckin}/>}
    {checked&&lastCheckin&&<ReadinessCard checkin={lastCheckin}/>}

    {/* Today's challenges */}
    {active.length>0&&<>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>Today's challenge</span>
        <button onClick={()=>setTab("train")} style={{fontSize:11,color:"#6EE7B7",background:"transparent",border:"none",cursor:"pointer",fontWeight:700}}>Details →</button>
      </div>
      {active.slice(0,1).map(ch=>{
        const myPosts=feed.filter(p=>p.uid===cu.id&&String(p.cid)===String(ch.id)&&new Date(p.ts)>=weekStart);
        const tot=myPosts.reduce((s,p)=>s+p.val,0);
        const pct=Math.min(1,ch.type==="habit"?myPosts.filter(p=>new Date(p.ts).toDateString()===new Date().toDateString()).length:tot/ch.goal);
        const loggedToday=myPosts.some(p=>new Date(p.ts).toDateString()===new Date().toDateString());
        return<div key={ch.id} className="card" style={{marginBottom:8,display:"flex",gap:10,alignItems:"center",borderColor:`${ch.color}22`}}>
          <div style={{fontSize:24,flexShrink:0}}>{ch.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:5}}>{ch.title}</div>
            <div style={{background:"#ffffff08",borderRadius:4,height:3,marginBottom:4}}>
              <div style={{width:`${pct*100}%`,height:"100%",background:ch.color,borderRadius:4,transition:"width .4s"}}/>
            </div>
            <div style={{fontSize:10,color:"#888"}}>{ch.type!=="habit"?`${tot.toLocaleString()} / ${ch.goal.toLocaleString()} ${ch.unit}`:`${pct===1?"Done!":"Not logged yet"}`}</div>
          </div>
          <button onClick={()=>onLog(ch)} style={{background:loggedToday?"#ffffff08":`${ch.color}22`,border:`1px solid ${loggedToday?"#ffffff10":ch.color+"44"}`,color:loggedToday?"#555":ch.color,borderRadius:10,padding:"7px 13px",fontSize:12,fontWeight:700,flexShrink:0}}>
            {loggedToday?"✓":"+ Log"}
          </button>
        </div>;
      })}
    </>}

    {/* Recent crew */}
    {recentPosts.length>0&&<>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10,marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>Crew activity</span>
        <button onClick={()=>setTab("crew")} style={{fontSize:11,color:"#6EE7B7",background:"transparent",border:"none",cursor:"pointer",fontWeight:700}}>See all →</button>
      </div>
      {recentPosts.map(post=>{
        const u=users.find(x=>x.id===post.uid)||{name:"?",color:"#888"};
        const ch=challenges.find(x=>String(x.id)===String(post.cid));
        if(!ch)return null;
        return<div key={post.id} style={{display:"flex",gap:9,alignItems:"center",padding:"10px 12px",background:"#ffffff05",borderRadius:12,marginBottom:6,border:"1px solid #ffffff08"}}>
          <Av u={u} s={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name?.split(" ")[0]} · {ch.icon} {ch.title}</div>
            <div style={{fontSize:10,color:"#888"}}>{post.val>0?`${post.val} ${ch.unit}`:"Completed"} · {ago(post.ts)}</div>
          </div>
        </div>;
      })}
    </>}

    {active.length===0&&!checked&&recentPosts.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#888"}}>
      <div style={{fontSize:40,marginBottom:10}}>👋</div>
      <div style={{fontSize:14,fontWeight:700,color:"#ccc",marginBottom:6}}>Welcome to Wellcrew!</div>
      <div style={{fontSize:12}}>Start by completing your daily check-in above.</div>
    </div>}
  </div>;
};

// ── TRAIN TAB (challenges + leaderboard) ──
const TrainTab=({challenges,feed,cu,onLog,lb,users,badges,teams,cu2,notify,session,setChallenges})=>{
  const [sec,setSec]=useState("challenges");
  return<div>
    <div style={{display:"flex",gap:5,marginBottom:14,background:"#ffffff07",borderRadius:11,padding:3}}>
      {[["challenges","🏋️ Challenges"],["board","🥇 Leaderboard"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>setSec(id)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:sec===id?"#6EE7B722":"transparent",color:sec===id?"#6EE7B7":"#888",fontWeight:sec===id?700:400,fontSize:12}}>{lbl}</button>
      ))}
    </div>
    {sec==="challenges"&&<ChalTab challenges={challenges} feed={feed} cu={cu} onLog={onLog}/>}
    {sec==="board"&&<LbTab lb={lb} feed={feed} users={users} challenges={challenges} cu={cu} teams={teams} badges={badges}/>}
  </div>;
};

// ── ME TAB (profile + messages) ──
const MeTab=({cu,lb,pd,setPd,notify,checked,onCheckin,lastCheckin,badges,awardBadge,allUsers})=>{
  const [sec,setSec]=useState("profile");
  return<div>
    <div style={{display:"flex",gap:5,marginBottom:14,background:"#ffffff07",borderRadius:11,padding:3}}>
      {[["profile","👤 Profile"],["messages","💬 Messages"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>setSec(id)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:sec===id?"#6EE7B722":"transparent",color:sec===id?"#6EE7B7":"#888",fontWeight:sec===id?700:400,fontSize:12}}>{lbl}</button>
      ))}
    </div>
    {sec==="profile"&&<ProfileTab cu={cu} lb={lb} pd={pd} setPd={setPd} notify={notify} checked={checked} onCheckin={onCheckin} lastCheckin={lastCheckin} badges={badges} awardBadge={awardBadge}/>}
    {sec==="messages"&&<MsgTab cu={cu} users={allUsers}/>}
  </div>;
};

// ── CHALLENGES TAB ──
const ChalTab=({challenges,feed,cu,onLog})=>{
  const a=challenges.filter(c=>c.active);
  const DAYS=["S","M","T","W","T","F","S"];
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d.toDateString();});

  return<div>
    <div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Active Challenges</div>
    {a.map(ch=>{
      const isHabit=ch.type==="habit";
      // Only count this week's logs (weekly reset every Monday)
      const myPosts=feed.filter(p=>p.uid===cu.id&&String(p.cid)===String(ch.id)&&new Date(p.ts)>=weekStart);
      const tot=myPosts.reduce((a,p)=>a+p.val,0);
      const pct=Math.min(1,isHabit?weekDays.filter(d=>myPosts.some(p=>new Date(p.ts).toDateString()===d)).length/5:tot/ch.goal);
      const doneToday=myPosts.some(p=>new Date(p.ts).toDateString()===todayStr());
      const weekDone=weekDays.map(d=>myPosts.some(p=>new Date(p.ts).toDateString()===d));

      return<div key={ch.id} className="card" style={{marginBottom:14,borderColor:`${ch.color}22`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:26,marginBottom:3}}>{ch.icon}</div>
            <div style={{fontWeight:800,fontSize:15,color:ch.color}}>{ch.title}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{ch.desc}</div>
          </div>
          <Ring pct={pct} color={ch.color}/>
        </div>

        {isHabit
          ?<>
            <div style={{display:"flex",gap:3,marginBottom:10}}>
              {DAYS.map((d,i)=><div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:8,color:"#555",marginBottom:3}}>{d}</div>
                <div style={{height:28,borderRadius:6,background:weekDone[i]?`${ch.color}99`:"#ffffff0a",border:`1px solid ${weekDone[i]?ch.color+"66":"#ffffff10"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:weekDone[i]?ch.color:"#444"}}>
                  {weekDone[i]?"✓":""}
                </div>
              </div>)}
            </div>
            <div style={{fontSize:11,color:"#888",marginBottom:10}}>
              {weekDone.filter(Boolean).length} / 5 days this week
            </div>
          </>
          :<>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",marginBottom:5}}>
              <span>{tot.toLocaleString()} / {ch.goal.toLocaleString()} {ch.unit}</span>
            </div>
            <div style={{background:"#ffffff08",borderRadius:6,height:5,marginBottom:12}}>
              <div style={{width:`${pct*100}%`,height:"100%",background:ch.color,borderRadius:6}}/>
            </div>
          </>
        }

        {ch.physioNote&&
          <div style={{background:`${ch.color}0d`,border:`1px solid ${ch.color}22`,borderRadius:10,padding:"9px 12px",marginBottom:12}}>
            <div style={{fontSize:10,color:ch.color,fontWeight:700,marginBottom:3}}>👩‍⚕️ Physio Note</div>
            <div style={{fontSize:11,color:"#aaa",lineHeight:1.55}}>{ch.physioNote}</div>
          </div>
        }

        <button
          onClick={()=>onLog(ch)}
          disabled={isHabit&&doneToday}
          style={{width:"100%",background:isHabit&&doneToday?"#6EE7B710":`${ch.color}18`,border:`1px solid ${isHabit&&doneToday?"#6EE7B733":ch.color+"44"}`,color:isHabit&&doneToday?"#6EE7B7":ch.color,padding:"10px",borderRadius:9,fontWeight:700,fontSize:13,opacity:isHabit&&doneToday?.65:1}}>
          {isHabit&&doneToday?"✅ Done for today!":`${isHabit?"✅ Mark as Done":"Log"} ${ch.icon} ${isHabit?"":"Progress"}`}
        </button>
      </div>;
    })}
    {a.length===0&&<div style={{textAlign:"center",color:"#888",padding:"20px 0 10px",fontSize:13}}>No active challenges.</div>}

    {/* ── Challenge History ── */}
    {challenges.filter(c=>!c.active).length>0&&<>
      <div style={{fontWeight:700,fontSize:14,color:"#888",marginTop:18,marginBottom:10}}>📚 Past Challenges</div>
      {challenges.filter(c=>!c.active).map(ch=>{
        const myPosts=feed.filter(p=>p.uid===cu.id&&String(p.cid)===String(ch.id));
        const tot=myPosts.reduce((a,p)=>a+p.val,0);
        const hitGoal=ch.goal&&tot>=ch.goal;
        const pct=ch.goal?Math.min(1,tot/ch.goal):0;
        const days=myPosts.length;
        return<div key={ch.id} className="card fu" style={{marginBottom:9,opacity:.8,borderColor:`${ch.color}18`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:22}}>{ch.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:"#bbb"}}>{ch.title}</div>
              <div style={{fontSize:10,color:"#555"}}>{ch.endDate?`Ended ${ch.endDate}`:"Archived"}</div>
            </div>
            {hitGoal?<span style={{fontSize:11,background:"#6EE7B722",border:"1px solid #6EE7B744",color:"#6EE7B7",borderRadius:8,padding:"3px 8px",fontWeight:700}}>✅ Completed</span>
              :<span style={{fontSize:11,background:"#ffffff08",borderRadius:8,padding:"3px 8px",color:"#666"}}>{Math.round(pct*100)}%</span>}
          </div>
          {ch.type!=="habit"&&<>
            <div style={{background:"#ffffff08",borderRadius:4,height:4,marginBottom:6}}>
              <div style={{width:`${pct*100}%`,height:"100%",background:hitGoal?"#6EE7B7":ch.color,borderRadius:4}}/>
            </div>
            <div style={{fontSize:11,color:"#666"}}>{tot.toLocaleString()} / {ch.goal?.toLocaleString()} {ch.unit} · {days} log{days!==1?"s":""}</div>
          </>}
          {ch.type==="habit"&&<div style={{fontSize:11,color:"#666"}}>{days} day{days!==1?"s":""} completed</div>}
        </div>;
      })}
    </>}
  </div>;
};

// ── MESSAGES TAB ──
const MsgTab=({cu,users})=>{
  const [dm,setDm]=useState(null);
  const [txt,setTxt]=useState("");
  const [sending,setSending]=useState(false);
  const [sendErr,setSendErr]=useState("");
  const [convos,setConvos]=useState({});
  const [lastMsgs,setLastMsgs]=useState({});
  const ref=useRef(null);

  useEffect(()=>{
    supabase.from('messages')
      .select('*')
      .or(`from_id.eq.${cu.id},to_id.eq.${cu.id}`)
      .order('created_at',{ascending:true})
      .then(({data})=>{
        if(!data) return;
        const grouped={};
        data.forEach(msg=>{
          const partner=msg.from_id===cu.id?msg.to_id:msg.from_id;
          if(!grouped[partner]) grouped[partner]=[];
          grouped[partner].push(msg);
        });
        setConvos(grouped);
        const lasts={};
        Object.entries(grouped).forEach(([uid,ms])=>{ lasts[uid]=ms[ms.length-1]; });
        setLastMsgs(lasts);
      });
    const ch=supabase.channel('dm-'+cu.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`to_id=eq.${cu.id}`},(payload)=>{
        const msg=payload.new;
        const partner=msg.from_id;
        setConvos(prev=>({...prev,[partner]:[...(prev[partner]||[]),msg]}));
        setLastMsgs(prev=>({...prev,[partner]:msg}));
      })
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[cu.id]);

  useEffect(()=>{ if(ref.current) ref.current.scrollTop=ref.current.scrollHeight; },[dm,convos]);

  const send=async()=>{
    if(!txt.trim()||!dm||sending) return;
    const text=txt.trim();
    setSending(true);
    setSendErr("");
    const{data,error}=await supabase.from('messages').insert({from_id:cu.id,to_id:dm.id,text}).select().single();
    setSending(false);
    if(error){setSendErr(error.message);return;}
    if(data){
      setTxt("");
      setConvos(prev=>({...prev,[dm.id]:[...(prev[dm.id]||[]),data]}));
      setLastMsgs(prev=>({...prev,[dm.id]:data}));
    }
  };

  const dmMsgs=dm?(convos[dm.id]||[]):[];

  if(dm) return(
    <div style={{display:"flex",flexDirection:"column",height:"70vh"}}>
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
        <button onClick={()=>setDm(null)} style={{background:"transparent",border:"none",color:"#6EE7B7",fontSize:20,padding:0}}>←</button>
        <Av u={dm} s={32}/>
        <div style={{fontWeight:700,fontSize:13}}>{dm.name}</div>
      </div>
      <div ref={ref} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:7,paddingBottom:10}}>
        {dmMsgs.map((msg,i)=>{
          const mine=msg.from_id===cu.id;
          return<div key={msg.id||i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}>
            <div style={{background:mine?`${cu.color||"#6EE7B7"}33`:"#ffffff0f",border:`1px solid ${mine?(cu.color||"#6EE7B7")+"33":"#ffffff15"}`,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"8px 12px",maxWidth:"75%",fontSize:13}}>{msg.text}</div>
          </div>;
        })}
      </div>
      {sendErr&&<div style={{fontSize:11,color:"#F87171",marginBottom:6,padding:"6px 10px",background:"#F8717120",borderRadius:8}}>{sendErr}</div>}
      <div style={{display:"flex",gap:7}}>
        <input placeholder="Message…" value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,fontSize:13}} disabled={sending}/>
        <button onClick={send} disabled={sending} style={{background:`${cu.color||"#6EE7B7"}22`,border:`1px solid ${cu.color||"#6EE7B7"}55`,color:cu.color||"#6EE7B7",padding:"0 14px",borderRadius:9,fontWeight:700,opacity:sending?0.5:1}}>{sending?"…":"→"}</button>
      </div>
    </div>
  );

  return(
    <div>
      <div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Direct Messages</div>
      {users.filter(u=>u.id!==cu.id).map(u=>{
        const last=lastMsgs[u.id];
        return<div key={u.id} onClick={()=>setDm(u)} className="card" style={{marginBottom:9,cursor:"pointer",display:"flex",gap:9,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <Av u={u} s={40}/>
            <div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:"#6EE7B7",border:"2px solid #080810"}}/>
          </div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
            <div style={{fontSize:12,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?last.text:"Start a conversation…"}</div>
          </div>
        </div>;
      })}
    </div>
  );
};

// ── BADGES GRID ──
const BadgesGrid=({badges,cu})=>{
  const myBadges=(badges||[]).filter(b=>b.user_id===cu.id);
  if(!myBadges.length) return(
    <div className="card" style={{marginBottom:9,textAlign:"center",padding:20}}>
      <div style={{fontSize:32,marginBottom:8}}>🏅</div>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>No badges yet</div>
      <div style={{fontSize:12,color:"#888"}}>Complete check-ins, build streaks and crush challenges to earn badges!</div>
    </div>
  );
  return(
    <div className="card" style={{marginBottom:9}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>🏅 Badges ({myBadges.length})</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {myBadges.map(b=>{
          const def=BADGE_DEFS[b.badge_type];
          if(!def)return null;
          return(
            <div key={b.badge_type} title={def.desc} style={{background:`${def.color}15`,border:`1px solid ${def.color}30`,borderRadius:12,padding:"9px 10px",textAlign:"center",minWidth:68,flex:"0 1 auto"}}>
              <div style={{fontSize:22,marginBottom:4}}>{def.icon}</div>
              <div style={{fontSize:9,color:def.color,fontWeight:700,lineHeight:1.3,maxWidth:64}}>{def.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── BODY MAP ──
const BodyMap=({value,onChange})=>{
  const [view,setView]=useState('front');
  const zp=(id)=>{
    const sel=value===id;
    return{fill:sel?'#F9A8D430':'#93C5FD07',stroke:sel?'#F9A8D4':'#93C5FD30',strokeWidth:sel?2:1,style:{cursor:'pointer'},onClick:()=>onChange(value===id?'':id)};
  };
  const lp={fontSize:7,fill:'#ffffff55',fontFamily:'system-ui',pointerEvents:'none',textAnchor:'middle'};
  const slp={fontSize:7,fill:'#F9A8D4',fontFamily:'system-ui',fontWeight:'700',pointerEvents:'none',textAnchor:'middle'};
  const lbl=(id,x,y,t)=><text key={'t'+id} x={x} y={y} {...(value===id?slp:lp)}>{t}</text>;

  /* Silhouette paths shared between front/back */
  const silhouette='#93C5FD18';
  const silS='#93C5FD40';

  return(
    <div>
      {/* Front / Back toggle */}
      <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:8}}>
        {[['front','Front view'],['back','Back view']].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:'4px 14px',borderRadius:20,border:`1px solid ${view===v?'#F9A8D455':'#ffffff18'}`,background:view===v?'#F9A8D420':'transparent',color:view===v?'#F9A8D4':'#888',fontWeight:view===v?700:400,fontSize:11}}>{l}</button>
        ))}
      </div>

      {/* R / L labels */}
      <div style={{display:'flex',justifyContent:'space-between',padding:'0 28px 4px',fontSize:11,fontWeight:800,color:'#6EE7B7'}}>
        <span>R</span><span style={{fontSize:9,color:'#555',fontWeight:400,alignSelf:'center'}}>patient perspective</span><span>L</span>
      </div>

      <svg viewBox="0 0 200 430" style={{width:'100%',maxWidth:240,display:'block',margin:'0 auto'}}>

        {/* ── BODY OUTLINE (background silhouette) ── */}
        {view==='front'&&<>
          {/* Body base outline */}
          <ellipse cx="100" cy="30" rx="23" ry="28" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M94 56 L94 76 L106 76 L106 56Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Torso */}
          <path d="M88 76 L112 76 L124 114 L126 155 L126 210 L74 210 L74 155 L76 114Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Shoulders */}
          <path d="M88 76 L56 84 L54 115 L87 115 L87 76Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M112 76 L144 84 L146 115 L113 115 L113 76Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Arms */}
          <path d="M36 84 L56 84 L56 170 L36 170Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M144 84 L164 84 L164 170 L144 170Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M35 170 L55 170 L55 268 L35 268Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M145 170 L165 170 L165 268 L145 268Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Hips */}
          <path d="M74 210 L100 210 L100 252 L68 252Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M100 210 L126 210 L132 252 L100 252Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Thighs */}
          <path d="M68 252 L100 252 L100 322 L70 322Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M100 252 L132 252 L130 322 L100 322Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Knees */}
          <path d="M70 322 L100 322 L100 346 L71 346Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M100 322 L130 322 L129 346 L100 346Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          {/* Shins */}
          <path d="M72 346 L99 346 L98 416 L73 416Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M101 346 L128 346 L127 416 L102 416Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
        </>}
        {view==='back'&&<>
          <ellipse cx="100" cy="30" rx="23" ry="28" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M94 56 L94 76 L106 76 L106 56Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M88 76 L112 76 L124 114 L126 155 L126 210 L74 210 L74 155 L76 114Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M88 76 L56 84 L54 115 L87 115 L87 76Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M112 76 L144 84 L146 115 L113 115 L113 76Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M36 84 L56 84 L56 170 L36 170Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M144 84 L164 84 L164 170 L144 170Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M35 170 L55 170 L55 268 L35 268Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M145 170 L165 170 L165 268 L145 268Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M74 210 L100 210 L100 252 L68 252Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M100 210 L126 210 L132 252 L100 252Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M68 252 L100 252 L100 322 L70 322Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M100 252 L132 252 L130 322 L100 322Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M70 322 L100 322 L100 346 L71 346Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M100 322 L130 322 L129 346 L100 346Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M72 346 L99 346 L98 416 L73 416Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
          <path d="M101 346 L128 346 L127 416 L102 416Z" fill={silhouette} stroke={silS} strokeWidth="1"/>
        </>}

        {/* ── CLICKABLE ZONES ── */}
        {view==='front'&&<>
          <ellipse cx="100" cy="30" rx="23" ry="28" {...zp('Head / Eyes')}/>
          {lbl('Head / Eyes',100,32,'Head')}
          <path d="M94 56 L94 76 L106 76 L106 56Z" {...zp('Neck')}/>{lbl('Neck',100,68,'Neck')}
          <path d="M88 76 L56 84 L54 115 L87 115 L87 76Z" {...zp('R Shoulder')}/>{lbl('R Shoulder',71,98,'R')}
          <path d="M112 76 L144 84 L146 115 L113 115 L113 76Z" {...zp('L Shoulder')}/>{lbl('L Shoulder',129,98,'L')}
          <path d="M88 76 L112 76 L124 114 L126 155 L74 155 L76 114Z" {...zp('Chest')}/>{lbl('Chest',100,116,'Chest')}
          <path d="M74 155 L126 155 L126 210 L74 210Z" {...zp('Abdomen')}/>{lbl('Abdomen',100,183,'Abdomen')}
          <path d="M36 84 L56 84 L56 170 L36 170Z" {...zp('R Upper Arm')}/>{lbl('R Upper Arm',46,128,'Arm')}
          <path d="M144 84 L164 84 L164 170 L144 170Z" {...zp('L Upper Arm')}/>{lbl('L Upper Arm',154,128,'Arm')}
          <path d="M35 170 L55 170 L55 268 L35 268Z" {...zp('R Forearm / Wrist')}/>{lbl('R Forearm / Wrist',45,220,'Wrist')}
          <path d="M145 170 L165 170 L165 268 L145 268Z" {...zp('L Forearm / Wrist')}/>{lbl('L Forearm / Wrist',155,220,'Wrist')}
          <path d="M74 210 L100 210 L100 252 L68 252Z" {...zp('R Hip')}/>{lbl('R Hip',86,232,'Hip')}
          <path d="M100 210 L126 210 L132 252 L100 252Z" {...zp('L Hip')}/>{lbl('L Hip',114,232,'Hip')}
          <path d="M68 252 L100 252 L100 322 L70 322Z" {...zp('R Thigh')}/>{lbl('R Thigh',85,287,'Thigh')}
          <path d="M100 252 L132 252 L130 322 L100 322Z" {...zp('L Thigh')}/>{lbl('L Thigh',115,287,'Thigh')}
          <path d="M70 322 L100 322 L100 346 L71 346Z" {...zp('R Knee')}/>{lbl('R Knee',85,336,'Knee')}
          <path d="M100 322 L130 322 L129 346 L100 346Z" {...zp('L Knee')}/>{lbl('L Knee',115,336,'Knee')}
          <path d="M72 346 L99 346 L98 416 L73 416Z" {...zp('R Shin / Calf')}/>{lbl('R Shin / Calf',85,382,'Shin')}
          <path d="M101 346 L128 346 L127 416 L102 416Z" {...zp('L Shin / Calf')}/>{lbl('L Shin / Calf',115,382,'Shin')}
        </>}
        {view==='back'&&<>
          <ellipse cx="100" cy="30" rx="23" ry="28" {...zp('Head / Eyes')}/>{lbl('Head / Eyes',100,32,'Head')}
          <path d="M94 56 L94 76 L106 76 L106 56Z" {...zp('Neck')}/>{lbl('Neck',100,68,'Neck')}
          <path d="M88 76 L56 84 L54 115 L87 115 L87 76Z" {...zp('R Shoulder')}/>{lbl('R Shoulder',71,98,'R')}
          <path d="M112 76 L144 84 L146 115 L113 115 L113 76Z" {...zp('L Shoulder')}/>{lbl('L Shoulder',129,98,'L')}
          <path d="M88 76 L112 76 L124 114 L126 155 L74 155 L76 114Z" {...zp('Upper Back')}/>{lbl('Upper Back',100,116,'Upper Back')}
          <path d="M74 155 L126 155 L126 210 L74 210Z" {...zp('Lower Back')}/>{lbl('Lower Back',100,183,'Lower Back')}
          <path d="M36 84 L56 84 L56 170 L36 170Z" {...zp('R Upper Arm')}/>{lbl('R Upper Arm',46,128,'Arm')}
          <path d="M144 84 L164 84 L164 170 L144 170Z" {...zp('L Upper Arm')}/>{lbl('L Upper Arm',154,128,'Arm')}
          <path d="M35 170 L55 170 L55 268 L35 268Z" {...zp('R Forearm / Wrist')}/>{lbl('R Forearm / Wrist',45,220,'Wrist')}
          <path d="M145 170 L165 170 L165 268 L145 268Z" {...zp('L Forearm / Wrist')}/>{lbl('L Forearm / Wrist',155,220,'Wrist')}
          <path d="M74 210 L100 210 L100 252 L68 252Z" {...zp('R Glute')}/>{lbl('R Glute',86,232,'Glute')}
          <path d="M100 210 L126 210 L132 252 L100 252Z" {...zp('L Glute')}/>{lbl('L Glute',114,232,'Glute')}
          <path d="M68 252 L100 252 L100 322 L70 322Z" {...zp('R Hamstring')}/>{lbl('R Hamstring',85,287,'Hamstring')}
          <path d="M100 252 L132 252 L130 322 L100 322Z" {...zp('L Hamstring')}/>{lbl('L Hamstring',115,287,'Hamstring')}
          <path d="M70 322 L100 322 L100 346 L71 346Z" {...zp('R Knee')}/>{lbl('R Knee',85,336,'Knee')}
          <path d="M100 322 L130 322 L129 346 L100 346Z" {...zp('L Knee')}/>{lbl('L Knee',115,336,'Knee')}
          <path d="M72 346 L99 346 L98 416 L73 416Z" {...zp('R Shin / Calf')}/>{lbl('R Shin / Calf',85,382,'Calf')}
          <path d="M101 346 L128 346 L127 416 L102 416Z" {...zp('L Shin / Calf')}/>{lbl('L Shin / Calf',115,382,'Calf')}
        </>}

        {/* R/L side indicators */}
        <text x="20" y="215" fontSize="9" fill="#6EE7B755" fontFamily="system-ui" textAnchor="middle" style={{pointerEvents:'none'}}>R</text>
        <text x="180" y="215" fontSize="9" fill="#6EE7B755" fontFamily="system-ui" textAnchor="middle" style={{pointerEvents:'none'}}>L</text>
      </svg>

      {value
        ? <div style={{textAlign:'center',fontSize:12,fontWeight:700,color:'#F9A8D4',marginTop:2}}>✓ {value}</div>
        : <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:2}}>Tap the area that hurts</div>
      }
    </div>
  );
};

// ── SYMPTOM LOG ──
const BODY_AREAS=[["Neck","🤔"],["Upper back","🔝"],["Lower back","😣"],["Shoulders","🏋️"],["Wrists / hands","✋"],["Hips","🦵"],["Knees","🦿"],["Eyes / head","👁️"],["Chest","💗"],["Other","📍"]];
const PAIN_TYPES=[["Aching","〰️"],["Sharp / stabbing","⚡"],["Burning","🔥"],["Stiffness","🧊"],["Tingling / numb","🔌"],["Pressure","🫷"],["Throbbing","🫀"],["Fatigue","😮‍💨"]];
const ACTIVITIES=[["Sitting at desk","💻"],["Typing / mousing","⌨️"],["Video calls","📹"],["After exercise","🏃"],["Woke up with it","😴"],["Walking / standing","🚶"],["Lifting","📦"],["No clear cause","❓"]];
const DURATIONS=[["< 30 mins","⚡"],["A few hours","⏳"],["All day","🌙"],["Comes & goes","🔄"],["Constant","📍"]];
const TOD_OPTS=[["Morning","🌅"],["Mid-morning","☀️"],["Midday","🕛"],["Afternoon","🌤️"],["Evening","🌙"]];

const SymptomLogSection=({cu,notify})=>{
  const [logs,setLogs]=useState([]);
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const autoTod=()=>{const h=new Date().getHours();return h<10?"Morning":h<12?"Mid-morning":h<14?"Midday":h<17?"Afternoon":"Evening";};
  const blank=()=>({body_area:"",pain_type:"",intensity:5,time_of_day:autoTod(),activity:"",duration:"",notes:""});
  const [f,setF]=useState(blank);
  const set=k=>v=>setF(p=>({...p,[k]:v}));

  useEffect(()=>{
    supabase.from('symptom_logs').select('*').eq('user_id',cu.id)
      .order('created_at',{ascending:false}).limit(15)
      .then(({data})=>{if(data)setLogs(data);});
  },[cu.id]);

  const submit=async()=>{
    if(!f.body_area||!f.pain_type){notify("Please select a body area and pain type.");return;}
    setSaving(true);
    const{data,error}=await supabase.from('symptom_logs')
      .insert({user_id:cu.id,company_id:cu.company_id,...f})
      .select().single();
    setSaving(false);
    if(!error&&data){
      setLogs(p=>[data,...p]);
      setOpen(false);setF(blank());
      notify("✅ Symptom logged — Physio Brooke will review");
    }
  };

  const intCol=i=>i<=3?"#6EE7B7":i<=6?"#FCD34D":i<=8?"#FB923C":"#F87171";
  const Pill=({opts,val,onPick,col="#6EE7B7"})=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {opts.map(([label,icon])=>{const sel=val===label;return(
        <button key={label} onClick={()=>onPick(sel?'':label)} style={{padding:"6px 10px",borderRadius:20,border:`1px solid ${sel?col+"66":"#ffffff18"}`,background:sel?col+"18":"transparent",color:sel?col:"#888",fontSize:11,fontWeight:sel?700:400,display:"flex",gap:4,alignItems:"center"}}>
          <span>{icon}</span>{label}
        </button>
      );})}
    </div>
  );

  const dateStr=d=>{const dt=new Date(d);return dt.toLocaleDateString("en-AU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};

  return(
    <div className="card" style={{marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:open?14:0}}>
        <div style={{fontWeight:700,fontSize:13}}>🩺 Symptom Log</div>
        <button onClick={()=>{setOpen(o=>!o);setF(blank());}} style={{background:open?"#ffffff10":"#F9A8D420",border:`1px solid ${open?"#ffffff18":"#F9A8D444"}`,color:open?"#888":"#F9A8D4",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700}}>
          {open?"✕ Cancel":"+ Log Symptom"}
        </button>
      </div>

      {open&&<div>
        {/* WHERE — interactive body map */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:8}}>📍 Where does it hurt?</div>
          <BodyMap value={f.body_area} onChange={set("body_area")}/>
        </div>

        {/* PAIN TYPE */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:7}}>💬 What type of pain?</div>
          <Pill opts={PAIN_TYPES} val={f.pain_type} onPick={set("pain_type")} col="#FCD34D"/>
        </div>

        {/* INTENSITY */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <div style={{fontSize:11,color:"#aaa",fontWeight:700}}>📊 Pain intensity</div>
            <div style={{fontSize:11,fontWeight:800,color:intCol(f.intensity)}}>{f.intensity}/10</div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=>(
              <button key={n} onClick={()=>set("intensity")(n)} style={{flex:1,padding:"7px 0",borderRadius:7,border:`1px solid ${f.intensity===n?intCol(n)+"66":"#ffffff12"}`,background:f.intensity===n?intCol(n)+"22":"transparent",color:f.intensity===n?intCol(n):"#555",fontSize:11,fontWeight:700}}>
                {n}
              </button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:9,color:"#555"}}>Mild</span>
            <span style={{fontSize:9,color:"#555"}}>Moderate</span>
            <span style={{fontSize:9,color:"#555"}}>Severe</span>
          </div>
        </div>

        {/* TIME OF DAY */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:7}}>🕐 Time of day</div>
          <Pill opts={TOD_OPTS} val={f.time_of_day} onPick={set("time_of_day")} col="#93C5FD"/>
        </div>

        {/* ACTIVITY */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:7}}>⚡ What were you doing?</div>
          <Pill opts={ACTIVITIES} val={f.activity} onPick={set("activity")} col="#6EE7B7"/>
        </div>

        {/* DURATION */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:7}}>⏱ How long has it lasted?</div>
          <Pill opts={DURATIONS} val={f.duration} onPick={set("duration")} col="#C4B5FD"/>
        </div>

        {/* NOTES */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:7}}>📝 Anything else to note? <span style={{fontWeight:400,color:"#555"}}>(optional)</span></div>
          <textarea value={f.notes} onChange={e=>set("notes")(e.target.value)} placeholder="e.g. worse when I look down, started after a long call…" rows={2} style={{resize:"none",width:"100%",fontSize:12}}/>
        </div>

        {/* SUBMIT */}
        <div style={{background:"#F9A8D408",border:"1px solid #F9A8D420",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#888"}}>
          🔒 This log is private. Only you and Physio Brooke can see it.
        </div>
        <button onClick={submit} disabled={saving||!f.body_area||!f.pain_type} style={{width:"100%",padding:"12px",borderRadius:11,border:"none",background:f.body_area&&f.pain_type?"linear-gradient(135deg,#F9A8D4,#C4B5FD)":"#ffffff10",color:f.body_area&&f.pain_type?"#080810":"#555",fontWeight:800,fontSize:14,opacity:saving?0.6:1}}>
          {saving?"Saving…":"Submit to Physio Brooke →"}
        </button>
      </div>}

      {/* PAST LOGS */}
      {!open&&logs.length===0&&(
        <div style={{textAlign:"center",padding:"20px 0",color:"#555",fontSize:12}}>
          <div style={{fontSize:28,marginBottom:6}}>🩺</div>
          No symptoms logged yet. Use the button above to log pain or discomfort.
        </div>
      )}
      {!open&&logs.length>0&&(
        <div style={{marginTop:10}}>
          {logs.map((l,i)=>(
            <div key={l.id} style={{display:"flex",gap:10,alignItems:"flex-start",paddingBottom:10,marginBottom:10,borderBottom:i<logs.length-1?"1px solid #ffffff08":"none"}}>
              <div style={{width:36,height:36,borderRadius:10,background:intCol(l.intensity)+"18",border:`1px solid ${intCol(l.intensity)}33`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:intCol(l.intensity),flexShrink:0}}>{l.intensity}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{l.body_area} · {l.pain_type}</div>
                <div style={{fontSize:11,color:"#666"}}>{[l.time_of_day,l.activity,l.duration].filter(Boolean).join(" · ")}</div>
                {l.notes&&<div style={{fontSize:11,color:"#555",fontStyle:"italic",marginTop:2}}>"{l.notes}"</div>}
                <div style={{fontSize:10,color:"#444",marginTop:2}}>{dateStr(l.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── PROFILE TAB ──
// ── MY PROGRESS DASHBOARD ──
const MyProgressCard=({cu,lb})=>{
  const [checkins,setCheckins]=useState([]);
  const [showDetails,setShowDetails]=useState(false);
  useEffect(()=>{
    supabase.from('checkins').select('*').eq('user_id',cu.id)
      .order('created_at',{ascending:false}).limit(30)
      .then(({data})=>{ if(data?.length) setCheckins(data); });
  },[cu.id]);
  if(!checkins.length) return null;

  const recent=checkins.slice(0,14);
  const prev=checkins.slice(14,28);

  const avg=(arr,key)=>arr.length?+(arr.reduce((s,c)=>s+(c[key]||0),0)/arr.length).toFixed(1):null;
  const avgSleepHrs=avg(recent,'sleep_hours');
  const avgMood=avg(recent,'mood');
  const avgEnergy=avg(recent,'energy');
  const avgReadiness=recent.length?Math.round(recent.reduce((s,c)=>s+(c.readiness||0),0)/recent.length):null;
  const avgWater=recent.length?Math.round(recent.reduce((s,c)=>s+(c.water_ml||0),0)/recent.length):null;

  // Trend vs previous 14 days (+ / - / ~)
  const trend=(curr,prv)=>{if(!prv||!curr)return null;const d=curr-prv;if(Math.abs(d)<0.2)return"~";return d>0?"↑":"↓";};
  const trendCol=(curr,prv,higherIsBetter=true)=>{if(!prv||!curr)return"#888";const d=curr-prv;if(Math.abs(d)<0.2)return"#888";return(d>0)===higherIsBetter?"#6EE7B7":"#F87171";};

  // Last 7 days check-in streak dots
  const last7=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toDateString();
    return checkins.some(c=>new Date(c.created_at).toDateString()===ds);
  }).reverse();

  const METRICS=[
    {icon:"😴",label:"Avg Sleep",val:avgSleepHrs?`${avgSleepHrs}h`:null,col:"#93C5FD",tr:trend(avgSleepHrs,avg(prev,'sleep_hours')),trCol:trendCol(avgSleepHrs,avg(prev,'sleep_hours')),target:"7–9h",ok:avgSleepHrs>=7},
    {icon:"⚡",label:"Avg Energy",val:avgEnergy?`${avgEnergy}/5`:null,col:"#FCD34D",tr:trend(avgEnergy,avg(prev,'energy')),trCol:trendCol(avgEnergy,avg(prev,'energy')),target:"4+/5",ok:avgEnergy>=4},
    {icon:"😊",label:"Avg Mood",val:avgMood?`${avgMood}/5`:null,col:"#F9A8D4",tr:trend(avgMood,avg(prev,'mood')),trCol:trendCol(avgMood,avg(prev,'mood')),target:"4+/5",ok:avgMood>=4},
    {icon:"💧",label:"Avg Water",val:avgWater?`${Math.round(avgWater/250)} glasses`:null,col:"#6EE7B7",tr:trend(avgWater,avg(prev,'water_ml')),trCol:trendCol(avgWater,avg(prev,'water_ml')),target:"8 glasses",ok:avgWater>=2000},
  ];

  const myLBEntry=lb.find(e=>e.uid===cu.id);
  const myRank=lb.findIndex(e=>e.uid===cu.id)+1;

  return<div className="card" style={{marginBottom:12,background:"linear-gradient(135deg,#6EE7B710,#93C5FD08)",borderColor:"#6EE7B730"}}>
    <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>📊 My Progress · last 14 days</div>

    {/* Readiness score hero */}
    {avgReadiness&&<div style={{display:"flex",alignItems:"center",gap:14,background:"#ffffff08",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
        <Ring pct={avgReadiness/100} color={readinessColor(avgReadiness)} size={64}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:readinessColor(avgReadiness)}}>{avgReadiness}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:14,color:readinessColor(avgReadiness)}}>{readinessLabel(avgReadiness)}</div>
        <div style={{fontSize:11,color:"#888",marginTop:2}}>Average readiness score</div>
        <div style={{fontSize:10,color:"#555",marginTop:4}}>Based on {recent.length} check-ins</div>
      </div>
      {myRank>0&&<div style={{textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:20,color:"#6EE7B7"}}>#{myRank}</div>
        <div style={{fontSize:9,color:"#555"}}>Rank</div>
      </div>}
    </div>}

    {/* Quick stats row — always visible */}
    <div style={{display:"flex",gap:7,marginBottom:10}}>
      {METRICS.filter(m=>m.val).map(m=>(
        <div key={m.label} style={{flex:1,background:"#ffffff07",borderRadius:10,padding:"8px 6px",textAlign:"center",border:`1px solid ${m.col}18`}}>
          <div style={{fontSize:15}}>{m.icon}</div>
          <div style={{fontWeight:800,fontSize:13,color:m.col,marginTop:2}}>{m.val}</div>
          <div style={{fontSize:8,color:"#666",marginTop:1}}>{m.label}</div>
          {m.tr&&<div style={{fontSize:9,color:m.trCol,fontWeight:700}}>{m.tr}</div>}
        </div>
      ))}
    </div>

    {/* Expand for full details */}
    <button onClick={()=>setShowDetails(v=>!v)} style={{width:"100%",background:"#ffffff08",border:"1px solid #ffffff12",borderRadius:9,padding:"8px",fontSize:11,color:"#888",fontWeight:600,cursor:"pointer"}}>
      {showDetails?"▲ Hide details":"▼ See full breakdown"}
    </button>

    {showDetails&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
      {/* 7-day check-in dots */}
      <div style={{background:"#ffffff07",borderRadius:11,padding:"10px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:12}}>🗓 This week's check-ins</div>
          <div style={{fontSize:11,color:"#FCD34D",fontWeight:700}}>{last7.filter(Boolean).length}/7 days</div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {last7.map((done,i)=>{
            const d=new Date();d.setDate(d.getDate()-(6-i));
            return<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:"100%",aspectRatio:"1",borderRadius:7,background:done?"#6EE7B7":"#ffffff0f",border:`1px solid ${done?"#6EE7B755":"#ffffff10"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{done?"✓":""}</div>
              <div style={{fontSize:8,color:"#555"}}>{d.toLocaleDateString('en',{weekday:'short'})}</div>
            </div>;
          })}
        </div>
      </div>
      {/* Points & streak */}
      <div style={{display:"flex",gap:7}}>
        <div style={{flex:1,background:"#FCD34D18",border:"1px solid #FCD34D22",borderRadius:10,padding:"9px 12px",textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:18,color:"#FCD34D"}}>{cu.checkin_streak||0}🔥</div>
          <div style={{fontSize:9,color:"#888",marginTop:1}}>Day streak</div>
        </div>
        <div style={{flex:1,background:"#93C5FD18",border:"1px solid #93C5FD22",borderRadius:10,padding:"9px 12px",textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:18,color:"#93C5FD"}}>{(myLBEntry?.pts||0).toLocaleString()}</div>
          <div style={{fontSize:9,color:"#888",marginTop:1}}>Total points</div>
        </div>
        <div style={{flex:1,background:"#6EE7B718",border:"1px solid #6EE7B722",borderRadius:10,padding:"9px 12px",textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:18,color:"#6EE7B7"}}>{checkins.length}</div>
          <div style={{fontSize:9,color:"#888",marginTop:1}}>Check-ins</div>
        </div>
      </div>
    </div>}
  </div>;
};

const ProfileTab=({cu,lb,pd,setPd,notify,checked,onCheckin,lastCheckin,badges,awardBadge})=>{const [nm,setNm]=useState(3);const myLB=lb.find(e=>e.uid===cu.id);const myR=lb.findIndex(e=>e.uid===cu.id)+1;
const save=()=>{const today=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});setPd(p=>({...p,mood:[...p.mood.slice(-6),{date:today,val:nm}]}));setNm(3);notify("🔒 Saved!");};
return<div>
  {!checked&&<CheckIn onDone={onCheckin}/>}
  {checked&&lastCheckin&&<ReadinessCard checkin={lastCheckin}/>}
  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}><Av u={cu} s={50}/><div><div style={{fontWeight:800,fontSize:18}}>{cu.name}</div><div style={{fontSize:12,color:"#888"}}>{cu.role}{cu.is_admin?" · 👑 Admin":""}</div><div style={{fontSize:10,color:"#6EE7B7",marginTop:2}}>🔒 Private</div></div></div>
  <MyProgressCard cu={cu} lb={lb}/>
  <BadgesGrid badges={badges||[]} cu={cu}/>
  <ErgonomicsCheck cu={cu} notify={notify} awardBadge={awardBadge}/>
  <SymptomLogSection cu={cu} notify={notify}/>
  <div className="card"><div style={{fontWeight:700,marginBottom:12}}>Log Mood</div><div style={{fontSize:11,color:"#888",marginBottom:6}}>Today's mood: <span style={{color:"#F9A8D4",fontWeight:700}}>{["😔","😕","😐","🙂","😄"][nm-1]}</span></div><div style={{display:"flex",gap:4,marginBottom:12}}>{[1,2,3,4,5].map(v=><button key={v} onClick={()=>setNm(v)} style={{flex:1,padding:"6px 0",borderRadius:9,border:`1px solid ${nm===v?"#F9A8D455":"#ffffff15"}`,background:nm===v?"#F9A8D420":"transparent",fontSize:15}}>{["😔","😕","😐","🙂","😄"][v-1]}</button>)}</div><button onClick={save} style={{width:"100%",background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",border:"1px solid #6EE7B755",color:"#6EE7B7",padding:"11px",borderRadius:11,fontWeight:700}}>🔒 Save Privately</button></div>
</div>;};

// ── ADMIN TAB ──

// ── Member Profile (admin drill-down) ──
const BADGE_META={first_log:{icon:'🌟',label:'First Log'},streak_3:{icon:'🔥',label:'3-Day Streak'},streak_7:{icon:'🔥',label:'7-Day Streak'},streak_14:{icon:'💪',label:'14-Day Streak'},streak_30:{icon:'👑',label:'30-Day Streak'},challenge_complete:{icon:'🏆',label:'Challenge Done'},hydration_hero:{icon:'💧',label:'Hydration Hero'},posture_check:{icon:'🪑',label:'Posture Check'},top_of_board:{icon:'🥇',label:'Top of Board'},perfect_week:{icon:'⭐',label:'Perfect Week'},early_bird:{icon:'🌅',label:'Early Bird'},night_owl:{icon:'🦉',label:'Night Owl'},team_player:{icon:'🤝',label:'Team Player'}};

const MemberProfile=({member,feed,challenges,cu,onBack,teamColor,session,notify})=>{
  const [sec,setSec]=useState('overview');
  const [symptoms,setSymptoms]=useState([]);
  const [badges,setBadges]=useState([]);
  const [checkins,setCheckins]=useState([]);
  const [loading,setLoading]=useState(true);
  const col=teamColor||member.color||'#6EE7B7';
  const intCol=i=>i<=3?'#6EE7B7':i<=6?'#FCD34D':i<=8?'#FB923C':'#F87171';

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      supabase.from('symptom_logs').select('*').eq('user_id',member.id).order('created_at',{ascending:false}).limit(50),
      supabase.from('user_badges').select('*').eq('user_id',member.id).order('created_at',{ascending:false}),
      supabase.from('checkins').select('*').eq('user_id',member.id).order('created_at',{ascending:false}).limit(30),
    ]).then(([sym,bdg,chk])=>{
      if(sym.data)setSymptoms(sym.data);
      if(bdg.data)setBadges(bdg.data);
      if(chk.data)setCheckins(chk.data);
      setLoading(false);
    });
  },[member.id]);

  const today7=new Date(Date.now()-7*864e5);
  const memberFeed=[...feed].filter(p=>p.uid===member.id).sort((a,b)=>b.ts-a.ts);
  const weekFeed=memberFeed.filter(p=>new Date(p.ts)>=today7);
  const weekPts=weekFeed.reduce((s,p)=>s+(p.val||1),0);
  const lastActive=memberFeed[0]?.ts||null;
  const avgReadiness=checkins.length>0?Math.round(checkins.slice(0,7).reduce((s,c)=>s+(c.readiness_score||0),0)/Math.min(checkins.length,7)):0;
  const highSev=symptoms.filter(s=>s.intensity>=7).length;

  const TSECS=[['overview','Overview','📊'],['symptoms','Symptoms','🩺'],['activity','Activity','🏃'],['checkins','Check-ins','✅'],['badges','Badges','🏅']];

  return<div>
    {/* Header */}
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
      <button onClick={onBack} style={{background:'#ffffff0f',border:'1px solid #ffffff18',borderRadius:10,padding:'6px 12px',color:'#888',fontSize:12,fontWeight:700}}>← Team</button>
      <Av u={member} s={46}/>
      <div style={{flex:1}}>
        <div style={{fontWeight:800,fontSize:17}}>{member.name}</div>
        <div style={{fontSize:12,color:'#888'}}>{member.role||'Team member'}</div>
        {lastActive&&<div style={{fontSize:10,color:'#555'}}>Last active {ago(lastActive)}</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end'}}>
        {(member.checkin_streak||0)>0&&<div style={{fontSize:12,fontWeight:700,color:'#FB923C'}}>🔥 {member.checkin_streak}d</div>}
        {highSev>0&&<div style={{fontSize:10,fontWeight:700,color:'#F87171',background:'#F8717118',borderRadius:8,padding:'2px 6px'}}>⚠️ {highSev} high pain</div>}
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:'flex',gap:4,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
      {TSECS.map(([id,lbl,icon])=><button key={id} onClick={()=>setSec(id)} style={{flexShrink:0,padding:'7px 11px',borderRadius:10,border:`1px solid ${sec===id?col+'55':'#ffffff15'}`,background:sec===id?col+'18':'transparent',color:sec===id?col:'#888',fontWeight:700,fontSize:11}}>{icon} {lbl}{id==='symptoms'&&symptoms.length>0?` (${symptoms.length})`:''}{id==='badges'&&badges.length>0?` (${badges.length})`:''}</button>)}
    </div>

    {loading&&<div style={{textAlign:'center',padding:'40px 0',color:'#888',fontSize:13}}>Loading member data…</div>}

    {/* OVERVIEW */}
    {!loading&&sec==='overview'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:12}}>
        {[['🔥 Streak',(member.checkin_streak||0)+' days','#FB923C'],['🏆 This week',weekPts+' pts','#FCD34D'],['📊 Total logs',memberFeed.length,'#93C5FD'],['🩺 Reports',symptoms.length,symptoms.some(s=>s.intensity>=7)?'#F87171':'#6EE7B7']].map(([l,v,c])=>(
          <div key={l} className="card" style={{padding:12,textAlign:'center',borderColor:c+'22'}}>
            <div style={{fontWeight:900,fontSize:20,color:c,marginBottom:2}}>{v}</div>
            <div style={{fontSize:10,color:'#888'}}>{l}</div>
          </div>
        ))}
      </div>

      {avgReadiness>0&&<div className="card" style={{marginBottom:10,display:'flex',gap:14,alignItems:'center'}}>
        <div style={{position:'relative',width:64,height:64,flexShrink:0}}>
          <svg width={64} height={64} style={{transform:'rotate(-90deg)'}}>
            <circle cx={32} cy={32} r={26} fill="none" stroke="#ffffff0f" strokeWidth={5}/>
            <circle cx={32} cy={32} r={26} fill="none" stroke={avgReadiness>=75?'#6EE7B7':avgReadiness>=50?'#FCD34D':'#F87171'} strokeWidth={5} strokeDasharray={`${avgReadiness/100*163} 163`} strokeLinecap="round"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,color:'#e8e8f0'}}>{avgReadiness}</div>
        </div>
        <div>
          <div style={{fontWeight:700,marginBottom:3}}>Avg Readiness Score</div>
          <div style={{fontSize:12,color:'#888'}}>Last {Math.min(checkins.length,7)} check-ins</div>
          <div style={{fontSize:12,color:avgReadiness>=75?'#6EE7B7':avgReadiness>=50?'#FCD34D':'#F87171',fontWeight:700,marginTop:2}}>{avgReadiness>=75?'Consistently high 💚':avgReadiness>=50?'Moderate wellness 💛':'May need support 🔴'}</div>
        </div>
      </div>}

      {checkins[0]&&<div className="card" style={{marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Latest check-in · <span style={{fontSize:11,color:'#888',fontWeight:400}}>{new Date(checkins[0].created_at).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})}</span></div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[['😴',`${checkins[0].sleep_hours||'–'}h sleep`,'#93C5FD'],['💧',`${checkins[0].water_ml?Math.round(checkins[0].water_ml/250):'–'} glasses`,'#6EE7B7'],['😊',`Mood ${checkins[0].mood||'–'}/5`,'#F9A8D4'],['⚡',`Energy ${checkins[0].energy||'–'}/5`,'#FCD34D']].map(([icon,label,c])=>(
            <div key={label} style={{fontSize:11,background:'#ffffff08',borderRadius:8,padding:'4px 9px',color:c}}>{icon} {label}</div>
          ))}
        </div>
      </div>}

      {symptoms.length>0&&<div className="card" style={{borderColor:'#F9A8D422'}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🩺 Recent pain reports</div>
        {symptoms.slice(0,3).map(s=>(
          <div key={s.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:intCol(s.intensity)+'18',border:`1px solid ${intCol(s.intensity)}33`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:12,color:intCol(s.intensity),flexShrink:0}}>{s.intensity}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600}}>{s.body_area} · {s.pain_type}</div>
              <div style={{fontSize:10,color:'#666'}}>{new Date(s.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}{s.activity?' · '+s.activity:''}</div>
            </div>
          </div>
        ))}
        {symptoms.length>3&&<div style={{fontSize:11,color:'#555',marginTop:2}}>+{symptoms.length-3} more — see Symptoms tab</div>}
      </div>}
    </div>}

    {/* SYMPTOMS */}
    {!loading&&sec==='symptoms'&&<div>
      {symptoms.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'#888'}}><div style={{fontSize:36,marginBottom:8}}>🩺</div>No symptom reports yet.</div>:<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12}}>
          {[[symptoms.length,'Total','#F9A8D4'],[`${Math.round(symptoms.reduce((s,r)=>s+r.intensity,0)/symptoms.length*10)/10}/10`,'Avg severity','#FCD34D'],[highSev,'High (7+)','#F87171']].map(([v,l,c])=>(
            <div key={l} className="card" style={{padding:10,textAlign:'center'}}>
              <div style={{fontWeight:900,fontSize:18,color:c}}>{v}</div>
              <div style={{fontSize:9,color:'#666'}}>{l}</div>
            </div>
          ))}
        </div>
        {symptoms.map(s=>(
          <div key={s.id} className="card" style={{marginBottom:8,borderColor:intCol(s.intensity)+'22'}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{width:38,height:38,borderRadius:10,background:intCol(s.intensity)+'18',border:`1px solid ${intCol(s.intensity)}33`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,color:intCol(s.intensity),flexShrink:0}}>{s.intensity}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{s.body_area}</div>
                <div style={{fontSize:11,color:'#aaa',marginBottom:4}}>{s.pain_type}{s.duration?' · '+s.duration:''}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:4}}>
                  {[s.time_of_day,s.activity].filter(Boolean).map(t=><span key={t} style={{fontSize:10,background:'#ffffff0a',border:'1px solid #ffffff10',borderRadius:10,padding:'2px 7px',color:'#888'}}>{t}</span>)}
                </div>
                {s.notes&&<div style={{fontSize:11,color:'#666',fontStyle:'italic',marginBottom:3}}>"{s.notes}"</div>}
                <div style={{fontSize:10,color:'#444'}}>{new Date(s.created_at).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
          </div>
        ))}
      </>}
    </div>}

    {/* ACTIVITY */}
    {!loading&&sec==='activity'&&<div>
      {memberFeed.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'#888'}}><div style={{fontSize:36,marginBottom:8}}>🏃</div>No activity yet.</div>
      :memberFeed.slice(0,40).map((p,i)=>{
        const ch=challenges.find(c=>String(c.id)===String(p.cid));
        return<div key={i} className="card" style={{display:'flex',gap:9,alignItems:'center',marginBottom:6,padding:'10px 12px'}}>
          <div style={{fontSize:20,flexShrink:0}}>{ch?.icon||'📊'}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700}}>{ch?.title||'Activity'}</div>
            <div style={{fontSize:11,color:'#888'}}>{p.val>0?`${p.val}${ch?.unit?' '+ch.unit:''} logged`:'Completed'}</div>
            {p.note&&<div style={{fontSize:10,color:'#555',fontStyle:'italic'}}>"{p.note}"</div>}
          </div>
          <div style={{fontSize:10,color:'#555',flexShrink:0}}>{ago(p.ts)}</div>
        </div>;
      })}
    </div>}

    {/* CHECK-INS */}
    {!loading&&sec==='checkins'&&<div>
      {checkins.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'#888'}}><div style={{fontSize:36,marginBottom:8}}>✅</div>No check-ins yet.</div>
      :checkins.map(c=>{
        const score=c.readiness_score||0;
        const sc=score>=75?'#6EE7B7':score>=50?'#FCD34D':'#F87171';
        return<div key={c.id} className="card" style={{marginBottom:8,borderColor:sc+'22'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:'#ccc'}}>{new Date(c.created_at).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})}</div>
            <div style={{fontWeight:800,fontSize:13,color:sc}}>Readiness {score}</div>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[['😴',`${c.sleep_hours||'–'}h sleep`,'#93C5FD'],['💧',`${c.water_ml?Math.round(c.water_ml/250):'–'} glasses`,'#6EE7B7'],['😊',`Mood ${c.mood||'–'}/5`,'#F9A8D4'],['⚡',`Energy ${c.energy||'–'}/5`,'#FCD34D']].map(([icon,label,c2])=>(
              <div key={label} style={{fontSize:10,background:'#ffffff08',borderRadius:8,padding:'3px 8px',color:c2}}>{icon} {label}</div>
            ))}
          </div>
        </div>;
      })}
    </div>}

    {/* BADGES */}
    {!loading&&sec==='badges'&&<div>
      {badges.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'#888'}}><div style={{fontSize:36,marginBottom:8}}>🏅</div>No badges yet.</div>
      :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {badges.map(b=>{const m=BADGE_META[b.badge_type]||{icon:'🏅',label:b.badge_type};return(
          <div key={b.id} className="card" style={{textAlign:'center',padding:12}}>
            <div style={{fontSize:28,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:9,color:'#aaa',fontWeight:700,marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:8,color:'#555'}}>{new Date(b.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}</div>
          </div>
        );})}
      </div>}
    </div>}
  </div>;
};

// ── Team Dashboard (per-team isolated view) ──
const TeamDashboard=({team,members,feed,cu,challenges,onBack,notify,session})=>{
  const [sec,setSec]=useState("overview");
  const [selectedMember,setSelectedMember]=useState(null);

  // Drill into a member profile
  if(selectedMember){
    return<MemberProfile member={selectedMember} feed={feed} challenges={challenges} cu={cu} onBack={()=>setSelectedMember(null)} teamColor={team.color} session={session} notify={notify}/>;
  }
  const [inviteLink,setInviteLink]=useState("");
  const [generating,setGenerating]=useState(false);
  const today7=new Date(Date.now()-7*864e5);
  const weekFeed=feed.filter(p=>new Date(p.ts)>=today7);
  const activeIds=new Set(weekFeed.map(p=>p.uid));
  const participation=members.length>0?Math.round(activeIds.size/members.length*100):0;
  const avgStreak=members.length>0?Math.round(members.reduce((a,u)=>a+(u.checkin_streak||0),0)/members.length*10)/10:0;
  const weekPts={};weekFeed.forEach(p=>{weekPts[p.uid]=(weekPts[p.uid]||0)+(p.val||1);});
  const topEntry=Object.entries(weekPts).sort((a,b)=>b[1]-a[1])[0];
  const topMember=topEntry?members.find(u=>u.id===topEntry[0]):null;
  const lb=[...members].map(u=>({...u,pts:weekPts[u.id]||0})).sort((a,b)=>b.pts-a.pts);
  const ws=Math.min(100,Math.round(participation*0.5+Math.min(100,avgStreak/14*100)*0.3+Math.min(100,weekFeed.length/Math.max(1,members.length*3)*100)*0.2));
  const wsCol=ws>=75?"#6EE7B7":ws>=50?"#FCD34D":ws>=25?"#FB923C":"#F87171";
  const wsLabel=ws>=75?"Thriving 💚":ws>=50?"Good 💛":ws>=25?"Developing 🟠":"Just Starting 🔴";
  const generateInvite=async()=>{
    setGenerating(true);
    const code=Math.random().toString(36).slice(2,10);
    const{error}=await supabase.from('invite_links').insert({team_id:team.id,code,created_by:session.user.id,active:true,company_id:cu.company_id,invite_type:'member'});
    if(!error){setInviteLink(`${window.location.origin}/join/${code}`);notify("✅ Invite link created!");}
    setGenerating(false);
  };
  const TSECS=[["overview","Overview","📊"],["members","Members","👥"],["activity","Activity","🏃"],["leaderboard","Board","🥇"]];
  return<div>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button onClick={onBack} style={{background:"#ffffff0f",border:"1px solid #ffffff18",borderRadius:10,padding:"6px 12px",color:"#888",fontSize:12,fontWeight:700}}>← Back</button>
      <div style={{width:42,height:42,borderRadius:13,background:`${team.color}22`,border:`1px solid ${team.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{team.emoji||"👥"}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:800,fontSize:17,color:team.color}}>{team.name}</div>
        <div style={{fontSize:11,color:"#888"}}>{members.length} member{members.length!==1?"s":""} · {participation}% active this week</div>
      </div>
    </div>
    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:14,overflowX:"auto"}}>
      {TSECS.map(([id,lbl,icon])=><button key={id} onClick={()=>setSec(id)} style={{flexShrink:0,padding:"7px 12px",borderRadius:10,border:`1px solid ${sec===id?team.color+"55":"#ffffff15"}`,background:sec===id?team.color+"18":"transparent",color:sec===id?team.color:"#888",fontWeight:700,fontSize:12}}>{icon} {lbl}</button>)}
    </div>
    {/* OVERVIEW */}
    {sec==="overview"&&<div>
      <div style={{background:`linear-gradient(135deg,${team.color}10,${team.color}05)`,border:`1px solid ${team.color}22`,borderRadius:18,padding:"18px 16px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
            <svg width={72} height={72} style={{transform:"rotate(-90deg)"}}>
              <circle cx={36} cy={36} r={30} fill="none" stroke="#ffffff0f" strokeWidth={6}/>
              <circle cx={36} cy={36} r={30} fill="none" stroke={wsCol} strokeWidth={6} strokeDasharray={`${ws/100*188} 188`} strokeLinecap="round" style={{transition:"stroke-dasharray .8s"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:wsCol}}>{ws}</div>
          </div>
          <div>
            <div style={{fontSize:11,color:"#888",marginBottom:3}}>Team Wellness Score</div>
            <div style={{fontWeight:800,fontSize:18,color:wsCol,marginBottom:2}}>{wsLabel}</div>
            <div style={{fontSize:11,color:"#888"}}>Participation, streaks & activity</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:14}}>
          {[[participation+"%","Participation",team.color],[avgStreak+"d","Avg Streak","#FCD34D"],[weekFeed.length,"Logs/week","#93C5FD"]].map(([v,l,c])=>
            <div key={l} style={{background:"#ffffff08",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontWeight:800,fontSize:16,color:c}}>{v}</div>
              <div style={{fontSize:9,color:"#666"}}>{l}</div>
            </div>
          )}
        </div>
      </div>
      {topMember&&<div className="card" style={{marginBottom:12,borderColor:`${team.color}22`}}>
        <div style={{fontSize:11,color:"#FCD34D",fontWeight:700,marginBottom:8}}>🥇 Top performer this week</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Av u={topMember} s={40}/>
          <div><div style={{fontWeight:700}}>{topMember.name}</div><div style={{fontSize:11,color:"#888"}}>{topEntry[1]} pts · 🔥{topMember.checkin_streak||0} streak</div></div>
        </div>
      </div>}
      <div className="card">
        <div style={{fontWeight:700,marginBottom:4}}>🔗 Invite to {team.name}</div>
        <div style={{fontSize:11,color:"#888",marginBottom:10}}>Share this link to add people directly to this team.</div>
        <Btn color={team.color} text={generating?"Creating…":"Generate Invite Link"} style={{width:"100%"}} onClick={generateInvite} disabled={generating}/>
        {inviteLink&&<div style={{marginTop:10,background:`${team.color}10`,border:`1px solid ${team.color}33`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:11,color:team.color,fontWeight:700,marginBottom:4}}>📋 Share this link:</div>
          <div style={{fontSize:11,color:"#aaa",wordBreak:"break-all",marginBottom:8}}>{inviteLink}</div>
          <button onClick={()=>{navigator.clipboard.writeText(inviteLink);notify("📋 Copied!");}} style={{background:`${team.color}22`,border:`1px solid ${team.color}44`,color:team.color,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700}}>Copy Link</button>
        </div>}
      </div>
    </div>}
    {/* MEMBERS */}
    {sec==="members"&&<div>
      {members.length===0
        ?<div style={{textAlign:"center",color:"#888",padding:"40px 0"}}><div style={{fontSize:40,marginBottom:10}}>👥</div>No members in this team yet.</div>
        :members.map(u=>{
          const isActive=activeIds.has(u.id);
          const lastLog=feed.filter(p=>p.uid===u.id).sort((a,b)=>b.ts-a.ts)[0];
          const wkPts=Object.fromEntries(Object.entries(weekPts));
          return<div key={u.id} className="card" style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,borderColor:isActive?`${team.color}30`:undefined,cursor:"pointer"}} onClick={()=>setSelectedMember(u)}>
            <Av u={u} s={40}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
              <div style={{fontSize:11,color:"#888"}}>{u.role||"Team member"}</div>
              {lastLog&&<div style={{fontSize:10,color:"#555"}}>Last active {ago(lastLog.ts)}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
              {(u.checkin_streak||0)>0&&<div style={{fontSize:11,fontWeight:700,color:"#FB923C"}}>🔥 {u.checkin_streak}</div>}
              {wkPts[u.id]>0&&<div style={{fontSize:10,color:'#FCD34D'}}>🏆 {wkPts[u.id]} pts</div>}
              {isActive&&<div style={{width:7,height:7,borderRadius:"50%",background:team.color}}/>}
              <div style={{fontSize:10,color:'#555',fontWeight:600}}>View →</div>
            </div>
          </div>;
        })
      }
    </div>}
    {/* ACTIVITY */}
    {sec==="activity"&&<div>
      {feed.length===0
        ?<div style={{textAlign:"center",color:"#888",padding:"40px 0"}}><div style={{fontSize:40,marginBottom:10}}>🏃</div>No activity from this team yet.</div>
        :feed.slice(0,30).map((p,i)=>{
          const u=members.find(m=>m.id===p.uid);
          const ch=challenges.find(c=>String(c.id)===String(p.cid));
          return<div key={i} className="card" style={{display:"flex",gap:9,alignItems:"center",marginBottom:6,padding:"10px 12px"}}>
            <div style={{fontSize:18,flexShrink:0}}>{ch?.icon||"📊"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700}}>{u?.name||"Unknown"}</div>
              <div style={{fontSize:11,color:"#888"}}>{ch?.title||"Activity"}{p.val>0?` · ${p.val}${ch?.unit?" "+ch.unit:""}`:""}</div>
              {p.note&&<div style={{fontSize:10,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{p.note}"</div>}
            </div>
            <div style={{fontSize:10,color:"#555",flexShrink:0}}>{ago(p.ts)}</div>
          </div>;
        })
      }
    </div>}
    {/* LEADERBOARD */}
    {sec==="leaderboard"&&<div>
      {lb.length===0
        ?<div style={{textAlign:"center",color:"#888",padding:"40px 0"}}><div style={{fontSize:40,marginBottom:10}}>🥇</div>No activity this week.</div>
        :<>
          {lb.length>=2&&<div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:6,marginBottom:18,padding:"0 8px"}}>
            {[lb[1],lb[0],lb[2]].filter(Boolean).map((u,pi)=>{
              const medal=["🥈","🥇","🥉"][pi];
              const ht=[70,90,58][pi];
              const col=["#9CA3AF","#FCD34D","#CD7F32"][pi];
              return<div key={u.id} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:11,marginBottom:3}}>{medal}</div>
                <Av u={u} s={36}/>
                <div style={{fontSize:10,fontWeight:700,color:"#ccc",margin:"3px 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name?.split(" ")[0]}</div>
                <div style={{height:ht,background:`${u.color||team.color}1a`,border:`1px solid ${u.color||team.color}33`,borderRadius:"6px 6px 0 0",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,color:col}}>{u.pts}</span>
                </div>
              </div>;
            })}
          </div>}
          {lb.map((u,i)=><div key={u.id} className="card" style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,borderColor:i===0?`${team.color}44`:undefined}}>
            <div style={{fontWeight:900,fontSize:15,width:24,textAlign:"center",flexShrink:0,color:i===0?"#FCD34D":i===1?"#9CA3AF":i===2?"#CD7F32":"#555"}}>
              {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
            </div>
            <Av u={u} s={34}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
              <div style={{fontSize:11,color:"#888"}}>{u.pts} pts this week{u.checkin_streak>0?` · 🔥${u.checkin_streak}`:""}</div>
            </div>
          </div>)}
        </>
      }
    </div>}
  </div>;
};

const PhysioQnA=({cu,notify})=>{
  const [qs,setQs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [answers,setAnswers]=useState({});
  const [saving,setSaving]=useState({});

  useEffect(()=>{
    supabase.from('physio_questions').select('*, profiles(name,color)')
      .eq('company_id',cu.company_id).order('created_at',{ascending:false})
      .then(({data})=>{ setQs(data||[]); setLoading(false); });
  },[cu.company_id]);

  const sendAnswer=async(q)=>{
    const ans=answers[q.id]?.trim();
    if(!ans)return;
    setSaving(s=>({...s,[q.id]:true}));
    const{error}=await supabase.from('physio_questions').update({answer:ans,answered_at:new Date().toISOString()}).eq('id',q.id);
    if(!error){
      setQs(prev=>prev.map(x=>x.id===q.id?{...x,answer:ans,answered_at:new Date().toISOString()}:x));
      setAnswers(a=>({...a,[q.id]:""}));
      notify("✅ Answer sent!");
    }
    setSaving(s=>({...s,[q.id]:false}));
  };

  if(loading)return<div style={{textAlign:"center",padding:30,color:"#555"}}>Loading questions…</div>;
  if(qs.length===0)return(
    <div style={{textAlign:"center",padding:"40px 20px",color:"#555"}}>
      <div style={{fontSize:40,marginBottom:10}}>💬</div>
      <div style={{fontSize:14,fontWeight:700,color:"#888",marginBottom:4}}>No questions yet</div>
      <div style={{fontSize:12}}>When team members ask questions from the Physio tab, they'll appear here.</div>
    </div>
  );
  return(
    <div>
      <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Member Questions</div>
      <div style={{fontSize:12,color:"#888",marginBottom:14}}>{qs.filter(q=>!q.answer).length} unanswered · {qs.filter(q=>q.answer).length} answered</div>
      {qs.map(q=>(
        <div key={q.id} className="card" style={{marginBottom:12,borderColor:q.answer?"#6EE7B733":"#ffffff12"}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`${q.profiles?.color||"#6EE7B7"}33`,border:`1px solid ${q.profiles?.color||"#6EE7B7"}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:q.profiles?.color||"#6EE7B7",flexShrink:0}}>{(q.profiles?.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700}}>{q.profiles?.name||"Member"}</div>
              <div style={{fontSize:10,color:"#555"}}>{new Date(q.created_at).toLocaleDateString("en-AU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
            </div>
            {q.answer?<span style={{fontSize:10,background:"#6EE7B720",color:"#6EE7B7",border:"1px solid #6EE7B740",borderRadius:20,padding:"2px 8px",fontWeight:700}}>Answered</span>:<span style={{fontSize:10,background:"#FCD34D20",color:"#FCD34D",border:"1px solid #FCD34D40",borderRadius:20,padding:"2px 8px",fontWeight:700}}>Pending</span>}
          </div>
          <div style={{fontSize:13,color:"#e8e8f0",lineHeight:1.55,marginBottom:10,fontWeight:500}}>💬 {q.question}</div>
          {q.answer?(
            <div style={{background:"#6EE7B710",border:"1px solid #6EE7B725",borderRadius:10,padding:"10px 13px"}}>
              <div style={{fontSize:10,color:"#6EE7B7",fontWeight:700,marginBottom:3}}>YOUR ANSWER</div>
              <div style={{fontSize:12,color:"#bbb",lineHeight:1.6}}>{q.answer}</div>
            </div>
          ):(
            <div>
              <textarea value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="Type your answer here…" rows={3} style={{width:"100%",resize:"none",marginBottom:8}}/>
              <button onClick={()=>sendAnswer(q)} disabled={saving[q.id]||!(answers[q.id]?.trim())} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:answers[q.id]?.trim()?"linear-gradient(135deg,#6EE7B7,#93C5FD)":"#ffffff10",color:answers[q.id]?.trim()?"#080810":"#555",fontWeight:800,fontSize:13,cursor:"pointer"}}>{saving[q.id]?"Sending…":"Send Answer"}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AdminTab=({cu,users,setUsers,challenges,setChallenges,notify,addNotif,session,onTipCreated,feed,teams:teamsProp})=>{
  const [view,setView]=useState("home");   // "home" | "team" | "tools"
  const [selectedTeam,setSelectedTeam]=useState(null);
  const [toolSec,setToolSec]=useState("hr");
  const [chF,setChF]=useState({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7",type:"count",physioNote:"",teamId:""});
  const [tipF,setTipF]=useState({title:"",content:"",body_part:"general",emoji:"💡",color:"#6EE7B7"});
  const [teams,setTeams]=useState([]);
  const [newTeam,setNewTeam]=useState({name:"",emoji:"👥",color:"#6EE7B7",challengeId:"",challengeTitle:"",challengeIcon:"🏃",challengeUnit:"",challengeGoal:"",challengeType:"count",challengeNote:""});
  const [savingTip,setSavingTip]=useState(false);
  const [analytics,setAnalytics]=useState(null);
  const [analyticsLoading,setAnalyticsLoading]=useState(false);
  const [companies,setCompanies]=useState([]);
  const [newCo,setNewCo]=useState({name:"",emoji:"🏢",color:"#6EE7B7"});
  const [creatingCo,setCreatingCo]=useState(false);
  const [adminInviteLink,setAdminInviteLink]=useState({});

  useEffect(()=>{
    const q=supabase.from('teams').select('*');
    (cu.is_super_admin?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{ if(data) setTeams(data); });
  },[cu.company_id]);

  useEffect(()=>{
    if(view!=='tools'||toolSec!=='analytics'||!cu.company_id)return;
    setAnalyticsLoading(true);
    supabase.rpc('get_company_analytics',{company_uuid:cu.company_id})
      .then(({data})=>{ if(data) setAnalytics(data); setAnalyticsLoading(false); });
  },[view,toolSec,cu.company_id]);

  useEffect(()=>{
    if(view!=='tools'||toolSec!=='superadmin'||!cu.is_super_admin)return;
    supabase.from('companies').select('*, profiles(count)').then(({data})=>{ if(data) setCompanies(data); });
  },[view,toolSec,cu.is_super_admin]);

  const createTeam=async()=>{
    if(!newTeam.name.trim())return;
    const{data,error}=await supabase.from('teams').insert({name:newTeam.name,emoji:newTeam.emoji,color:newTeam.color,company_id:cu.company_id}).select().single();
    if(error||!data){notify("❌ Couldn't create team.");return;}
    setTeams(t=>[...t,data]);
    // If a first challenge was selected (and not "skip"), create it for this team
    if(newTeam.challengeTitle&&newTeam.challengeId!=="none"){
      const start=new Date().toISOString().split("T")[0];
      const end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
      await supabase.from('challenges').update({active:false}).eq('company_id',cu.company_id).eq('team_id',data.id).eq('active',true);
      const{data:ch}=await supabase.from('challenges').insert({title:newTeam.challengeTitle,icon:newTeam.challengeIcon,unit:newTeam.challengeUnit,goal:parseFloat(newTeam.challengeGoal)||null,color:newTeam.color,type:newTeam.challengeType,physio_note:newTeam.challengeNote,active:true,start_date:start,end_date:end,company_id:cu.company_id,team_id:data.id}).select().single();
      if(ch) setChallenges(c=>[...c,{...ch,physioNote:ch.physio_note,endDate:ch.end_date}]);
    }
    setNewTeam({name:"",emoji:"👥",color:"#6EE7B7",challengeId:"",challengeTitle:"",challengeIcon:"🏃",challengeUnit:"",challengeGoal:"",challengeType:"count",challengeNote:""});
    notify(`✅ Team "${data.name}" created!`);
  };
  const createCh=async()=>{
    if(!chF.title||!chF.goal)return;
    const start=new Date().toISOString().split("T")[0];
    const end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
    // Deactivate any currently active challenges first (one at a time)
    await supabase.from('challenges').update({active:false}).eq('company_id',cu.company_id).eq('active',true);
    setChallenges(c=>c.map(x=>({...x,active:false})));
    const{data,error}=await supabase.from('challenges').insert({title:chF.title,icon:chF.icon,unit:chF.unit,goal:parseFloat(chF.goal),color:chF.color,type:chF.type,physio_note:chF.physioNote,active:true,start_date:start,end_date:end,company_id:cu.company_id,team_id:chF.teamId||null}).select().single();
    if(!error&&data){setChallenges(c=>[...c,{...data,desc:data.description,physioNote:data.physio_note,endDate:data.end_date}]);setChF({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7",type:"count",physioNote:"",teamId:""});notify("✅ Challenge created!");addNotif("challenge",`New challenge: ${data.title}`);}
    else notify("❌ Couldn't save challenge — try again.");
  };
  const createTip=async()=>{
    if(!tipF.title||!tipF.content)return;
    setSavingTip(true);
    const{data,error}=await supabase.from('physio_tips').insert({title:tipF.title,content:tipF.content,body_part:tipF.body_part,emoji:tipF.emoji,color:BP_COLORS[tipF.body_part]||"#6EE7B7",author_id:session.user.id,company_id:cu.company_id}).select().single();
    if(!error&&data){onTipCreated(data);setTipF({title:"",content:"",body_part:"general",emoji:"💡",color:"#6EE7B7"});notify("✅ Physio tip posted to feed!");}
    else notify("❌ Couldn't save tip, try again.");
    setSavingTip(false);
  };
  const createCompany=async()=>{
    if(!newCo.name.trim())return;
    setCreatingCo(true);
    const{data,error}=await supabase.from('companies').insert({name:newCo.name,emoji:newCo.emoji,color:newCo.color,created_by:session.user.id}).select().single();
    if(!error&&data){setCompanies(c=>[...c,data]);setNewCo({name:"",emoji:"🏢",color:"#6EE7B7"});notify(`✅ Company "${data.name}" created!`);}
    setCreatingCo(false);
  };
  const generateAdminInvite=async(companyId)=>{
    const code=Math.random().toString(36).slice(2,10);
    const{error}=await supabase.from('invite_links').insert({company_id:companyId,code,created_by:session.user.id,active:true,invite_type:'admin'});
    if(!error){setAdminInviteLink(m=>({...m,[companyId]:`${window.location.origin}/join/${code}`}));notify("✅ Admin invite created!");}
  };

  // ── Team dashboard view ──
  if(view==="team"&&selectedTeam){
    const members=users.filter(u=>u.team_id===selectedTeam.id);
    const memberIds=new Set(members.map(u=>u.id));
    const teamFeed=(feed||[]).filter(p=>memberIds.has(p.uid));
    return<TeamDashboard team={selectedTeam} members={members} feed={teamFeed} cu={cu} challenges={challenges} onBack={()=>{setView("home");setSelectedTeam(null);}} notify={notify} session={session}/>;
  }

  // ── Admin tools view ──
  if(view==="tools"){
    const today7=new Date(Date.now()-7*864e5);
    const TSECS=[["hr","HR Report","📋"],["analytics","Analytics","📊"],["tips","Physio Tips","💡"],["questions","Q&A","💬"],["challenges","Challenges","🏆"],["insights","Insights","🧠"],["digest","Digest","📧"],["teams","Teams","👥"],...(cu.is_super_admin?[["superadmin","Super Admin","🌐"]]:[])]
    const weekLogs=(feed||[]).filter(p=>new Date(p.ts)>=today7);
    const weekLoggers=new Set(weekLogs.map(p=>p.uid));
    const totalMembers=users.length+1;
    const scorePts={};weekLogs.forEach(p=>{scorePts[p.uid]=(scorePts[p.uid]||0)+(p.val||0);});
    const topEntry=Object.entries(scorePts).sort((a,b)=>b[1]-a[1])[0];
    const topUser=topEntry?users.find(u=>u.id===topEntry[0]):null;
    const topPts=topEntry?topEntry[1]:0;
    const TIPS=["Take a 5-minute walk every hour — your lower back will thank you.","Roll your shoulders back 10 times to reset your posture right now.","Drink a full glass of water before your next meeting.","Try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.","A 2-minute standing stretch at midday reduces afternoon fatigue by 30%."];
    const tipOfWeek=TIPS[new Date().getDay()%TIPS.length];
    return<div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>setView("home")} style={{background:"#ffffff0f",border:"1px solid #ffffff18",borderRadius:10,padding:"6px 12px",color:"#888",fontSize:12,fontWeight:700}}>← Teams</button>
        <span style={{fontWeight:700,fontSize:16}}>Admin Tools</span>
        {cu.is_super_admin&&<Pill color="#FCD34D" text="SUPER ADMIN"/>}
      </div>
      <div style={{display:"flex",gap:4,marginBottom:14,overflowX:"auto"}}>
        {TSECS.map(([id,lbl,icon])=><button key={id} onClick={()=>setToolSec(id)} style={{flexShrink:0,padding:"7px 12px",borderRadius:10,border:`1px solid ${toolSec===id?"#C4B5FD55":"#ffffff15"}`,background:toolSec===id?"#C4B5FD18":"transparent",color:toolSec===id?"#C4B5FD":"#888",fontWeight:700,fontSize:12}}>{icon} {lbl}</button>)}
      </div>
      {toolSec==="analytics"&&<div>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Company Analytics</div>
        <div style={{fontSize:12,color:"#888",marginBottom:14}}>Last 7 days across all teams</div>
        {analyticsLoading&&<div style={{textAlign:"center",padding:"30px 0",color:"#888",fontSize:13}}>Loading…</div>}
        {!analyticsLoading&&analytics&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[[analytics.active_users_week,"Active Users","this week","#6EE7B7","👥"],[analytics.total_logs_week,"Activity Logs","this week","#93C5FD","📊"],[analytics.checkin_count_week,"Check-Ins","this week","#F9A8D4","🌅"],[analytics.avg_readiness_week!=null?analytics.avg_readiness_week+"":"–","Avg Readiness","this week","#FCD34D","⚡"]].map(([v,l,sub,c,ic])=>
              <div key={l} className="card" style={{padding:14}}><div style={{fontSize:20,marginBottom:6}}>{ic}</div><div style={{fontWeight:800,fontSize:22,color:c,marginBottom:2}}>{v}</div><div style={{fontSize:11,fontWeight:700,color:"#bbb"}}>{l}</div><div style={{fontSize:10,color:"#555"}}>{sub}</div></div>
            )}
          </div>
          {analytics.total_members>0&&<div className="card" style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontWeight:700,fontSize:13}}>Participation Rate</div><div style={{fontSize:12,color:"#6EE7B7",fontWeight:700}}>{Math.round((analytics.active_users_week/analytics.total_members)*100)}%</div></div>
            <div style={{background:"#ffffff08",borderRadius:6,height:8}}><div style={{width:`${Math.min(100,(analytics.active_users_week/analytics.total_members)*100)}%`,height:"100%",background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",borderRadius:6,transition:"width .6s"}}/></div>
            <div style={{fontSize:11,color:"#888",marginTop:6}}>{analytics.active_users_week} of {analytics.total_members} members logged activity this week</div>
          </div>}
          {Array.isArray(analytics.daily_logs)&&analytics.daily_logs.length>0&&<div className="card">
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Daily Activity (7 days)</div>
            <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
              {(()=>{const days=[];const today=new Date();for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
              const maxVal=Math.max(1,...analytics.daily_logs.map(d=>d.count||0));
              return days.map(day=>{const entry=analytics.daily_logs.find(d=>d.log_date===day);const count=entry?.count||0;const h=Math.max(4,(count/maxVal)*52);const dow=new Date(day).toLocaleDateString('en',{weekday:'short'}).slice(0,1);
              return<div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,color:count>0?"#6EE7B7":"#555",fontWeight:700}}>{count>0?count:""}</div>
                <div style={{width:"100%",height:h,background:count>0?"linear-gradient(180deg,#6EE7B7,#93C5FD40)":"#ffffff08",borderRadius:"3px 3px 0 0",transition:"height .4s"}}/>
                <div style={{fontSize:9,color:"#555"}}>{dow}</div>
              </div>;});})()}
            </div>
          </div>}
        </>}
        {!analyticsLoading&&!analytics&&<div style={{textAlign:"center",padding:"30px 0",color:"#888",fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>📊</div>No activity data yet.</div>}
      </div>}
      {toolSec==="tips"&&<div>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Post a Physio Tip</div>
        <div style={{fontSize:12,color:"#888",marginBottom:14}}>Tips appear in everyone's feed instantly.</div>
        <div className="card">
          <Inp label="Title" placeholder="e.g. Why your hips are tight from sitting" value={tipF.title} onChange={e=>setTipF(f=>({...f,title:e.target.value}))}/>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>Body Area</div><select value={tipF.body_part} onChange={e=>setTipF(f=>({...f,body_part:e.target.value}))} style={{width:"100%"}}>{Object.entries(BP_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>Tip Content</div><textarea value={tipF.content} onChange={e=>setTipF(f=>({...f,content:e.target.value}))} placeholder="Share your physio knowledge…" rows={5} style={{resize:"none",width:"100%"}}/></div>
          <Inp label="Emoji" value={tipF.emoji} onChange={e=>setTipF(f=>({...f,emoji:e.target.value}))} style={{width:60}}/>
          {tipF.title&&tipF.content&&<div style={{background:`${BP_COLORS[tipF.body_part]||"#6EE7B7"}0d`,border:`1px solid ${BP_COLORS[tipF.body_part]||"#6EE7B7"}22`,borderRadius:10,padding:"10px 12px",marginBottom:12}}><div style={{fontSize:10,color:"#888",marginBottom:4}}>Preview</div><div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{tipF.title}</div><div style={{fontSize:11,color:"#aaa"}}>{tipF.content.slice(0,80)}{tipF.content.length>80?"…":""}</div></div>}
          <Btn color="#6EE7B7" text={savingTip?"Posting…":"💡 Post to Feed"} style={{width:"100%",padding:"11px"}} onClick={createTip} disabled={savingTip||!tipF.title||!tipF.content}/>
        </div>
      </div>}
      {toolSec==="questions"&&<PhysioQnA cu={cu} notify={notify}/>}
      {toolSec==="challenges"&&<div>
        <div className="card" style={{marginBottom:12}}>
          <div style={{fontWeight:700,marginBottom:10}}>Create Challenge</div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:6}}>Type</div><div style={{display:"flex",gap:6}}>{[["count","📊 Count","Log a number"],["habit","✅ Habit","Daily checklist"]].map(([v,lbl,sub])=><button key={v} onClick={()=>setChF(f=>({...f,type:v}))} style={{flex:1,padding:"9px 8px",borderRadius:10,border:`1px solid ${chF.type===v?"#F9A8D455":"#ffffff15"}`,background:chF.type===v?"#F9A8D418":"transparent",textAlign:"left"}}><div style={{fontWeight:700,fontSize:12,color:chF.type===v?"#F9A8D4":"#888"}}>{lbl}</div><div style={{fontSize:10,color:"#555",marginTop:2}}>{sub}</div></button>)}</div></div>
          <div style={{display:"flex",gap:7}}><Inp label="Title" value={chF.title} onChange={e=>setChF(f=>({...f,title:e.target.value}))} style={{flex:3}}/><Inp label="Icon" value={chF.icon} onChange={e=>setChF(f=>({...f,icon:e.target.value}))} style={{flex:1}}/></div>
          {chF.type==="count"&&<div style={{display:"flex",gap:7}}><Inp label="Unit" value={chF.unit} onChange={e=>setChF(f=>({...f,unit:e.target.value}))} style={{flex:1}}/><Inp label="Goal" value={chF.goal} onChange={e=>setChF(f=>({...f,goal:e.target.value}))} type="number" style={{flex:1}}/></div>}
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:5}}>Color</div><div style={{display:"flex",gap:5}}>{TC.map(c=><button key={c} onClick={()=>setChF(f=>({...f,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${chF.color===c?"#fff":"transparent"}`}}/>)}</div></div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>Assign to Team <span style={{color:"#555"}}>(optional — leave blank for all teams)</span></div><select value={chF.teamId} onChange={e=>setChF(f=>({...f,teamId:e.target.value}))} style={{width:"100%",background:"#ffffff08",border:"1px solid #ffffff15",color:"#e8e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"system-ui,sans-serif"}}><option value="">🌐 All Teams</option>{teams.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</select></div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>Physio Note <span style={{color:"#555"}}>(optional)</span></div><textarea value={chF.physioNote} onChange={e=>setChF(f=>({...f,physioNote:e.target.value}))} placeholder="Why does this challenge matter? This will be shown to your team when they first join the challenge." rows={3} style={{resize:"none",width:"100%"}}/></div>
          <Btn color="#F9A8D4" text="Launch 🚀" style={{width:"100%"}} onClick={createCh}/>
        </div>
        {challenges.map(ch=>{const assignedTeam=ch.team_id?teams.find(t=>t.id===ch.team_id):null;return<div key={ch.id} className="card" style={{marginBottom:8,display:"flex",gap:9,alignItems:"center",opacity:ch.active?1:.6}}>
          <span style={{fontSize:20}}>{ch.icon}</span>
          <div style={{flex:1}}><div style={{fontWeight:700,color:ch.color,fontSize:13}}>{ch.title}</div><div style={{fontSize:11,color:"#888"}}>{ch.type==="habit"?"Habit ✅":ch.goal?.toLocaleString()+" "+ch.unit} · {assignedTeam?`${assignedTeam.emoji} ${assignedTeam.name}`:"All Teams"}</div></div>
          <button onClick={async()=>{
  if(!ch.active){
    // Resuming — deactivate all others first
    await supabase.from('challenges').update({active:false}).eq('company_id',cu.company_id).eq('active',true);
    setChallenges(c=>c.map(x=>({...x,active:false})));
  }
  await supabase.from('challenges').update({active:!ch.active}).eq('id',ch.id);
  setChallenges(c=>c.map(x=>x.id===ch.id?{...x,active:!x.active}:x));
}} style={{background:`${ch.active?"#FCD34D":"#6EE7B7"}15`,border:`1px solid ${ch.active?"#FCD34D":"#6EE7B7"}33`,color:ch.active?"#FCD34D":"#6EE7B7",borderRadius:8,padding:"4px 8px",fontSize:11,fontWeight:700}}>{ch.active?"Pause":"Resume"}</button>
        </div>})}
      </div>}
      {toolSec==="hr"&&<HRDashboard cu={cu}/>}
      {toolSec==="insights"&&<InsightsSection cu={cu} session={session} users={users}/>}
      {toolSec==="digest"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontWeight:700,fontSize:15}}>Weekly Digest Preview</div><span style={{fontSize:10,background:"#6EE7B722",border:"1px solid #6EE7B733",borderRadius:8,padding:"2px 8px",color:"#6EE7B7",fontWeight:700}}>PREVIEW</span></div>
        <div style={{fontSize:12,color:"#888",marginBottom:16}}>What your team receives every Monday morning.</div>
        <div style={{background:"#13131f",border:"1px solid #ffffff15",borderRadius:18,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(135deg,#6EE7B722,#93C5FD15)",borderBottom:"1px solid #ffffff10",padding:"20px 20px 16px",textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:22,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>WELLCREW</div>
            <div style={{fontSize:12,color:"#888"}}>Weekly Wellness Digest · {new Date().toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'})}</div>
          </div>
          <div style={{padding:"20px"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#e8e8f0",marginBottom:14}}>Good morning, Team! 👋</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
              {[[weekLoggers.size+"","Active","👥","#6EE7B7"],[weekLogs.length+"","Logs","📊","#93C5FD"],[Math.round(weekLoggers.size/Math.max(1,totalMembers)*100)+"%","Participated","🎯","#F9A8D4"]].map(([v,l,ic,c])=>(
                <div key={l} style={{background:"#ffffff08",borderRadius:12,padding:"12px 8px",textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>{ic}</div><div style={{fontWeight:800,fontSize:18,color:c}}>{v}</div><div style={{fontSize:9,color:"#666"}}>{l}</div></div>
              ))}
            </div>
            {topUser&&<div style={{background:"#FCD34D15",border:"1px solid #FCD34D33",borderRadius:14,padding:"14px",marginBottom:14}}>
              <div style={{fontSize:11,color:"#FCD34D",fontWeight:700,marginBottom:6}}>🥇 THIS WEEK'S TOP PERFORMER</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><Av u={topUser} s={40}/><div><div style={{fontWeight:700,fontSize:14}}>{topUser.name}</div><div style={{fontSize:12,color:"#888"}}>{topPts.toLocaleString()} points</div></div></div>
            </div>}
            {!topUser&&<div style={{background:"#ffffff08",borderRadius:12,padding:"12px",marginBottom:14,textAlign:"center",color:"#888",fontSize:12}}>No activity logged this week yet.</div>}
            <div style={{background:"#6EE7B710",border:"1px solid #6EE7B722",borderRadius:14,padding:"14px",marginBottom:14}}>
              <div style={{fontSize:11,color:"#6EE7B7",fontWeight:700,marginBottom:6}}>👩‍⚕️ PHYSIO TIP OF THE WEEK</div>
              <div style={{fontSize:13,color:"#d4d4d4",lineHeight:1.6}}>{tipOfWeek}</div>
              <div style={{fontSize:10,color:"#888",marginTop:6}}>— Physiotherapist, Brooke Cassar</div>
            </div>
            <div style={{background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",borderRadius:12,padding:"12px 14px",textAlign:"center",border:"1px solid #6EE7B744"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e8e8f0",marginBottom:3}}>Keep the momentum going! 💪</div>
              <div style={{fontSize:11,color:"#888"}}>Log your activity in Wellcrew to stay on the leaderboard.</div>
            </div>
          </div>
          <div style={{borderTop:"1px solid #ffffff08",padding:"12px 20px",textAlign:"center"}}><div style={{fontSize:10,color:"#555"}}>Wellcrew · Built for workplace wellness by Physiotherapist, Brooke Cassar</div></div>
        </div>
      </div>}
      {toolSec==="teams"&&<div>
        <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Create New Team</div>
        <div className="card" style={{marginBottom:14}}>
          <Inp label="Team Name" value={newTeam.name} onChange={e=>setNewTeam(t=>({...t,name:e.target.value}))} placeholder="e.g. Sales Team"/>
          <div style={{marginBottom:14}}><div style={{fontSize:11,color:"#888",marginBottom:5}}>Color</div><div style={{display:"flex",gap:5}}>{TC.map(c=><button key={c} onClick={()=>setNewTeam(t=>({...t,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${newTeam.color===c?"#fff":"transparent"}`}}/>)}</div></div>
          {/* First challenge picker */}
          <div style={{borderTop:"1px solid #ffffff0f",paddingTop:14,marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:700,color:"#6EE7B7",marginBottom:4}}>🏆 Week 1 Challenge</div>
            <div style={{fontSize:11,color:"#666",marginBottom:10}}>Pick one to start them off. One challenge per week per team.</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[
                {id:"none",icon:"⏭️",title:"Skip for now",sub:"Add a challenge later from the Challenges tab",type:"habit",goal:null,unit:"",note:""},
                {id:"stretch",icon:"🧘",title:"Daily Desk Stretch",sub:"5 min · Habit · Reduces neck & back pain by 72%",type:"habit",goal:null,unit:"",note:"Prolonged sitting increases spinal disc pressure by 40%. Daily stretching is the single most effective intervention for office-related musculoskeletal pain."},
                {id:"steps",icon:"🦶",title:"10,000 Steps",sub:"Count · 10,000 steps/day · Cuts mortality risk 36%",type:"count",goal:10000,unit:"steps",note:"Every 1,000 extra steps per day reduces cardiovascular mortality by 15%. Walking is the most underrated medicine — no gym required."},
                {id:"water",icon:"💧",title:"8 Glasses of Water",sub:"Count · 8 glasses/day · Boosts cognition 20%",type:"count",goal:8,unit:"glasses",note:"Even mild dehydration (1–2% body weight) impairs concentration, memory and reaction time. Most office workers are chronically under-hydrated."},
                {id:"mindfulness",icon:"🧠",title:"2-Minute Breathing Break",sub:"Habit · Daily · Reduces anxiety 38%",type:"habit",goal:null,unit:"",note:"Just 2 minutes of diaphragmatic breathing activates the parasympathetic nervous system, measurably reducing cortisol within 90 seconds."},
                {id:"movement",icon:"🏃",title:"Movement Break Every Hour",sub:"Habit · Daily · Reduces blood sugar spikes 30%",type:"habit",goal:null,unit:"",note:"Sedentary bouts over 30 minutes cause measurable drops in insulin sensitivity. A 2-minute walk every hour reduces blood sugar spikes by 30% and improves afternoon energy."},
                {id:"eye",icon:"👁️",title:"20-20-20 Eye Rule",sub:"Habit · Daily · Reduces digital eye strain 62%",type:"habit",goal:null,unit:"",note:"Office workers blink 66% less on screens. Every 20 minutes, look 20 feet away for 20 seconds. Reduces eye strain, headaches and end-of-day fatigue significantly."},
                {id:"sleep",icon:"😴",title:"8 Hours Sleep",sub:"Count · 8 hrs/night · 11 fewer sick days/year",type:"count",goal:8,unit:"hours",note:"Poor sleep costs employers 11 lost productivity days per employee per year. Consistent 8-hour sleep improves reaction time, mood and immune function within one week."},
              ].map(ch=>{
                const sel=newTeam.challengeId===ch.id;
                return<button key={ch.id} onClick={()=>setNewTeam(t=>({...t,challengeId:ch.id,challengeTitle:ch.title,challengeIcon:ch.icon,challengeType:ch.type,challengeGoal:ch.goal?String(ch.goal):"",challengeUnit:ch.unit,challengeNote:ch.note}))} style={{display:"flex",gap:10,alignItems:"center",background:sel?"#6EE7B715":"#ffffff06",border:`1px solid ${sel?"#6EE7B755":"#ffffff0f"}`,borderRadius:12,padding:"10px 12px",textAlign:"left",cursor:"pointer",width:"100%"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{ch.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:sel?"#6EE7B7":"#e8e8f0"}}>{ch.title}</div>
                    <div style={{fontSize:10,color:"#666",marginTop:1}}>{ch.sub}</div>
                  </div>
                  {sel&&<span style={{color:"#6EE7B7",fontWeight:800,fontSize:14}}>✓</span>}
                </button>;
              })}
            </div>
          </div>
          <Btn color="#93C5FD" text="Create Team →" style={{width:"100%",marginTop:14}} onClick={createTeam} disabled={!newTeam.name.trim()||!newTeam.challengeId}/>
        </div>
        {teams.map(t=><div key={t.id} className="card" style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,borderColor:`${t.color}22`}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{t.emoji}</div>
          <div style={{flex:1}}><div style={{fontWeight:700}}>{t.name}</div><div style={{fontSize:11,color:"#888"}}>{users.filter(u=>u.team_id===t.id).length} members</div></div>
        </div>)}
        {teams.length===0&&<div style={{textAlign:"center",color:"#888",padding:"20px 0",fontSize:13}}>No teams yet.</div>}
      </div>}
      {toolSec==="superadmin"&&cu.is_super_admin&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontWeight:700,fontSize:15}}>🌐 Super Admin</span><Pill color="#FCD34D" text="BROOKE ONLY"/></div>
        <div style={{fontSize:12,color:"#888",marginBottom:14}}>Manage all companies on Wellcrew.</div>
        <div className="card" style={{marginBottom:14}}>
          <div style={{fontWeight:700,marginBottom:10}}>Create New Company</div>
          <div style={{display:"flex",gap:7,marginBottom:8}}><input placeholder="Company name" value={newCo.name} onChange={e=>setNewCo(c=>({...c,name:e.target.value}))} style={{flex:1}}/><input placeholder="🏢" value={newCo.emoji} onChange={e=>setNewCo(c=>({...c,emoji:e.target.value}))} style={{width:50}}/></div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:5}}>Brand Color</div><div style={{display:"flex",gap:5}}>{TC.map(c=><button key={c} onClick={()=>setNewCo(co=>({...co,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${newCo.color===c?"#fff":"transparent"}`}}/>)}</div></div>
          <Btn color="#FCD34D" text={creatingCo?"Creating…":"➕ Create Company"} style={{width:"100%"}} onClick={createCompany} disabled={creatingCo||!newCo.name.trim()}/>
        </div>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>{companies.length} Companies</div>
        {companies.map(co=><div key={co.id} className="card" style={{marginBottom:10,borderColor:`${co.color}22`}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
            <div style={{width:44,height:44,borderRadius:13,background:`${co.color}22`,border:`1px solid ${co.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{co.emoji}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{co.name}</div><div style={{fontSize:11,color:"#888"}}>{co.plan||"starter"} plan</div></div>
            {co.id===cu.company_id&&<Pill color="#6EE7B7" text="YOUR CO"/>}
          </div>
          <Btn color="#C4B5FD" text="👑 Generate Admin Invite" style={{width:"100%",fontSize:12}} onClick={()=>generateAdminInvite(co.id)}/>
          {adminInviteLink[co.id]&&<div style={{marginTop:8,background:"#C4B5FD10",border:"1px solid #C4B5FD25",borderRadius:9,padding:"9px 12px"}}>
            <div style={{fontSize:11,color:"#C4B5FD",fontWeight:700,marginBottom:5}}>📋 Admin invite link:</div>
            <div style={{fontSize:10,color:"#aaa",wordBreak:"break-all",marginBottom:7}}>{adminInviteLink[co.id]}</div>
            <button onClick={()=>{navigator.clipboard.writeText(adminInviteLink[co.id]);notify("📋 Copied!");}} style={{background:"#C4B5FD22",border:"1px solid #C4B5FD44",color:"#C4B5FD",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700}}>Copy Link</button>
          </div>}
        </div>)}
        {companies.length===0&&<div style={{textAlign:"center",color:"#888",padding:"20px 0",fontSize:13}}>No companies yet.</div>}
      </div>}
    </div>;
  }

  // ── HOME: team picker ──
  const today7=new Date(Date.now()-7*864e5);
  const recentLogs=(feed||[]).filter(p=>new Date(p.ts)>=today7);
  const recentLoggers=new Set(recentLogs.map(p=>p.uid));
  const totalMembers=users.length+1;
  const partRate=totalMembers>0?recentLoggers.size/totalMembers:0;
  const avgStreak=users.length>0?users.reduce((a,u)=>a+(u.checkin_streak||0),0)/users.length:0;
  const ws=Math.min(100,Math.round(partRate*100*0.5+Math.min(1,avgStreak/14)*100*0.3+Math.min(1,(recentLogs.length/(totalMembers*3)))*100*0.2));
  const wsCol=ws>=75?"#6EE7B7":ws>=50?"#FCD34D":ws>=25?"#FB923C":"#F87171";
  const wsLabel=ws>=75?"Thriving 💚":ws>=50?"Good 💛":ws>=25?"Developing 🟠":"Just Starting 🔴";

  return<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontWeight:700,fontSize:17}}>Admin</span><Pill color="#C4B5FD" text="ADMIN"/>{cu.is_super_admin&&<Pill color="#FCD34D" text="SUPER"/>}</div>
      <Btn color="#C4B5FD" text="⚙️ Tools" style={{fontSize:12,padding:"6px 12px"}} onClick={()=>setView("tools")}/>
    </div>

    {/* Company wellness score */}
    <div style={{background:"linear-gradient(135deg,#6EE7B710,#93C5FD08)",border:"1px solid #6EE7B722",borderRadius:18,padding:"16px",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
          <svg width={64} height={64} style={{transform:"rotate(-90deg)"}}>
            <circle cx={32} cy={32} r={26} fill="none" stroke="#ffffff0f" strokeWidth={5}/>
            <circle cx={32} cy={32} r={26} fill="none" stroke={wsCol} strokeWidth={5} strokeDasharray={`${ws/100*163} 163`} strokeLinecap="round" style={{transition:"stroke-dasharray .8s"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:wsCol}}>{ws}</div>
        </div>
        <div>
          <div style={{fontSize:10,color:"#888",marginBottom:2}}>Company Wellness Score</div>
          <div style={{fontWeight:800,fontSize:17,color:wsCol}}>{wsLabel}</div>
          <div style={{display:"flex",gap:10,marginTop:5}}>
            {[[Math.round(partRate*100)+"%","Active","#6EE7B7"],[avgStreak.toFixed(1)+"d","Streak","#FCD34D"],[recentLogs.length,"Logs","#93C5FD"]].map(([v,l,c])=>
              <div key={l} style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13,color:c}}>{v}</div><div style={{fontSize:9,color:"#555"}}>{l}</div></div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Team cards */}
    <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Teams <span style={{color:"#555",fontWeight:400,fontSize:12}}>— tap to open dashboard</span></div>
    {teams.length===0&&<div className="card" style={{textAlign:"center",padding:"30px 16px",color:"#888"}}>
      <div style={{fontSize:36,marginBottom:8}}>👥</div>
      <div style={{fontSize:13,marginBottom:10}}>No teams yet.</div>
      <Btn color="#93C5FD" text="⚙️ Create a Team" onClick={()=>{setView("tools");setToolSec("teams");}}/>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {teams.map(t=>{
        const members=users.filter(u=>u.team_id===t.id);
        const memberIds=new Set(members.map(u=>u.id));
        const tFeed=(feed||[]).filter(p=>memberIds.has(p.uid)&&new Date(p.ts)>=today7);
        const tActive=new Set(tFeed.map(p=>p.uid)).size;
        const tPart=members.length>0?Math.round(tActive/members.length*100):0;
        const tStreak=members.length>0?Math.round(members.reduce((a,u)=>a+(u.checkin_streak||0),0)/members.length*10)/10:0;
        const tWs=Math.min(100,Math.round(tPart*0.5+Math.min(100,tStreak/14*100)*0.3+Math.min(100,tFeed.length/Math.max(1,members.length*3)*100)*0.2));
        const tWsCol=tWs>=75?"#6EE7B7":tWs>=50?"#FCD34D":tWs>=25?"#FB923C":"#F87171";
        return<div key={t.id} onClick={()=>{setSelectedTeam(t);setView("team");}} className="card" style={{cursor:"pointer",borderColor:`${t.color}33`,padding:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:10,right:12,fontWeight:900,fontSize:13,color:tWsCol}}>{tWs}</div>
          <div style={{width:40,height:40,borderRadius:12,background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:8}}>{t.emoji||"👥"}</div>
          <div style={{fontWeight:800,fontSize:13,marginBottom:2,paddingRight:28}}>{t.name}</div>
          <div style={{fontSize:11,color:"#888",marginBottom:6}}>{members.length} member{members.length!==1?"s":""}</div>
          <div style={{display:"flex",gap:8}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:t.color}}>{tPart}%</div><div style={{fontSize:9,color:"#555"}}>Active</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:"#FB923C"}}>🔥{tStreak}</div><div style={{fontSize:9,color:"#555"}}>Streak</div></div>
          </div>
          <div style={{marginTop:8,height:3,background:"#ffffff08",borderRadius:3}}><div style={{width:`${tWs}%`,height:"100%",background:tWsCol,borderRadius:3,transition:"width .5s"}}/></div>
        </div>;
      })}
    </div>
    {teams.length>0&&<Btn color="#93C5FD" text="+ New Team" style={{width:"100%",marginBottom:4}} onClick={()=>{setView("tools");setToolSec("teams");}}/>}
  </div>;
};

// ── LOG MODAL ──
const LogModal=({onClose,challenges,cu,setFeed,notify,initialChallenge,awardBadge,feed})=>{
  const a=challenges.filter(c=>c.active);
  const [sel,setSel]=useState(initialChallenge||a[0]);
  const [val,setVal]=useState("");
  const [note,setNote]=useState("");
  const isHabit=sel?.type==="habit";

  const submit=async()=>{
    if(!sel)return;
    const v=isHabit?1:parseFloat(val);
    if(!isHabit&&(isNaN(v)||v<=0))return;
    const{data,error}=await supabase.from('activity_logs').insert({
      user_id:cu.id,challenge_id:sel.id,value:v,note:note||null,
      company_id:cu.company_id||null
    }).select().single();
    if(!error&&data){
      setFeed(f=>[{
        id:data.id,uid:data.user_id,cid:data.challenge_id,
        val:data.value,note:data.note||'',
        ts:new Date(data.created_at).getTime(),
        comments:[],rx:{}
      },...f]);
      notify(`✅ ${sel.icon} Logged!`);
      // Award first_log badge if this is their first ever log
      const myLogs=(feed||[]).filter(p=>p.uid===cu.id);
      if(myLogs.length===0&&awardBadge) awardBadge('first_log');
      // Award challenge_complete if they hit the goal
      if(!isHabit&&awardBadge&&sel.goal){
        const prevPts=(feed||[]).filter(p=>p.uid===cu.id&&String(p.cid)===String(sel.id)).reduce((a,p)=>a+(p.val||0),0);
        if(prevPts<sel.goal&&prevPts+v>=sel.goal) awardBadge('challenge_complete');
      }
      onClose();
    } else {
      notify("❌ Couldn't save — try again.");
    }
  };

  return<Modal onClose={onClose}>
    <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>Log Progress</div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
      {a.map(c=><button key={c.id} onClick={()=>{setSel(c);setVal("");}} style={{padding:"5px 10px",borderRadius:18,border:`1px solid ${sel?.id===c.id?c.color:"#ffffff22"}`,background:sel?.id===c.id?`${c.color}22`:"transparent",color:sel?.id===c.id?c.color:"#888",fontSize:11}}>{c.icon} {c.title}</button>)}
    </div>
    {sel&&<>
      {isHabit
        ?<div style={{textAlign:"center",padding:"16px 0 20px"}}>
            <div style={{fontSize:52,marginBottom:10}}>{sel.icon}</div>
            <div style={{fontWeight:800,fontSize:17,color:sel.color,marginBottom:4}}>{sel.title}</div>
            <div style={{fontSize:12,color:"#888",marginBottom:6}}>{sel.desc}</div>
            {sel.physioNote&&<div style={{background:`${sel.color}0d`,border:`1px solid ${sel.color}22`,borderRadius:10,padding:"9px 12px",marginBottom:18,textAlign:"left"}}>
              <div style={{fontSize:10,color:sel.color,fontWeight:700,marginBottom:3}}>👩‍⚕️ Why it matters</div>
              <div style={{fontSize:11,color:"#aaa",lineHeight:1.5}}>{sel.physioNote}</div>
            </div>}
            <textarea placeholder="How did it feel? (optional)" value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{resize:"none",marginBottom:14}}/>
            <Btn color={sel.color} text="✅ Mark as Done!" style={{width:"100%",padding:"13px",fontSize:15}} onClick={submit}/>
          </div>
        :<>
            <Inp label={`Enter ${sel.unit}`} value={val} onChange={e=>setVal(e.target.value)} type="number" min="0"/>
            <textarea placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{resize:"none",marginBottom:11}}/>
            <Btn color={sel.color} text="Post to Feed →" style={{width:"100%",padding:"11px"}} onClick={submit}/>
          </>
      }
    </>}
  </Modal>;
};

// ── NOTIFICATIONS PANEL ──
const NotifsPanel=({notifs,onClose,onRead})=><div className="sd" style={{position:"fixed",top:58,right:8,width:280,maxWidth:"90vw",background:"#13131f",border:"1px solid #ffffff18",borderRadius:14,zIndex:800,boxShadow:"0 16px 50px #0009",maxHeight:"68vh",overflowY:"auto"}}><div style={{padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #ffffff0f",position:"sticky",top:0,background:"#13131f"}}><div style={{fontWeight:700,fontSize:13}}>Notifications</div><button onClick={onClose} style={{background:"transparent",border:"none",color:"#888",fontSize:17,padding:0}}>✕</button></div>{notifs.length===0&&<div style={{padding:"20px",textAlign:"center",color:"#888",fontSize:12}}>All caught up! 🎉</div>}{notifs.map(n=>{const icons={badge:"🏅",reaction:"💬",challenge:"🏆",dm:"✉️",admin:"⚙️",invite:"📧"};return<div key={n.id} onClick={()=>onRead(n.id)} style={{padding:"10px 14px",borderBottom:"1px solid #ffffff06",background:n.read?"transparent":"#6EE7B70d",cursor:"pointer",display:"flex",gap:7,alignItems:"flex-start"}}><span style={{fontSize:14,flexShrink:0}}>{icons[n.type]||"🔔"}</span><div style={{flex:1}}><div style={{fontSize:11,color:n.read?"#888":"#ccc",lineHeight:1.4}}>{n.text}</div><div style={{fontSize:9,color:"#555",marginTop:2}}>{ago(n.ts)}</div></div>{!n.read&&<div style={{width:5,height:5,borderRadius:"50%",background:"#6EE7B7",marginTop:3,flexShrink:0}}/>}</div>;})}
</div>;

// ── MAIN APP ──
export default function App({ session }) {
  const [dark,setDark]=useState(true);
  const th=dark?DK:LT;
  const [cu,setCu]=useState(null);
  const [profileLoading,setProfileLoading]=useState(true);
  const [tab,setTab]=useState("home");
  const [feed,setFeed]=useState(IF);
  const [msgs,setMsgs]=useState(IM);
  const [challenges,setChallenges]=useState(IC);
  const [users,setUsers]=useState([]);
  // Leaderboard computed from feed + challenges (auto-updates when either changes)
  const lb=useMemo(()=>{
    const pts={};
    feed.forEach(post=>{
      const ch=challenges.find(c=>String(c.id)===String(post.cid));
      if(!ch)return;
      const p=ch.type==="habit"?100:(post.val||0);
      pts[post.uid]=(pts[post.uid]||0)+p;
    });
    return Object.entries(pts).map(([uid,p])=>({uid,pts:p})).sort((a,b)=>b.pts-a.pts);
  },[feed,challenges]);
  const [tips,setTips]=useState([]);
  const [showLog,setShowLog]=useState(null);
  const [showNotifs,setShowNotifs]=useState(false);
  const [checked,setChecked]=useState(false);
  const [lastCheckin,setLastCheckin]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [pd,setPd]=useState(IP);
  const [notifs,setNotifs]=useState([
    {id:1,type:"badge",text:"Welcome to Wellcrew! 🎉",ts:N-3600000,read:false},
  ]);
  const [teams,setTeams]=useState([]);
  const [badges,setBadges]=useState([]);
  const [activePulse,setActivePulse]=useState(null);
  const [myPulseVoted,setMyPulseVoted]=useState(false);
  const [activeSurvey,setActiveSurvey]=useState(null);
  const [mySurveyDone,setMySurveyDone]=useState(false);
  const [introChallenge,setIntroChallenge]=useState(null);
  const [showAvatarMenu,setShowAvatarMenu]=useState(false);
  const [showEditProfile,setShowEditProfile]=useState(false);
  const [editName,setEditName]=useState("");
  const [editRole,setEditRole]=useState("");
  const [editSaving,setEditSaving]=useState(false);

  // Load profile
  useEffect(()=>{
    if(!session) return;
    supabase.from('profiles').select('*').eq('id',session.user.id).single()
      .then(({data})=>{
        if(data) setCu(data);
        else setCu({id:session.user.id,name:session.user.email,color:"#6EE7B7",is_admin:false});
        setProfileLoading(false);
      });
  },[session]);

  // Load physio tips (company-scoped after profile loads)
  useEffect(()=>{
    if(!cu)return;
    const q=supabase.from('physio_tips').select('*').order('created_at',{ascending:false});
    (cu.is_super_admin||!cu.company_id?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{ if(data) setTips(data); });
  },[cu?.id]);

  // Load challenges from Supabase (company-scoped, then filter to user's team or company-wide)
  useEffect(()=>{
    if(!cu)return;
    const q=supabase.from('challenges').select('*').order('created_at',{ascending:true});
    (cu.is_super_admin||!cu.company_id?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{
        if(data){
          // For regular members, show: challenges for their specific team + challenges for all teams (team_id is null)
          const visible=cu.is_admin||cu.is_super_admin?data:data.filter(c=>!c.team_id||c.team_id===cu.team_id);
          const mapped=visible.map(c=>({...c,desc:c.description,physioNote:c.physio_note,endDate:c.end_date}));
          setChallenges(mapped);
          // Show intro to new users for their active challenge
          if(!cu.has_seen_intro){
            const active=mapped.find(c=>c.active);
            if(active) setIntroChallenge(active);
          }
        }
      });
  },[cu?.id]);

  // Load activity logs from Supabase (company-scoped)
  useEffect(()=>{
    if(!cu)return;
    const q=supabase.from('activity_logs').select('*').order('created_at',{ascending:false}).limit(200);
    (cu.is_super_admin||!cu.company_id?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{
        if(data) setFeed(data.map(log=>({
          id:log.id,uid:log.user_id,cid:log.challenge_id,
          val:log.value,note:log.note||'',
          ts:new Date(log.created_at).getTime(),
          comments:[],rx:{}
        })));
      });
  },[cu?.id]);

  // Load company members for leaderboard + DMs
  useEffect(()=>{
    if(!cu)return;
    const q=supabase.from('profiles').select('*');
    (cu.is_super_admin||!cu.company_id?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{ if(data) setUsers(data.filter(u=>u.id!==cu.id)); });
  },[cu?.id]);

  // Restore today's check-in on load (so the check-in widget doesn't re-appear)
  useEffect(()=>{
    if(!cu)return;
    const todayISO=new Date().toISOString().slice(0,10);
    supabase.from('checkins').select('*').eq('user_id',cu.id)
      .gte('created_at',todayISO).order('created_at',{ascending:false}).limit(1)
      .then(({data})=>{ if(data&&data.length){setLastCheckin(data[0]);setChecked(true);} });
  },[cu]);

  // Load teams (company-scoped)
  useEffect(()=>{
    if(!cu)return;
    const q=supabase.from('teams').select('*');
    (cu.is_super_admin||!cu.company_id?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{ if(data) setTeams(data); });
  },[cu?.id]);

  // Load badges
  useEffect(()=>{
    if(!cu?.id)return;
    supabase.from('user_badges').select('*')
      .then(({data})=>{ if(data) setBadges(data); });
  },[cu?.id]);

  // Load active pulse + check if user already voted this week
  useEffect(()=>{
    if(!cu?.id||!cu?.company_id)return;
    const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
    supabase.from('mood_pulses').select('*').eq('company_id',cu.company_id).eq('is_active',true)
      .gte('week_of',weekStart.toISOString().slice(0,10)).order('created_at',{ascending:false}).limit(1)
      .then(async({data})=>{
        if(data&&data[0]){
          setActivePulse(data[0]);
          const{data:vote}=await supabase.from('pulse_responses').select('id').eq('pulse_id',data[0].id).eq('user_id',cu.id).limit(1);
          if(vote&&vote.length)setMyPulseVoted(true);
        }
      });
  },[cu?.id,cu?.company_id]);

  // Load active survey + check if user already responded
  useEffect(()=>{
    if(!cu?.id||!cu?.company_id)return;
    const period=new Date().toISOString().slice(0,7);
    supabase.from('wellbeing_surveys').select('*').eq('company_id',cu.company_id).eq('is_active',true)
      .eq('period',period).order('created_at',{ascending:false}).limit(1)
      .then(async({data})=>{
        if(data&&data[0]){
          setActiveSurvey(data[0]);
          const{data:resp}=await supabase.from('survey_responses').select('id').eq('survey_id',data[0].id).eq('user_id',cu.id).limit(1);
          if(resp&&resp.length)setMySurveyDone(true);
        }
      });
  },[cu?.id,cu?.company_id]);

  const notify=useCallback(msg=>{const id=Date.now();setToasts(ts=>[...ts,{id,msg}]);setTimeout(()=>setToasts(ts=>ts.filter(x=>x.id!==id)),3000);},[]);
  const addNotif=useCallback((type,text)=>setNotifs(n=>[{id:Date.now(),type,text,ts:Date.now(),read:false},...n]),[]);
  const handleTipCreated=useCallback(tip=>setTips(t=>[tip,...t]),[]);

  const awardBadge=useCallback(async(badgeType,meta={})=>{
    if(!cu?.id)return;
    // Award via RPC (ON CONFLICT DO NOTHING keeps it idempotent)
    await supabase.rpc('award_badge',{p_user_id:cu.id,p_badge_type:badgeType,p_metadata:meta});
    // Reload this user's badges and check if new
    const{data}=await supabase.from('user_badges').select('*').eq('user_id',cu.id);
    if(data){
      setBadges(prev=>{
        const hadBefore=prev.some(b=>b.user_id===cu.id&&b.badge_type===badgeType);
        const others=prev.filter(b=>b.user_id!==cu.id);
        if(!hadBefore){
          const def=BADGE_DEFS[badgeType];
          if(def){
            addNotif('badge',`🏅 New badge: ${def.icon} ${def.label}!`);
            setToasts(ts=>{const id=Date.now();setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3000);return[...ts,{id,msg:`🏅 ${def.icon} ${def.label} badge earned!`}];});
          }
        }
        return[...others,...data];
      });
    }
  },[cu?.id,addNotif]);

  const handleCheckin=useCallback(async(payload)=>{
    if(!cu)return;
    const{sleepHours,waterGlasses,...scores}=payload;
    const r=calcReadiness(scores);
    const nowHour=new Date().getHours();
    const{data}=await supabase.from('checkins').insert({
      user_id:cu.id,...scores,readiness:r,
      sleep_hours:sleepHours,water_ml:waterGlasses*250,check_in_hour:nowHour
    }).select().single();
    setLastCheckin(data||{...scores,readiness:r,sleep_hours:sleepHours,water_ml:waterGlasses*250,check_in_hour:nowHour,id:Date.now(),created_at:new Date().toISOString()});
    setChecked(true);
    notify("🌅 Check-in saved!");
    // Update streak via RPC
    const{data:newStreak}=await supabase.rpc('update_checkin_streak',{p_user_id:cu.id});
    const streak=newStreak||1;
    setCu(c=>({...c,checkin_streak:streak,last_checkin_date:new Date().toISOString().slice(0,10)}));
    // Award check-in badges
    awardBadge('first_checkin');
    if(nowHour<8) awardBadge('early_bird');
    if(nowHour>=21) awardBadge('night_owl');
    if(streak>=3) awardBadge('streak_3');
    if(streak>=7) awardBadge('streak_7');
    if(streak>=14) awardBadge('streak_14');
    if(streak>=30) awardBadge('streak_30');
    // Perfect week: check if logged all 7 days in current week
    const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
    const{data:weekCheckins}=await supabase.from('checkins').select('created_at').eq('user_id',cu.id).gte('created_at',weekStart.toISOString());
    if(weekCheckins){
      const uniqueDays=new Set(weekCheckins.map(c=>new Date(c.created_at).toDateString()));
      if(uniqueDays.size>=7) awardBadge('perfect_week');
    }
  },[cu,notify,awardBadge]);

  if(profileLoading) return(
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontWeight:800,fontSize:24,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>WELLCREW</div>
    </div>
  );

  const unread=notifs.filter(n=>!n.read).length;
  const myR=lb.findIndex(e=>e.uid===cu?.id)+1;
  const allUsers=[cu,...users.filter(u=>u.id!==cu?.id)];
  const NAV=[["home","Home","🏠"],["crew","Crew","👥"],["train","Train","🏋️"],["sleep","Sleep","😴"],["physio","Physio","🩺"],...(cu?.is_admin?[["admin","Admin","⚙️"]]:[]),["me","Me","👤"]];
  // Nudge: how many teammates logged activity today (excluding self)
  const todayLogs=feed.filter(p=>new Date(p.ts).toDateString()===todayStr());
  const iLoggedToday=todayLogs.some(p=>p.uid===cu?.id);
  const todayLoggerSet=new Set(todayLogs.filter(p=>p.uid!==cu?.id).map(p=>p.uid));
  const nudgeCount=todayLoggerSet.size;

  return<>
    <style>{makeCSS(th)}</style>
    <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:7,alignItems:"center",pointerEvents:"none"}}>
      {toasts.map(t=><div key={t.id} style={{background:"#13131f",border:"1px solid #6EE7B755",borderRadius:13,padding:"9px 18px",fontSize:13,color:"#6EE7B7",backdropFilter:"blur(12px)",whiteSpace:"nowrap",animation:"ti 3s ease both"}}>{t.msg}</div>)}
    </div>
    {showNotifs&&<><div style={{position:"fixed",inset:0,zIndex:799}} onClick={()=>setShowNotifs(false)}/><NotifsPanel notifs={notifs} onClose={()=>setShowNotifs(false)} onRead={id=>setNotifs(n=>n.map(x=>x.id===id?{...x,read:true}:x))}/></>}
    {showLog&&<LogModal onClose={()=>setShowLog(null)} challenges={challenges} cu={cu} setFeed={setFeed} notify={notify} initialChallenge={typeof showLog==="object"?showLog:null} awardBadge={awardBadge} feed={feed}/>}
    {introChallenge&&<ChallengeIntroModal challenge={introChallenge} onDone={async()=>{setIntroChallenge(null);await supabase.from('profiles').update({has_seen_intro:true}).eq('id',session.user.id);setCu(c=>({...c,has_seen_intro:true}));}}/>}
    {showEditProfile&&<Modal onClose={()=>setShowEditProfile(false)}>
      <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>✏️ Edit Profile</div>
      <div style={{fontSize:12,color:"#666",marginBottom:18}}>Changes are visible to your team.</div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#6EE7B7,#93C5FD)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:24,color:"#080810"}}>
          {(editName||cu.name||"?")[0].toUpperCase()}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#888",marginBottom:5}}>Full Name</div>
        <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Your name" style={{width:"100%",background:"#ffffff08",border:"1px solid #ffffff15",color:"#e8e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"system-ui,sans-serif"}}/>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:"#888",marginBottom:5}}>Role / Job Title</div>
        <input value={editRole} onChange={e=>setEditRole(e.target.value)} placeholder="e.g. Marketing Manager" style={{width:"100%",background:"#ffffff08",border:"1px solid #ffffff15",color:"#e8e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"system-ui,sans-serif"}}/>
      </div>
      <button disabled={editSaving||!editName.trim()} onClick={async()=>{
        setEditSaving(true);
        const{error}=await supabase.from('profiles').update({name:editName.trim(),role:editRole.trim()}).eq('id',session.user.id);
        if(!error){setCu(c=>({...c,name:editName.trim(),role:editRole.trim()}));setShowEditProfile(false);notify("✅ Profile updated!");}
        else notify("❌ Couldn't save — try again.");
        setEditSaving(false);
      }} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:"linear-gradient(135deg,#6EE7B7,#93C5FD)",color:"#080810",fontWeight:800,fontSize:15,cursor:"pointer",opacity:editSaving?0.6:1}}>
        {editSaving?"Saving…":"Save Changes"}
      </button>
    </Modal>}

    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"13px 13px 0",position:"sticky",top:0,zIndex:40,background:`linear-gradient(to bottom,${th.bg} 85%,transparent)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:21,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-.5}}>WELLCREW</div>
            <div style={{fontSize:9,color:th.sub,marginTop:1}}>Company Wellness Hub</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setDark(v=>!v)} style={{width:30,height:30,borderRadius:8,background:th.nb,border:`1px solid ${th.cb}`,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
            <div onClick={()=>setShowNotifs(v=>!v)} style={{position:"relative",cursor:"pointer",width:30,height:30,borderRadius:8,background:th.nb,border:`1px solid ${th.cb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🔔{unread>0&&<div style={{position:"absolute",top:-3,right:-3,width:13,height:13,borderRadius:"50%",background:"#F9A8D4",fontSize:7,fontWeight:800,color:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</div>}</div>
            {myR>0&&<div style={{fontSize:10,color:"#6EE7B7",background:"#6EE7B715",border:"1px solid #6EE7B730",borderRadius:18,padding:"2px 7px",fontWeight:700}}>#{myR}</div>}
            <div style={{position:"relative"}}>
              <div onClick={()=>setShowAvatarMenu(v=>!v)} style={{cursor:"pointer"}}><Av u={cu} s={30}/></div>
              {showAvatarMenu&&<><div style={{position:"fixed",inset:0,zIndex:149}} onClick={()=>setShowAvatarMenu(false)}/><div style={{position:"absolute",top:36,right:0,background:"#1a1a2e",border:"1px solid #ffffff18",borderRadius:14,padding:8,minWidth:180,zIndex:150,boxShadow:"0 8px 32px #000a"}}>
                <div style={{padding:"8px 12px",marginBottom:4,borderBottom:"1px solid #ffffff0f"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#e8e8f0"}}>{cu.name}</div>
                  <div style={{fontSize:11,color:"#666",marginTop:1}}>{cu.role||"Team Member"}</div>
                </div>
                {[
                  {icon:"👤",label:"My Profile",action:()=>{setTab("me");setShowAvatarMenu(false);}},
                  {icon:"✏️",label:"Edit Profile",action:()=>{setEditName(cu.name||"");setEditRole(cu.role||"");setShowEditProfile(true);setShowAvatarMenu(false);}},
                ].map(item=><button key={item.label} onClick={item.action} style={{display:"flex",alignItems:"center",gap:9,width:"100%",background:"transparent",border:"none",color:"#ccc",fontSize:13,padding:"8px 12px",borderRadius:9,cursor:"pointer",textAlign:"left"}}>
                  <span>{item.icon}</span>{item.label}
                </button>)}
                <div style={{borderTop:"1px solid #ffffff0f",marginTop:4,paddingTop:4}}>
                  <button onClick={async()=>{setShowAvatarMenu(false);await supabase.auth.signOut();}} style={{display:"flex",alignItems:"center",gap:9,width:"100%",background:"transparent",border:"none",color:"#F9A8D4",fontSize:13,padding:"8px 12px",borderRadius:9,cursor:"pointer",textAlign:"left"}}>
                    <span>🚪</span>Sign out
                  </button>
                </div>
              </div></>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:2,background:th.nb,borderRadius:12,padding:3,overflowX:"auto",marginBottom:2}}>
          {NAV.map(([id,lbl,icon])=><button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,flex:1,minWidth:38,padding:"5px 2px",borderRadius:8,border:"none",background:tab===id?th.na:"transparent",color:tab===id?th.tx:th.sub,fontSize:8,fontWeight:tab===id?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:11}}>{icon}</span>{lbl}</button>)}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 13px 90px"}}>
        {tab==="home"&&<HomeTab cu={cu} checked={checked} onCheckin={handleCheckin} lastCheckin={lastCheckin} feed={feed} challenges={challenges} onLog={ch=>setShowLog(ch||true)} users={allUsers} setTab={setTab} activePulse={activePulse} myPulseVoted={myPulseVoted} setMyPulseVoted={setMyPulseVoted} activeSurvey={activeSurvey} mySurveyDone={mySurveyDone} setMySurveyDone={setMySurveyDone} iLoggedToday={iLoggedToday} nudgeCount={nudgeCount}/>}
        {tab==="crew"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:17}}>Team Feed</div>
            <Btn color="#6EE7B7" text="+ Log" onClick={()=>setShowLog(true)}/>
          </div>
          <FeedTab feed={feed} setFeed={setFeed} challenges={challenges} users={allUsers} cu={cu} notify={notify} tips={tips}/>
        </div>}
        {tab==="train"&&<TrainTab challenges={challenges} feed={feed} cu={cu} onLog={ch=>setShowLog(ch)} lb={lb} users={allUsers} badges={badges} teams={teams}/>}
        {tab==="sleep"&&<SleepTab cu={cu} lastCheckin={lastCheckin}/>}
        {tab==="physio"&&<PhysioTab cu={cu}/>}
        {tab==="admin"&&cu?.is_admin&&<AdminTab cu={cu} users={allUsers} setUsers={setUsers} challenges={challenges} setChallenges={setChallenges} notify={notify} addNotif={addNotif} session={session} onTipCreated={handleTipCreated} feed={feed} teams={teams}/>}
        {tab==="me"&&<MeTab cu={cu} lb={lb} pd={pd} setPd={setPd} notify={notify} checked={checked} onCheckin={handleCheckin} lastCheckin={lastCheckin} badges={badges} awardBadge={awardBadge} allUsers={allUsers}/>}
      </div>
    </div>
  </>;
}
