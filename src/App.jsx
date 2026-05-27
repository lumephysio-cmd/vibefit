import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from './supabase';

// ── CONSTANTS ──
const TC=["#6EE7B7","#93C5FD","#F9A8D4","#FCD34D","#C4B5FD","#FB923C","#34D399","#F472B6"];
const RX=["🔥","💪","👏","❤️","🎉"];
const N=Date.now();
const BP_COLORS={general:"#6EE7B7",lower_back:"#F9A8D4",shoulders:"#93C5FD",neck:"#FCD34D",hips:"#C4B5FD",wrists:"#FB923C",eyes:"#34D399"};
const BP_LABELS={general:"General",lower_back:"Lower Back",shoulders:"Shoulders",neck:"Neck & Upper Back",hips:"Hips",wrists:"Wrists",eyes:"Eyes"};

// ── INITIAL DATA ──
const IC=[
  {id:1,title:"10K Steps",icon:"👟",unit:"steps",goal:10000,color:"#6EE7B7",desc:"10,000 steps every day",active:true,type:"count",endDate:"2026-12-31"},
  {id:2,title:"2L Water",icon:"💧",unit:"ml",goal:2000,color:"#93C5FD",desc:"Stay hydrated daily",active:true,type:"count",endDate:"2026-12-31"},
  {id:3,title:"Desk Stretches",icon:"🧘",unit:"session",goal:1,color:"#F9A8D4",desc:"3 min stretch break, every hour",active:true,type:"habit",physioNote:"Prolonged sitting increases lumbar disc pressure by 40%. These micro-breaks are proven to reduce neck & lower back pain and boost afternoon energy.",endDate:"2026-12-31"},
  {id:4,title:"Mindfulness",icon:"🌿",unit:"mins",goal:20,color:"#FCD34D",desc:"20 mins mindfulness daily",active:true,type:"count",endDate:"2026-12-31"},
];
const ILB=[{uid:4,pts:9200,str:5},{uid:1,pts:8750,str:4},{uid:3,pts:7400,str:7},{uid:2,pts:6800,str:3}];
const IF=[
  {id:1,uid:2,cid:1,val:11200,note:"New record! 🏃",ts:N-7200000,comments:[{uid:1,text:"Beast mode!"}],rx:{"🔥":[3,4],"💪":[1]}},
  {id:2,uid:3,cid:3,val:1,note:"Shoulders feel so much better!",ts:N-18000000,comments:[],rx:{"💪":[2],"👏":[4]}},
];
const IM={"1-2":[{from:1,text:"Great job today!",ts:N-200000}]};
const IP={weight:[{date:"Mar 17",val:74.2},{date:"Mar 18",val:73.8},{date:"Mar 23",val:72.5}],mood:[{date:"Mar 17",val:3},{date:"Mar 20",val:5},{date:"Mar 23",val:5}],notes:["Feeling great after the run!"]};

// ── HELPERS ──
const ago=ts=>{const d=Date.now()-ts;if(d<60000)return"just now";if(d<3600000)return`${Math.floor(d/60000)}m`;return`${Math.floor(d/3600000)}h`;};
const ini=n=>n?n.split(" ").map(p=>p[0]).join("").toUpperCase().slice(0,2):"?";
let _c=0;const uid=()=>++_c;
const todayStr=()=>new Date().toDateString();

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
  const [step,setStep]=useState(0);const [scores,setScores]=useState({});
  const STEPS=[{k:"mood",q:"How's your mood?",opts:["😴","😕","😐","🙂","😄"],color:"#F9A8D4"},{k:"energy",q:"Energy level?",opts:["🪫","😮‍💨","😌","⚡","🚀"],color:"#FCD34D"},{k:"water",q:"Water intake so far?",opts:["🏜️","💧","🥛","💦","🌊"],color:"#93C5FD"},{k:"sleep",q:"Sleep last night?",opts:["😵","😪","😴","🛌","⭐"],color:"#6EE7B7"}];
  if(step>=STEPS.length){const total=Object.values(scores).reduce((a,b)=>a+b,0);const col=total<=8?"#F9A8D4":total<=12?"#FCD34D":"#6EE7B7";return<div style={{background:"linear-gradient(135deg,#6EE7B715,#93C5FD0a)",border:"1px solid #6EE7B733",borderRadius:18,padding:18,marginBottom:14,textAlign:"center"}}><div style={{fontSize:30,marginBottom:6}}>✅</div><div style={{fontWeight:800,fontSize:16,marginBottom:2}}>Check-in done!</div><div style={{fontWeight:800,fontSize:34,color:col,marginBottom:4}}>{total}/20</div><div style={{fontSize:13,color:col,marginBottom:14}}>{total<=8?"Take it easy 🌿":total<=12?"Solid start! 💪":"You're on fire! 🔥"}</div><button onClick={onDone} style={{background:"#6EE7B722",border:"1px solid #6EE7B744",color:"#6EE7B7",borderRadius:10,padding:"7px 20px",fontWeight:700}}>Done</button></div>;}
  const cur=STEPS[step];
  return<div style={{background:"linear-gradient(135deg,#6EE7B715,#93C5FD0a)",border:"1px solid #6EE7B733",borderRadius:18,padding:18,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:800,fontSize:14}}>🌅 Daily Check-In</div><div style={{display:"flex",gap:4}}>{STEPS.map((_,i)=><div key={i} style={{width:18,height:3,borderRadius:2,background:i<step?cur.color:"#ffffff15"}}/>)}</div></div><div style={{fontWeight:700,fontSize:15,marginBottom:12}}>{cur.q}</div><div style={{display:"flex",gap:6}}>{cur.opts.map((emoji,i)=>{const v=i+1,sel=scores[cur.k]===v;return<button key={i} onClick={()=>{setScores(s=>({...s,[cur.k]:v}));setTimeout(()=>setStep(s=>s+1),220);}} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${sel?cur.color:"#ffffff15"}`,background:sel?`${cur.color}22`:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:22}}>{emoji}</span></button>;})}
  </div></div>;
};

// ── AI TAB ──
const AiTab=({challenges,setChallenges,notify})=>{
  const [prompt,setPrompt]=useState("");const [loading,setLoading]=useState(false);const [sugg,setSugg]=useState([]);const [err,setErr]=useState("");const [done,setDone]=useState({});
  const QP=["Morning movement challenge","Mindfulness for stressed teams","Desk-friendly exercises","Summer hydration push"];
  const dc={Easy:"#6EE7B7",Medium:"#FCD34D",Hard:"#F9A8D4"};
  const gen=async()=>{if(!prompt.trim())return;setLoading(true);setSugg([]);setErr("");try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});const data=await r.json();if(data.error)throw new Error(data.error);setSugg(data.suggestions);}catch(e){setErr("Couldn't generate — try again!");}setLoading(false);};
  const launch=(s,i)=>{const today=new Date().toISOString().split("T")[0],end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];setChallenges(c=>[...c,{id:Date.now(),title:s.title,icon:s.icon,unit:s.unit,goal:s.goal,color:s.color,desc:s.desc,active:true,type:"count",startDate:today,endDate:end}]);setDone(d=>({...d,[i]:true}));notify(`🚀 "${s.title}" launched!`);};
  return<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontWeight:700,fontSize:17}}>✨ AI Challenges</span><Pill color="#C4B5FD" text="CLAUDE"/></div><div style={{fontSize:12,color:"#888",marginBottom:14}}>Describe your team's goals and get challenge ideas instantly.</div><div style={{background:"#ffffff08",border:"1px solid #ffffff12",borderRadius:16,padding:16,marginBottom:14}}><div style={{fontWeight:700,marginBottom:8,fontSize:12}}>Quick prompts</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{QP.map(p=><button key={p} onClick={()=>setPrompt(p)} style={{background:prompt===p?"#C4B5FD22":"transparent",border:`1px solid ${prompt===p?"#C4B5FD55":"#ffffff15"}`,borderRadius:20,padding:"4px 10px",fontSize:11,color:prompt===p?"#C4B5FD":"#888",fontWeight:prompt===p?700:400}}>{p}</button>)}</div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Or describe your own…" rows={3} style={{resize:"none",width:"100%",marginBottom:10}}/><button onClick={gen} disabled={loading||!prompt.trim()} style={{width:"100%",padding:"11px",borderRadius:10,border:"1px solid #C4B5FD33",background:prompt.trim()?"#C4B5FD22":"#ffffff08",color:prompt.trim()?"#C4B5FD":"#555",fontWeight:700,fontSize:13}}>{loading?"✨ Generating…":"✨ Generate Ideas"}</button>{err&&<div style={{marginTop:8,fontSize:12,color:"#F9A8D4",textAlign:"center"}}>{err}</div>}</div>{sugg.map((s,i)=><div key={i} style={{background:"#ffffff08",border:`1px solid ${s.color}33`,borderRadius:16,padding:16,marginBottom:10}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:44,height:44,borderRadius:12,background:`${s.color}20`,border:`1px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.icon}</div><div style={{flex:1}}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><span style={{fontWeight:700,color:s.color}}>{s.title}</span><Pill color={dc[s.difficulty]||"#888"} text={s.difficulty}/></div><div style={{fontSize:12,color:"#888",marginBottom:4}}>{s.desc}</div><div style={{fontSize:11,color:"#666"}}>🎯 {s.goal?.toLocaleString()} {s.unit}</div></div></div><button onClick={()=>launch(s,i)} disabled={done[i]} style={{marginTop:10,width:"100%",background:done[i]?"#6EE7B722":`${s.color}18`,border:`1px solid ${done[i]?"#6EE7B744":s.color+"44"}`,color:done[i]?"#6EE7B7":s.color,padding:"8px",borderRadius:9,fontWeight:700,fontSize:12,opacity:done[i]?.7:1}}>{done[i]?"✅ Launched!":"🚀 Launch"}</button></div>)}{!loading&&sugg.length===0&&<div style={{textAlign:"center",padding:"36px 0",color:"#555"}}><div style={{fontSize:40,marginBottom:10}}>✨</div><div style={{fontSize:13}}>Pick a prompt or write your own above.</div></div>}</div>;
};

// ── FEED TAB ──
const FeedTab=({feed,setFeed,challenges,users,cu,notify,checked,setChecked,tips=[]})=>{
  const [ct,setCt]=useState({});
  const react=(pid,emoji)=>setFeed(f=>f.map(p=>{if(p.id!==pid)return p;const cur=p.rx[emoji]||[],has=cur.includes(cu.id);return{...p,rx:{...p.rx,[emoji]:has?cur.filter(x=>x!==cu.id):[...cur,cu.id]}};}));
  const comment=pid=>{const t=ct[pid];if(!t?.trim())return;setFeed(f=>f.map(p=>p.id!==pid?p:{...p,comments:[...p.comments,{uid:cu.id,text:t}]}));setCt(c=>({...c,[pid]:""}));};

  // Merge tips + activity posts, sorted newest first
  const items=[
    ...tips.map(t=>({...t,_kind:"tip",_ts:new Date(t.created_at).getTime()||0})),
    ...feed.map(p=>({...p,_kind:"post",_ts:p.ts}))
  ].sort((a,b)=>b._ts-a._ts);

  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:17}}>Activity Feed</div>
    </div>
    {!checked&&<CheckIn onDone={()=>{setChecked(true);notify("🌅 Check-in saved!");}}/>}
    {items.map(item=>{
      if(item._kind==="tip") return<TipCard key={`tip-${item.id}`} tip={item}/>;
      const post=item;
      const u=users.find(x=>x.id===post.uid)||{name:"Unknown",color:"#888"};
      const ch=challenges.find(x=>x.id===post.cid);
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
      const myPosts=feed.filter(p=>p.uid===cu.id&&p.cid===ch.id);
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
    {a.length===0&&<div style={{textAlign:"center",color:"#888",padding:"40px 0",fontSize:13}}>No active challenges.</div>}
  </div>;
};

// ── LEADERBOARD TAB ──
const LbTab=({lb,users,challenges,cu})=>{const a=challenges.filter(c=>c.active);const [sel,setSel]=useState(a[0]||challenges[0]);const medals=["🥇","🥈","🥉"];return<div><div style={{fontWeight:700,fontSize:17,marginBottom:12}}>Leaderboard</div>{a.length>0&&<div style={{display:"flex",gap:3,background:"#ffffff08",borderRadius:11,padding:3,marginBottom:14}}>{a.map(c=><button key={c.id} onClick={()=>setSel(c)} style={{flex:1,padding:"5px",borderRadius:8,border:"none",background:sel?.id===c.id?`${c.color}22`:"transparent",color:sel?.id===c.id?c.color:"#888",fontSize:16}}>{c.icon}</button>)}</div>}{lb.map((e,i)=>{const u=users.find(x=>x.id===e.uid);if(!u)return null;const me=u.id===cu.id;return<div key={e.uid} className="card" style={{marginBottom:8,border:me?`1px solid ${u.color||"#6EE7B7"}55`:"",background:me?`${u.color||"#6EE7B7"}08`:""}}><div style={{display:"flex",alignItems:"center",gap:9}}><div style={{fontWeight:800,fontSize:16,width:24,textAlign:"center"}}>{i<3?medals[i]:`#${i+1}`}</div><Av u={u} s={36}/><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:700,fontSize:13}}>{u.name}{me&&<span style={{fontSize:10,color:u.color||"#6EE7B7",marginLeft:5}}>you</span>}</div><div style={{fontWeight:700,color:u.color||"#6EE7B7",fontSize:13}}>{e.pts.toLocaleString()}</div></div><div style={{background:"#ffffff08",borderRadius:4,height:4,marginTop:4}}><div style={{width:`${Math.min(100,(e.pts/(sel?.goal||10000))*100)}%`,height:"100%",background:u.color||"#6EE7B7",borderRadius:4}}/></div></div></div></div>;})}
</div>;};

// ── MESSAGES TAB ──
const MsgTab=({cu,users,messages,setMessages})=>{const [dm,setDm]=useState(null);const [txt,setTxt]=useState("");const ref=useRef(null);const key=(a,b)=>[Math.min(a,b),Math.max(a,b)].join("-");useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[dm,messages]);const send=()=>{if(!txt.trim()||!dm)return;const k=key(cu.id,dm.id);setMessages(m=>({...m,[k]:[...(m[k]||[]),{from:cu.id,text:txt,ts:Date.now()}]}));setTxt("");};
if(dm)return<div style={{display:"flex",flexDirection:"column",height:"70vh"}}><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><button onClick={()=>setDm(null)} style={{background:"transparent",border:"none",color:"#6EE7B7",fontSize:20,padding:0}}>←</button><Av u={dm} s={32}/><div style={{fontWeight:700,fontSize:13}}>{dm.name}</div></div><div ref={ref} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:7,paddingBottom:10}}>{(messages[key(cu.id,dm.id)]||[]).map((msg,i)=>{const mine=msg.from===cu.id;return<div key={i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}><div style={{background:mine?`${cu.color||"#6EE7B7"}33`:"#ffffff0f",border:`1px solid ${mine?(cu.color||"#6EE7B7")+"33":"#ffffff15"}`,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"8px 12px",maxWidth:"75%",fontSize:13}}>{msg.text}</div></div>;})}
</div><div style={{display:"flex",gap:7}}><input placeholder="Message…" value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,fontSize:13}}/><button onClick={send} style={{background:`${cu.color||"#6EE7B7"}22`,border:`1px solid ${cu.color||"#6EE7B7"}55`,color:cu.color||"#6EE7B7",padding:"0 14px",borderRadius:9,fontWeight:700}}>→</button></div></div>;
return<div><div style={{fontWeight:700,fontSize:17,marginBottom:14}}>Direct Messages</div>{users.filter(u=>u.id!==cu.id).map(u=>{const k=key(cu.id,u.id),conv=messages[k]||[],last=conv[conv.length-1];return<div key={u.id} onClick={()=>setDm(u)} className="card" style={{marginBottom:9,cursor:"pointer",display:"flex",gap:9,alignItems:"center"}}><div style={{position:"relative"}}><Av u={u} s={40}/><div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:"#6EE7B7",border:"2px solid #080810"}}/></div><div style={{flex:1,overflow:"hidden"}}><div style={{fontWeight:700,fontSize:13}}>{u.name}</div><div style={{fontSize:12,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?last.text:"Start a conversation…"}</div></div></div>;})}
</div>;};

// ── PROFILE TAB ──
const ProfileTab=({cu,lb,pd,setPd,notify})=>{const [nw,setNw]=useState("");const [nm,setNm]=useState(3);const [nn,setNn]=useState("");const myLB=lb.find(e=>e.uid===cu.id);const myR=lb.findIndex(e=>e.uid===cu.id)+1;
const save=()=>{const today=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});if(nw){const v=parseFloat(nw);if(!isNaN(v))setPd(p=>({...p,weight:[...p.weight.slice(-6),{date:today,val:v}]}))}setPd(p=>({...p,mood:[...p.mood.slice(-6),{date:today,val:nm}]}));if(nn.trim())setPd(p=>({...p,notes:[...p.notes,nn]}));setNw("");setNn("");setNm(3);notify("🔒 Saved!");};
return<div><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}><Av u={cu} s={50}/><div><div style={{fontWeight:800,fontSize:18}}>{cu.name}</div><div style={{fontSize:12,color:"#888"}}>{cu.role}{cu.is_admin?" · 👑 Admin":""}</div><div style={{fontSize:10,color:"#6EE7B7",marginTop:2}}>🔒 Private</div></div></div>
<div style={{display:"flex",gap:7,marginBottom:10}}>{[["#"+(myR||"–"),"Rank","#6EE7B7"],[(myLB?.str||0)+"🔥","Streak","#FCD34D"],[(myLB?.pts||0).toLocaleString(),"Points","#93C5FD"]].map(([v,l,c])=><div key={l} className="card" style={{flex:1,textAlign:"center",padding:12}}><div style={{fontWeight:800,fontSize:16,color:c}}>{v}</div><div style={{fontSize:10,color:"#888"}}>{l}</div></div>)}</div>
<div className="card" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13}}>⚖️ Weight</div><div style={{fontSize:12,color:"#6EE7B7",fontWeight:700}}>{pd.weight[pd.weight.length-1]?.val} kg</div></div><Spk sid="wt" data={pd.weight} color="#6EE7B7"/></div>
<div className="card" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13}}>😊 Mood</div><div style={{fontSize:12,color:"#F9A8D4",fontWeight:700}}>{pd.mood[pd.mood.length-1]?.val}/5</div></div><Spk sid="md" data={pd.mood} color="#F9A8D4"/></div>
<div className="card" style={{marginBottom:9}}><div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📓 Journal</div>{pd.notes.map((n,i)=><div key={i} style={{fontSize:12,color:"#888",borderLeft:"2px solid #ffffff10",paddingLeft:7,marginBottom:5}}>{n}</div>)}</div>
<div className="card"><div style={{fontWeight:700,marginBottom:12}}>Log Today</div><Inp label="Weight (kg)" placeholder="72.5" type="number" min="0" value={nw} onChange={e=>setNw(e.target.value)}/><div style={{fontSize:11,color:"#888",marginBottom:6}}>Mood: <span style={{color:"#F9A8D4",fontWeight:700}}>{["😔","😕","😐","🙂","😄"][nm-1]}</span></div><div style={{display:"flex",gap:4,marginBottom:9}}>{[1,2,3,4,5].map(v=><button key={v} onClick={()=>setNm(v)} style={{flex:1,padding:"6px 0",borderRadius:9,border:`1px solid ${nm===v?"#F9A8D455":"#ffffff15"}`,background:nm===v?"#F9A8D420":"transparent",fontSize:15}}>{["😔","😕","😐","🙂","😄"][v-1]}</button>)}</div><textarea placeholder="Journal note…" rows={2} value={nn} onChange={e=>setNn(e.target.value)} style={{resize:"none",marginBottom:9}}/><button onClick={save} style={{width:"100%",background:"linear-gradient(135deg,#6EE7B733,#93C5FD22)",border:"1px solid #6EE7B755",color:"#6EE7B7",padding:"11px",borderRadius:11,fontWeight:700}}>🔒 Save Privately</button></div>
</div>;};

// ── ADMIN TAB ──
const AdminTab=({cu,users,setUsers,challenges,setChallenges,notify,addNotif,session,onTipCreated})=>{
  const [sec,setSec]=useState("overview");
  const [chF,setChF]=useState({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7",type:"count",physioNote:""});
  const [tipF,setTipF]=useState({title:"",content:"",body_part:"general",emoji:"💡",color:"#6EE7B7"});
  const [inviteLink,setInviteLink]=useState("");
  const [teams,setTeams]=useState([]);
  const [newTeam,setNewTeam]=useState({name:"",emoji:"👥",color:"#6EE7B7"});
  const [generating,setGenerating]=useState(false);
  const [savingTip,setSavingTip]=useState(false);

  useEffect(()=>{
    supabase.from('teams').select('*').then(({data})=>{ if(data) setTeams(data); });
  },[]);

  const createTeam=async()=>{
    if(!newTeam.name.trim())return;
    const {data,error}=await supabase.from('teams').insert({name:newTeam.name,emoji:newTeam.emoji,color:newTeam.color}).select().single();
    if(!error&&data){setTeams(t=>[...t,data]);setNewTeam({name:"",emoji:"👥",color:"#6EE7B7"});notify(`✅ Team "${data.name}" created!`);}
  };

  const generateInviteLink=async(teamId)=>{
    setGenerating(true);
    const code=Math.random().toString(36).slice(2,10);
    const {error}=await supabase.from('invite_links').insert({team_id:teamId,code,created_by:session.user.id,active:true});
    if(!error){const link=`${window.location.origin}/join/${code}`;setInviteLink(link);notify("✅ Invite link created!");}
    setGenerating(false);
  };

  const createCh=async()=>{
    if(!chF.title||!chF.goal)return;
    const end=new Date(Date.now()+7*864e5).toISOString().split("T")[0];
    const newCh={id:Date.now(),...chF,goal:parseFloat(chF.goal),active:true,endDate:end};
    setChallenges(c=>[...c,newCh]);
    setChF({title:"",icon:"🏃",unit:"",goal:"",color:"#6EE7B7",type:"count",physioNote:""});
    notify("✅ Challenge created!");
    addNotif("challenge",`New challenge: ${chF.title}`);
  };

  const createTip=async()=>{
    if(!tipF.title||!tipF.content)return;
    setSavingTip(true);
    const {data,error}=await supabase.from('physio_tips').insert({
      title:tipF.title,content:tipF.content,body_part:tipF.body_part,
      emoji:tipF.emoji,color:BP_COLORS[tipF.body_part]||"#6EE7B7",
      author_id:session.user.id
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

  const SECS=[["overview","Overview","🏠"],["tips","Physio Tips","💡"],["teams","Teams","👥"],["challenges","Challenges","🏆"]];

  return<div>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><span style={{fontWeight:700,fontSize:17}}>Admin Panel</span><Pill color="#C4B5FD" text="ADMIN"/></div>
    <div style={{display:"flex",gap:4,marginBottom:14,overflowX:"auto"}}>{SECS.map(([id,lbl,icon])=><button key={id} onClick={()=>setSec(id)} style={{flexShrink:0,padding:"7px 12px",borderRadius:10,border:`1px solid ${sec===id?"#C4B5FD55":"#ffffff15"}`,background:sec===id?"#C4B5FD18":"transparent",color:sec===id?"#C4B5FD":"#888",fontWeight:700,fontSize:12,display:"flex",gap:4,alignItems:"center"}}><span>{icon}</span>{lbl}</button>)}</div>

    {sec==="overview"&&<div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
        {[[users.length,"Members","#6EE7B7"],[teams.length,"Teams","#93C5FD"],[challenges.filter(c=>c.active).length,"Active","#F9A8D4"]].map(([v,l,c])=><div key={l} className="card" style={{flex:"1 1 80px",padding:12}}><div style={{fontWeight:800,fontSize:22,color:c}}>{v}</div><div style={{fontSize:10,color:"#888"}}>{l}</div></div>)}
      </div>
      <div className="card"><div style={{fontWeight:700,marginBottom:9}}>Quick Actions</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><Btn color="#6EE7B7" text="💡 Post Tip" onClick={()=>setSec("tips")}/><Btn color="#93C5FD" text="👥 New Team" onClick={()=>setSec("teams")}/><Btn color="#F9A8D4" text="🏆 Challenge" onClick={()=>setSec("challenges")}/></div></div>
    </div>}

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
        <button onClick={()=>setChallenges(c=>c.map(x=>x.id===ch.id?{...x,active:!x.active}:x))} style={{background:`${ch.active?"#FCD34D":"#6EE7B7"}15`,border:`1px solid ${ch.active?"#FCD34D":"#6EE7B7"}33`,color:ch.active?"#FCD34D":"#6EE7B7",borderRadius:8,padding:"4px 8px",fontSize:11,fontWeight:700}}>{ch.active?"Pause":"Resume"}</button>
      </div>)}
    </div>}
  </div>;
};

// ── LOG MODAL ──
const LogModal=({onClose,challenges,cu,setFeed,setLb,notify,initialChallenge})=>{
  const a=challenges.filter(c=>c.active);
  const [sel,setSel]=useState(initialChallenge||a[0]);
  const [val,setVal]=useState("");
  const [note,setNote]=useState("");
  const isHabit=sel?.type==="habit";

  const submit=()=>{
    if(!sel)return;
    const v=isHabit?1:parseFloat(val);
    if(!isHabit&&(isNaN(v)||v<=0))return;
    setFeed(f=>[{id:Date.now(),uid:cu.id,cid:sel.id,val:v,note,ts:Date.now(),comments:[],rx:{}},...f]);
    setLb(l=>{
      const pts=isHabit?100:v;
      const ex=l.find(e=>e.uid===cu.id);
      const nx=ex?l.map(e=>e.uid===cu.id?{...e,pts:e.pts+pts}:e):[...l,{uid:cu.id,pts,str:1}];
      return[...nx].sort((a,b)=>b.pts-a.pts);
    });
    notify(`✅ ${sel.icon} Logged!`);
    onClose();
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
  const [lb,setLb]=useState(ILB);
  const [msgs,setMsgs]=useState(IM);
  const [challenges,setChallenges]=useState(IC);
  const [users,setUsers]=useState([]);
  const [tips,setTips]=useState([]);
  const [showLog,setShowLog]=useState(null);
  const [showNotifs,setShowNotifs]=useState(false);
  const [checked,setChecked]=useState(false);
  const [toasts,setToasts]=useState([]);
  const [pd,setPd]=useState(IP);
  const [notifs,setNotifs]=useState([
    {id:1,type:"badge",text:"Welcome to VibeFit! 🎉",ts:N-3600000,read:false},
  ]);

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

  // Load physio tips
  useEffect(()=>{
    supabase.from('physio_tips').select('*').order('created_at',{ascending:false})
      .then(({data})=>{ if(data) setTips(data); });
  },[]);

  const notify=useCallback(msg=>{const id=Date.now();setToasts(ts=>[...ts,{id,msg}]);setTimeout(()=>setToasts(ts=>ts.filter(x=>x.id!==id)),3000);},[]);
  const addNotif=useCallback((type,text)=>setNotifs(n=>[{id:Date.now(),type,text,ts:Date.now(),read:false},...n]),[]);
  const handleTipCreated=useCallback(tip=>setTips(t=>[tip,...t]),[]);

  if(profileLoading) return(
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontWeight:800,fontSize:24,background:"linear-gradient(90deg,#6EE7B7,#93C5FD)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>VIBEFIT</div>
    </div>
  );

  const unread=notifs.filter(n=>!n.read).length;
  const myR=lb.findIndex(e=>e.uid===cu?.id)+1;
  const allUsers=[cu,...users.filter(u=>u.id!==cu?.id)];
  const NAV=[["feed","Feed","📣"],["challenges","Train","🏆"],["leaderboard","Board","🥇"],["messages","DMs","💬"],["ai","AI ✨","🤖"],...(cu?.is_admin?[["admin","Admin","⚙️"]]:[]),["profile","Me","👤"]];

  return<>
    <style>{makeCSS(th)}</style>
    <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:7,alignItems:"center",pointerEvents:"none"}}>
      {toasts.map(t=><div key={t.id} style={{background:"#13131f",border:"1px solid #6EE7B755",borderRadius:13,padding:"9px 18px",fontSize:13,color:"#6EE7B7",backdropFilter:"blur(12px)",whiteSpace:"nowrap",animation:"ti 3s ease both"}}>{t.msg}</div>)}
    </div>
    {showNotifs&&<><div style={{position:"fixed",inset:0,zIndex:799}} onClick={()=>setShowNotifs(false)}/><NotifsPanel notifs={notifs} onClose={()=>setShowNotifs(false)} onRead={id=>setNotifs(n=>n.map(x=>x.id===id?{...x,read:true}:x))}/></>}
    {showLog&&<LogModal onClose={()=>setShowLog(null)} challenges={challenges} cu={cu} setFeed={setFeed} setLb={setLb} notify={notify} initialChallenge={typeof showLog==="object"?showLog:null}/>}

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
          <FeedTab feed={feed} setFeed={setFeed} challenges={challenges} users={allUsers} cu={cu} notify={notify} checked={checked} setChecked={setChecked} tips={tips}/>
        </>}
        {tab==="challenges"&&<ChalTab challenges={challenges} feed={feed} cu={cu} onLog={ch=>setShowLog(ch)}/>}
        {tab==="leaderboard"&&<LbTab lb={lb} users={allUsers} challenges={challenges} cu={cu}/>}
        {tab==="messages"&&<MsgTab cu={cu} users={allUsers} messages={msgs} setMessages={setMsgs}/>}
        {tab==="ai"&&<AiTab challenges={challenges} setChallenges={setChallenges} notify={notify}/>}
        {tab==="admin"&&cu?.is_admin&&<AdminTab cu={cu} users={allUsers} setUsers={setUsers} challenges={challenges} setChallenges={setChallenges} notify={notify} addNotif={addNotif} session={session} onTipCreated={handleTipCreated}/>}
        {tab==="profile"&&<ProfileTab cu={cu} lb={lb} pd={pd} setPd={setPd} notify={notify}/>}
      </div>
    </div>
  </>;
}
