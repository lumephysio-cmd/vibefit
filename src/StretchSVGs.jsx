// StretchSVGs.jsx
// Per-step anatomical illustrations.
// Each entry in STRETCH_SVGS[area][stretchIndex] is an array of
// small SVG components, one per step.  Rendered inline beside each step.

const B  = '#93C5FD';   // body stroke
const BF = '#93C5FD0d'; // body fill

// ── tiny seated base ─────────────────────────────────────────────────────────
// viewBox 0 0 100 128  (used by all seated poses)
const Seat = () => (
  <>
    <rect x="8"  y="90" width="84" height="5" rx="2" fill="#1e2244" stroke="#ffffff18" strokeWidth=".8"/>
    <rect x="8"  y="66" width="5"  height="29" rx="2" fill="#1e2244" stroke="#ffffff14" strokeWidth=".8"/>
    <line x1="10" y1="95" x2="10" y2="120" stroke="#ffffff0d" strokeWidth="3" strokeLinecap="round"/>
    <line x1="88" y1="95" x2="88" y2="120" stroke="#ffffff0d" strokeWidth="3" strokeLinecap="round"/>
  </>
);

const Torso = ({rotate=0}) => (
  <g transform={`rotate(${rotate},50,68)`}>
    <path d="M34 46 L34 90 L66 90 L66 46 Q50 40 34 46Z" fill={BF} stroke={B} strokeWidth="1.4"/>
  </g>
);

const Legs = () => (
  <>
    <path d="M34 90 Q50 94 66 90 L66 100 Q50 104 34 100Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="100" width="9"  height="18" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="57" y="100" width="9"  height="18" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="118" rx="10" ry="3.5" fill={BF} stroke={B} strokeWidth="1.2"/>
    <ellipse cx="62" cy="118" rx="10" ry="3.5" fill={BF} stroke={B} strokeWidth="1.2"/>
  </>
);

const Head = ({tilt=0, turn=0, back=0}) => (
  <g transform={`rotate(${tilt},50,44) translate(${-back},0)`}>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="50" cy={turn!==0?17:17} rx={turn!==0?10:13} ry="13" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx={turn>5?60:turn<-5?40:62} cy="17" rx="3" ry="4.5" fill={BF} stroke={B} strokeWidth="1"/>
  </g>
);

const NeutralArms = () => (
  <>
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 52 L78 74 L66 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </>
);

// ── highlight helper ──────────────────────────────────────────────────────────
const Spot = ({cx,cy,rx=12,ry=10,rot=0,color}) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
    fill={`${color}38`} stroke={color} strokeWidth="1.4" strokeDasharray="3,2"
    transform={rot?`rotate(${rot},${cx},${cy})`:''}/>
);

// ── POSE COMPONENTS (all 100×128 viewBox) ────────────────────────────────────

const SitNeutral = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><NeutralArms/><Legs/><Head/>
  </svg>
);

const SitChinTuck = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/>
    <NeutralArms/>
    <Legs/>
    {/* head pulled back */}
    <g transform="translate(-4,0)">
      <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
      <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
      <ellipse cx="62" cy="17" rx="3" ry="4.5" fill={BF} stroke={B} strokeWidth="1"/>
    </g>
    <Spot cx={47} cy={31} rx={10} ry={6} color={color}/>
    {/* chin-back arrow */}
    <path d="M68 17 L60 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <polygon points="60,14 60,20 54,17" fill={color}/>
  </svg>
);

const SitHeadTiltR = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><NeutralArms/><Legs/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <g transform="rotate(22,50,44)">
      <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
      <ellipse cx="62" cy="17" rx="3" ry="4.5" fill={BF} stroke={B} strokeWidth="1"/>
    </g>
    <Spot cx={38} cy={36} rx={7} ry={18} rot={-5} color={color}/>
  </svg>
);

const SitHeadTiltRHandOnHead = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/>
    {/* Left arm neutral */}
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right arm raised to head */}
    <path d="M66 52 L74 36" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <Legs/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <g transform="rotate(22,50,44)">
      <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
      <ellipse cx="62" cy="17" rx="3" ry="4.5" fill={BF} stroke={B} strokeWidth="1"/>
    </g>
    <Spot cx={38} cy={36} rx={7} ry={18} rot={-5} color={color}/>
  </svg>
);

const SitHeadTiltL = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><NeutralArms/><Legs/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <g transform="rotate(-22,50,44)">
      <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
      <ellipse cx="40" cy="17" rx="3" ry="4.5" fill={BF} stroke={B} strokeWidth="1"/>
    </g>
    <Spot cx={62} cy={36} rx={7} ry={18} rot={5} color={color}/>
  </svg>
);

const SitHeadTurnR = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><NeutralArms/><Legs/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="52" cy="17" rx="10" ry="13" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="62" cy="15" rx="3" ry="3" fill={BF} stroke={B} strokeWidth="1"/>
    <Spot cx={36} cy={36} rx={6} ry={16} rot={-8} color={color}/>
    {/* rotation arc */}
    <path d="M62 8 A16 16 0 0 1 78 18" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <polygon points="78,18 72,14 76,24" fill={color}/>
  </svg>
);

const SitTrapGrip = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/>
    {/* Left arm neutral */}
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right arm down to grip chair */}
    <path d="M66 52 L76 82 L88 91" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <ellipse cx="88" cy="92" rx="5" ry="3" fill={BF} stroke={B} strokeWidth="1.2"/>
    <Legs/>
    {/* Head tilted left */}
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <g transform="rotate(-22,50,44)">
      <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
      <ellipse cx="40" cy="17" rx="3" ry="4.5" fill={BF} stroke={B} strokeWidth="1"/>
    </g>
    {/* Right upper trap highlight */}
    <Spot cx={64} cy={50} rx={12} ry={9} rot={-20} color={color}/>
  </svg>
);

const SitArmsCrossed = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 52 L60 66 L38 76" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 52 L40 66 L62 76" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SitRotateR = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Legs/>
    <g transform="rotate(15,50,68)">
      <path d="M34 46 L34 90 L66 90 L66 46 Q50 40 34 46Z" fill={BF} stroke={B} strokeWidth="1.4"/>
      <path d="M34 52 L60 66 L38 76" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M66 52 L40 66 L62 76" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <Head tilt={0}/>
    <Spot cx={50} cy={78} rx={14} ry={9} color={color}/>
    {/* rotation arc */}
    <path d="M30 55 A28 28 0 0 1 70 45" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <polygon points="70,45 62,42 68,52" fill={color}/>
  </svg>
);

const SitFig4 = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/>
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 52 L78 70 L64 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <Head/>
    {/* Left thigh + shin */}
    <path d="M34 90 L34 102 L42 102 L44 90Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="102" width="9" height="16" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="118" rx="10" ry="3.5" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Right thigh going out */}
    <path d="M66 90 Q80 88 86 82 L88 90 Q82 96 66 100Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* Right lower leg horizontal (resting on left knee) */}
    <path d="M44 78 Q52 72 62 78 L60 88 Q52 82 42 88Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="42" cy="83" rx="6" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <Spot cx={80} cy={87} rx={10} ry={9} color={color}/>
  </svg>
);

const SitCat = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/>
    <path d="M34 50 Q28 68 30 90 L70 90 Q72 68 66 50 Q50 62 34 50Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* spine curve highlight */}
    <path d="M43 54 Q36 70 40 88" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2"/>
    <path d="M57 54 Q64 70 60 88" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2"/>
    <path d="M34 56 L22 76 L30 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 56 L78 76 L70 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="44" y="34" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4" transform="rotate(18,50,44)"/>
    <circle cx="48" cy="23" r="12" fill={BF} stroke={B} strokeWidth="1.4"/>
    <path d="M34 90 Q50 96 66 90 L66 100 Q50 106 34 100Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="100" width="9" height="16" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="57" y="100" width="9" height="16" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="116" rx="10" ry="3" fill={BF} stroke={B} strokeWidth="1.2"/>
    <ellipse cx="62" cy="116" rx="10" ry="3" fill={BF} stroke={B} strokeWidth="1.2"/>
  </svg>
);

const SitCow = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/>
    <path d="M34 50 Q34 70 36 90 L64 90 Q66 70 66 50 Q50 40 34 50Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* arched spine */}
    <path d="M42 52 Q40 70 42 88" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2"/>
    <path d="M58 52 Q60 70 58 88" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2"/>
    <path d="M34 56 L22 76 L30 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 56 L78 76 L70 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4" transform="rotate(-8,50,44)"/>
    <circle cx="52" cy="18" r="12" fill={BF} stroke={B} strokeWidth="1.4"/>
    <path d="M34 90 Q50 94 66 90 L66 100 Q50 104 34 100Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="100" width="9" height="16" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="57" y="100" width="9" height="16" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="116" rx="10" ry="3" fill={BF} stroke={B} strokeWidth="1.2"/>
    <ellipse cx="62" cy="116" rx="10" ry="3" fill={BF} stroke={B} strokeWidth="1.2"/>
  </svg>
);

const StandNeutral = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <line x1="10" y1="124" x2="90" y2="124" stroke="#ffffff10" strokeWidth="1"/>
    <path d="M38 42 L36 90 L64 90 L62 42 Q50 36 38 42Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="44" y="24" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <circle cx="50" cy="14" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="62" cy="14" rx="3" ry="4" fill={BF} stroke={B} strokeWidth="1"/>
    <path d="M36 48 L24 72" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 72 L30 88" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <path d="M64 48 L76 72" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <path d="M76 72 L70 88" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <rect x="36" y="90" width="10" height="32" rx="4" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="56" y="90" width="10" height="32" rx="4" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="41" cy="122" rx="13" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <ellipse cx="61" cy="122" rx="13" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
  </svg>
);

const StandLunge = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <line x1="10" y1="124" x2="90" y2="124" stroke="#ffffff10" strokeWidth="1"/>
    {/* Torso */}
    <path d="M38 42 L36 88 L62 88 L62 42 Q50 36 38 42Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="44" y="24" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <circle cx="50" cy="14" r="12" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="62" cy="14" rx="3" ry="4" fill={BF} stroke={B} strokeWidth="1"/>
    {/* Arms — right holds chair */}
    <path d="M36 48 L24 70" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <path d="M62 48 L76 62 L90 68" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Front left leg */}
    <path d="M36 88 L28 120 L42 120 L46 88Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="34" cy="122" rx="14" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Back right leg — knee on ground */}
    <path d="M62 88 Q74 108 76 118 L90 118 Q88 108 74 88Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="76" cy="122" rx="13" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <ellipse cx="77" cy="112" rx="8" ry="5" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Hip flexor highlight */}
    <Spot cx={63} cy={92} rx={11} ry={9} color={color}/>
  </svg>
);

const SitRightAcross = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    {/* Right arm across chest */}
    <path d="M66 52 L32 62 L22 72" fill="none" stroke={B} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Left hand at right elbow */}
    <path d="M34 52 L32 62" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <Spot cx={65} cy={54} rx={11} ry={10} color={color}/>
  </svg>
);

const StandArmWall = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <line x1="10" y1="124" x2="90" y2="124" stroke="#ffffff10" strokeWidth="1"/>
    {/* Wall */}
    <rect x="90" y="0" width="6" height="128" rx="2" fill="#1e2244" stroke="#ffffff14" strokeWidth=".8"/>
    <path d="M38 42 L36 90 L62 90 L62 42 Q50 36 38 42Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="44" y="24" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <circle cx="50" cy="14" r="12" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="62" cy="14" rx="3" ry="4" fill={BF} stroke={B} strokeWidth="1"/>
    {/* Right arm raised 90° and forearm against wall */}
    <path d="M62 48 L90 48" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <path d="M90 48 L90 20" stroke={B} strokeWidth="3.5" strokeLinecap="round"/>
    <ellipse cx="90" cy="19" rx="4" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Left arm */}
    <path d="M36 48 L24 70 L32 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="36" y="90" width="10" height="32" rx="4" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="56" y="90" width="10" height="32" rx="4" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="41" cy="122" rx="13" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <ellipse cx="61" cy="122" rx="13" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <Spot cx={50} cy={62} rx={16} ry={12} color={color}/>
  </svg>
);

const SitShouldBack = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    {/* Arms pulled back */}
    <path d="M34 52 L18 66" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <path d="M18 66 L22 82" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <path d="M66 52 L82 66" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <path d="M82 66 L78 82" stroke={B} strokeWidth="3" strokeLinecap="round"/>
    <Spot cx={50} cy={62} rx={16} ry={12} color={color}/>
    <path d="M24 62 L34 62" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <polygon points="34,59 34,65 40,62" fill={color}/>
    <path d="M76 62 L66 62" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <polygon points="66,59 66,65 60,62" fill={color}/>
  </svg>
);

const SitArmBehindHead = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    {/* Left arm neutral */}
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right arm up and behind head */}
    <path d="M66 52 L76 36" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <path d="M76 36 L60 24" stroke={B} strokeWidth="3.5" strokeLinecap="round"/>
    <ellipse cx="59" cy="23" rx="5" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Left hand pressing elbow */}
    <path d="M34 52 L68 40" stroke={B} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3,2"/>
    <Spot cx={72} cy={38} rx={11} ry={9} rot={-30} color={color}/>
  </svg>
);

const SitWristDown = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right arm extended forward */}
    <path d="M66 56 L96 56" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    {/* Wrist bent DOWN */}
    <path d="M96 56 L98 72" stroke={B} strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M98 72 L94 84 M98 72 L98 86 M98 72 L102 84" stroke={B} strokeWidth="2" strokeLinecap="round"/>
    {/* Left hand bending wrist */}
    <path d="M34 52 L94 62" stroke={B} strokeWidth="2" strokeDasharray="3,2" strokeLinecap="round"/>
    <Spot cx={84} cy={57} rx={14} ry={7} color={color}/>
  </svg>
);

const SitWristUp = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right arm extended forward */}
    <path d="M66 60 L96 60" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    {/* Wrist bent UP */}
    <path d="M96 60 L98 46" stroke={B} strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M98 46 L94 34 M98 46 L98 32 M98 46 L102 34" stroke={B} strokeWidth="2" strokeLinecap="round"/>
    {/* Left hand bending wrist up */}
    <path d="M34 52 L94 53" stroke={B} strokeWidth="2" strokeDasharray="3,2" strokeLinecap="round"/>
    <Spot cx={84} cy={56} rx={14} ry={7} color={color}/>
  </svg>
);

const SitPrayerHi = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 56 L44 66 L48 76" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 56 L56 66 L52 76" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Prayer block */}
    <rect x="46" y="62" width="8" height="22" rx="3" fill={`${color}25`} stroke={color} strokeWidth="1.4"/>
    {/* Fingers up */}
    <line x1="48" y1="62" x2="46" y2="48" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="50" y1="62" x2="50" y2="46" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="52" y1="62" x2="54" y2="48" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <Spot cx={50} cy={83} rx={9} ry={5} color={color}/>
  </svg>
);

const SitPrayerLo = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 56 L42 76 L46 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 56 L58 76 L54 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Prayer block lowered */}
    <rect x="46" y="82" width="8" height="18" rx="3" fill={`${color}25`} stroke={color} strokeWidth="1.4"/>
    <line x1="48" y1="82" x2="46" y2="68" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="50" y1="82" x2="50" y2="66" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="52" y1="82" x2="54" y2="68" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <Spot cx={50} cy={97} rx={9} ry={5} color={color}/>
    <path d="M50 80 L50 92" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <polygon points="47,92 53,92 50,98" fill={color}/>
  </svg>
);

const SitFingerOpen = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 52 L22 62" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <path d="M66 52 L78 62" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    {/* Left hand spread */}
    <path d="M22 62 L10 52 M22 62 L14 50 M22 62 L20 46 M22 62 L28 48 M22 62 L32 52"
      stroke={B} strokeWidth="2" strokeLinecap="round"/>
    {/* Right hand spread */}
    <path d="M78 62 L68 52 M78 62 L72 50 M78 62 L80 46 M78 62 L86 48 M78 62 L90 52"
      stroke={B} strokeWidth="2" strokeLinecap="round"/>
    <Spot cx={22} cy={58} rx={8} ry={8} color={color}/>
    <Spot cx={78} cy={58} rx={8} ry={8} color={color}/>
  </svg>
);

const SitFingerFist = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 52 L22 66" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="20" cy="70" rx="9" ry="7" fill={BF} stroke={B} strokeWidth="1.4"/>
    <path d="M66 52 L78 66" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="80" cy="70" rx="9" ry="7" fill={BF} stroke={B} strokeWidth="1.4"/>
  </svg>
);

const SitFig4Lean = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/>
    {/* Torso leaning forward */}
    <g transform="rotate(12,50,68)">
      <path d="M34 46 L34 90 L66 90 L66 46 Q50 40 34 46Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    </g>
    <Head/>
    {/* Arms reaching forward */}
    <path d="M34 56 L30 82 L50 94" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 56 L70 82 L50 94" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Left shin */}
    <path d="M34 90 L34 104 L42 104 L44 90Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="104" width="9" height="14" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="118" rx="10" ry="3.5" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Right leg figure-4 */}
    <path d="M66 90 Q80 88 86 82 L88 90 Q82 96 66 100Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <path d="M44 78 Q52 72 62 78 L60 88 Q52 82 42 88Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="42" cy="83" rx="6" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <Spot cx={80} cy={87} rx={12} ry={11} color={color}/>
  </svg>
);

const SitKneeChest = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Head/>
    {/* Arms pulling knee up */}
    <path d="M34 54 L28 72 L44 84" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66 54 L68 72 L56 84" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Left thigh+shin (on floor) */}
    <path d="M34 90 L34 102 L42 102 L44 90Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="102" width="9" height="16" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="118" rx="10" ry="3.5" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Right thigh pulled UP */}
    <path d="M66 90 Q74 76 68 60 L58 62 Q62 76 56 90Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* Right shin horizontal */}
    <path d="M44 68 Q52 60 62 68 L60 78 Q52 70 42 78Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="42" cy="73" rx="6" ry="4" fill={BF} stroke={B} strokeWidth="1.2"/>
    <Spot cx={62} cy={76} rx={11} ry={14} color={color}/>
  </svg>
);

const SitLookFar = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><NeutralArms/><Legs/>
    {/* Head looking right */}
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="52" cy="17" rx="10" ry="13" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="62" cy="15" rx="3" ry="3" fill={BF} stroke={B} strokeWidth="1"/>
    {/* Gaze into distance */}
    <line x1="63" y1="14" x2="96" y2="10" stroke={color} strokeWidth="1.5" strokeDasharray="3,3" opacity=".8"/>
    <path d="M90 8 L96 10 L90 13" fill={color} stroke={color} strokeWidth="1"/>
    <text x="93" y="8" fontSize="7" fill={color} fontFamily="system-ui">far</text>
    {/* Screen to left (what they were looking at) */}
    <rect x="2" y="38" width="22" height="16" rx="2" fill="#080814" stroke="#ffffff14" strokeWidth=".8"/>
    <rect x="4" y="40" width="18" height="12" rx="1" fill="#6EE7B708"/>
  </svg>
);

const SitHandsEyes = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* Both arms up to cup over eyes */}
    <path d="M34 52 L30 36" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <path d="M66 52 L70 36" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    {/* Cupped hands over eyes */}
    <path d="M29 34 Q50 24 71 34" fill={`${color}20`} stroke={color} strokeWidth="1.4"/>
    <path d="M29 34 L31 44 Q50 50 69 44 L71 34" fill={`${color}14`} stroke={color} strokeWidth="1.2" strokeDasharray="3,2"/>
    {/* Eyes closed */}
    <path d="M40 18 Q44 15 48 18" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M52 18 Q56 15 60 18" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const SitThumbFocus = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><Legs/><Head/>
    <path d="M34 52 L22 74 L34 88" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right arm extended, thumb up */}
    <path d="M66 56 L94 52" stroke={B} strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="95" cy="50" rx="4" ry="6" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* Near focus ray */}
    <line x1="60" y1="14" x2="92" y2="48" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" opacity=".8"/>
    {/* Far focus ray (faded) */}
    <line x1="60" y1="14" x2="96" y2="8" stroke={color} strokeWidth="1.2" strokeDasharray="3,3" opacity=".35"/>
    <text x="92" y="7" fontSize="7" fill={color} fontFamily="system-ui" opacity=".5">far</text>
  </svg>
);

const SitEyesClose = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/><Torso/><NeutralArms/><Legs/>
    <rect x="44" y="30" width="12" height="14" rx="3.5" fill={BF} stroke={B} strokeWidth="1.4"/>
    <circle cx="50" cy="17" r="13" fill={BF} stroke={B} strokeWidth="1.4"/>
    {/* Eyes closed — gentle curved lines */}
    <path d="M40 17 Q44 14 48 17" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M40 17 Q44 20 48 17" fill={`${color}18`} stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M52 17 Q56 14 60 17" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M52 17 Q56 20 60 17" fill={`${color}18`} stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* Relaxed smile */}
    <path d="M44 24 Q50 28 56 24" fill="none" stroke={B} strokeWidth="1.4" strokeLinecap="round"/>
    <Spot cx={50} cy={17} rx={14} ry={10} color={color}/>
  </svg>
);

const SitGluteTwist = ({color}) => (
  <svg viewBox="0 0 100 128" width="100%" style={{display:'block'}}>
    <Seat/>
    <g transform="rotate(14,50,68)">
      <path d="M34 46 L34 90 L66 90 L66 46 Q50 40 34 46Z" fill={BF} stroke={B} strokeWidth="1.4"/>
      <path d="M34 52 L62 68 L38 78" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M66 52 L38 64 L58 74" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <Head/>
    {/* Left thigh */}
    <path d="M34 90 L34 102 L42 102 L44 90Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <rect x="35" y="102" width="9" height="14" rx="3" fill={BF} stroke={B} strokeWidth="1.4"/>
    <ellipse cx="39" cy="116" rx="10" ry="3" fill={BF} stroke={B} strokeWidth="1.2"/>
    {/* Right figure-4 */}
    <path d="M66 90 Q80 88 86 82 L88 90 Q82 96 66 100Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <path d="M44 78 Q52 72 62 78 L60 88 Q52 82 42 88Z" fill={BF} stroke={B} strokeWidth="1.4"/>
    <Spot cx={80} cy={87} rx={12} ry={10} color={color}/>
  </svg>
);

// ── STEP-BY-STEP MAPPING ──────────────────────────────────────────────────────
// STRETCH_SVGS[area][stretchIndex] = array of components, one per step
export const STRETCH_SVGS = {
  neck: [
    // 0: Chin Tuck (4 steps)
    [SitNeutral, SitChinTuck, SitChinTuck, SitNeutral],
    // 1: Lateral Neck Tilt (4 steps)
    [SitNeutral, SitHeadTiltR, SitHeadTiltRHandOnHead, SitNeutral],
    // 2: Neck Rotation (4 steps)
    [SitNeutral, SitHeadTurnR, SitHeadTurnR, SitNeutral],
    // 3: Upper Trap Stretch (5 steps)
    [SitNeutral, SitNeutral, SitTrapGrip, SitTrapGrip, SitNeutral],
  ],
  lower_back: [
    // 0: Lumbar Rotation (5 steps)
    [SitNeutral, SitArmsCrossed, SitRotateR, SitRotateR, SitNeutral],
    // 1: Seated Figure-4 (5 steps)
    [SitNeutral, SitFig4, SitFig4, SitFig4, SitNeutral],
    // 2: Cat-Cow (4 steps)
    [SitNeutral, SitCow, SitCat, SitNeutral],
    // 3: Hip Flexor Standing (5 steps)
    [StandNeutral, StandNeutral, StandLunge, StandLunge, StandNeutral],
  ],
  shoulders: [
    // 0: Cross-Body (4 steps)
    [SitNeutral, SitRightAcross, SitRightAcross, SitNeutral],
    // 1: Chest Opener / Doorway (5 steps)
    [StandNeutral, StandArmWall, StandArmWall, StandArmWall, StandNeutral],
    // 2: Scapular Retraction (4 steps)
    [SitNeutral, SitShouldBack, SitShouldBack, SitNeutral],
    // 3: Thread the Needle (4 steps)
    [SitNeutral, SitArmBehindHead, SitArmBehindHead, SitNeutral],
  ],
  wrists: [
    // 0: Wrist Extension (4 steps)
    [SitNeutral, SitWristDown, SitWristDown, SitNeutral],
    // 1: Wrist Flexion (4 steps)
    [SitNeutral, SitWristUp, SitWristUp, SitNeutral],
    // 2: Prayer Hands (4 steps)
    [SitNeutral, SitPrayerHi, SitPrayerLo, SitNeutral],
    // 3: Finger Spreads (4 steps)
    [SitNeutral, SitFingerOpen, SitFingerFist, SitFingerOpen],
  ],
  hips: [
    // 0: Figure-4 Deep (5 steps)
    [SitNeutral, SitFig4, SitFig4Lean, SitFig4Lean, SitNeutral],
    // 1: Hip Flexor Lunge (5 steps)
    [StandNeutral, StandLunge, StandLunge, StandLunge, StandNeutral],
    // 2: Glute & Spine Twist (4 steps)
    [SitNeutral, SitFig4, SitGluteTwist, SitNeutral],
    // 3: Knee-to-Chest (4 steps)
    [SitNeutral, SitKneeChest, SitKneeChest, SitNeutral],
  ],
  eyes: [
    // 0: 20-20-20 (4 steps)
    [SitNeutral, SitNeutral, SitLookFar, SitNeutral],
    // 1: Eye Palming (4 steps)
    [SitNeutral, SitHandsEyes, SitHandsEyes, SitNeutral],
    // 2: Near-Far Focus (4 steps)
    [SitNeutral, SitThumbFocus, SitLookFar, SitThumbFocus],
    // 3: Full Blink Reset (5 steps)
    [SitNeutral, SitEyesClose, SitEyesClose, SitNeutral, SitNeutral],
  ],
};
