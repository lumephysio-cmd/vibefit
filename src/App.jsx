import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from './supabase';
import PhysioTab from './PhysioTab';
import LbTab from './LbTab';
import { BADGE_DEFS } from './badges';

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
const IP={weight:[{date:"Mar 17",val:74.2},{date:"Mar 18",val:73.8},{date:"Mar 23",val:72.5}],mood:[{date:"Mar 17",val:3},{date:"Mar 20",val:5},{date:"Mar 23",val:5}],notes:["Feeling great after the run!"]};

// ── HELPERS ──
const ago=ts=>{const d=Date.now()-ts;if(d<60000)return"just now";if(d<3600000)return`${Math.floor(d/60000)}m`;return`${Math.floor(d/3600000)}h`;};
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
        <div style={{fontSize:10,color:"#555",marginTop:1}}>by Dr. Brooke 👩‍⚕️</div>
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
        <div style={{fontSize:11,color:"#888"}}>Daily readiness · by Dr. Brooke 👩‍⚕️</div>
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
        <div><div style={{fontWeight:800,fontSize:15,color:cfg.col}}>{cfg.label}</div><div style={{fontSize:11,color:"#888",marginTop:1}}>Worksite ergonomics · by Dr. Brooke 👩‍⚕️</div></div>
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

// ── FEED TAB ──
const FeedTab=({feed,setFeed,challenges,users,cu,notify,tips=[]})=>{
  const [ct,setCt]=useState({});
  const react=(pid,emoji)=>setFeed(f=>f.map(p=>{if(p.id!==pid)return p;const cur=p.rx[emoji]||[],has=cur.includes(cu.id);return{...p,rx:{...p.rx,[emoji]:has?cur.filter(x=>x!==cu.id):[...cur,cu.id]}};}));
  const comment=pid=>{const t=ct[pid];if(!t?.trim())return;setFeed(f=>f.map(p=>p.id!==pid?p:{...p,comments:[...p.comments,{uid:cu.id,text:t}]}));setCt(c=>({...c,[pid]:""}));};

  // Merge tips + activity posts, sorted newest first
  const items=[
    ...tips.map(t=>({...t,_kind:"tip",_ts:new Date(t.created_at).getTime()||0})),
    ...feed.map(p=>({...p,_kind:"post",_ts:p.ts}))
  ].sort((a,b)=>b._ts-a._ts);

  return<div>
    {items.map(item=>{
      if(item._kind==="tip") return<TipCard key={`tip-${item.id}`} tip={item}/>;
      const post=item;
      const u=users.find(x=>x.id===post.uid)||{name:"Unknown",color:"#888"};
      const ch=challenges.find(x=>String(x.id)===String(post.cid));
      if(!ch)return null;
      const isHabit=ch.type==="habit";
      return<div key={post.id} className="card" style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Av u={u} s={32}/>
            <div><div style={{fontWeight:700,fontSize:13}}>{u.name}</div><div style={{fontSize:10,color:"#888"}}>{ago(post.ts)}</div></div>
          </div>
          <Pill color={ch.color} text={`${ch.icon} ${ch.title}`}/>
        </div>
        {isHabit
          ?<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:28}}>✅</span>
              <span style={{fontWeight:700,fontSize:14,color:ch.color}}>Completed!</span>
            </div>
          :<>
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:5}}>
              <span style={{fontWeight:800,fontSize:26,color:ch.color}}>{post.val.toLocaleString()}</span>
              <span style={{fontSize:12,color:"#888"}}>{ch.unit}</span>
              <span style={{fontSize:11,color:"#555",marginLeft:"auto"}}>/ {ch.goal.toLocaleString()}</span>
            </div>
            <div style={{background:"#ffffff08",borderRadius:6,height:4,marginBottom:8}}>
              <div style={{width:`${Math.min(100,(post.val/ch.goal)*100)}%`,height:"100%",background:ch.color,borderRadius:6}}/>
            </div>
          </>
        }
        {post.note&&<div style={{fontSize:12,color:"#888",marginBottom:8,fontStyle:"italic"}}>"{post.note}"</div>}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
          {RX.map(e=>{const us=post.rx[e]||[],a=us.includes(cu.id);return<button key={e} onClick={()=>react(post.id,e)} style={{background:a?"#ffffff15":"transparent",border:`1px solid ${a?"#ffffff30":"#ffffff0f"}`,borderRadius:20,padding:"3px 8px",fontSize:12,color:a?"#e8e8f0":"#888",display:"flex",gap:3,alignItems:"center"}}>{e}{us.length>0&&<span style={{fontSize:10}}>{us.length}</span>}</button>;})}
        </div>
        {post.comments.map((c,i)=>{const u2=users.find(x=>x.id===c.uid)||{name:"?",color:"#888"};return<div key={i} style={{display:"flex",gap:6,marginBottom:5}}><Av u={u2} s={22}/><div style={{background:"#ffffff08",borderRadius:9,padding:"5px 9px",flex:1,fontSize:12,color:"#aaa"}}><span style={{color:u2.color,fontWeight:600}}>{u2.name?.split(" ")[0]} </span>{c.text}</div></div>;})}
        <div style={{display:"flex",gap:6,marginTop:7}}>
          <Av u={cu} s={22}/>
          <input placeholder="Comment…" value={ct[post.id]||""} onChange={e=>setCt(c=>({...c,[post.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&comment(post.id)} style={{flex:1,fontSize:12}}/>
        </div>
      </div>;
    })}
    {items.length===0&&<div style={{textAlign:"center",color:"#888",padding:"40px 0",fontSize:13}}>No posts yet!</div>}
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
const MsgTab=({cu,users,messages,setMessages})=>{const [dm,setDm]=useState(null);const [txt,setTxt]=useState("");const ref=useRef(null);const key=(a,b)=>[Math.min(a,b),Math.max(a,b)].join("-");useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[dm,messages]);const send=()=>{if(!txt.trim()||!dm)return;const k=key(cu.id,dm.id);setMessages(m=>({...m,[k]:[...(m[k]||[]),{from:cu.id,text:txt,ts:Date.now()}]}));setTxt("");};
if(dm)return<div style={{display:"flex",flexDirection:"column",height:"70vh"}}><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><button onClick={()=>setDm(null)} style={{background:"transparent",border:"none",color:"#6EE7B7",fontSize:20,padding:0}}>←</button><Av u={dm} s={32}/><div style={{fontWeight:700,fontSize:13}}>{dm.name}</div></div><div ref={ref} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:7,paddingBottom:10}}>{(messages[key(cu.id,dm.id)]||[]).map((msg,i)=>{const mine=msg.from===cu.id;return<div key={i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}><div style={{background:mine?`${cu.color||"#6EE7B7"}33`:"#ffffff0f",border:`1px solid ${mine?(cu.color||"#6EE7B7")+"33":"#ffffff15"}`,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"8px 12px",maxWidth:"75%",fontSize:13}}>{msg.text}</div></div>;})}
</div><div style={{display:"flex",gap:7}}><input placeholder="Message…" value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,fontSize:13}}/><button onClick={send} style={{background:`${cu.color||"#6EE7B7"}22`,border:`1px solid ${cu.color||"#6EE7B7"}55`,color:cu.color||"#6EE7B7",padding:"0 14px",borderRadius:9,fontWeight:700}}>→</button></div></div>;
return<div><div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Direct Messages</div>{users.filter(u=>u.id!==cu.id).map(u=>{const k=key(cu.id,u.id),conv=messages[k]||[],last=conv[conv.length-1];return<div key={u.id} onClick={()=>setDm(u)} className="card" style={{marginBottom:9,cursor:"pointer",display:"flex",gap:9,alignItems:"center"}}><div style={{position:"relative"}}><Av u={u} s={40}/><div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:"#6EE7B7",border:"2px solid #080810"}}/></div><div style={{flex:1,overflow:"hidden"}}><div style={{fontWeight:700,fontSize:13}}>{u.name}</div><div style={{fontSize:12,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?last.text:"Start a conversation…"}</div></div></div>;})}
</div>;};

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

// ── PROFILE TAB ──
const ProfileTab=({cu,lb,pd,setPd,notify,checked,onCheckin,lastCheckin,badges,awardBadge})=>{const [nw,setNw]=useState("");const [nm,setNm]=useState(3);const [nn,setNn]=useState("");const myLB=lb.find(e=>e.uid===cu.id);const myR=lb.findIndex(e=>e.uid===cu.id)+1;
const save=()=>{const today=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});if(nw){const v=parseFloat(nw);if(!isNaN(v))setPd(p=>({...p,weight:[...p.weight.slice(-6),{date:today,val:v}]}))}setPd(p=>({...p,mood:[...p.mood.slice(-6),{date:today,val:nm}]}));if(nn.trim())setPd(p=>({...p,notes:[...p.notes,nn]}));setNw("");setNn("");setNm(3);notify("🔒 Saved!");};
return<div>
  {/* 🔒 Private daily check-in — only you see this */}
  {!checked&&<CheckIn onDone={onCheckin}/>}
  {checked&&lastCheckin&&<ReadinessCard checkin={lastCheckin}/>}
  <ErgonomicsCheck cu={cu} notify={notify} awardBadge={awardBadge}/>
  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}><Av u={cu} s={50}/><div><div style={{fontWeight:800,fontSize:18}}>{cu.name}</div><div style={{fontSize:12,color:"#888"}}>{cu.role}{cu.is_admin?" · 👑 Admin":""}</div><div style={{fontSize:10,color:"#6EE7B7",marginTop:2}}>🔒 Private</div></div></div>
<div style={{display:"flex",gap:7,marginBottom:10}}>{[["#"+(myR||"–"),"Rank","#6EE7B7"],[(cu.checkin_streak||0)+"🔥","Streak","#FCD34D"],[(myLB?.pts||0).toLocaleString(),"Points","#93C5FD"]].map(([v,l,c])=><div key={l} className="card" style={{flex:1,textAlign:"center",padding:12}}><div style={{fontWeight:800,fontSize:16,color:c}}>{v}</div><div style={{fontSize:10,color:"#888"}}>{l}</div></div>)}</div>
<ReadinessHistoryCard cu={cu}/>
<BadgesGrid badges={badges||[]} cu={cu}/><div className="card" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13}}>⚖️ Weight</div><div style={{fontSize:12,color:"#6EE7B7",fontWeight:700}}>{pd.weight[pd.weight.length-1]?.val} kg</div></div><Spk sid="wt" data={pd.weight} color="#6EE7B7"/></div>
<div className="card" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13}}>😊 Mood</div><div style={{fontSize:12,color:"#F9A8D4",fontWeight:700}}>{pd.mood[pd.mood.length-1]?.val}/5</div></div><Spk sid="md" data={pd.mood} color="#F9A8D4"/></div>
<div className="card" style={{marginBottom:9}}><div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📓 Journal</div>{pd.notes.map((n,i)=><div key={i} style={{fontSize:12,color:"#888",borderLeft:"2px solid #ffffff10",paddingLeft:7,marginBottom:5}}>{n}</div>)}</div>
<div className="card"><div style={{fontWeight:700,marginBottom:12}}>Log Today</div><Inp label="Weight (kg)" placeholder="72.5" type="number" min="0" value={nw} onChange={e=>setNw(e.target.value)}/><div style={{fontSize:11,color:"#888",marginBottom:6}}>Mood: <span style={{color:"#F9A8D4",fontWeight:700}}>{["😔","😕","😐","🙂","😄"][nm-1]}</span></div><div style={{display:"flex",gap:4,marginBottom:9}}>{[1,2,3,4,5].map(v=><button key={v} onClick={()=>setNm(v)} style={{flex:1,padding:"6px 0",borderRadius:9,border:`1px solid ${nm===v?"#F9A8D455":"#ffffff15"}`,background:nm===v?"#F9A8D420":"transparent",fontSize:15}}>{["😔","😕","😐","🙂","😄"][v-1]}</button>)}</div><textarea placeholder="Journal note…" rows={2} value={nn} onChange={e=>setNn(e.target.value)} style={{resize:"none",marginBottom:9}}/><button onClick={save} style={{width:"100%",background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",border:"1px solid #6EE7B755",color:"#6EE7B7",padding:"11px",borderRadius:11,fontWeight:700}}>🔒 Save Privately</button></div>
</div>;};

// ── ADMIN TAB ──
const AdminTab=({cu,users,setUsers,challenges,setChallenges,notify,addNotif,session,onTipCreated,feed,teams:teamsProp})=>{
  const [sec,setSec]=useState("overview");
  const [chF,setChF]=useState({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7",type:"count",physioNote:""});
  const [tipF,setTipF]=useState({title:"",content:"",body_part:"general",emoji:"💡",color:"#6EE7B7"});
  const [inviteLink,setInviteLink]=useState("");
  const [teams,setTeams]=useState([]);
  const [newTeam,setNewTeam]=useState({name:"",emoji:"👥",color:"#6EE7B7"});
  const [generating,setGenerating]=useState(false);
  const [savingTip,setSavingTip]=useState(false);
  // Analytics
  const [analytics,setAnalytics]=useState(null);
  const [analyticsLoading,setAnalyticsLoading]=useState(false);
  // Super admin
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
    if(sec!=='analytics'||!cu.company_id)return;
    setAnalyticsLoading(true);
    supabase.rpc('get_company_analytics',{company_uuid:cu.company_id})
      .then(({data})=>{ if(data) setAnalytics(data); setAnalyticsLoading(false); });
  },[sec,cu.company_id]);

  useEffect(()=>{
    if(sec!=='superadmin'||!cu.is_super_admin)return;
    supabase.from('companies').select('*, profiles(count)').then(({data})=>{ if(data) setCompanies(data); });
  },[sec,cu.is_super_admin]);

  const createTeam=async()=>{
    if(!newTeam.name.trim())return;
    const {data,error}=await supabase.from('teams').insert({name:newTeam.name,emoji:newTeam.emoji,color:newTeam.color,company_id:cu.company_id}).select().single();
    if(!error&&data){setTeams(t=>[...t,data]);setNewTeam({name:"",emoji:"👥",color:"#6EE7B7"});notify(`✅ Team "${data.name}" created!`);}
  };

  const generateInviteLink=async(teamId)=>{
    setGenerating(true);
    const code=Math.random().toString(36).slice(2,10);
    const {error}=await supabase.from('invite_links').insert({team_id:teamId,code,created_by:session.user.id,active:true,company_id:cu.company_id,invite_type:'member'});
    if(!error){const link=`${window.location.origin}/join/${code}`;setInviteLink(link);notify("✅ Invite link created!");}
    setGenerating(false);
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
    if(!error){
      const link=`${window.location.origin}/join/${code}`;
      setAdminInviteLink(m=>({...m,[companyId]:link}));
      notify("✅ Admin invite created!");
    }
  };

  const createCh=async()=>{
    if(!chF.title||!chF.goal)return;
    const start=new Date().toISOString().split("T")[0];
    const end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
    const{data,error}=await supabase.from('challenges').insert({
      title:chF.title,icon:chF.icon,unit:chF.unit,
      goal:parseFloat(chF.goal),color:chF.color,type:chF.type,
      physio_note:chF.physioNote,active:true,
      start_date:start,end_date:end,company_id:cu.company_id
    }).select().single();
    if(!error&&data){
      setChallenges(c=>[...c,{...data,desc:data.description,physioNote:data.physio_note,endDate:data.end_date}]);
      setChF({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7",type:"count",physioNote:""});
      notify("✅ Challenge created!");
      addNotif("challenge",`New challenge: ${data.title}`);
    } else {
      notify("❌ Couldn't save challenge — try again.");
    }
  };

  const createTip=async()=>{
    if(!tipF.title||!tipF.content)return;
    setSavingTip(true);
    const {data,error}=await supabase.from('physio_tips').insert({
      title:tipF.title,content:tipF.content,body_part:tipF.body_part,
      emoji:tipF.emoji,color:BP_COLORS[tipF.body_part]||"#6EE7B7",
      author_id:session.user.id,company_id:cu.company_id
    }).select().single();
    if(!error&&data){
      onTipCreated(data);
      setTipF({title:"",content:"",body_part:"general",emoji:"💡",color:"#6EE7B7"});
      notify("✅ Physio tip posted to feed!");
    } else {
      notify("❌ Couldn't save tip, try again.");
    }
    setSavingTip(false);
  };

  const SECS=[
    ["overview","Overview","🏠"],["analytics","Analytics","📊"],
    ["digest","Digest","📧"],
    ["tips","Physio Tips","💡"],["teams","Teams","👥"],["challenges","Challenges","🏆"],
    ...(cu.is_super_admin?[["superadmin","Super Admin","🌐"]]:[])]

  return<div>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><span style={{fontWeight:700,fontSize:17}}>Admin Panel</span><Pill color="#C4B5FD" text="ADMIN"/>{cu.is_super_admin&&<Pill color="#FCD34D" text="SUPER ADMIN"/>}</div>
    <div style={{display:"flex",gap:4,marginBottom:14,overflowX:"auto"}}>{SECS.map(([id,lbl,icon])=><button key={id} onClick={()=>setSec(id)} style={{flexShrink:0,padding:"7px 12px",borderRadius:10,border:`1px solid ${sec===id?"#C4B5FD55":"#ffffff15"}`,background:sec===id?"#C4B5FD18":"transparent",color:sec===id?"#C4B5FD":"#888",fontWeight:700,fontSize:12,display:"flex",gap:4,alignItems:"center"}}><span>{icon}</span>{lbl}</button>)}</div>

    {sec==="overview"&&(()=>{
      // Company Wellness Score (0–100)
      const today7=new Date(Date.now()-7*864e5);
      const recentLogs=(feed||[]).filter(p=>new Date(p.ts)>=today7);
      const recentLoggers=new Set(recentLogs.map(p=>p.uid));
      const totalMembers=users.length+1;
      const partRate=totalMembers>0?recentLoggers.size/totalMembers:0;
      const allProfiles=[...users];
      const avgStreak=allProfiles.length>0?allProfiles.reduce((a,u)=>a+(u.checkin_streak||0),0)/allProfiles.length:0;
      const wellnessScore=Math.min(100,Math.round(partRate*100*0.5+Math.min(1,avgStreak/14)*100*0.3+Math.min(1,(recentLogs.length/(totalMembers*3)))*100*0.2));
      const wsColor=wellnessScore>=75?"#6EE7B7":wellnessScore>=50?"#FCD34D":wellnessScore>=25?"#FB923C":"#F87171";
      const wsLabel=wellnessScore>=75?"Thriving 💚":wellnessScore>=50?"Good 💛":wellnessScore>=25?"Developing 🟠":"Just Starting 🔴";
      return<div>
        {/* Wellness Score hero */}
        <div style={{background:"linear-gradient(135deg,#6EE7B710,#93C5FD08)",border:"1px solid #6EE7B722",borderRadius:18,padding:"18px 16px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
              <svg width={72} height={72} style={{transform:"rotate(-90deg)"}}>
                <circle cx={36} cy={36} r={30} fill="none" stroke="#ffffff0f" strokeWidth={6}/>
                <circle cx={36} cy={36} r={30} fill="none" stroke={wsColor} strokeWidth={6} strokeDasharray={`${(wellnessScore/100)*188} 188`} strokeLinecap="round" style={{transition:"stroke-dasharray .8s"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:wsColor}}>{wellnessScore}</div>
            </div>
            <div>
              <div style={{fontSize:11,color:"#888",marginBottom:3}}>Company Wellness Score</div>
              <div style={{fontWeight:800,fontSize:20,color:wsColor,marginBottom:2}}>{wsLabel}</div>
              <div style={{fontSize:11,color:"#888"}}>Based on participation, streaks & activity</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:14}}>
            {[["Participation",Math.round(partRate*100)+"%","#6EE7B7"],["Avg Streak",avgStreak.toFixed(1)+"d","#FCD34D"],["Logs / week",recentLogs.length,"#93C5FD"]].map(([l,v,c])=>(
              <div key={l} style={{background:"#ffffff08",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontWeight:800,fontSize:16,color:c}}>{v}</div>
                <div style={{fontSize:9,color:"#666"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
          {[[totalMembers,"Members","#6EE7B7"],[teams.length,"Teams","#93C5FD"],[challenges.filter(c=>c.active).length,"Active","#F9A8D4"]].map(([v,l,c])=><div key={l} className="card" style={{flex:"1 1 80px",padding:12}}><div style={{fontWeight:800,fontSize:22,color:c}}>{v}</div><div style={{fontSize:10,color:"#888"}}>{l}</div></div>)}
        </div>
        <div className="card"><div style={{fontWeight:700,marginBottom:9}}>Quick Actions</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><Btn color="#93C5FD" text="📊 Analytics" onClick={()=>setSec("analytics")}/><Btn color="#6EE7B7" text="💡 Post Tip" onClick={()=>setSec("tips")}/><Btn color="#F9A8D4" text="🏆 Challenge" onClick={()=>setSec("challenges")}/><Btn color="#FCD34D" text="📧 Digest" onClick={()=>setSec("digest")}/></div></div>
      </div>;
    })()}

    {sec==="analytics"&&<div>
      <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Company Analytics</div>
      <div style={{fontSize:12,color:"#888",marginBottom:14}}>Last 7 days · {cu.company_id}</div>
      {analyticsLoading&&<div style={{textAlign:"center",padding:"30px 0",color:"#888",fontSize:13}}>Loading analytics…</div>}
      {!analyticsLoading&&analytics&&<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[
            [analytics.active_users_week,"Active Users","this week","#6EE7B7","👥"],
            [analytics.total_logs_week,"Activity Logs","this week","#93C5FD","📊"],
            [analytics.checkin_count_week,"Check-Ins","this week","#F9A8D4","🌅"],
            [analytics.avg_readiness_week!=null?analytics.avg_readiness_week+"":"–","Avg Readiness","this week","#FCD34D","⚡"],
          ].map(([v,l,sub,c,ic])=><div key={l} className="card" style={{padding:14}}>
            <div style={{fontSize:20,marginBottom:6}}>{ic}</div>
            <div style={{fontWeight:800,fontSize:22,color:c,marginBottom:2}}>{v}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#bbb"}}>{l}</div>
            <div style={{fontSize:10,color:"#555"}}>{sub}</div>
          </div>)}
        </div>
        {analytics.total_members>0&&<div className="card" style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:13}}>Participation Rate</div>
            <div style={{fontSize:12,color:"#6EE7B7",fontWeight:700}}>{Math.round((analytics.active_users_week/analytics.total_members)*100)}%</div>
          </div>
          <div style={{background:"#ffffff08",borderRadius:6,height:8}}>
            <div style={{width:`${Math.min(100,(analytics.active_users_week/analytics.total_members)*100)}%`,height:"100%",background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",borderRadius:6,transition:"width .6s"}}/>
          </div>
          <div style={{fontSize:11,color:"#888",marginTop:6}}>{analytics.active_users_week} of {analytics.total_members} members logged activity this week</div>
        </div>}
        {Array.isArray(analytics.daily_logs)&&analytics.daily_logs.length>0&&<div className="card">
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Daily Activity (7 days)</div>
          <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
            {(()=>{const days=[];const today=new Date();for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
            const maxVal=Math.max(1,...analytics.daily_logs.map(d=>d.count||0));
            return days.map((day,idx)=>{const entry=analytics.daily_logs.find(d=>d.log_date===day);const count=entry?.count||0;const h=Math.max(4,(count/maxVal)*52);const dow=new Date(day).toLocaleDateString('en',{weekday:'short'}).slice(0,1);
            return<div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{fontSize:9,color:count>0?"#6EE7B7":"#555",fontWeight:700}}>{count>0?count:""}</div>
              <div style={{width:"100%",height:h,background:count>0?"linear-gradient(180deg,#6EE7B7,#93C5FD40)":"#ffffff08",borderRadius:"3px 3px 0 0",transition:"height .4s"}}/>
              <div style={{fontSize:9,color:"#555"}}>{dow}</div>
            </div>;})})()}
          </div>
        </div>}
        {!analyticsLoading&&analytics&&challenges.filter(c=>c.active).length>0&&<div className="card" style={{marginTop:8}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Challenge Engagement</div>
          {challenges.filter(c=>c.active).map(ch=>{
            const logsForCh=(analytics.daily_logs||[]).length; // rough proxy
            const uniqueUsers=Math.min(analytics.active_users_week,analytics.total_members);
            const pct=analytics.total_members>0?Math.round((uniqueUsers/analytics.total_members)*100):0;
            return<div key={ch.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontSize:12,fontWeight:700}}>{ch.icon} {ch.title}</div>
                <div style={{fontSize:11,color:ch.color,fontWeight:700}}>{pct}%</div>
              </div>
              <div style={{background:"#ffffff08",borderRadius:4,height:5}}>
                <div style={{width:`${pct}%`,height:"100%",background:ch.color,borderRadius:4,transition:"width .6s"}}/>
              </div>
            </div>;
          })}
        </div>}
      </>}
      {!analyticsLoading&&!analytics&&<div style={{textAlign:"center",padding:"30px 0",color:"#888",fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>📊</div>No activity data yet — get your team logging!</div>}
    </div>}

    {sec==="digest"&&(()=>{
      // Build weekly digest preview from available data
      const today7=new Date(Date.now()-7*864e5);
      const weekLogs=(feed||[]).filter(p=>new Date(p.ts)>=today7);
      const weekLoggers=new Set(weekLogs.map(p=>p.uid));
      const allProfiles=users;
      const totalMembers=users.length+1;
      // Top scorer this week
      const scorePts={};
      weekLogs.forEach(p=>{scorePts[p.uid]=(scorePts[p.uid]||0)+(p.val||0);});
      const topEntry=Object.entries(scorePts).sort((a,b)=>b[1]-a[1])[0];
      const topUser=topEntry?allProfiles.find(u=>u.id===topEntry[0]):null;
      const topPts=topEntry?topEntry[1]:0;
      // Avg readiness from last 7 checkins
      const weekDateStr=today7.toISOString().slice(0,10);
      const TIPS=["Take a 5-minute walk every hour — your lower back will thank you.","Roll your shoulders back 10 times to reset your posture right now.","Drink a full glass of water before your next meeting.","Try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.","A 2-minute standing stretch at midday reduces afternoon fatigue by 30%."];
      const tipOfWeek=TIPS[new Date().getDay()%TIPS.length];
      return<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontWeight:700,fontSize:16}}>Weekly Digest Preview</div>
          <span style={{fontSize:10,background:"#6EE7B722",border:"1px solid #6EE7B733",borderRadius:8,padding:"2px 8px",color:"#6EE7B7",fontWeight:700}}>PREVIEW</span>
        </div>
        <div style={{fontSize:12,color:"#888",marginBottom:16}}>This is what your team would receive every Monday morning.</div>

        {/* Email preview card */}
        <div style={{background:"#13131f",border:"1px solid #ffffff15",borderRadius:18,overflow:"hidden"}}>
          {/* Email header */}
          <div style={{background:"linear-gradient(135deg,#6EE7B722,#93C5FD15)",borderBottom:"1px solid #ffffff10",padding:"20px 20px 16px",textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:22,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>VIBEFIT</div>
            <div style={{fontSize:12,color:"#888"}}>Weekly Wellness Digest · {new Date().toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'})}</div>
          </div>
          <div style={{padding:"20px"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#e8e8f0",marginBottom:14}}>Good morning, Team! 👋</div>
            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
              {[[weekLoggers.size+"","Active","👥","#6EE7B7"],[weekLogs.length+"","Logs","📊","#93C5FD"],[Math.round(weekLoggers.size/Math.max(1,totalMembers)*100)+"%","Participated","🎯","#F9A8D4"]].map(([v,l,ic,c])=>(
                <div key={l} style={{background:"#ffffff08",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
                  <div style={{fontWeight:800,fontSize:18,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:"#666"}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Top performer */}
            {topUser&&<div style={{background:"#FCD34D15",border:"1px solid #FCD34D33",borderRadius:14,padding:"14px",marginBottom:14}}>
              <div style={{fontSize:11,color:"#FCD34D",fontWeight:700,marginBottom:6}}>🥇 THIS WEEK'S TOP PERFORMER</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`${topUser.color||"#6EE7B7"}33`,border:`2px solid ${topUser.color||"#6EE7B7"}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:topUser.color||"#6EE7B7",fontSize:15}}>{(topUser.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{topUser.name}</div>
                  <div style={{fontSize:12,color:"#888"}}>{topPts.toLocaleString()} points this week</div>
                </div>
              </div>
            </div>}
            {!topUser&&<div style={{background:"#ffffff08",borderRadius:12,padding:"12px",marginBottom:14,textAlign:"center",color:"#888",fontSize:12}}>No activity logged this week yet.</div>}
            {/* Physio tip */}
            <div style={{background:"#6EE7B710",border:"1px solid #6EE7B722",borderRadius:14,padding:"14px",marginBottom:14}}>
              <div style={{fontSize:11,color:"#6EE7B7",fontWeight:700,marginBottom:6}}>👩‍⚕️ PHYSIO TIP OF THE WEEK</div>
              <div style={{fontSize:13,color:"#d4d4d4",lineHeight:1.6}}>{tipOfWeek}</div>
              <div style={{fontSize:10,color:"#888",marginTop:6}}>— Physiotherapist, Brooke Cassar</div>
            </div>
            {/* CTA */}
            <div style={{background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",borderRadius:12,padding:"12px 14px",textAlign:"center",border:"1px solid #6EE7B744"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e8e8f0",marginBottom:3}}>Keep the momentum going! 💪</div>
              <div style={{fontSize:11,color:"#888"}}>Log your activity in VibeFit to stay on the leaderboard.</div>
            </div>
          </div>
          {/* Footer */}
          <div style={{borderTop:"1px solid #ffffff08",padding:"12px 20px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"#555",lineHeight:1.6}}>VibeFit · Built for workplace wellness by Physiotherapist, Brooke Cassar</div>
          </div>
        </div>

        <div style={{marginTop:14,background:"#C4B5FD0d",border:"1px solid #C4B5FD22",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#C4B5FD",marginBottom:4}}>📬 Auto-send setup</div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.6}}>To send this digest automatically every Monday, connect an email service like Resend or SendGrid and deploy the <code style={{background:"#ffffff10",borderRadius:4,padding:"1px 4px",fontSize:11}}>weekly-digest</code> Supabase edge function.</div>
        </div>
      </div>;
    })()}

    {sec==="tips"&&<div>
      <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Post a Physio Tip</div>
      <div style={{fontSize:12,color:"#888",marginBottom:14}}>Share your expertise — tips appear in everyone's feed instantly.</div>
      <div className="card">
        <Inp label="Title" placeholder="e.g. Why your hips are tight from sitting" value={tipF.title} onChange={e=>setTipF(f=>({...f,title:e.target.value}))}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>Body Area</div>
          <select value={tipF.body_part} onChange={e=>setTipF(f=>({...f,body_part:e.target.value}))} style={{width:"100%"}}>
            {Object.entries(BP_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>Tip Content</div>
          <textarea value={tipF.content} onChange={e=>setTipF(f=>({...f,content:e.target.value}))} placeholder="Share your physio knowledge — keep it practical and evidence-based…" rows={5} style={{resize:"none",width:"100%"}}/>
        </div>
        <Inp label="Emoji" value={tipF.emoji} onChange={e=>setTipF(f=>({...f,emoji:e.target.value}))} style={{width:60}}/>
        {tipF.title&&tipF.content&&<div style={{background:`${BP_COLORS[tipF.body_part]||"#6EE7B7"}0d`,border:`1px solid ${BP_COLORS[tipF.body_part]||"#6EE7B7"}22`,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
          <div style={{fontSize:10,color:"#888",marginBottom:4}}>Preview</div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{tipF.title}</div>
          <div style={{fontSize:11,color:"#aaa"}}>{tipF.content.slice(0,80)}{tipF.content.length>80?"…":""}</div>
        </div>}
        <Btn color="#6EE7B7" text={savingTip?"Posting…":"💡 Post to Feed"} style={{width:"100%",padding:"11px"}} onClick={createTip} disabled={savingTip||!tipF.title||!tipF.content}/>
      </div>
    </div>}

    {sec==="teams"&&<div>
      <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>Teams</div>
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontWeight:700,marginBottom:10}}>Create New Team</div>
        <Inp label="Team Name" value={newTeam.name} onChange={e=>setNewTeam(t=>({...t,name:e.target.value}))} placeholder="e.g. Physio Team"/>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:5}}>Color</div><div style={{display:"flex",gap:5}}>{TC.map(c=><button key={c} onClick={()=>setNewTeam(t=>({...t,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${newTeam.color===c?"#fff":"transparent"}`}}/>)}</div></div>
        <Btn color="#93C5FD" text="Create Team" style={{width:"100%"}} onClick={createTeam}/>
      </div>
      {teams.map(t=><div key={t.id} className="card" style={{marginBottom:10,borderColor:`${t.color}22`}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{t.emoji}</div>
          <div style={{flex:1}}><div style={{fontWeight:700}}>{t.name}</div></div>
          <Btn color="#6EE7B7" text={generating?"…":"🔗 Invite Link"} style={{fontSize:12,padding:"6px 12px"}} onClick={()=>generateInviteLink(t.id)}/>
        </div>
        {inviteLink&&<div style={{marginTop:10,background:"#6EE7B710",border:"1px solid #6EE7B733",borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:11,color:"#6EE7B7",marginBottom:6,fontWeight:700}}>📋 Share this link:</div>
          <div style={{fontSize:11,color:"#aaa",wordBreak:"break-all",marginBottom:8}}>{inviteLink}</div>
          <button onClick={()=>{navigator.clipboard.writeText(inviteLink);notify("📋 Copied!");}} style={{background:"#6EE7B722",border:"1px solid #6EE7B744",color:"#6EE7B7",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700}}>Copy Link</button>
        </div>}
      </div>)}
      {teams.length===0&&<div style={{textAlign:"center",color:"#888",padding:"20px 0",fontSize:13}}>No teams yet. Create your first one above!</div>}
    </div>}

    {sec==="challenges"&&<div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontWeight:700,marginBottom:10}}>Create Challenge</div>

        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:6}}>Challenge Type</div>
          <div style={{display:"flex",gap:6}}>
            {[["count","📊 Count","Log a number (steps, ml, reps)"],["habit","✅ Habit","Daily checklist (stretch, drink water)"]].map(([v,lbl,sub])=>
              <button key={v} onClick={()=>setChF(f=>({...f,type:v}))} style={{flex:1,padding:"9px 8px",borderRadius:10,border:`1px solid ${chF.type===v?"#F9A8D455":"#ffffff15"}`,background:chF.type===v?"#F9A8D418":"transparent",textAlign:"left"}}>
                <div style={{fontWeight:700,fontSize:12,color:chF.type===v?"#F9A8D4":"#888"}}>{lbl}</div>
                <div style={{fontSize:10,color:"#555",marginTop:2}}>{sub}</div>
              </button>
            )}
          </div>
        </div>

        <div style={{display:"flex",gap:7}}>
          <Inp label="Title" value={chF.title} onChange={e=>setChF(f=>({...f,title:e.target.value}))} style={{flex:3}}/>
          <Inp label="Icon" value={chF.icon} onChange={e=>setChF(f=>({...f,icon:e.target.value}))} style={{flex:1}}/>
        </div>
        {chF.type==="count"&&<div style={{display:"flex",gap:7}}>
          <Inp label="Unit" value={chF.unit} onChange={e=>setChF(f=>({...f,unit:e.target.value}))} style={{flex:1}}/>
          <Inp label="Goal" value={chF.goal} onChange={e=>setChF(f=>({...f,goal:e.target.value}))} type="number" style={{flex:1}}/>
        </div>}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:5}}>Color</div>
          <div style={{display:"flex",gap:5}}>{TC.map(c=><button key={c} onClick={()=>setChF(f=>({...f,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${chF.color===c?"#fff":"transparent"}`}}/>)}</div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>Physio Note <span style={{color:"#555"}}>(optional — shows on challenge card)</span></div>
          <textarea value={chF.physioNote} onChange={e=>setChF(f=>({...f,physioNote:e.target.value}))} placeholder="Why does this challenge matter? Share the science…" rows={3} style={{resize:"none",width:"100%"}}/>
        </div>
        <Btn color="#F9A8D4" text="Launch 🚀" style={{width:"100%"}} onClick={createCh}/>
      </div>
      {challenges.map(ch=><div key={ch.id} className="card" style={{marginBottom:8,display:"flex",gap:9,alignItems:"center",opacity:ch.active?1:.6}}>
        <span style={{fontSize:20}}>{ch.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:ch.color,fontSize:13}}>{ch.title}</div>
          <div style={{fontSize:11,color:"#888"}}>{ch.type==="habit"?"Habit ✅":ch.goal?.toLocaleString()+" "+ch.unit}</div>
        </div>
        <button onClick={async()=>{await supabase.from('challenges').update({active:!ch.active}).eq('id',ch.id);setChallenges(c=>c.map(x=>x.id===ch.id?{...x,active:!x.active}:x));}} style={{background:`${ch.active?"#FCD34D":"#6EE7B7"}15`,border:`1px solid ${ch.active?"#FCD34D":"#6EE7B7"}33`,color:ch.active?"#FCD34D":"#6EE7B7",borderRadius:8,padding:"4px 8px",fontSize:11,fontWeight:700}}>{ch.active?"Pause":"Resume"}</button>
      </div>)}
    </div>}

    {sec==="superadmin"&&cu.is_super_admin&&<div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontWeight:700,fontSize:16}}>🌐 Super Admin</span>
        <Pill color="#FCD34D" text="BROOKE ONLY"/>
      </div>
      <div style={{fontSize:12,color:"#888",marginBottom:14}}>Manage all companies on VibeFit. Each company is fully isolated.</div>

      <div className="card" style={{marginBottom:14}}>
        <div style={{fontWeight:700,marginBottom:10}}>Create New Company</div>
        <div style={{display:"flex",gap:7,marginBottom:8}}>
          <input placeholder="Company name" value={newCo.name} onChange={e=>setNewCo(c=>({...c,name:e.target.value}))} style={{flex:1}}/>
          <input placeholder="🏢" value={newCo.emoji} onChange={e=>setNewCo(c=>({...c,emoji:e.target.value}))} style={{width:50}}/>
        </div>
        <div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:5}}>Brand Color</div><div style={{display:"flex",gap:5}}>{TC.map(c=><button key={c} onClick={()=>setNewCo(co=>({...co,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${newCo.color===c?"#fff":"transparent"}`}}/>)}</div></div>
        <Btn color="#FCD34D" text={creatingCo?"Creating…":"➕ Create Company"} style={{width:"100%"}} onClick={createCompany} disabled={creatingCo||!newCo.name.trim()}/>
      </div>

      <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>{companies.length} Companies</div>
      {companies.map(co=><div key={co.id} className="card" style={{marginBottom:10,borderColor:`${co.color}22`}}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:13,background:`${co.color}22`,border:`1px solid ${co.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{co.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14}}>{co.name}</div>
            <div style={{fontSize:11,color:"#888"}}>{co.plan||"starter"} plan · {co.subscription_status||"active"}</div>
          </div>
          {co.id===cu.company_id&&<Pill color="#6EE7B7" text="YOUR CO"/>}
        </div>
        <Btn color="#C4B5FD" text="👑 Generate Admin Invite" style={{width:"100%",fontSize:12}} onClick={()=>generateAdminInvite(co.id)}/>
        {adminInviteLink[co.id]&&<div style={{marginTop:8,background:"#C4B5FD10",border:"1px solid #C4B5FD25",borderRadius:9,padding:"9px 12px"}}>
          <div style={{fontSize:11,color:"#C4B5FD",fontWeight:700,marginBottom:5}}>📋 Admin invite link:</div>
          <div style={{fontSize:10,color:"#aaa",wordBreak:"break-all",marginBottom:7}}>{adminInviteLink[co.id]}</div>
          <button onClick={()=>{navigator.clipboard.writeText(adminInviteLink[co.id]);notify("📋 Copied!");}} style={{background:"#C4B5FD22",border:"1px solid #C4B5FD44",color:"#C4B5FD",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700}}>Copy Link</button>
        </div>}
      </div>)}
      {companies.length===0&&<div style={{textAlign:"center",color:"#888",padding:"20px 0",fontSize:13}}>No companies yet. Create the first one above!</div>}
    </div>}
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
  const [tab,setTab]=useState("feed");
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
    {id:1,type:"badge",text:"Welcome to VibeFit! 🎉",ts:N-3600000,read:false},
  ]);
  const [teams,setTeams]=useState([]);
  const [badges,setBadges]=useState([]);

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

  // Load challenges from Supabase (company-scoped)
  useEffect(()=>{
    if(!cu)return;
    const q=supabase.from('challenges').select('*').order('created_at',{ascending:true});
    (cu.is_super_admin||!cu.company_id?q:q.eq('company_id',cu.company_id))
      .then(({data})=>{
        if(data) setChallenges(data.map(c=>({...c,desc:c.description,physioNote:c.physio_note,endDate:c.end_date})));
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
      <div style={{fontWeight:800,fontSize:24,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>VIBEFIT</div>
    </div>
  );

  const unread=notifs.filter(n=>!n.read).length;
  const myR=lb.findIndex(e=>e.uid===cu?.id)+1;
  const allUsers=[cu,...users.filter(u=>u.id!==cu?.id)];
  const NAV=[["feed","Feed","📣"],["challenges","Train","🏆"],["leaderboard","Board","🥇"],["messages","DMs","💬"],["physio","Physio","🩺"],["ai","AI ✨","🤖"],...(cu?.is_admin?[["admin","Admin","⚙️"]]:[]),["profile","Me","👤"]];
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

    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"13px 13px 0",position:"sticky",top:0,zIndex:40,background:`linear-gradient(to bottom,${th.bg} 85%,transparent)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:21,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-.5}}>VIBE<span style={{WebkitTextFillColor:th.tx}}>FIT</span></div>
            <div style={{fontSize:9,color:th.sub,marginTop:1}}>Company Wellness Hub</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setDark(v=>!v)} style={{width:30,height:30,borderRadius:8,background:th.nb,border:`1px solid ${th.cb}`,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
            <div onClick={()=>setShowNotifs(v=>!v)} style={{position:"relative",cursor:"pointer",width:30,height:30,borderRadius:8,background:th.nb,border:`1px solid ${th.cb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🔔{unread>0&&<div style={{position:"absolute",top:-3,right:-3,width:13,height:13,borderRadius:"50%",background:"#F9A8D4",fontSize:7,fontWeight:800,color:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</div>}</div>
            {myR>0&&<div style={{fontSize:10,color:"#6EE7B7",background:"#6EE7B715",border:"1px solid #6EE7B730",borderRadius:18,padding:"2px 7px",fontWeight:700}}>#{myR}</div>}
            <div onClick={async()=>{await supabase.auth.signOut();}} style={{cursor:"pointer"}}><Av u={cu} s={30}/></div>
          </div>
        </div>
        <div style={{display:"flex",gap:2,background:th.nb,borderRadius:12,padding:3,overflowX:"auto",marginBottom:2}}>
          {NAV.map(([id,lbl,icon])=><button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,flex:1,minWidth:38,padding:"5px 2px",borderRadius:8,border:"none",background:tab===id?th.na:"transparent",color:tab===id?th.tx:th.sub,fontSize:8,fontWeight:tab===id?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:11}}>{icon}</span>{lbl}</button>)}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 13px 90px"}}>
        {tab==="feed"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:17}}>Activity Feed</div>
            <Btn color="#6EE7B7" text="+ Log" onClick={()=>setShowLog(true)}/>
          </div>
          {/* Nudge banner */}
          {!iLoggedToday&&nudgeCount>0&&(
            <div style={{background:"#6EE7B70d",border:"1px solid #6EE7B733",borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>👀</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:"#6EE7B7"}}>{nudgeCount} teammate{nudgeCount!==1?"s":""} already logged today</div>
                <div style={{fontSize:11,color:"#888",marginTop:1}}>Don't fall behind — log your progress!</div>
              </div>
              <button onClick={()=>setShowLog(true)} style={{background:"#6EE7B722",border:"1px solid #6EE7B744",color:"#6EE7B7",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:700,flexShrink:0}}>Log 📊</button>
            </div>
          )}
          <FeedTab feed={feed} setFeed={setFeed} challenges={challenges} users={allUsers} cu={cu} notify={notify} tips={tips}/>
        </>}
        {tab==="challenges"&&<ChalTab challenges={challenges} feed={feed} cu={cu} onLog={ch=>setShowLog(ch)}/>}
        {tab==="leaderboard"&&<LbTab lb={lb} feed={feed} users={allUsers} challenges={challenges} cu={cu} teams={teams} badges={badges}/>}
        {tab==="messages"&&<MsgTab cu={cu} users={allUsers} messages={msgs} setMessages={setMsgs}/>}
        {tab==="physio"&&<PhysioTab cu={cu}/>}
        {tab==="ai"&&<AiTab challenges={challenges} setChallenges={setChallenges} notify={notify} cu={cu}/>}
        {tab==="admin"&&cu?.is_admin&&<AdminTab cu={cu} users={allUsers} setUsers={setUsers} challenges={challenges} setChallenges={setChallenges} notify={notify} addNotif={addNotif} session={session} onTipCreated={handleTipCreated} feed={feed} teams={teams}/>}
        {tab==="profile"&&<ProfileTab cu={cu} lb={lb} pd={pd} setPd={setPd} notify={notify} checked={checked} onCheckin={handleCheckin} lastCheckin={lastCheckin} badges={badges} awardBadge={awardBadge}/>}
      </div>
    </div>
  </>;
}
