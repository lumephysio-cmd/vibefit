import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// ── STRETCH DATA ──────────────────────────────────────────────────────────────
const AREAS = [
  { id:'neck',      label:'Neck',        icon:'🤔', color:'#FCD34D' },
  { id:'lower_back',label:'Lower Back',  icon:'😣', color:'#F9A8D4' },
  { id:'shoulders', label:'Shoulders',   icon:'🏋️', color:'#93C5FD' },
  { id:'wrists',    label:'Wrists',      icon:'✋', color:'#6EE7B7' },
  { id:'hips',      label:'Hips',        icon:'🦵', color:'#C4B5FD' },
  { id:'eyes',      label:'Eyes',        icon:'👁️', color:'#FB923C' },
];

const STRETCHES = {
  neck: [
    {
      name:'Chin Tuck',
      pos:'🪑',
      time:'10 sec × 5 reps',
      diff:'Easy',
      steps:[
        'Sit tall, eyes looking straight ahead',
        'Without tilting your head, draw your chin straight back (think "double chin")',
        'Hold for 10 seconds — you should feel a stretch at the base of your skull',
        'Release slowly. Repeat 5 times',
      ],
      physio:'The #1 exercise for forward head posture. Every centimetre your head sits in front of your shoulders adds ~4kg of load to your cervical spine. This reactivates the deep neck flexors and decompresses the upper discs.',
    },
    {
      name:'Lateral Neck Tilt',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Sit tall and relax your shoulders down away from your ears',
        'Tilt your right ear toward your right shoulder — don\'t rotate, just tilt',
        'For a deeper stretch, gently place your right hand on the left side of your head',
        'Hold 30 seconds, breathe, then switch sides',
      ],
      physio:'Stretches the upper trapezius and levator scapulae — the two muscles most chronically overloaded during desk work. Releasing these reduces tension headaches and neck stiffness.',
    },
    {
      name:'Neck Rotation',
      pos:'🪑',
      time:'5 slow reps each side',
      diff:'Easy',
      steps:[
        'Sit tall, chin slightly tucked',
        'Slowly turn your head to look over your right shoulder as far as comfortable',
        'Hold for 3 seconds at the end range',
        'Return to centre and repeat on the left. Move slowly — no bouncing',
      ],
      physio:'Maintains rotational range in the cervical spine. Office workers typically lose rotation range faster than any other movement — 5 minutes of sustained typing can reduce range by 15%.',
    },
    {
      name:'Upper Trapezius Stretch',
      pos:'🪑',
      time:'45 sec each side',
      diff:'Easy',
      steps:[
        'Sit tall. Reach your right arm under the chair seat and grip it',
        'This anchors the right shoulder down',
        'Drop your left ear toward your left shoulder until you feel a strong stretch',
        'You can add a gentle forward tilt of the chin for more intensity',
        'Hold 45 sec, breathe deeply, then switch sides',
      ],
      physio:'Gripping the chair prevents the shoulder from hiking — this isolates the upper trap stretch perfectly. Chronically tight upper traps are one of the most common causes of cervicogenic headaches in office workers.',
    },
  ],
  lower_back: [
    {
      name:'Seated Lumbar Rotation',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Sit upright, feet flat on the floor, hip-width apart',
        'Cross your arms over your chest or place your hands on your knees',
        'Slowly rotate your upper body to the right, keeping hips square',
        'Hold at end range for 30 seconds, breathing into the stretch',
        'Return to centre and rotate to the left',
      ],
      physio:'Restores rotational mobility lost from sustained sitting. Spinal rotation also helps pump fluid back into lumbar discs — they are avascular and rely entirely on movement for nutrition.',
    },
    {
      name:'Seated Figure-4 (Pigeon)',
      pos:'🪑',
      time:'45 sec each side',
      diff:'Easy',
      steps:[
        'Sit on the edge of your chair, upright posture',
        'Lift your right ankle and rest it on your left knee, forming a figure-4',
        'Gently press your right knee down while leaning slightly forward',
        'You should feel a deep stretch in your right glute and outer hip',
        'Hold 45 sec, switch sides',
      ],
      physio:'Stretches the piriformis — a muscle that runs beneath the gluteus maximus. When tight, it can irritate the sciatic nerve. This is the single most effective seated stretch for people with desk-related lower back and hip pain.',
    },
    {
      name:'Seated Cat-Cow',
      pos:'🪑',
      time:'8–10 slow reps',
      diff:'Easy',
      steps:[
        'Sit on the edge of your chair, hands on your knees',
        'Cow: arch your lower back, lift your chest, look slightly upward (inhale)',
        'Cat: round your lower back, tuck your chin to your chest, and push your spine backward (exhale)',
        'Flow slowly between the two — this should feel like a gentle wave through your spine',
      ],
      physio:'Alternating flexion and extension is the most evidence-based movement for disc health. It restores the natural fluid exchange in the nucleus pulposus of each disc. This is often prescribed as a first-line treatment for non-specific lower back pain.',
    },
    {
      name:'Standing Hip Flexor Stretch',
      pos:'🧍',
      time:'40 sec each side',
      diff:'Moderate',
      steps:[
        'Stand behind your chair, holding the back for balance',
        'Step your right foot back into a split stance, keeping both feet pointing forward',
        'Bend your front knee slightly and tuck your pelvis under (posterior tilt)',
        'You should feel a stretch in the front of the right hip — not the lower back',
        'Hold 40 sec, switch sides',
      ],
      physio:'The iliopsoas (hip flexor) shortens in a seated position and pulls the lumbar spine into an exaggerated curve when you stand. Stretching it is essential for anyone sitting more than 4 hours per day.',
    },
  ],
  shoulders: [
    {
      name:'Cross-Body Shoulder Stretch',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Bring your right arm across your body at shoulder height',
        'Hook your left hand or forearm around the right elbow to anchor it',
        'Keep your right shoulder down — don\'t let it ride up to your ear',
        'Hold 30 seconds, breathing deeply into the back of the right shoulder',
      ],
      physio:'Targets the posterior shoulder capsule, which tightens significantly from mouse use and forward reaching. This stretch directly reduces the risk of impingement syndrome — one of the most common repetitive strain injuries in office workers.',
    },
    {
      name:'Chest Opener / Doorway Stretch',
      pos:'🧍',
      time:'30 sec × 2',
      diff:'Easy',
      steps:[
        'Stand in a doorway (or use the wall). Raise your right arm to 90°, elbow bent to 90°',
        'Place your right forearm flat against the doorframe',
        'Step your right foot forward and gently rotate your body away from the wall',
        'You should feel a stretch across the chest and front of the shoulder',
        'Hold 30 sec, repeat on the other side, then do both arms simultaneously',
      ],
      physio:'Counteracts the pectoralis minor shortening that comes from sustained forward posture. Tight pec minor tilts the scapula forward and compresses the brachial plexus — this can cause referred pain down the arm that is often misdiagnosed.',
    },
    {
      name:'Scapular Retraction',
      pos:'🪑',
      time:'2 sec hold × 15 reps',
      diff:'Easy',
      steps:[
        'Sit tall, arms at your sides',
        'Pull both shoulder blades together toward your spine — imagine squeezing a pencil between them',
        'Hold for 2 seconds (don\'t shrug up)',
        'Release fully. Repeat 15 times',
      ],
      physio:'This is a strengthening exercise, not just a stretch. The rhomboids and mid-trapezius become inhibited and weakened from prolonged forward posture. Re-activating them directly improves shoulder alignment and reduces shoulder and neck pain.',
    },
    {
      name:'Thread the Needle (Seated)',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Sit upright, raise your right arm overhead',
        'Bend your elbow and drop your right hand down your upper back (palm facing out)',
        'Use your left hand to gently press the right elbow back or downward',
        'Hold 30 seconds — you should feel this in the right tricep and side of shoulder',
      ],
      physio:'Stretches the tricep brachii and lateral shoulder, which tighten from sustained keyboard use. Also improves shoulder internal rotation range — critical for healthy overhead movement.',
    },
  ],
  wrists: [
    {
      name:'Wrist Extension Stretch',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Extend your right arm in front of you, palm facing up',
        'Use your left hand to gently bend your right wrist downward (fingers pointing toward the floor)',
        'Keep the elbow straight and hold for 30 seconds',
        'You should feel this along the underside of the forearm (wrist flexors)',
      ],
      physio:'The wrist flexors (forearm underside) shorten from hours of keyboard typing. This stretches the flexor digitorum superficialis and profundus — tightness here is the primary driver of carpal tunnel pressure.',
    },
    {
      name:'Wrist Flexion Stretch',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Extend your right arm in front of you, palm facing down',
        'Use your left hand to gently bend your right wrist upward (fingers pointing toward the ceiling)',
        'Keep the elbow straight and hold for 30 seconds',
        'You should feel this along the top of the forearm (wrist extensors)',
      ],
      physio:'Stretches the extensor group, which is overloaded from holding the wrist in a neutral-to-extended position while mousing. Tight extensors are a common cause of lateral epicondylitis (tennis elbow) in desk workers.',
    },
    {
      name:'Prayer Hands Stretch',
      pos:'🪑',
      time:'20 sec × 3 reps',
      diff:'Easy',
      steps:[
        'Press your palms together in front of your chest, fingers pointing upward (prayer position)',
        'Keeping palms together, slowly lower your hands toward your waist',
        'Stop when you feel a strong stretch in your wrists and forearms',
        'Hold 20 seconds. For more intensity, try reverse prayer: backs of hands together',
      ],
      physio:'Provides a combined stretch of both wrist flexors and extensors simultaneously. Particularly helpful as a break exercise every 45–60 minutes to prevent repetitive strain injury (RSI) accumulation.',
    },
    {
      name:'Finger Spreads & Fist Pumps',
      pos:'🪑',
      time:'10 reps, 2–3 sets',
      diff:'Easy',
      steps:[
        'Hold both hands in front of you, palms facing you',
        'Slowly spread all fingers as wide as possible — hold 3 seconds',
        'Make a gentle fist, squeezing all fingers in — hold 3 seconds',
        'Alternate between spread and fist for 10 slow reps',
      ],
      physio:'Activates the intrinsic hand muscles (lumbricals and interossei) which are underused during typing. Regular movement flushes lactic acid from the finger flexor tendons and reduces synovial stiffness in the finger joints.',
    },
  ],
  hips: [
    {
      name:'Seated Figure-4 (Deep)',
      pos:'🪑',
      time:'60 sec each side',
      diff:'Easy',
      steps:[
        'Sit upright on the edge of your chair',
        'Place your right ankle on your left knee',
        'Press gently on the right knee to lower it toward horizontal',
        'Now lean your torso forward from the hip until you feel a deep glute stretch',
        'Hold for 60 seconds — use breath to allow the muscle to relax into the stretch',
      ],
      physio:'Extended holds (>45 sec) are required for real change in hip external rotator flexibility. The piriformis and obturator externus have very dense connective tissue — brief stretches don\'t penetrate deeply enough.',
    },
    {
      name:'Hip Flexor Lunge Stretch',
      pos:'🧍',
      time:'45 sec each side',
      diff:'Moderate',
      steps:[
        'Stand and step your right leg back into a lunge position, right knee lowered toward the floor',
        'Keep your front shin vertical (knee over ankle)',
        'Tuck your pelvis under (squeeze right glute gently) — this is key to feeling the hip flexor, not the lower back',
        'Hold 45 sec, breathe, switch sides',
      ],
      physio:'The iliopsoas is the most shortened muscle from prolonged sitting. When it can\'t fully extend at the hip, the lower back compensates — this is the root cause of most occupational lower back pain. Daily hip flexor stretching has a measurable effect within 3 weeks.',
    },
    {
      name:'Seated Glute & Spine Twist',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Sit tall, cross your right ankle over your left knee (figure-4)',
        'Place your right hand on the right knee, left hand on the outside of the right knee',
        'Gently rotate your torso to the right, using the knee as a lever for more hip depth',
        'Hold 30 seconds, looking over your right shoulder',
      ],
      physio:'Combines hip external rotation and spinal rotation in one movement. This is particularly effective because rotation helps decompress facet joints in the lumbar spine while simultaneously addressing hip tightness.',
    },
    {
      name:'Seated Knee-to-Chest',
      pos:'🪑',
      time:'30 sec each side',
      diff:'Easy',
      steps:[
        'Sit tall on the edge of your chair',
        'Lift your right knee and clasp both hands around your shin, just below the knee',
        'Gently pull the knee toward your chest until you feel a stretch in the right glute and hip',
        'Hold 30 seconds, breathing into the stretch — don\'t round your back',
      ],
      physio:'Stretches the gluteus maximus and posterior hip capsule. Also gently flexes the lumbar spine, which helps to counteract the compressive load from prolonged sitting in extension.',
    },
  ],
  eyes: [
    {
      name:'20-20-20 Rule',
      pos:'🧍',
      time:'20 sec every 20 min',
      diff:'Easy',
      steps:[
        'Set a timer every 20 minutes',
        'Stop what you\'re doing and look at an object at least 20 feet (6m) away',
        'Blink slowly and fully 5–10 times while focusing on the distant object',
        'Hold for 20 seconds before returning to your screen',
      ],
      physio:'The ciliary muscle inside your eye contracts to maintain close focus — sustained near work causes it to fatigue, leading to headaches, blur and difficulty switching focus. This simple rule is clinically proven to significantly reduce digital eye strain.',
    },
    {
      name:'Eye Palming',
      pos:'🪑',
      time:'60 sec',
      diff:'Easy',
      steps:[
        'Rub your palms together vigorously for 10 seconds to generate warmth',
        'Cup both palms gently over your closed eyes — fingertips on your forehead, heels of hands on your cheeks',
        'Don\'t press on the eyeballs themselves — create a light, warm dome',
        'Breathe slowly and relax for 60 seconds',
      ],
      physio:'Warmth relaxes the orbicularis oculi (the muscle ring around the eye) and promotes natural tear production. The complete darkness also gives the retinal photoreceptors a chance to recover from photopigment bleaching caused by screen brightness.',
    },
    {
      name:'Near-Far Focus Switching',
      pos:'🪑',
      time:'10 reps',
      diff:'Easy',
      steps:[
        'Hold your thumb 15–20cm from your nose',
        'Focus sharply on your thumbnail for 3 seconds',
        'Then shift your focus to an object as far away as possible for 3 seconds',
        'Alternate back and forth 10 times — move slowly and deliberately between each',
      ],
      physio:'Exercises the ciliary muscle through its full range of contraction and relaxation — essentially a strength + flexibility workout for accommodation. This prevents the progressive loss of near-far focusing ability that digital workers experience.',
    },
    {
      name:'Full Blink Reset',
      pos:'🪑',
      time:'1 min',
      diff:'Easy',
      steps:[
        'Let your eyes close naturally',
        'Scrunch your eyelids together gently (not a tight squeeze — about 30% effort) for 3 seconds',
        'Release and let your eyes open softly',
        'Repeat 5 times, then finish by blinking rapidly for 5 seconds',
      ],
      physio:'Screen users blink 3× less per minute than normal. Incomplete blinking leaves the lower third of the cornea exposed and unlubricated. The scrunch-release sequence forces a full blink that spreads the tear film uniformly across the entire cornea surface.',
    },
  ],
};

// ── POSTURE DIAGRAM ───────────────────────────────────────────────────────────
const PostureDiagram = () => {
  const [hover, setHover] = useState(null);
  const NOTES = {
    monitor:'Monitor top at eye level — the top edge of the screen aligns with your eyes. Screen 50–70cm away (arm\'s length). Your gaze angles slightly downward (10–20°) to the centre of the screen.',
    head:'Head directly over shoulders, chin slightly tucked. Every 2.5cm of forward head posture adds ~5kg of load to the cervical spine.',
    shoulders:'Shoulders relaxed and down, not hunched. Shoulder blades gently drawn toward the spine. Elbows stay close to your sides.',
    arms:'Upper arms hang nearly vertical. Elbows at ~90°. Forearms rest flat on the desk. Wrists neutral — not bent up or down.',
    back:'Back at 100–110° (slight recline). Lumbar curve supported. This reduces disc pressure compared to sitting bolt upright at 90°.',
    hips:'Hips at ~90–100°. Weight distributed evenly on both sit bones. Knees at or slightly below hip level. Never cross your legs.',
    feet:'Feet flat on the floor, hip-width apart. Knees at ~90°. If feet don\'t reach, use a footrest.',
  };

  const SK='#C8956C', HR='#3D2410', TP='#2B4785', PT='#1A2E45', SH='#0F0F1E';
  const hc = id => hover===id ? '#FCD34D' : '#ffffff38';
  const lc = id => hover===id ? '#FCD34D30' : '#ffffff15';
  const DotLine = ({id,dot,l1,l2}) => (
    <g style={{cursor:'pointer'}} onMouseEnter={()=>setHover(id)} onMouseLeave={()=>setHover(null)} onClick={()=>setHover(hover===id?null:id)}>
      <line x1={l1[0]} y1={l1[1]} x2={l2[0]} y2={l2[1]} stroke={lc(id)} strokeWidth="1" strokeDasharray="4,3"/>
      <circle cx={dot[0]} cy={dot[1]} r="5" fill={hc(id)}/>
    </g>
  );

  return (
    <div style={{position:'relative'}}>
      <svg viewBox="0 0 340 435" style={{width:'100%',maxWidth:360,display:'block',margin:'0 auto'}}>

        {/* ── FLOOR ── */}
        <line x1="40" y1="424" x2="318" y2="424" stroke="#ffffff10" strokeWidth="1.5"/>

        {/* ── DESK surface at y=205, elbow height ── */}
        <rect x="58" y="205" width="264" height="9" rx="3" fill="#2a2a3e" stroke="#ffffff18" strokeWidth="1"/>
        <rect x="60" y="205" width="260" height="2.5" rx="1" fill="#ffffff0c"/>
        <rect x="303" y="214" width="9" height="207" rx="3" fill="#2a2a3e"/>

        {/* ── CHAIR ── */}
        <rect x="54" y="118" width="15" height="157" rx="7" fill="#1e1e30" stroke="#ffffff14" strokeWidth="1"/>
        <rect x="61" y="268" width="106" height="14" rx="6" fill="#1e1e30" stroke="#ffffff18" strokeWidth="1"/>
        <rect x="63" y="269" width="102" height="4" rx="2" fill="#ffffff08"/>

        {/* ── KEYBOARD ── */}
        <rect x="128" y="197" width="60" height="10" rx="3" fill="#14142a" stroke="#ffffff18" strokeWidth="1"/>
        <rect x="130" y="199" width="56" height="6" rx="2" fill="#ffffff07"/>

        {/* ── MONITOR — top edge (y=62) matches eye level (head cy=70, eyes ~y=64) ── */}
        <rect x="192" y="62" width="104" height="76" rx="6" fill="#0d0d1a" stroke="#6EE7B766" strokeWidth="1.5"/>
        <rect x="196" y="66" width="96" height="68" rx="4" fill="#6EE7B710"/>
        <rect x="202" y="77"  width="54" height="3"  rx="1.5" fill="#6EE7B738"/>
        <rect x="202" y="86"  width="74" height="2"  rx="1"   fill="#ffffff16"/>
        <rect x="202" y="93"  width="50" height="2"  rx="1"   fill="#ffffff10"/>
        <rect x="202" y="100" width="65" height="2"  rx="1"   fill="#ffffff0c"/>
        <rect x="202" y="107" width="40" height="2"  rx="1"   fill="#ffffff09"/>
        {/* subtle eye-level guide */}
        <line x1="80" y1="64" x2="192" y2="64" stroke="#FCD34D15" strokeWidth="1" strokeDasharray="5,4"/>
        {/* stand */}
        <line x1="244" y1="138" x2="244" y2="203" stroke="#ffffff22" strokeWidth="3" strokeLinecap="round"/>
        <rect x="227" y="200" width="34" height="7" rx="3" fill="#2a2a3e" stroke="#ffffff15" strokeWidth="1"/>

        {/* ══ ANATOMICAL FEMALE FIGURE ══ */}

        {/* HAIR — professional bun */}
        <ellipse cx="79" cy="52" rx="17" ry="15" fill={HR}/>
        <path d="M 75 63 Q 71 51 75 42 Q 81 33 93 35 Q 106 38 106 52 Q 105 64 97 69 Q 88 67 75 63Z" fill={HR}/>

        {/* HEAD — skin toned, facing right */}
        <ellipse cx="93" cy="70" rx="19" ry="22" fill={SK}/>
        <ellipse cx="106" cy="64" rx="3" ry="2.2" fill="#5A3520" opacity="0.75"/>
        <path d="M 109 72 Q 112 77 109 79" stroke="#A87050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* NECK */}
        <path d="M 88 90 C 88 100 89 110 89 115 L 97 115 C 97 110 98 100 97 90 Z" fill={SK}/>

        {/* TORSO — professional blouse, side profile, slight recline */}
        <path d="
          M 78 118
          C 72 143 70 172 72 203
          C 73 227 76 253 79 268
          C 82 277 93 281 105 278
          C 115 275 120 265 118 257
          C 117 241 115 221 114 210
          C 114 196 115 180 117 169
          C 118 155 117 141 113 131
          C 110 122 104 112 96 110
          L 86 110
          C 82 111 78 115 78 118 Z
        " fill={TP}/>
        {/* collar skin gap */}
        <path d="M 89 110 C 90 117 94 119 97 110 Z" fill={SK}/>

        {/* RIGHT UPPER ARM — nearly vertical sleeve down to desk */}
        <path d="M 112 121 C 116 150 120 174 121 205 L 128 204 C 128 174 126 150 122 121 Z" fill={TP}/>

        {/* RIGHT FOREARM — skin, horizontal on desk */}
        <path d="M 121 205 C 121 209 121 211 122 212 L 163 212 C 164 211 165 208 165 205 L 128 204 Z" fill={SK}/>

        {/* HAND */}
        <ellipse cx="167" cy="208" rx="8" ry="5" fill={SK}/>

        {/* LEFT UPPER ARM — hanging slightly back */}
        <path d="M 78 118 C 74 137 70 160 69 174 L 76 175 C 77 160 80 138 83 119 Z" fill={TP}/>

        {/* THIGHS — pants, near-horizontal */}
        <path d="M 80 268 C 80 281 168 282 170 268 C 170 260 80 259 80 268 Z" fill={PT}/>

        {/* KNEE */}
        <ellipse cx="169" cy="276" rx="9" ry="7" fill={PT}/>

        {/* SHIN — pants, vertical */}
        <path d="M 159 281 C 157 370 157 398 159 416 L 180 416 C 182 398 182 370 180 281 Z" fill={PT}/>

        {/* SHOE */}
        <path d="M 156 414 C 155 420 157 424 160 424 L 198 424 C 202 424 204 420 202 415 L 180 416 Z" fill={SH}/>

        {/* ── ANGLE ARCS ── */}
        <path d="M 113 208 A 12 12 0 0 1 124 196" stroke="#93C5FD55" strokeWidth="1.5" fill="none"/>
        <text x="126" y="195" fontSize="7.5" fill="#93C5FD99" fontFamily="system-ui">~90°</text>

        <path d="M 105 269 A 14 14 0 0 1 92 256" stroke="#6EE7B755" strokeWidth="1.5" fill="none"/>
        <text x="107" y="257" fontSize="7.5" fill="#6EE7B799" fontFamily="system-ui">~100°</text>

        <path d="M 172 286 A 11 11 0 0 1 182 276" stroke="#6EE7B755" strokeWidth="1.5" fill="none"/>
        <text x="180" y="290" fontSize="7.5" fill="#6EE7B799" fontFamily="system-ui">~90°</text>

        {/* ── INTERACTIVE DOTS ── */}
        <DotLine id="head"      dot={[46,70]}   l1={[46,70]}   l2={[74,70]}/>
        <DotLine id="shoulders" dot={[46,118]}  l1={[46,118]}  l2={[78,118]}/>
        <DotLine id="hips"      dot={[46,268]}  l1={[46,268]}  l2={[78,268]}/>
        <DotLine id="monitor"   dot={[308,100]} l1={[308,100]} l2={[296,100]}/>
        <DotLine id="back"      dot={[308,182]} l1={[308,182]} l2={[76,180]}/>
        <DotLine id="arms"      dot={[308,207]} l1={[308,207]} l2={[167,208]}/>
        <DotLine id="feet"      dot={[308,419]} l1={[308,419]} l2={[202,420]}/>

        {/* ── LABELS ── */}
        {[
          {id:'head',      x:6,   y:74,  a:'start'},
          {id:'shoulders', x:6,   y:122, a:'start'},
          {id:'hips',      x:6,   y:272, a:'start'},
          {id:'monitor',   x:334, y:104, a:'end'},
          {id:'back',      x:334, y:186, a:'end'},
          {id:'arms',      x:334, y:211, a:'end'},
          {id:'feet',      x:334, y:423, a:'end'},
        ].map(({id,x,y,a})=>(
          <text key={id} x={x} y={y} fontSize="8.5" textAnchor={a}
            fill={hover===id?'#FCD34D':'#ffffff55'} fontWeight={hover===id?'700':'400'}
            style={{cursor:'pointer',userSelect:'none'}} fontFamily="system-ui,sans-serif"
            onMouseEnter={()=>setHover(id)} onMouseLeave={()=>setHover(null)}
            onClick={()=>setHover(hover===id?null:id)}>
            {id.charAt(0).toUpperCase()+id.slice(1)}
          </text>
        ))}

      </svg>

      {hover && (
        <div style={{background:'linear-gradient(135deg,#FCD34D18,#FCD34D08)',border:'1px solid #FCD34D33',borderRadius:13,padding:'12px 14px',marginTop:6}}>
          <div style={{fontSize:10,color:'#FCD34D',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:5}}>
            👩‍⚕️ {hover.charAt(0).toUpperCase()+hover.slice(1).replace('_',' ')}
          </div>
          <div style={{fontSize:12,color:'#ccc',lineHeight:1.6}}>{NOTES[hover]}</div>
        </div>
      )}
      {!hover && (
        <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:6}}>
          Tap any highlighted point for Physio Brooke's note
        </div>
      )}
    </div>
  );
};

const CHECKLIST = [
  { icon:'✅', text:'Monitor top at eye level, 50–70cm away' },
  { icon:'✅', text:'Head directly over shoulders (no forward jut)' },
  { icon:'✅', text:'Shoulders relaxed and down, not hunched' },
  { icon:'✅', text:'Elbows ~90°, forearms parallel to desk' },
  { icon:'✅', text:'Wrists neutral — flat, not angled' },
  { icon:'✅', text:'Back at 100–110° (slight recline), lumbar supported' },
  { icon:'✅', text:'Hips at 90° or slightly open, weight even on both sides' },
  { icon:'✅', text:'Feet flat on floor (or footrest), knees at ~90°' },
  { icon:'❌', text:'Don\'t cross your legs — rotates the pelvis unevenly' },
  { icon:'❌', text:'Don\'t sit fully upright at exactly 90° — it increases disc pressure' },
  { icon:'❌', text:'Don\'t reach forward for keyboard/mouse — keep elbows close' },
  { icon:'❌', text:'Don\'t look up at your monitor — compresses neck facet joints' },
];

// ── BREATHING DATA ────────────────────────────────────────────────────────────
const CNS_SECTIONS = [
  {
    icon:'⚡', title:'The Fight-or-Flight Response', color:'#F87171',
    content:`When your brain perceives stress — a difficult email, a looming deadline, a tense conversation — the sympathetic nervous system fires. Your adrenal glands release cortisol and adrenaline. Heart rate climbs. Blood is redirected away from your prefrontal cortex (decision-making) to your muscles. Digestion slows. Your body is preparing to fight or flee.\n\nThe problem: your brain cannot distinguish between a tiger and a passive-aggressive Slack message. The same system fires for both. In a corporate environment, it fires dozens of times per day — leaving you wired, foggy, and exhausted by 3pm.`,
  },
  {
    icon:'🌿', title:'The Parasympathetic Brake', color:'#6EE7B7',
    content:`The parasympathetic nervous system is your recovery mode — "rest and digest." It restores blood flow to the prefrontal cortex, lowers cortisol, reduces heart rate, and enables the complex cognitive work that office jobs actually demand: problem-solving, creativity, empathy, and clear communication.\n\nYou cannot think your way into a parasympathetic state. But you can breathe your way in — in as little as 30 seconds. This is not a metaphor. It is a direct physiological pathway.`,
  },
  {
    icon:'🫁', title:'Why Breathing is the Switch', color:'#93C5FD',
    content:`Breathing is the only autonomic function you can consciously control. When you extend the exhale longer than the inhale, you activate the vagus nerve — the primary nerve of the parasympathetic system. Vagal activation slows the heart, calms the amygdala (your brain's threat centre), and restores prefrontal function.\n\nHeart Rate Variability (HRV) — the slight variation in time between heartbeats — is the gold-standard biomarker of nervous system balance. Controlled breathing directly and measurably increases HRV within 3–5 minutes.`,
  },
  {
    icon:'🧠', title:'Focus & Mental Clarity', color:'#C4B5FD',
    content:`Under sympathetic activation, attention narrows into tunnel vision — useful for physical danger, terrible for analytical work. Deliberate breathing shifts you into a broad-focus attentional state that improves working memory, creative thinking, and task-switching.\n\nResearch from Stanford and Harvard shows 5 minutes of controlled breathing before cognitive tasks improves accuracy by 8–15% and reduces error rates significantly. Elite performers — surgeons, pilots, special forces — use these protocols not for relaxation, but for performance under pressure.`,
  },
];

const BREATH_TECHNIQUES = [
  {
    name:'Box Breathing',
    subtitle:'Stress & Focus Reset',
    icon:'⬛',
    color:'#6EE7B7',
    pattern:[4,4,4,4],
    labels:['Inhale', 'Hold', 'Exhale', 'Hold'],
    tagline:'Used by Navy SEALs before high-stakes operations.',
    science:'Equal timing across all four phases synchronises the autonomic nervous system. 5 minutes of box breathing reduces cortisol by up to 25% and significantly increases HRV. The hold phases train your nervous system to remain calm under CO₂ accumulation — exactly what happens during high-pressure work.',
    bestFor:['Pre-meeting clarity','Presentation nerves','Deadline pressure'],
  },
  {
    name:'4-7-8 Breathing',
    subtitle:'Deep Calm',
    icon:'🌊',
    color:'#93C5FD',
    pattern:[4,7,8,0],
    labels:['Inhale', 'Hold', 'Exhale', ''],
    tagline:"Dr Andrew Weil's 'natural tranquiliser for the nervous system.'",
    science:'The 7-count hold elevates CO₂ slightly, which activates GABA receptors — the same pathway targeted by anti-anxiety medication, but through chemistry your body produces naturally. The 8-count exhale triggers the baroreceptor reflex: your brain physically interprets the slow outbreath as a signal that you are safe.',
    bestFor:['After difficult conversations','Afternoon energy crash','Pre-sleep wind-down'],
  },
  {
    name:'Physiological Sigh',
    subtitle:'Instant Stress Relief',
    icon:'😮‍💨',
    color:'#C4B5FD',
    pattern:[2,1,7,0],
    labels:['Inhale through nose', 'Quick second sniff', 'Slow exhale through mouth', ''],
    tagline:'Stanford research: the fastest known method to reduce acute stress.',
    science:'During stress, small alveoli (air sacs) in your lungs collapse, reducing gas-exchange efficiency and amplifying the stress response. The double inhale forcibly re-inflates them. The long exhale then offloads CO₂ rapidly, shifting your brain from sympathetic to parasympathetic dominance in a single breath cycle — often within 10 seconds.',
    bestFor:['Immediate stress spike','Before a hard conversation','Any moment, anywhere'],
    special:true,
  },
  {
    name:'Coherent Breathing',
    subtitle:'Peak Performance',
    icon:'🔄',
    color:'#FCD34D',
    pattern:[5,0,5,0],
    labels:['Inhale', '', 'Exhale', ''],
    tagline:'5 breaths per minute — the resonance frequency of the human body.',
    science:"At exactly 5-5 timing, your breathing synchronises with your cardiovascular system's natural oscillation frequency. This creates resonance — producing the highest possible HRV. Studies link this state to peak cognitive performance, superior emotional regulation, and accelerated stress recovery. Used by elite athletes before competition.",
    bestFor:['Deep focus work','Creative problem-solving','Sustained high performance'],
  },
];

// ── BREATHING GUIDE COMPONENT ─────────────────────────────────────────────────
const BreathGuide = ({ t }) => {
  const phases = t.pattern.map((d,i)=>({d,label:t.labels[i]})).filter(p=>p.d>0);
  const [running, setRunning] = useState(false);
  const [pi, setPi] = useState(0);
  const [tick, setTick] = useState(phases[0].d);
  const [cycles, setCycles] = useState(0);
  const st = useRef({pi:0,tick:phases[0].d});
  const timer = useRef(null);

  const stop = () => {
    clearInterval(timer.current);
    setRunning(false); setPi(0); setTick(phases[0].d); setCycles(0);
    st.current = {pi:0, tick:phases[0].d};
  };
  const go = () => {
    st.current = {pi:0, tick:phases[0].d};
    setPi(0); setTick(phases[0].d); setCycles(0); setRunning(true);
    timer.current = setInterval(()=>{
      const s = st.current;
      if (s.tick > 1) { s.tick--; setTick(s.tick); }
      else {
        const npi = (s.pi+1) % phases.length;
        if (npi===0) setCycles(c=>c+1);
        s.pi = npi; s.tick = phases[npi].d;
        setPi(npi); setTick(s.tick);
      }
    }, 1000);
  };
  useEffect(()=>()=>clearInterval(timer.current),[]);

  const phase = phases[pi];
  const label = phase.label.toLowerCase();
  const expanding = label.includes('inhale') || label.includes('sniff') || (label.includes('hold') && phases[(pi+phases.length-1)%phases.length]?.label.toLowerCase().includes('inhale'));
  const big=148, small=72;
  const sz = running ? (expanding ? big : small) : (big+small)/2;
  const dur = running ? phase.d : 1;

  return (
    <div style={{textAlign:'center',padding:'8px 0 4px'}}>
      <div style={{
        width:sz, height:sz, borderRadius:'50%',
        background:`radial-gradient(circle at 38% 35%, ${t.color}55, ${t.color}18)`,
        border:`2px solid ${t.color}60`,
        margin:'0 auto 16px',
        transition:`all ${dur*0.85}s ease-${expanding?'in':'out'}`,
        boxShadow:`0 0 ${running?36:12}px ${t.color}${running?'55':'22'}`,
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        {running && <span style={{fontSize:30,fontWeight:900,color:t.color,userSelect:'none'}}>{tick}</span>}
        {!running && <span style={{fontSize:26}}>{t.icon}</span>}
      </div>

      {running && <div style={{fontSize:18,fontWeight:800,color:t.color,marginBottom:4}}>{phase.label}</div>}
      {running && cycles>0 && <div style={{fontSize:11,color:'#666',marginBottom:12}}>🔄 {cycles} cycle{cycles!==1?'s':''} complete</div>}
      {!running && <div style={{fontSize:12,color:'#666',marginBottom:12}}>Ready when you are</div>}

      <button onClick={running?stop:go} style={{
        padding:'9px 28px', borderRadius:11, border:`1px solid ${t.color}55`,
        background:`${t.color}1a`, color:t.color, fontWeight:800, fontSize:13, cursor:'pointer',
      }}>{running?'Stop':'Start'}</button>
    </div>
  );
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function PhysioTab({ cu }) {
  const [sec, setSec] = useState('stretches');
  const [selectedArea, setSelectedArea] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [ergoPainAreas, setErgoPainAreas] = useState([]);

  // Load pain areas from ergonomics assessment for personalisation
  useEffect(() => {
    supabase.from('ergonomics_assessments')
      .select('pain_areas').eq('user_id', cu.id)
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data && data[0] && data[0].pain_areas) {
          const areas = data[0].pain_areas.filter(a => a !== 'none');
          setErgoPainAreas(areas);
          if (areas.length > 0) setSelectedArea(areas[0]); // pre-select first pain area
        }
      });
  }, [cu.id]);

  const stretches = selectedArea ? STRETCHES[selectedArea] || [] : [];

  const diffCol = { Easy: '#6EE7B7', Moderate: '#FCD34D', Hard: '#F87171' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>🩺 Physio Resources</span>
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        Evidence-based desk stretches &amp; posture guidance by Physio Brooke 👩‍⚕️
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 16, background: '#ffffff07', borderRadius: 11, padding: 3 }}>
        {[['stretches','🧘 Stretches'],['posture','📐 Posture'],['breathing','🫁 Breathe']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setSec(id)} style={{
            flex:1, padding:'8px 4px', borderRadius:8, border:'none',
            background:sec===id?'#6EE7B722':'transparent',
            color:sec===id?'#6EE7B7':'#888',
            fontWeight:sec===id?700:400, fontSize:12,
          }}>{lbl}</button>
        ))}
      </div>

      {/* ── STRETCHES ── */}
      {sec === 'stretches' && (
        <div>
          {/* Personalisation banner */}
          {ergoPainAreas.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#6EE7B715,#C4B5FD0a)', border: '1px solid #6EE7B730', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>👩‍⚕️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>Personalised for you</div>
                <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                  Based on your ergonomics assessment, we've highlighted stretches for your pain areas:{' '}
                  {ergoPainAreas.map(a => AREAS.find(x => x.id === a)?.label).filter(Boolean).join(', ')}.
                </div>
              </div>
            </div>
          )}

          {/* Area filter */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
            {AREAS.map(a => {
              const isPain = ergoPainAreas.includes(a.id);
              const sel = selectedArea === a.id;
              return (
                <button key={a.id} onClick={() => { setSelectedArea(sel ? null : a.id); setExpanded(null); }}
                  style={{
                    flexShrink: 0, padding: '7px 12px', borderRadius: 20,
                    border: `1px solid ${sel ? a.color : isPain ? a.color + '55' : '#ffffff15'}`,
                    background: sel ? `${a.color}22` : isPain ? `${a.color}0d` : 'transparent',
                    color: sel ? a.color : isPain ? a.color + 'cc' : '#888',
                    fontWeight: sel || isPain ? 700 : 400, fontSize: 12,
                    display: 'flex', gap: 5, alignItems: 'center', position: 'relative',
                  }}>
                  <span>{a.icon}</span> {a.label}
                  {isPain && !sel && <span style={{ width: 5, height: 5, borderRadius: '50%', background: a.color, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* No area selected */}
          {!selectedArea && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🧘</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 6 }}>Select a body area</div>
              <div style={{ fontSize: 12, color: '#555' }}>
                {ergoPainAreas.length > 0
                  ? 'Your pain areas are highlighted — tap one to see targeted stretches.'
                  : 'Tap any area above to see desk-friendly stretches you can do right now.'}
              </div>
            </div>
          )}

          {/* Stretch cards */}
          {selectedArea && stretches.map((s, i) => {
            const area = AREAS.find(a => a.id === selectedArea);
            const isOpen = expanded === `${selectedArea}-${i}`;
            return (
              <div key={i} className="card" style={{ marginBottom: 10, borderColor: isOpen ? `${area.color}44` : undefined, cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : `${selectedArea}-${i}`)}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${area.color}20`, border: `1px solid ${area.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.pos}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: '#888' }}>⏱ {s.time}</span>
                      <span style={{ fontSize: 10, background: `${diffCol[s.diff] || '#888'}18`, color: diffCol[s.diff] || '#888', border: `1px solid ${diffCol[s.diff] || '#888'}33`, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{s.diff}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: '#555', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>How to do it</div>
                    {s.steps.map((step, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${area.color}22`, border: `1px solid ${area.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: area.color, flexShrink: 0, marginTop: 1 }}>{j + 1}</div>
                        <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6, flex: 1 }}>{step}</div>
                      </div>
                    ))}
                    <div style={{ background: `${area.color}0d`, border: `1px solid ${area.color}22`, borderRadius: 10, padding: '10px 13px', marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>👩‍⚕️</span>
                      <div>
                        <div style={{ fontSize: 10, color: area.color, fontWeight: 700, marginBottom: 3 }}>WHY THIS WORKS · Physio Brooke</div>
                        <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>{s.physio}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {selectedArea && stretches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#888', fontSize: 13 }}>No stretches for this area yet.</div>
          )}
        </div>
      )}

      {/* ── POSTURE GUIDE ── */}
      {sec === 'posture' && (
        <div>
          <div style={{ background: 'linear-gradient(135deg,#6EE7B710,#93C5FD08)', border: '1px solid #6EE7B725', borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Ideal Seated Posture</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>
              Tap any highlighted point for Physio Brooke's note 👇
            </div>
            <PostureDiagram />
          </div>

          {/* Do / Don't checklist */}
          <div className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Quick Posture Checklist</div>
            {CHECKLIST.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div style={{ fontSize: 12, color: item.icon === '✅' ? '#bbb' : '#888', lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>

          {/* Break reminder info */}
          <div style={{ background: '#93C5FD10', border: '1px solid #93C5FD25', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⏰ Movement Break Schedule</div>
            <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.7 }}>
              Even perfect posture causes musculoskeletal problems when held for too long. Use this rhythm:<br/>
              <span style={{ color: '#6EE7B7', fontWeight: 700 }}>Every 20 min</span> — 20-20-20 eye break<br/>
              <span style={{ color: '#93C5FD', fontWeight: 700 }}>Every 45 min</span> — wrist/neck micro-stretch (2 min)<br/>
              <span style={{ color: '#C4B5FD', fontWeight: 700 }}>Every 90 min</span> — stand, walk, full body reset (5 min)<br/>
              <span style={{ color: '#FCD34D', fontWeight: 700 }}>Every 3 hours</span> — complete posture reset + lower back stretches
            </div>
          </div>
        </div>
      )}

      {/* ── BREATHING ── */}
      {sec==='breathing' && (
        <div>
          {/* Hero banner */}
          <div style={{background:'linear-gradient(135deg,#93C5FD12,#C4B5FD08)',border:'1px solid #93C5FD25',borderRadius:18,padding:'18px 16px',marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>🫁 The Science of Breathing</div>
            <div style={{fontSize:12,color:'#aaa',lineHeight:1.65}}>
              Your breath is the only part of your autonomic nervous system you can consciously control — and it's a direct dial between stress and calm. Understanding how it works transforms it from a passive reflex into one of the most powerful performance tools you have.
            </div>
          </div>

          {/* CNS Education cards */}
          {CNS_SECTIONS.map((s,i)=>(
            <EducationCard key={i} s={s}/>
          ))}

          {/* Divider */}
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'20px 0 16px'}}>
            <div style={{flex:1,height:1,background:'#ffffff10'}}/>
            <div style={{fontSize:12,color:'#555',fontWeight:700}}>GUIDED TECHNIQUES</div>
            <div style={{flex:1,height:1,background:'#ffffff10'}}/>
          </div>

          {/* Technique cards */}
          {BREATH_TECHNIQUES.map((t,i)=>(
            <TechniqueCard key={i} t={t}/>
          ))}

          {/* Physio note */}
          <div style={{background:'linear-gradient(135deg,#6EE7B710,#6EE7B705)',border:'1px solid #6EE7B725',borderRadius:14,padding:'14px 16px',marginTop:4}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <span style={{fontSize:20,flexShrink:0}}>👩‍⚕️</span>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:'#6EE7B7',marginBottom:4}}>Physio Brooke's Recommendation</div>
                <div style={{fontSize:12,color:'#aaa',lineHeight:1.65}}>
                  Start with <strong style={{color:'#e8e8f0'}}>Box Breathing</strong> — 3 minutes before your most demanding meeting of the day. Once that becomes a habit, add the <strong style={{color:'#e8e8f0'}}>Physiological Sigh</strong> for any acute stress moment. Together, these two techniques address 90% of what a corporate nervous system goes through in a working day.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS (defined after PhysioTab so they can use its scope) ────────
function EducationCard({s}) {
  const [open,setOpen] = useState(false);
  return (
    <div className="card" style={{marginBottom:10,borderColor:`${s.color}22`,cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:38,height:38,borderRadius:11,background:`${s.color}18`,border:`1px solid ${s.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{s.icon}</div>
        <div style={{flex:1,fontWeight:700,fontSize:13,color:s.color}}>{s.title}</div>
        <span style={{fontSize:12,color:'#555'}}>{open?'▲':'▼'}</span>
      </div>
      {open&&(
        <div style={{marginTop:12}}>
          {s.content.split('\n\n').map((para,i)=>(
            <p key={i} style={{fontSize:12,color:'#aaa',lineHeight:1.75,margin:i===0?'0 0 10px':'10px 0 0'}}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function TechniqueCard({t}) {
  const [open,setOpen] = useState(false);
  return (
    <div className="card" style={{marginBottom:12,borderColor:open?`${t.color}44`:undefined}}>
      {/* Header — tap to expand */}
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
        <div style={{width:42,height:42,borderRadius:13,background:`${t.color}18`,border:`1px solid ${t.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{t.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:14,color:t.color}}>{t.name}</div>
          <div style={{fontSize:11,color:'#888'}}>{t.subtitle}</div>
        </div>
        {/* Pattern pills */}
        <div style={{display:'flex',gap:3,flexShrink:0}}>
          {t.pattern.filter(d=>d>0).map((d,i)=>(
            <div key={i} style={{background:`${t.color}18`,border:`1px solid ${t.color}33`,borderRadius:6,padding:'2px 6px',fontSize:10,fontWeight:700,color:t.color}}>{d}s</div>
          ))}
        </div>
        <span style={{fontSize:12,color:'#555',marginLeft:4}}>{open?'▲':'▼'}</span>
      </div>

      {open&&(
        <div style={{marginTop:14}}>
          {/* Tagline */}
          <div style={{fontSize:12,color:'#888',fontStyle:'italic',marginBottom:12,paddingBottom:12,borderBottom:'1px solid #ffffff0f'}}>"{t.tagline}"</div>

          {/* Phase labels */}
          <div style={{display:'flex',gap:4,marginBottom:14,flexWrap:'wrap'}}>
            {t.pattern.map((d,i)=>d>0&&(
              <div key={i} style={{background:`${t.color}12`,border:`1px solid ${t.color}25`,borderRadius:8,padding:'4px 10px',fontSize:11}}>
                <span style={{color:t.color,fontWeight:700}}>{d}s</span>
                <span style={{color:'#888',marginLeft:4}}>{t.labels[i]}</span>
              </div>
            ))}
          </div>

          {/* Animated guide */}
          <div style={{background:`${t.color}08`,border:`1px solid ${t.color}20`,borderRadius:14,padding:'16px 14px',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:t.color,textTransform:'uppercase',letterSpacing:.5,marginBottom:12}}>Live Guide</div>
            <BreathGuide t={t}/>
          </div>

          {/* Science */}
          <div style={{background:'#ffffff07',borderRadius:12,padding:'12px 14px',marginBottom:10}}>
            <div style={{fontSize:10,color:'#6EE7B7',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>👩‍⚕️ The Science</div>
            <div style={{fontSize:12,color:'#aaa',lineHeight:1.7}}>{t.science}</div>
          </div>

          {/* Best for */}
          <div style={{fontSize:11,color:'#666',marginBottom:2}}>Best for:</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {t.bestFor.map((b,i)=>(
              <span key={i} style={{background:`${t.color}12`,border:`1px solid ${t.color}25`,borderRadius:20,padding:'3px 10px',fontSize:11,color:t.color}}>{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
