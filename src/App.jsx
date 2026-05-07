import { useState, useEffect, useRef, useCallback } from "react";

const TC=["#6EE7B7","#93C5FD","#F9A8D4","#FCD34D","#C4B5FD","#FB923C","#34D399","#F472B6"];
const RX=["🔥","💪","👏","❤️","🎉"];
const BD=[
  {id:"first_log",icon:"🌱",name:"First Step",desc:"Log your first activity",color:"#6EE7B7"},
  {id:"streak_3",icon:"🔥",name:"On Fire",desc:"3-day streak",color:"#FCD34D"},
  {id:"steps_50k",icon:"👟",name:"Road Runner",desc:"50k total steps",color:"#6EE7B7"},
  {id:"hydration",icon:"💧",name:"Hydration Hero",desc:"Water 5 days running",color:"#93C5FD"},
  {id:"gold",icon:"🥇",name:"Champion",desc:"Finish #1",color:"#FCD34D"},
  {id:"all_rounder",icon:"🌟",name:"All-Rounder",desc:"Log every challenge type",color:"#F9A8D4"},
];
const N=Date.now();
const IU=[
  {id:1,name:"Alex Rivera",avatar:"AR",role:"Marketing",team:"marketing",color:"#6EE7B7",isAdmin:false,email:"alex@co.com"},
  {id:2,name:"Jamie Park",avatar:"JP",role:"Engineering",team:"engineering",color:"#93C5FD",isAdmin:false,email:"jamie@co.com"},
  {id:3,name:"Sam Chen",avatar:"SC",role:"Design",team:"design",color:"#F9A8D4",isAdmin:false,email:"sam@co.com"},
  {id:4,name:"Taylor Brooks",avatar:"TB",role:"Sales",team:"sales",color:"#FCD34D",isAdmin:false,email:"taylor@co.com"},
  {id:5,name:"Morgan Lee",avatar:"ML",role:"HR",team:"hr",color:"#C4B5FD",isAdmin:true,email:"morgan@co.com"},
];
const IT=[
  {id:"marketing",name:"Marketing",color:"#6EE7B7",emoji:"📣"},
  {id:"engineering",name:"Engineering",color:"#93C5FD",emoji:"⚙️"},
  {id:"design",name:"Design",color:"#F9A8D4",emoji:"🎨"},
  {id:"sales",name:"Sales",color:"#FCD34D",emoji:"💼"},
  {id:"hr",name:"HR",color:"#C4B5FD",emoji:"🤝"},
];
const IC=[
  {id:1,title:"10K Steps",icon:"👟",unit:"steps",goal:10000,color:"#6EE7B7",desc:"10,000 steps every day",active:true,endDate:"2026-03-30"},
  {id:2,title:"2L Water",icon:"💧",unit:"ml",goal:2000,color:"#93C5FD",desc:"Stay hydrated daily",active:true,endDate:"2026-03-30"},
  {id:3,title:"Push-Ups",icon:"💪",unit:"reps",goal:100,color:"#F9A8D4",desc:"100 push-ups daily",active:true,endDate:"2026-04-05"},
  {id:4,title:"Mindfulness",icon:"🧘",unit:"mins",goal:20,color:"#FCD34D",desc:"20 mins mindfulness",active:true,endDate:"2026-03-30"},
];
const ILB=[{userId:4,progress:9200,streak:5},{userId:1,progress:8750,streak:4},{userId:3,progress:7400,streak:7},{userId:2,progress:6800,streak:3},{userId:5,progress:5100,streak:2}];
const IF=[
  {id:1,userId:2,challengeId:1,value:11200,note:"New record! 🏃",timestamp:N-7200000,comments:[{userId:1,text:"Beast mode!",ts:N-6900000}],reactions:{"🔥":[3,4],"💪":[1,5]}},
  {id:2,userId:3,challengeId:3,value:120,note:"Morning session ☀️",timestamp:N-18000000,comments:[],reactions:{"💪":[2],"👏":[4,1]}},
  {id:3,userId:5,challengeId:2,value:2400,note:"Crushed the water! 💧",timestamp:N-28800000,comments:[{userId:3,text:"Hydration queen! 👑",ts:N-28000000}],reactions:{"❤️":[1,2,3]}},
];
const IM={"1-2":[{from:1,text:"Great job today!",ts:N-200000}],"2-3":[{from:3,text:"Race you to 10k?",ts:N-100000},{from:2,text:"You're on! 😤",ts:N-90000}]};
const IP={weight:[{date:"Mar 17",val:74.2},{date:"Mar 18",val:73.8},{date:"Mar 19",val:73.5},{date:"Mar 21",val:73.1},{date:"Mar 23",val:72.5}],mood:[{date:"Mar 17",val:3},{date:"Mar 18",val:4},{date:"Mar 20",val:5},{date:"Mar 22",val:5},{date:"Mar 23",val:5}],notes:["Feeling great after the run!","Drank extra water today."]};
const IBG={1:["first_log","streak_3"],2:["first_log","steps_50k","gold"],3:["first_log","all_rounder"],4:["first_log","gold"],5:["first_log","hydration"]};

const ago=ts=>{const d=Date.now()-ts;if(d<60000)return"just now";if(d<3600000)return`${Math.floor(d/60000)}m ago`;if(d<86400000)return`${Math.floor(d/3600000)}h ago`;return`${Math.floor(d/86400000)}d ago`;};
const ini=n=>n.split(" ").map(p=>p[0]).join("").toUpperCase().slice(0,2);
let _c=0;const uid=()=>`v${++_c}`;

const DK={bg:"#080810",card:"linear-gradient(135deg,#ffffff09,#ffffff04)",cb:"#ffffff12",tx:"#e8e8f0",sub:"#666",inp:"#ffffff08",inpb:"#ffffff15",nb:"#ffffff07",na:"#ffffff15"};
const LT={bg:"#f0f4f8",card:"linear-gradient(135deg,#fff,#f8fafc)",cb:"#e2e8f0",tx:"#1a202c",sub:"#718096",inp:"#ffffff",inpb:"#cbd5e0",nb:"#e2e8f0",na:"#ffffff"};

const makeCSS=t=>`*{box-sizing:border-box;margin:0;padding:0}body{background:${t.bg};color:${t.tx};font-family:system-ui,sans-serif;overscroll-behavior:none}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:4px}input,textarea,select{background:${t.inp};border:1px solid ${t.inpb};color:${t.tx};border-radius:10px;padding:9px 13px;font-family:inherit;font-size:13px;outline:none;width:100%}input:focus,textarea:focus{border-color:#6EE7B755}select option{background:#13131f}button{cursor:pointer;font-family:inherit;transition:all 0.15s}button:active{transform:scale(0.97)}@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes ti{0%{opacity:0;transform:translateX(-50%) translateY(-10px)}10%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.fu{animation:fu 0.3s ease both}.card{background:${t.card};border:1px solid ${t.cb};border-radius:16px;padding:16px}`;

const Av=({u,s=34})=><div style={{width:s,height:s,borderRadius:"50%",background:`linear-gradient(135deg,${u.color}33,${u.color}66)`,border:`2px solid ${u.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s*0.34,fontWeight:700,color:u.color,flexShrink:0}}>{u.avatar||ini(u.name)}</div>;
const Ring=({pct,color,size=64,stroke=5})=>{const r=(size-stroke*2)/2,c=2*Math.PI*r,d=c*Math.min(pct,1);return<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ffffff0f" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${d} ${c}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.5s"}}/></svg>;};
const Pill=({color,ch})=><span style={{fontSize:10,background:`${color}22`,color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 8px",fontWeight:700,whiteSpace:"nowrap"}}>{ch}</span>;
const Btn=({color="#6EE7B7",ch,style,...p})=><button {...p} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${color}33`,background:`${color}22`,color,fontWeight:700,fontSize:13,...style}}>{ch}</button>;
const Inp=({lbl,...p})=><div style={{marginBottom:10}}>{lbl&&<div style={{fontSize:11,color:"#888",marginBottom:4}}>{lbl}</div>}<input {...p} style={{width:"100%",...p.style}}/></div>;
const Sel=({lbl,children,...p})=><div style={{marginBottom:10}}>{lbl&&<div style={{fontSize:11,color:"#888",marginBottom:4}}>{lbl}</div>}<select {...p} style={{borderRadius:10,padding:"9px 13px",fontSize:13,outline:"none",width:"100%",...p.style}}>{children}</select></div>;
const Modal=({onClose,ch})=><div style={{position:"fixed",inset:0,background:"#000c",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",padding:16}} onMouseDown={onClose}><div className="card fu" style={{width:340,maxWidth:"95vw",maxHeight:"88vh",overflowY:"auto"}} onMouseDown={e=>e.stopPropagation()}>{ch}</div></div>;
const Spk=({data,color,sid})=>{const w=200,h=44,vs=data.map(d=>d.val),mn=Math.min(...vs),mx=Math.max(...vs),rng=mx-mn||1;const pts=vs.map((v,i)=>`${(i/Math.max(vs.length-1,1))*w},${h-((v-mn)/rng)*(h-6)-3}`).join(" ");return<svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><defs><linearGradient id={`g${sid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g${sid})`}/><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>{vs.map((v,i)=><circle key={i} cx={(i/Math.max(vs.length-1,1))*w} cy={h-((v-mn)/rng)*(h-6)-3} r="2.5" fill={color}/>)}</svg>;};

// ── CHECK-IN ──
const CheckIn=({onDone})=>{
  const [step,setStep]=useState(0);
  const [data,setData]=useState({});
  const steps=[
    {k:"mood",lbl:"How's your mood?",opts:[["😴","Low"],["😕","Meh"],["😐","OK"],["🙂","Good"],["😄","Great"]],color:"#F9A8D4"},
    {k:"energy",lbl:"Energy level?",opts:[["🪫","Drained"],["😮‍💨","Tired"],["😌","Steady"],["⚡","Energised"],["🚀","Buzzing"]],color:"#FCD34D"},
    {k:"water",lbl:"Water so far?",opts:[["🏜️","None"],["💧","A bit"],["🥛","Some"],["💦","Plenty"],["🌊","Loads"]],color:"#93C5FD"},
    {k:"sleep",lbl:"Sleep last night?",opts:[["😵","<4h"],["😪","5h"],["😴","6h"],["🛌","7h"],["⭐","8h+"]],color:"#6EE7B7"},
  ];
  const done=step>=steps.length;
  const score=Object.values(data).reduce((a,v)=>a+v,0);
  const sc=score<=8?"#F9A8D4":score<=12?"#FCD34D":"#6EE7B7";
  if(done)return<div style={{background:"linear-gradient(135deg,#6EE7B718,#93C5FD10)",border:"1px solid #6EE7B733",borderRadius:18,padding:18,marginBottom:14,textAlign:"center"}} className="fu"><div style={{fontSize:32,marginBottom:6}}>✅</div><div style={{fontWeight:800,fontSize:16,marginBottom:2}}>Check-in done!</div><div style={{fontWeight:800,fontSize:34,color:sc,marginBottom:4}}>{score}/20</div><div style={{fontSize:13,color:sc,marginBottom:14}}>{score<=8?"Take it easy 🌿":score<=12?"Solid start! 💪":"You're on fire! 🔥"}</div><button onClick={onDone} style={{background:"#6EE7B722",border:"1px solid #6EE7B744",color:"#6EE7B7",borderRadius:10,padding:"7px 18px",fontWeight:700}}>Done</button></div>;
  const cur=steps[step];
  return<div style={{background:"linear-gradient(135deg,#6EE7B718,#93C5FD10)",border:"1px solid #6EE7B733",borderRadius:18,padding:18,marginBottom:14}} className="fu">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontWeight:800,fontSize:14}}>🌅 Daily Check-In</div>
      <div style={{display:"flex",gap:3}}>{steps.map((_,i)=><div key={i} style={{width:16,height:3,borderRadius:2,background:i<step?cur.color:"#ffffff15"}}/>)}</div>
    </div>
    <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>{cur.lbl}</div>
    <div style={{display:"flex",gap:5}}>{cur.opts.map(([emoji,lbl],i)=>{const v=i+1,sel=data[cur.k]===v;return<button key={i} onClick={()=>{setData(d=>({...d,[cur.k]:v}));setTimeout(()=>setStep(s=>s+1),220);}} style={{flex:1,padding:"9px 3px",borderRadius:11,border:`2px solid ${sel?cur.color:"#ffffff15"}`,background:sel?`${cur.color}22`:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transform:sel?"scale(1.04)":"scale(1)"}}><span style={{fontSize:20}}>{emoji}</span><span style={{fontSize:8,color:sel?cur.color:"#888",fontWeight:sel?700:400}}>{lbl}</span></button>;})}
    </div>
  </div>;
};

// ── AI TAB ──
const AiTab=({challenges,setChallenges,notify,addNotif})=>{
  const [prompt,setPrompt]=useState("");
  const [loading,setLoading]=useState(false);
  const [sugg,setSugg]=useState([]);
  const [err,setErr]=useState("");
  const [launched,setLaunched]=useState({});
  const QP=["7-day morning movement","mindfulness for a stressed team","fun desk-friendly exercises","summer hydration challenge"];
  const dc={Easy:"#6EE7B7",Medium:"#FCD34D",Hard:"#F9A8D4"};
const gen=async()=>{
  if(!prompt.trim())return;
  setLoading(true);setSugg([]);setErr("");
  try{
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    const data=await res.json();
    if(data.error)throw new Error(data.error);
    setSugg(data.suggestions);
  }catch(e){setErr("Couldn't generate — try again!");}
  setLoading(false);
};
  const launch=(s,i)=>{
    const today=new Date().toISOString().split("T")[0],end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
    setChallenges(c=>[...c,{id:Date.now(),title:s.title,icon:s.icon,unit:s.unit,goal:s.goal,color:s.color,desc:s.desc,active:true,startDate:today,endDate:end,teams:"all"}]);
    setLaunched(l=>({...l,[i]:true}));notify(`🚀 "${s.title}" launched!`);addNotif("challenge",`New AI challenge: ${s.title}`);
  };
  return<div className="fu">
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><div style={{fontWeight:700,fontSize:17}}>✨ AI Challenges</div><Pill color="#C4B5FD" ch="CLAUDE"/></div>
    <div style={{fontSize:12,color:"#888",marginBottom:14}}>Describe your goals and get personalised challenge ideas.</div>
    <div className="card" style={{marginBottom:14}}>
      <div style={{fontWeight:700,marginBottom:8,fontSize:12}}>Quick prompts</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{QP.map(p=><button key={p} onClick={()=>setPrompt(p)} style={{background:prompt===p?"#C4B5FD22":"#ffffff08",border:`1px solid ${prompt===p?"#C4B5FD55":"#ffffff15"}`,borderRadius:20,padding:"4px 10px",fontSize:11,color:prompt===p?"#C4B5FD":"#888",fontWeight:prompt===p?700:400}}>{p}</button>)}</div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. A 2-week competitive challenge for our sales team…" rows={3} style={{resize:"none",marginBottom:10}}/>
      <button onClick={gen} disabled={loading||!prompt.trim()} style={{width:"100%",padding:"11px",borderRadius:10,border:"1px solid #C4B5FD33",background:!prompt.trim()?"#ffffff08":"#C4B5FD22",color:!prompt.trim()?"#555":"#C4B5FD",fontWeight:700,fontSize:13}}>
        {loading?<span style={{animation:"pulse 1s infinite",display:"inline-block"}}>✨ Generating…</span>:"✨ Generate Ideas"}
      </button>
      {err&&<div style={{marginTop:8,fontSize:12,color:"#F9A8D4",textAlign:"center"}}>{err}</div>}
    </div>
    {sugg.map((s,i)=><div key={i} className="card" style={{marginBottom:10,borderColor:`${s.color}33`}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:46,height:46,borderRadius:12,background:`${s.color}20`,border:`1px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.icon}</div>
        <div style={{flex:1}}><div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:3}}><div style={{fontWeight:700,fontSize:14,color:s.color}}>{s.title}</div><Pill color={dc[s.difficulty]||"#888"} ch={s.difficulty}/></div><div style={{fontSize:12,color:"#888",marginBottom:5}}>{s.desc}</div><div style={{fontSize:11,color:"#555"}}>🎯 {s.goal?.toLocaleString()} {s.unit} · 📅 {s.duration}</div></div>
      </div>
      <button onClick={()=>launch(s,i)} disabled={launched[i]} style={{marginTop:10,width:"100%",background:launched[i]?"#6EE7B722":`${s.color}18`,border:`1px solid ${launched[i]?"#6EE7B744":s.color+"44"}`,color:launched[i]?"#6EE7B7":s.color,padding:"8px",borderRadius:9,fontWeight:700,fontSize:12,opacity:launched[i]?0.7:1}}>{launched[i]?"✅ Launched!":"🚀 Launch"}</button>
    </div>)}
    {!loading&&sugg.length===0&&<div style={{textAlign:"center",padding:"36px 16px",color:"#555"}}><div style={{fontSize:40,marginBottom:10}}>✨</div><div style={{fontWeight:600,fontSize:13}}>Pick a prompt or write your own above.</div></div>}
  </div>;
};

// ── FEED ──
const FeedView=({feed,setFeed,challenges,users,cu,badges,setBadges,addNotif,notify,checked,setChecked})=>{
  const [ct,setCt]=useState({});
  const react=(pid,emoji)=>setFeed(f=>f.map(p=>{if(p.id!==pid)return p;const cur=p.reactions[emoji]||[],has=cur.includes(cu.id);if(!has&&p.userId!==cu.id)addNotif("reaction",`${cu.name} reacted ${emoji}`);return{...p,reactions:{...p.reactions,[emoji]:has?cur.filter(x=>x!==cu.id):[...cur,cu.id]}};}));
  const comment=pid=>{const t=ct[pid];if(!t?.trim())return;setFeed(f=>f.map(p=>p.id!==pid?p:{...p,comments:[...p.comments,{userId:cu.id,text:t,ts:Date.now()}]}));setCt(c=>({...c,[pid]:""}));};
  return<div className="fu">
    {!checked&&<CheckIn onDone={()=>{setChecked(true);notify("🌅 Check-in saved!");}}/>}
    {feed.map(post=>{
      const u=users.find(x=>x.id===post.userId)||{name:"?",avatar:"?",color:"#888",role:""};
      const ch=challenges.find(x=>x.id===post.challengeId);if(!ch)return null;
      return<div key={post.id} className="card" style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><Av u={u} s={34}/><div><div style={{fontWeight:700,fontSize:13}}>{u.name}</div><div style={{fontSize:10,color:"#888"}}>{ago(post.timestamp)}</div></div></div>
          <div style={{background:`${ch.color}22`,border:`1px solid ${ch.color}44`,borderRadius:20,padding:"3px 9px",fontSize:11,color:ch.color,fontWeight:700}}>{ch.icon} {ch.title}</div>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:5}}><span style={{fontWeight:800,fontSize:26,color:ch.color}}>{post.value.toLocaleString()}</span><span style={{fontSize:12,color:"#888"}}>{ch.unit}</span><span style={{fontSize:11,color:"#555",marginLeft:"auto"}}>/ {ch.goal.toLocaleString()}</span></div>
        <div style={{background:"#ffffff08",borderRadius:6,height:4,marginBottom:8}}><div style={{width:`${Math.min(100,(post.value/ch.goal)*100)}%`,height:"100%",background:ch.color,borderRadius:6}}/></div>
        {post.note&&<div style={{fontSize:12,color:"#888",marginBottom:8,fontStyle:"italic"}}>"{post.note}"</div>}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{RX.map(emoji=>{const us=post.reactions[emoji]||[],a=us.includes(cu.id);return<button key={emoji} onClick={()=>react(post.id,emoji)} style={{background:a?"#ffffff15":"transparent",border:`1px solid ${a?"#ffffff30":"#ffffff0f"}`,borderRadius:20,padding:"3px 8px",fontSize:12,color:a?"#e8e8f0":"#888",display:"flex",gap:3,alignItems:"center"}}>{emoji}{us.length>0&&<span style={{fontSize:10}}>{us.length}</span>}</button>;})}
        </div>
        {post.comments.map((c,i)=>{const u2=users.find(x=>x.id===c.userId)||{name:"?",color:"#888"};return<div key={i} style={{display:"flex",gap:6,marginBottom:5}}><Av u={u2} s={22}/><div style={{background:"#ffffff08",borderRadius:9,padding:"5px 9px",flex:1,fontSize:12,color:"#aaa"}}><span style={{color:u2.color,fontWeight:600}}>{u2.name.split(" ")[0]} </span>{c.text}</div></div>;})}
        <div style={{display:"flex",gap:7,marginTop:7}}><Av u={cu} s={24}/><input placeholder="Comment…" value={ct[post.id]||""} onChange={e=>setCt(c=>({...c,[post.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&comment(post.id)} style={{flex:1,fontSize:12}}/></div>
      </div>;
    })}
    {feed.length===0&&<div style={{textAlign:"center",color:"#888",padding:"40px 0",fontSize:13}}>No posts yet — log something! 🏃</div>}
  </div>;
};

// ── CHALLENGES ──
const ChalView=({challenges,feed,cu,onLog})=>{const a=challenges.filter(c=>c.active);return<div className="fu"><div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Active Challenges</div>{a.map(ch=>{const tot=feed.filter(p=>p.userId===cu.id&&p.challengeId===ch.id).reduce((a,p)=>a+p.value,0);const pct=Math.min(1,tot/ch.goal);return<div key={ch.id} className="card" style={{marginBottom:12,borderColor:`${ch.color}22`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{fontSize:24,marginBottom:3}}>{ch.icon}</div><div style={{fontWeight:800,fontSize:15,color:ch.color}}>{ch.title}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{ch.desc}</div></div><Ring pct={pct} color={ch.color}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",marginBottom:5}}><span>{tot.toLocaleString()} / {ch.goal.toLocaleString()} {ch.unit}</span>{ch.endDate&&<span>Ends {ch.endDate}</span>}</div><div style={{background:"#ffffff08",borderRadius:6,height:5,marginBottom:12}}><div style={{width:`${pct*100}%`,height:"100%",background:ch.color,borderRadius:6}}/></div><button onClick={()=>onLog(ch)} style={{width:"100%",background:`${ch.color}15`,border:`1px solid ${ch.color}44`,color:ch.color,padding:"9px",borderRadius:9,fontWeight:700,fontSize:13}}>Log {ch.icon} Progress</button></div>;})}
{a.length===0&&<div style={{textAlign:"center",color:"#888",padding:"40px 0",fontSize:13}}>No active challenges.</div>}</div>;};

// ── LEADERBOARD ──
const LbView=({lb,users,challenges,cu})=>{const a=challenges.filter(c=>c.active);const [sel,setSel]=useState(a[0]||challenges[0]);return<div className="fu"><div style={{fontWeight:700,fontSize:17,marginBottom:12}}>Leaderboard</div>{a.length>0&&<div style={{display:"flex",gap:3,background:"#ffffff08",borderRadius:11,padding:3,marginBottom:14}}>{a.map(c=><button key={c.id} onClick={()=>setSel(c)} style={{flex:1,padding:"5px 2px",borderRadius:8,border:"none",background:sel?.id===c.id?`${c.color}22`:"transparent",color:sel?.id===c.id?c.color:"#888",fontSize:15}}>{c.icon}</button>)}</div>}{lb.map((e,i)=>{const u=users.find(x=>x.id===e.userId);if(!u)return null;const me=u.id===cu.id,medals=["🥇","🥈","🥉"];return<div key={e.userId} className="card" style={{marginBottom:8,border:me?`1px solid ${u.color}55`:"",background:me?`${u.color}08`:""}}><div style={{display:"flex",alignItems:"center",gap:9}}><div style={{fontWeight:800,fontSize:16,width:24,textAlign:"center"}}>{i<3?medals[i]:`#${i+1}`}</div><Av u={u} s={36}/><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:700,fontSize:13}}>{u.name}{me&&<span style={{fontSize:10,color:u.color,marginLeft:5}}>you</span>}</div><div style={{fontWeight:700,color:u.color,fontSize:13}}>{e.progress.toLocaleString()}</div></div><div style={{background:"#ffffff08",borderRadius:4,height:4,marginTop:4}}><div style={{width:`${Math.min(100,(e.progress/(sel?.goal||10000))*100)}%`,height:"100%",background:u.color,borderRadius:4}}/></div></div></div></div>;})}</div>;};

// ── TEAMS ──
const TeamsView=({cu,lb,teams,users})=>{const [sel,setSel]=useState(null);const sc=teams.map(t=>{const members=users.filter(u=>u.team===t.id),avg=members.length?Math.round(members.reduce((a,u)=>a+(lb.find(e=>e.userId===u.id)?.progress||0),0)/members.length):0;return{...t,members,avg};}).sort((a,b)=>b.avg-a.avg);
if(sel){const t=sc.find(x=>x.id===sel);if(!t)return null;return<div className="fu"><button onClick={()=>setSel(null)} style={{background:"transparent",border:"none",color:"#6EE7B7",fontWeight:700,marginBottom:10,padding:0,fontSize:13}}>← All Teams</button><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16}}><div style={{width:46,height:46,borderRadius:13,background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{t.emoji}</div><div><div style={{fontWeight:800,fontSize:17}}>{t.name}</div><div style={{fontSize:12,color:"#888"}}>{t.members.length} members · avg {t.avg.toLocaleString()}</div></div></div>{t.members.map(u=>{const l=lb.find(e=>e.userId===u.id);return<div key={u.id} className="card" style={{marginBottom:9,display:"flex",gap:10,alignItems:"center"}}><Av u={u} s={38}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{u.name}{u.id===cu.id&&<span style={{fontSize:10,color:u.color,marginLeft:5}}>you</span>}</div><div style={{background:"#ffffff08",borderRadius:4,height:4,marginTop:4}}><div style={{width:`${Math.min(100,((l?.progress||0)/10000)*100)}%`,height:"100%",background:u.color,borderRadius:4}}/></div></div><div style={{fontWeight:800,color:u.color,fontSize:13}}>{(l?.progress||0).toLocaleString()}</div></div>;})}
</div>;}
return<div className="fu"><div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Teams</div>{sc.map((t,i)=><div key={t.id} onClick={()=>setSel(t.id)} className="card" style={{marginBottom:9,cursor:"pointer",borderColor:`${t.color}22`}}><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:42,height:42,borderRadius:12,background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{t.emoji}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:700}}>{t.name}</div><div style={{fontWeight:800,color:t.color}}>{t.avg.toLocaleString()}</div></div><div style={{fontSize:11,color:"#888",marginBottom:5}}>{t.members.length} members</div><div style={{background:"#ffffff08",borderRadius:4,height:4}}><div style={{width:`${(t.avg/(sc[0]?.avg||1))*100}%`,height:"100%",background:t.color,borderRadius:4}}/></div></div></div>{i===0&&<div style={{fontSize:11,color:t.color,fontWeight:700,marginTop:6}}>🏆 Leading</div>}{t.id===cu.team&&<div style={{fontSize:11,color:"#888",marginTop:2}}>← Your team</div>}</div>)}</div>;};

// ── MESSAGES ──
const MsgView=({cu,users,messages,setMessages})=>{const [dm,setDm]=useState(null);const [txt,setTxt]=useState("");const ref=useRef(null);const key=(a,b)=>[Math.min(a,b),Math.max(a,b)].join("-");useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[dm,messages]);const send=()=>{if(!txt.trim()||!dm)return;const k=key(cu.id,dm.id);setMessages(m=>({...m,[k]:[...(m[k]||[]),{from:cu.id,text:txt,ts:Date.now()}]}));setTxt("");};
if(dm)return<div className="fu" style={{display:"flex",flexDirection:"column",height:"calc(100vh-180px)"}}>
  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><button onClick={()=>setDm(null)} style={{background:"transparent",border:"none",color:"#6EE7B7",fontSize:19,padding:0}}>←</button><Av u={dm} s={32}/><div><div style={{fontWeight:700,fontSize:13}}>{dm.name}</div><div style={{fontSize:10,color:"#6EE7B7"}}>● online</div></div></div>
  <div ref={ref} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:7,paddingBottom:10}}>{(messages[key(cu.id,dm.id)]||[]).map((msg,i)=>{const mine=msg.from===cu.id,s=users.find(x=>x.id===msg.from)||cu;return<div key={i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",gap:5,alignItems:"flex-end"}}>{!mine&&<Av u={s} s={22}/>}<div style={{background:mine?`${cu.color}33`:"#ffffff0f",border:`1px solid ${mine?cu.color+"33":"#ffffff15"}`,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"8px 11px",maxWidth:"75%",fontSize:13}}>{msg.text}</div></div>;})}
  </div>
  <div style={{display:"flex",gap:7}}><input placeholder="Message…" value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,fontSize:13}}/><button onClick={send} style={{background:`${cu.color}22`,border:`1px solid ${cu.color}55`,color:cu.color,padding:"0 14px",borderRadius:9,fontWeight:700}}>→</button></div>
</div>;
return<div className="fu"><div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Direct Messages</div>{users.filter(u=>u.id!==cu.id).map(u=>{const k=key(cu.id,u.id),conv=messages[k]||[],last=conv[conv.length-1];return<div key={u.id} onClick={()=>setDm(u)} className="card" style={{marginBottom:9,cursor:"pointer",display:"flex",gap:9,alignItems:"center"}}><div style={{position:"relative"}}><Av u={u} s={40}/><div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:"#6EE7B7",border:"2px solid #080810"}}/></div><div style={{flex:1,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:700,fontSize:13}}>{u.name}</div>{last&&<div style={{fontSize:10,color:"#888"}}>{ago(last.ts)}</div>}</div><div style={{fontSize:12,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?last.text:"Start a conversation…"}</div></div></div>;})}
</div>;};

// ── PROFILE ──
const ProfileView=({cu,lb,badges,pd,setPd,notify})=>{const [nw,setNw]=useState("");const [nm,setNm]=useState(3);const [nn,setNn]=useState("");const myLB=lb.find(e=>e.userId===cu.id);const myR=lb.findIndex(e=>e.userId===cu.id)+1;const save=()=>{const today=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});if(nw){const v=parseFloat(nw);if(!isNaN(v))setPd(p=>({...p,weight:[...p.weight.slice(-6),{date:today,val:v}]}))}setPd(p=>({...p,mood:[...p.mood.slice(-6),{date:today,val:nm}]}));if(nn.trim())setPd(p=>({...p,notes:[...p.notes,nn]}));setNw("");setNn("");setNm(3);notify("🔒 Saved!");};
return<div className="fu">
  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}><Av u={cu} s={50}/><div><div style={{fontWeight:800,fontSize:18}}>{cu.name}</div><div style={{fontSize:12,color:"#888"}}>{cu.role}{cu.isAdmin?" · 👑":""}</div><div style={{fontSize:10,color:"#6EE7B7",marginTop:2}}>🔒 Private</div></div></div>
  <div style={{display:"flex",gap:7,marginBottom:10}}>{[["#"+(myR||"–"),"Rank","#6EE7B7"],[(myLB?.streak||0)+"🔥","Streak","#FCD34D"],[(myLB?.progress||0).toLocaleString(),"Points","#93C5FD"]].map(([v,l,c])=><div key={l} className="card" style={{flex:1,textAlign:"center",padding:12}}><div style={{fontWeight:800,fontSize:16,color:c}}>{v}</div><div style={{fontSize:10,color:"#888"}}>{l}</div></div>)}</div>
  <div className="card" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13}}>⚖️ Weight (kg)</div><div style={{fontSize:12,color:"#6EE7B7",fontWeight:700}}>{pd.weight[pd.weight.length-1]?.val} kg</div></div><Spk sid="wt" data={pd.weight} color="#6EE7B7"/></div>
  <div className="card" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13}}>😊 Mood</div><div style={{fontSize:12,color:"#F9A8D4",fontWeight:700}}>{pd.mood[pd.mood.length-1]?.val}/5</div></div><Spk sid="md" data={pd.mood} color="#F9A8D4"/></div>
  <div className="card" style={{marginBottom:9}}><div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📓 Journal</div>{pd.notes.map((n,i)=><div key={i} style={{fontSize:12,color:"#888",borderLeft:"2px solid #ffffff10",paddingLeft:7,marginBottom:5}}>{n}</div>)}</div>
  <div className="card"><div style={{fontWeight:700,marginBottom:12}}>Log Today</div><Inp lbl="Weight (kg)" placeholder="72.5" type="number" min="0" value={nw} onChange={e=>setNw(e.target.value)}/><div style={{fontSize:11,color:"#888",marginBottom:6}}>Mood: <span style={{color:"#F9A8D4",fontWeight:700}}>{["😔","😕","😐","🙂","😄"][nm-1]}</span></div><div style={{display:"flex",gap:4,marginBottom:9}}>{[1,2,3,4,5].map(v=><button key={v} onClick={()=>setNm(v)} style={{flex:1,padding:"6px 0",borderRadius:9,border:`1px solid ${nm===v?"#F9A8D455":"#ffffff15"}`,background:nm===v?"#F9A8D420":"transparent",fontSize:15}}>{["😔","😕","😐","🙂","😄"][v-1]}</button>)}</div><textarea placeholder="Journal note…" rows={2} value={nn} onChange={e=>setNn(e.target.value)} style={{resize:"none",marginBottom:9}}/><button onClick={save} style={{width:"100%",background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",border:"1px solid #6EE7B755",color:"#6EE7B7",padding:"11px",borderRadius:11,fontWeight:700}}>🔒 Save Privately</button></div>
</div>;};

// ── ADMIN ──
const AdminView=({teams,users,setUsers,challenges,setChallenges,invites,setInvites,notify,addNotif})=>{
  const [sec,setSec]=useState("overview");
  const [em,setEm]=useState(null);
  const [chF,setChF]=useState({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7"});
  const [invF,setInvF]=useState({email:"",role:"",team:teams[0]?.id||""});
  const [link]=useState(`vibefit.app/join/${uid()}`);
  const SECS=[["overview","Overview","🏠"],["members","Members","👤"],["challenges","Challenges","🏆"],["invites","Invites","📧"]];
  const createCh=()=>{if(!chF.title||!chF.goal)return;const today=new Date().toISOString().split("T")[0],end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];setChallenges(c=>[...c,{id:Date.now(),...chF,goal:parseFloat(chF.goal),active:true,startDate:today,endDate:end,teams:"all"}]);setChF({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7"});notify("✅ Challenge created!");addNotif("challenge",`New: ${chF.title}`);};
  const sendInv=()=>{if(!invF.email.trim())return;setInvites(v=>[{id:Date.now(),...invF,status:"pending",sent:Date.now()},...v]);setInvF({email:"",role:"",team:teams[0]?.id||""});notify("📧 Invite sent!");};
  return<div className="fu">
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><div style={{fontWeight:700,fontSize:17}}>Admin Panel</div><Pill color="#C4B5FD" ch="ADMIN"/></div>
    <div style={{display:"flex",gap:3,overflowX:"auto",marginBottom:14,paddingBottom:3}}>{SECS.map(([id,lbl,icon])=><button key={id} onClick={()=>setSec(id)} style={{flexShrink:0,padding:"6px 11px",borderRadius:9,border:`1px solid ${sec===id?"#C4B5FD55":"#ffffff15"}`,background:sec===id?"#C4B5FD18":"transparent",color:sec===id?"#C4B5FD":"#888",fontWeight:700,fontSize:11,display:"flex",gap:4,alignItems:"center"}}><span>{icon}</span>{lbl}</button>)}</div>
    {sec==="overview"&&<div><div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>{[[users.length,"Members","#6EE7B7"],[teams.length,"Teams","#93C5FD"],[challenges.filter(c=>c.active).length,"Active","#F9A8D4"],[invites.filter(i=>i.status==="pending").length,"Pending","#FCD34D"]].map(([v,l,c])=><div key={l} className="card" style={{flex:"1 1 80px",padding:12}}><div style={{fontWeight:800,fontSize:22,color:c}}>{v}</div><div style={{fontSize:10,color:"#888"}}>{l}</div></div>)}</div><div className="card"><div style={{fontWeight:700,marginBottom:9}}>Quick Actions</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><Btn color="#6EE7B7" ch="📧 Invite" onClick={()=>setSec("invites")}/><Btn color="#F9A8D4" ch="🏆 Challenge" onClick={()=>setSec("challenges")}/></div></div></div>}
    {sec==="members"&&<div>{users.map(u=>{const t=teams.find(x=>x.id===u.team);return<div key={u.id} className="card" style={{marginBottom:9}}><div style={{display:"flex",gap:9,alignItems:"center"}}><Av u={u} s={38}/><div style={{flex:1}}><div style={{display:"flex",gap:5,alignItems:"center"}}><div style={{fontWeight:700,fontSize:13}}>{u.name}</div>{u.isAdmin&&<Pill color="#C4B5FD" ch="Admin"/>}</div><div style={{fontSize:11,color:"#888"}}>{u.email}</div>{t&&<div style={{marginTop:3}}><Pill color={t.color} ch={`${t.emoji} ${t.name}`}/></div>}</div><div style={{display:"flex",gap:5,flexDirection:"column"}}><button onClick={()=>setEm({...u})} style={{background:"#ffffff08",border:"1px solid #ffffff15",borderRadius:7,color:"#aaa",padding:"4px 8px",fontSize:11,fontWeight:700}}>Edit</button><button onClick={()=>{setUsers(x=>x.map(y=>y.id===u.id?{...y,isAdmin:!y.isAdmin}:y));notify("✅ Updated");}} style={{background:"#C4B5FD15",border:"1px solid #C4B5FD33",borderRadius:7,color:"#C4B5FD",padding:"4px 8px",fontSize:11,fontWeight:700}}>{u.isAdmin?"Demote":"Admin"}</button></div></div></div>;})}
    {em&&<Modal onClose={()=>setEm(null)} ch={<><div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Edit Member</div><Inp lbl="Name" value={em.name} onChange={e=>setEm(m=>({...m,name:e.target.value}))}/><Inp lbl="Email" value={em.email} onChange={e=>setEm(m=>({...m,email:e.target.value}))}/><Inp lbl="Role" value={em.role} onChange={e=>setEm(m=>({...m,role:e.target.value}))}/><Sel lbl="Team" value={em.team} onChange={e=>setEm(m=>({...m,team:e.target.value}))}><option value="">No team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</Sel><div style={{display:"flex",gap:7,marginTop:7}}><Btn color="#6EE7B7" style={{flex:1}} ch="Save" onClick={()=>{setUsers(u=>u.map(x=>x.id===em.id?{...em,avatar:ini(em.name)}:x));setEm(null);notify("✅ Saved");}}/><button onClick={()=>{setUsers(u=>u.filter(x=>x.id!==em.id));setEm(null);notify("🗑️ Removed");}} style={{background:"#F9A8D415",border:"1px solid #F9A8D433",color:"#F9A8D4",borderRadius:9,padding:"8px 13px",fontWeight:700,fontSize:12}}>Remove</button></div></>}/>}</div>}
    {sec==="challenges"&&<div><div className="card" style={{marginBottom:12}}><div style={{fontWeight:700,marginBottom:9}}>Create Challenge</div><div style={{display:"flex",gap:7}}><Inp lbl="Title" value={chF.title} onChange={e=>setChF(f=>({...f,title:e.target.value}))} style={{flex:3}}/><Inp lbl="Icon" value={chF.icon} onChange={e=>setChF(f=>({...f,icon:e.target.value}))} style={{flex:1}}/></div><div style={{display:"flex",gap:7}}><Inp lbl="Unit" value={chF.unit} onChange={e=>setChF(f=>({...f,unit:e.target.value}))} style={{flex:1}}/><Inp lbl="Goal" value={chF.goal} onChange={e=>setChF(f=>({...f,goal:e.target.value}))} type="number" style={{flex:1}}/></div><div style={{marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:5}}>Color</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{TC.map(c=><button key={c} onClick={()=>setChF(f=>({...f,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${chF.color===c?"#fff":"transparent"}`}}/>)}</div></div><Btn color="#F9A8D4" style={{width:"100%"}} ch="Launch 🚀" onClick={createCh}/></div>{challenges.map(ch=><div key={ch.id} className="card" style={{marginBottom:7,display:"flex",gap:9,alignItems:"center",opacity:ch.active?1:0.6}}><span style={{fontSize:20}}>{ch.icon}</span><div style={{flex:1}}><div style={{fontWeight:700,color:ch.color,fontSize:13}}>{ch.title}</div><div style={{fontSize:11,color:"#888"}}>{ch.goal.toLocaleString()} {ch.unit}</div></div><button onClick={()=>setChallenges(c=>c.map(x=>x.id===ch.id?{...x,active:!x.active}:x))} style={{background:`${ch.active?"#FCD34D":"#6EE7B7"}15`,border:`1px solid ${ch.active?"#FCD34D":"#6EE7B7"}33`,color:ch.active?"#FCD34D":"#6EE7B7",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700}}>{ch.active?"Pause":"On"}</button><button onClick={()=>{setChallenges(c=>c.filter(x=>x.id!==ch.id));notify("🗑️");}} style={{background:"#F9A8D415",border:"1px solid #F9A8D433",color:"#F9A8D4",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700}}>Del</button></div>)}</div>}
    {sec==="invites"&&<div><div className="card" style={{marginBottom:12}}><div style={{fontWeight:700,marginBottom:6}}>🔗 Invite Link</div><div style={{background:"#ffffff08",borderRadius:9,padding:"8px 11px",fontFamily:"monospace",fontSize:11,color:"#6EE7B7",display:"flex",justifyContent:"space-between",alignItems:"center",gap:7,wordBreak:"break-all"}}><span>{link}</span><button onClick={()=>notify("📋 Copied!")} style={{background:"#6EE7B722",border:"1px solid #6EE7B755",color:"#6EE7B7",borderRadius:7,padding:"3px 8px",fontSize:11,fontWeight:700,flexShrink:0}}>Copy</button></div></div><div className="card" style={{marginBottom:12}}><div style={{fontWeight:700,marginBottom:9}}>Send Invite</div><Inp lbl="Email" value={invF.email} onChange={e=>setInvF(f=>({...f,email:e.target.value}))} type="email" placeholder="colleague@co.com"/><Inp lbl="Role" value={invF.role} onChange={e=>setInvF(f=>({...f,role:e.target.value}))} placeholder="e.g. Manager"/><Sel lbl="Team" value={invF.team} onChange={e=>setInvF(f=>({...f,team:e.target.value}))}><option value="">No team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</Sel><Btn color="#6EE7B7" style={{width:"100%"}} ch="Send 📧" onClick={sendInv}/></div>{invites.map(inv=>{const t=teams.find(x=>x.id===inv.team);const sc={pending:"#FCD34D",accepted:"#6EE7B7"}[inv.status]||"#888";return<div key={inv.id} className="card" style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:13}}>{inv.email}</div><div style={{fontSize:11,color:"#888"}}>{t?`${t.emoji} ${t.name}`:"No team"} · {ago(inv.sent)}</div></div><Pill color={sc} ch={inv.status}/></div></div>;})}
    </div>}
  </div>;
};

// ── NOTIFS ──
const NotifsPanel=({notifs,onClose,onRead})=><div className="sd" style={{position:"fixed",top:58,right:8,width:280,maxWidth:"90vw",background:"#13131f",border:"1px solid #ffffff18",borderRadius:14,zIndex:800,boxShadow:"0 16px 50px #0009",maxHeight:"68vh",overflowY:"auto"}}><div style={{padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #ffffff0f",position:"sticky",top:0,background:"#13131f"}}><div style={{fontWeight:700,fontSize:13}}>Notifications</div><button onClick={onClose} style={{background:"transparent",border:"none",color:"#888",fontSize:17,padding:0}}>✕</button></div>{notifs.length===0&&<div style={{padding:"20px",textAlign:"center",color:"#888",fontSize:12}}>All caught up! 🎉</div>}{notifs.map(n=>{const icons={badge:"🏅",reaction:"💬",challenge:"🏆",dm:"✉️",admin:"⚙️",invite:"📧"};return<div key={n.id} onClick={()=>onRead(n.id)} style={{padding:"9px 14px",borderBottom:"1px solid #ffffff06",background:n.read?"transparent":"#6EE7B70d",cursor:"pointer",display:"flex",gap:7,alignItems:"flex-start"}}><span style={{fontSize:14,flexShrink:0}}>{icons[n.type]||"🔔"}</span><div style={{flex:1}}><div style={{fontSize:11,color:n.read?"#888":"#ccc",lineHeight:1.4}}>{n.text}</div><div style={{fontSize:9,color:"#555",marginTop:2}}>{ago(n.ts)}</div></div>{!n.read&&<div style={{width:5,height:5,borderRadius:"50%",background:"#6EE7B7",flexShrink:0,marginTop:3}}/>}</div>;})}
</div>;

// ── LOG MODAL ──
const LogModal=({onClose,challenges,feed,setFeed,lb,setLb,cu,badges,setBadges,addNotif,notify,initCh})=>{
  const a=challenges.filter(c=>c.active);
  const [sel,setSel]=useState(initCh||a[0]);
  const [val,setVal]=useState("");const [note,setNote]=useState("");
  const submit=()=>{if(!sel||!val)return;const v=parseFloat(val);if(isNaN(v)||v<=0)return;setFeed(f=>[{id:Date.now(),userId:cu.id,challengeId:sel.id,value:v,note,timestamp:Date.now(),comments:[],reactions:{}},...f]);setLb(l=>{const ex=l.find(e=>e.userId===cu.id);const nx=ex?l.map(e=>e.userId===cu.id?{...e,progress:e.progress+v}:e):[...l,{userId:cu.id,progress:v,streak:1}];return[...nx].sort((a,b)=>b.progress-a.progress);});if(!(badges[cu.id]||[]).includes("first_log")){setBadges(b=>({...b,[cu.id]:[...(b[cu.id]||[]),"first_log"]}));addNotif("badge","🌱 First Step badge earned!");}notify(`✅ ${sel.icon} Logged!`);onClose();};
  return<Modal onClose={onClose} ch={<><div style={{fontWeight:700,fontSize:16,marginBottom:12}}>Log Progress</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>{a.map(c=><button key={c.id} onClick={()=>setSel(c)} style={{padding:"4px 9px",borderRadius:18,border:`1px solid ${sel?.id===c.id?c.color:"#ffffff22"}`,background:sel?.id===c.id?`${c.color}22`:"transparent",color:sel?.id===c.id?c.color:"#888",fontSize:11}}>{c.icon} {c.title}</button>)}</div>{sel&&<><Inp lbl={`Enter ${sel.unit}`} value={val} onChange={e=>setVal(e.target.value)} type="number" min="0"/><textarea placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{resize:"none",marginBottom:11}}/><Btn color={sel.color} style={{width:"100%",padding:"11px"}} ch="Post to Feed →" onClick={submit}/></>}{a.length===0&&<div style={{color:"#888",fontSize:12,textAlign:"center",padding:"12px 0"}}>No active challenges.</div>}</>}/>;
};

// ── MAIN ──
export default function App() {
  const [dark,setDark]=useState(true);
  const t=dark?DK:LT;
  const [cu,setCu]=useState(IU[0]);
  const [tab,setTab]=useState("feed");
  const [feed,setFeed]=useState(IF);
  const [lb,setLb]=useState(ILB);
  const [msgs,setMsgs]=useState(IM);
  const [pd,setPd]=useState(IP);
  const [badges,setBadges]=useState(IBG);
  const [notifs,setNotifs]=useState([
    {id:1,type:"badge",text:"You earned 🔥 On Fire badge!",ts:N-3600000,read:false},
    {id:2,type:"reaction",text:"Jamie reacted 💪 to your post",ts:N-7200000,read:false},
    {id:3,type:"challenge",text:"Steps ends tomorrow — you're #2!",ts:N-10800000,read:true},
  ]);
  const [teams]=useState(IT);
  const [users,setUsers]=useState(IU);
  const [challenges,setChallenges]=useState(IC);
  const [invites,setInvites]=useState([
    {id:1,email:"jordan@co.com",team:"marketing",role:"Content Manager",status:"pending",sent:N-86400000},
    {id:2,email:"riley@co.com",team:"engineering",role:"Developer",status:"accepted",sent:N-172800000},
  ]);
  const [showLog,setShowLog]=useState(null);
  const [showSel,setShowSel]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [checked,setChecked]=useState(false);
  const [toasts,setToasts]=useState([]);

  useEffect(()=>{setCu(u=>users.find(x=>x.id===u.id)||u);},[users]);

  const notify=useCallback(msg=>{const id=Date.now();setToasts(ts=>[...ts,{id,msg}]);setTimeout(()=>setToasts(ts=>ts.filter(x=>x.id!==id)),3100);},[]);
  const addNotif=useCallback((type,text)=>setNotifs(n=>[{id:Date.now(),type,text,ts:Date.now(),read:false},...n]),[]);
  const unread=notifs.filter(n=>!n.read).length;
  const cuu=users.find(u=>u.id===cu.id)||cu;
  const myR=lb.findIndex(e=>e.userId===cu.id)+1;

  const NAV=[["feed","Feed","📣"],["challenges","Train","🏆"],["leaderboard","Board","🥇"],["teams","Teams","👥"],["messages","DMs","💬"],["ai","AI ✨","🤖"],...(cuu.isAdmin?[["admin","Admin","⚙️"]]:[]),["profile","Me","🔒"]];

  return <>
    <style>{makeCSS(t)}</style>
    <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:7,alignItems:"center",pointerEvents:"none"}}>
      {toasts.map(t=><div key={t.id} style={{background:"#13131f",border:"1px solid #6EE7B755",borderRadius:13,padding:"9px 18px",fontSize:13,color:"#6EE7B7",backdropFilter:"blur(12px)",whiteSpace:"nowrap",animation:"ti 3s ease both"}}>{t.msg}</div>)}
    </div>
    {showNotifs&&<><div style={{position:"fixed",inset:0,zIndex:799}} onClick={()=>setShowNotifs(false)}/><NotifsPanel notifs={notifs} onClose={()=>setShowNotifs(false)} onRead={id=>setNotifs(n=>n.map(x=>x.id===id?{...x,read:true}:x))}/></>}
    {showLog&&<LogModal onClose={()=>setShowLog(null)} challenges={challenges} feed={feed} setFeed={setFeed} lb={lb} setLb={setLb} cu={cuu} badges={badges} setBadges={setBadges} addNotif={addNotif} notify={notify} initCh={showLog===true?null:showLog}/>}
    {showSel&&<Modal onClose={()=>setShowSel(false)} ch={<><div style={{fontWeight:700,marginBottom:11,fontSize:11,color:"#888"}}>SWITCH USER (DEMO)</div>{users.map(u=><div key={u.id} onClick={()=>{setCu(u);setShowSel(false);setChecked(false);}} style={{display:"flex",alignItems:"center",gap:9,padding:"9px",borderRadius:11,cursor:"pointer",background:cu.id===u.id?`${u.color}15`:"transparent",marginBottom:3,border:`1px solid ${cu.id===u.id?u.color+"44":"transparent"}`}}><Av u={u} s={32}/><div><div style={{fontWeight:600,fontSize:13}}>{u.name}</div><div style={{fontSize:10,color:"#888"}}>{u.role}{u.isAdmin?" · 👑":""}</div></div></div>)}</>}/>}

    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column",background:t.bg,color:t.tx}}>
      <div style={{padding:"13px 13px 0",position:"sticky",top:0,zIndex:40,background:`linear-gradient(to bottom,${t.bg} 85%,transparent)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:21,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-0.5}}>VIBE<span style={{WebkitTextFillColor:t.tx}}>FIT</span></div>
            <div style={{fontSize:9,color:t.sub,marginTop:1}}>Company Wellness Hub</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setDark(v=>!v)} style={{width:30,height:30,borderRadius:8,background:t.nb,border:`1px solid ${t.cb}`,fontSize:13,color:t.tx,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
            <div onClick={()=>setShowNotifs(v=>!v)} style={{position:"relative",cursor:"pointer",width:30,height:30,borderRadius:8,background:t.nb,border:`1px solid ${t.cb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🔔{unread>0&&<div style={{position:"absolute",top:-3,right:-3,width:13,height:13,borderRadius:"50%",background:"#F9A8D4",fontSize:7,fontWeight:800,color:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</div>}</div>
            {myR>0&&<div style={{fontSize:10,color:"#6EE7B7",background:"#6EE7B715",border:"1px solid #6EE7B730",borderRadius:18,padding:"2px 7px",fontWeight:700}}>#{myR}</div>}
            <div onClick={()=>setShowSel(true)} style={{cursor:"pointer"}}><Av u={cuu} s={30}/></div>
          </div>
        </div>
        <div style={{display:"flex",gap:2,background:t.nb,borderRadius:12,padding:3,overflowX:"auto",marginBottom:2}}>
          {NAV.map(([id,lbl,icon])=><button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,flex:1,minWidth:36,padding:"5px 2px",borderRadius:8,border:"none",background:tab===id?t.na:"transparent",color:tab===id?t.tx:t.sub,fontSize:8,fontWeight:tab===id?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:11}}>{icon}</span>{lbl}</button>)}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 13px 90px"}}>
        {tab==="feed"&&<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:17}}>Activity Feed</div><Btn color="#6EE7B7" ch="+ Log" onClick={()=>setShowLog(true)}/></div><FeedView feed={feed} setFeed={setFeed} challenges={challenges} users={users} cu={cuu} badges={badges} setBadges={setBadges} addNotif={addNotif} notify={notify} checked={checked} setChecked={setChecked}/></>}
        {tab==="challenges"&&<ChalView challenges={challenges} feed={feed} cu={cuu} onLog={ch=>setShowLog(ch)}/>}
        {tab==="leaderboard"&&<LbView lb={lb} users={users} challenges={challenges} cu={cuu}/>}
        {tab==="teams"&&<TeamsView cu={cuu} lb={lb} teams={teams} users={users}/>}
        {tab==="messages"&&<MsgView cu={cuu} users={users} messages={msgs} setMessages={setMsgs}/>}
        {tab==="ai"&&<AiTab challenges={challenges} setChallenges={setChallenges} notify={notify} addNotif={addNotif}/>}
        {tab==="admin"&&cuu.isAdmin&&<AdminView teams={teams} users={users} setUsers={setUsers} challenges={challenges} setChallenges={setChallenges} invites={invites} setInvites={setInvites} notify={notify} addNotif={addNotif}/>}
        {tab==="profile"&&<ProfileView cu={cuu} lb={lb} badges={badges} pd={pd} setPd={setPd} notify={notify}/>}
      </div>
    </div>
  </>;
}