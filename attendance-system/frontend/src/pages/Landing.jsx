import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Shared CSS ─────────────────────────────────────────── */
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f0f4ff;font-family:'Space Grotesk',sans-serif;overflow-x:hidden}
::selection{background:#2563eb;color:#fff}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#93c5fd;border-radius:2px}

/* Particles */
@keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-40px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.9)}}
@keyframes float2{0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(-40px,30px) rotate(180deg)}}
@keyframes float3{0%,100%{transform:translate(0,0)}25%{transform:translate(20px,-30px)}75%{transform:translate(-30px,10px)}}
@keyframes pulseRing{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
@keyframes slideLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(37,99,235,0.3)}50%{box-shadow:0 0 40px rgba(37,99,235,0.6)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes chatSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
@keyframes nudge{0%,100%{transform:translateX(0)}25%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
@keyframes counterUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes scanLine{from{top:0}to{top:100%}}
@keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.vis{opacity:0;transform:translateY(20px);transition:opacity .7s ease,transform .7s ease}
.vis.show{opacity:1;transform:none}
.fu{animation:fadeUp .6s cubic-bezier(.4,0,.2,1) both}
.fi{animation:fadeIn .5s ease both}
.sr{animation:slideRight .5s ease both}
.sl{animation:slideLeft .5s ease both}

/* Nav */
.lnav{color:rgba(15,23,42,.55);text-decoration:none;font-size:.85rem;font-weight:500;transition:color .15s}
.lnav:hover{color:#1d4ed8}

/* Feature cards */
.feat{background:#fff;border:1px solid rgba(37,99,235,.1);border-radius:16px;padding:26px;transition:all .22s;cursor:default}
.feat:hover{border-color:rgba(37,99,235,.35);transform:translateY(-4px);box-shadow:0 16px 48px rgba(37,99,235,.12)}

/* Stat cards */
.stat-c{background:#fff;border:1px solid rgba(37,99,235,.1);border-radius:14px;padding:26px;text-align:center;transition:all .2s}
.stat-c:hover{border-color:#2563eb;box-shadow:0 8px 32px rgba(37,99,235,.15);transform:translateY(-2px)}

/* Buttons */
.btn-p{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border-radius:10px;font-family:'Space Grotesk',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;border:none;background:#2563eb;color:#fff;transition:all .18s;text-decoration:none;letter-spacing:-.01em;box-shadow:0 4px 16px rgba(37,99,235,.35)}
.btn-p:hover{background:#1d4ed8;transform:translateY(-2px);box-shadow:0 8px 28px rgba(37,99,235,.45)}
.btn-o{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border-radius:10px;font-family:'Space Grotesk',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;background:transparent;color:#1e3a8a;border:1.5px solid rgba(37,99,235,.3);transition:all .18s;text-decoration:none}
.btn-o:hover{border-color:#2563eb;background:rgba(37,99,235,.05);transform:translateY(-2px)}

/* Chatbot */
.chat-bubble{background:#fff;border:1px solid rgba(37,99,235,.15);border-radius:16px;padding:10px 14px;font-size:.82rem;color:#1e3a8a;line-height:1.5;animation:chatSlide .3s ease;max-width:240px;box-shadow:0 4px 12px rgba(37,99,235,.08)}
.chat-bubble.user{background:#2563eb;color:#fff;align-self:flex-end}
.chat-input{width:100%;padding:9px 12px;background:#f0f4ff;border:1px solid rgba(37,99,235,.2);border-radius:8px;font-family:'Space Grotesk',sans-serif;font-size:.82rem;color:#1e3a8a;outline:none;transition:border-color .15s}
.chat-input:focus{border-color:#2563eb;background:#fff}
.chat-input::placeholder{color:#93c5fd}

/* Auth inputs */
.au-i{width:100%;padding:11px 14px;background:#fff;border:1.5px solid rgba(37,99,235,.2);border-radius:10px;color:#0f172a;font-family:'Space Grotesk',sans-serif;font-size:.875rem;outline:none;transition:border-color .15s,box-shadow .15s}
.au-i:focus{border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.1)}
.au-i::placeholder{color:#94a3b8}
select.au-i{cursor:pointer} .au-i option{background:#fff;color:#0f172a}
.au-btn{width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:'Space Grotesk',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 14px rgba(37,99,235,.3);letter-spacing:-.01em}
.au-btn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.4)}
.au-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.au-ghost{width:100%;padding:11px;background:transparent;color:#3b82f6;border:1.5px solid rgba(37,99,235,.25);border-radius:10px;font-family:'Space Grotesk',sans-serif;font-size:.875rem;font-weight:600;cursor:pointer;transition:all .15s}
.au-ghost:hover{border-color:#2563eb;background:rgba(37,99,235,.04)}
`

/* ─── Shared sub-components ─────────────────────────────── */
export function Logo({ size = 'md' }) {
  const s = size === 'sm' ? { box: 28, font: '.65rem', text: '.88rem' } : { box: 36, font: '.72rem', text: '1rem' }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:s.box, height:s.box, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:s.font, color:'#fff', boxShadow:'0 4px 12px rgba(37,99,235,.4)' }}>IQ</div>
      <span style={{ fontWeight:700, fontSize:s.text, color:'#0f172a', letterSpacing:'-.03em', fontFamily:"'Bricolage Grotesque',sans-serif" }}>AttendIQ</span>
    </div>
  )
}

export function AuthField({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'#64748b', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:5 }}>{label}</label>
      {children}
      {hint  && <div style={{ fontSize:'.62rem', color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>{hint}</div>}
      {error && <div style={{ fontSize:'.68rem', color:'#ef4444', marginTop:5, fontFamily:"'JetBrains Mono',monospace' " }}>{error}</div>}
    </div>
  )
}

export function EyeBtn({ open, toggle }) {
  return (
    <button type="button" onClick={toggle} tabIndex={-1} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}>
      {open
        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><line x1="2" y1="2" x2="14" y2="14"/></svg>
        : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
      }
    </button>
  )
}

export function Spinner() {
  return <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .6s linear infinite' }} />
}

export function ToastRack({ toasts, remove }) {
  return (
    <div style={{ position:'fixed', top:18, right:18, zIndex:999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => {
        const cfg = { success:{ bg:'#f0fdf4', border:'#86efac', dot:'#22c55e', tx:'#166534' }, error:{ bg:'#fef2f2', border:'#fca5a5', dot:'#ef4444', tx:'#991b1b' }, info:{ bg:'#eff6ff', border:'#93c5fd', dot:'#2563eb', tx:'#1e40af' } }[t.type]
        return (
          <div key={t.id} style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:10, minWidth:260, maxWidth:320, pointerEvents:'all', boxShadow:'0 8px 24px rgba(0,0,0,.08)', animation:'fadeUp .3s ease' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.dot, marginTop:4, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:'.8rem', color:cfg.tx, marginBottom:1 }}>{t.title}</div>
              <div style={{ fontSize:'.73rem', color:cfg.tx, opacity:.75, lineHeight:1.5 }}>{t.msg}</div>
            </div>
            <button onClick={() => remove(t.id)} style={{ background:'none', border:'none', cursor:'pointer', color:cfg.tx, opacity:.5, fontSize:15, padding:'0 2px', pointerEvents:'all' }}>×</button>
          </div>
        )
      })}
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = (type, title, msg) => {
    const id = Date.now()
    setToasts(t => [...t, { id, type, title, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }
  return { toasts, push, remove: id => setToasts(t => t.filter(x => x.id !== id)) }
}

/* ─── Floating particles ─────────────────────────────────── */
function Particles() {
  const shapes = [
    { x:'10%', y:'20%', size:12, anim:'float1 8s ease-in-out infinite', color:'rgba(37,99,235,.15)', delay:'0s' },
    { x:'85%', y:'15%', size:18, anim:'float2 11s ease-in-out infinite', color:'rgba(59,130,246,.12)', delay:'2s' },
    { x:'75%', y:'70%', size:10, anim:'float3 9s ease-in-out infinite', color:'rgba(37,99,235,.18)', delay:'1s' },
    { x:'20%', y:'75%', size:14, anim:'float1 12s ease-in-out infinite', color:'rgba(99,102,241,.12)', delay:'3s' },
    { x:'50%', y:'10%', size:8,  anim:'float2 7s ease-in-out infinite',  color:'rgba(37,99,235,.1)',  delay:'1.5s' },
    { x:'92%', y:'50%', size:20, anim:'float3 14s ease-in-out infinite', color:'rgba(59,130,246,.08)', delay:'4s' },
    { x:'5%',  y:'50%', size:9,  anim:'float1 10s ease-in-out infinite', color:'rgba(37,99,235,.12)', delay:'0.5s' },
    { x:'60%', y:'85%', size:16, anim:'float2 13s ease-in-out infinite', color:'rgba(99,102,241,.1)', delay:'2.5s' },
  ]
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {shapes.map((s, i) => (
        <div key={i} style={{ position:'absolute', left:s.x, top:s.y, width:s.size, height:s.size, borderRadius:'50%', background:s.color, animation:s.anim, animationDelay:s.delay, filter:'blur(1px)' }} />
      ))}
      {/* Grid lines */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(37,99,235,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.04) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
    </div>
  )
}

/* ─── Chatbot ────────────────────────────────────────────── */
const BOT_ANSWERS = {
  default: ["AttendIQ helps university lecturers mark and track attendance in seconds.", "Try asking about pricing, features, or how QR attendance works!"],
  pricing: ["AttendIQ is completely free for individual lecturers.", "For institutions with multiple staff, contact us for a team plan."],
  qr: ["Each session generates a unique QR code.", "Students scan it and they're marked present — no app needed, just their phone camera."],
  features: ["Key features: QR attendance, live analytics, multi-institution support, 75% threshold alerts, and PDF export.", "All accessible from one clean dashboard."],
  signup: ["Creating an account takes under 2 minutes.", "Click 'Get started' at the top of the page — it's free!"],
  report: ["Reports show per-student and per-course attendance rates.", "You can track trends over time and export data as needed."],
  hello: ["Hey there! 👋 I'm the AttendIQ assistant.", "Ask me anything about the platform!"],
}

function getResponse(input) {
  const q = input.toLowerCase()
  if (/hello|hi|hey|yo/.test(q))     return BOT_ANSWERS.hello
  if (/price|cost|free|pay/.test(q)) return BOT_ANSWERS.pricing
  if (/qr|scan|code/.test(q))        return BOT_ANSWERS.qr
  if (/feature|what|do|can/.test(q)) return BOT_ANSWERS.features
  if (/sign|register|create|join/.test(q)) return BOT_ANSWERS.signup
  if (/report|analytics|track/.test(q)) return BOT_ANSWERS.report
  return BOT_ANSWERS.default
}

function Chatbot({ onNavigate }) {
  const [open,    setOpen]    = useState(false)
  const [input,   setInput]   = useState('')
  const [msgs,    setMsgs]    = useState([{ from:'bot', text:"Hi! I'm the AttendIQ assistant 👋 Ask me anything about the platform." }])
  const [typing,  setTyping]  = useState(false)
  const [nudge,   setNudge]   = useState(false)
  const scrollRef = useRef()

  useEffect(() => {
    const t = setTimeout(() => setNudge(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [msgs, typing])

  const send = () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setMsgs(m => [...m, { from:'user', text:userMsg }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const replies = getResponse(userMsg)
      setTyping(false)
      replies.forEach((r, i) => setTimeout(() => setMsgs(m => [...m, { from:'bot', text:r }]), i * 600))
    }, 900)
  }

  const SUGGESTIONS = ['How does QR work?', 'Is it free?', 'Show me features']

  return (
    <>
      {/* Chat window */}
      {open && (
        <div style={{ position:'fixed', bottom:88, right:20, width:320, background:'#fff', border:'1px solid rgba(37,99,235,.2)', borderRadius:20, boxShadow:'0 20px 60px rgba(37,99,235,.2)', zIndex:1000, overflow:'hidden', animation:'fadeUp .3s ease' }}>
          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, background:'rgba(255,255,255,.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>🤖</div>
              <div>
                <div style={{ fontWeight:700, fontSize:'.85rem', color:'#fff' }}>AttendIQ Assistant</div>
                <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.7)', fontFamily:"'JetBrains Mono',monospace" }}>
                  <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#4ade80', marginRight:4, verticalAlign:'middle' }} />
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', padding:'4px 8px', fontSize:'.75rem' }}>✕</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ height:260, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from==='user' ? 'flex-end' : 'flex-start' }}>
                <div className={`chat-bubble${m.from==='user'?' user':''}`} style={{ animation:`chatSlide .3s ease ${i*0.05}s both` }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:'flex', gap:6, alignItems:'center', padding:'8px 12px', background:'#f0f4ff', borderRadius:12, width:'fit-content' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#2563eb', animation:`typingDot 1.2s ease ${i*.15}s infinite` }} />)}
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div style={{ padding:'0 12px 8px', display:'flex', gap:6, flexWrap:'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setInput(s); setTimeout(send, 50) }} style={{ padding:'4px 10px', background:'#eff6ff', border:'1px solid rgba(37,99,235,.2)', borderRadius:100, fontSize:'.66rem', color:'#1d4ed8', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>{s}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(37,99,235,.1)', display:'flex', gap:7 }}>
            <input className="chat-input" placeholder="Ask me anything…" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()} />
            <button onClick={send} style={{ width:34, height:34, background:'#2563eb', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 7h12M8 2l5 5-5 5"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => { setOpen(v => !v); setNudge(false) }} style={{ position:'fixed', bottom:20, right:20, width:56, height:56, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', border:'none', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 28px rgba(37,99,235,.45)', zIndex:1000, animation: nudge && !open ? 'nudge 1s ease 3' : 'none', transition:'transform .2s' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        {open
          ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2"><path d="M4 4l12 12M16 4L4 16"/></svg>
          : <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="1.8"><path d="M4 4h14a2 2 0 012 2v8a2 2 0 01-2 2H8l-4 3V6a2 2 0 012-2z"/></svg>
        }
        {nudge && !open && (
          <div style={{ position:'absolute', top:-6, right:-4, width:18, height:18, background:'#ef4444', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.58rem', color:'#fff', fontWeight:700, border:'2px solid #fff', animation:'pulseRing 1.5s ease infinite' }}>1</div>
        )}
      </button>

      {/* Nudge bubble */}
      {nudge && !open && (
        <div style={{ position:'fixed', bottom:86, right:20, background:'#fff', border:'1px solid rgba(37,99,235,.2)', borderRadius:12, padding:'9px 14px', fontSize:'.78rem', color:'#1e40af', boxShadow:'0 8px 24px rgba(37,99,235,.15)', zIndex:999, animation:'fadeUp .4s ease', fontWeight:500, maxWidth:200 }}>
          👋 Have questions? Ask me!
          <div style={{ position:'absolute', bottom:-6, right:20, width:12, height:12, background:'#fff', border:'1px solid rgba(37,99,235,.2)', borderRight:'none', borderTop:'none', transform:'rotate(-45deg)' }} />
        </div>
      )}
    </>
  )
}

/* ─── FEATURES ───────────────────────────────────────────── */
const FEATURES = [
  { icon:'⚡', title:'Mark in seconds', body:'One tap per student. Bulk-mark an entire class present in a single click. Never lose time to admin.' },
  { icon:'📱', title:'QR attendance', body:'Generate a unique QR per session. Students scan — instantly marked. No lists. No friction.' },
  { icon:'📊', title:'Live analytics', body:'Rates, trends, and at-risk students surface automatically. See what needs attention at a glance.' },
  { icon:'🏛️', title:'Multi-institution', body:'Teach at more than one university? All your classes, one clean dashboard.' },
  { icon:'🔔', title:'Threshold alerts', body:'Automatically flagged when a student drops below 75% — so nobody slips through.' },
  { icon:'📤', title:'Export reports', body:'Download per-student or per-class sheets any time. PDF or Excel, ready in seconds.' },
]

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function Landing() {
  const navigate   = useNavigate()
  const [vis, setVis] = useState({})
  const [scroll, setScroll] = useState(0)
  const [counter, setCounter] = useState({ students:0, classes:0, rate:0 })
  const counterStarted = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(e.target.dataset.id) }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('[data-id]').forEach(el => obs.observe(el))
    window.addEventListener('scroll', () => setScroll(window.scrollY))
    return () => obs.disconnect()
  }, [])

  function setVisible(id) {
    setVis(v => ({ ...v, [id]: true }))
    if (id === 'stats' && !counterStarted.current) {
      counterStarted.current = true
      animateCounter('students', 0, 2847, 1800)
      animateCounter('classes', 0, 412, 1600)
      animateCounter('rate', 0, 94, 1400)
    }
  }

  function animateCounter(key, from, to, duration) {
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounter(c => ({ ...c, [key]: Math.round(from + (to - from) * eased) }))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  const v = id => `vis${vis[id] ? ' show' : ''}`

  return (
    <div style={{ background:'#f0f4ff', color:'#0f172a', fontFamily:"'Space Grotesk',sans-serif", overflowX:'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:60, padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background: scroll > 40 ? 'rgba(240,244,255,.92)' : 'transparent', backdropFilter: scroll > 40 ? 'blur(16px)' : 'none', borderBottom: scroll > 40 ? '1px solid rgba(37,99,235,.1)' : 'none', transition:'all .3s' }}>
        <Logo />
        <div style={{ display:'flex', gap:28 }}>
          <a href="#features" className="lnav">Features</a>
          <a href="#how" className="lnav">How it works</a>
          <a href="#stats" className="lnav">Stats</a>
        </div>
        <div style={{ display:'flex', gap:9 }}>
          <button className="btn-o" style={{ padding:'8px 18px', fontSize:'.82rem' }} onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn-p" style={{ padding:'8px 18px', fontSize:'.82rem' }} onClick={() => navigate('/signup')}>Get started →</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 24px 80px', position:'relative', overflow:'hidden', background:'linear-gradient(160deg,#eff6ff 0%,#f0f4ff 40%,#e0e7ff 100%)' }}>
        <Particles />

        {/* Glow orb */}
        <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:400, background:'radial-gradient(ellipse,rgba(37,99,235,.12) 0%,transparent 70%)', pointerEvents:'none' }} />

        {/* Pulse rings */}
        <div style={{ position:'absolute', top:'30%', left:'15%', width:80, height:80, borderRadius:'50%', border:'1px solid rgba(37,99,235,.2)', animation:'pulseRing 3s ease infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'60%', right:'12%', width:60, height:60, borderRadius:'50%', border:'1px solid rgba(99,102,241,.15)', animation:'pulseRing 4s ease infinite 1s', pointerEvents:'none' }} />

        {/* Badge */}
        <div className="fu" style={{ animationDelay:'.1s', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(37,99,235,.08)', border:'1px solid rgba(37,99,235,.2)', borderRadius:100, padding:'6px 16px', fontSize:'.68rem', fontFamily:"'JetBrains Mono',monospace", color:'#1d4ed8', letterSpacing:'.06em' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', boxShadow:'0 0 8px #22c55e' }} />
            LIVE BETA · FREE FOR LECTURERS
          </div>
        </div>

        <h1 className="fu" style={{ animationDelay:'.18s', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(2.8rem,6.5vw,5.2rem)', fontWeight:800, letterSpacing:'-.05em', lineHeight:1.05, marginBottom:14, maxWidth:800, color:'#0f172a' }}>
          The{' '}
          <span style={{ color:'#2563eb', position:'relative' }}>
            smartest way
            <svg style={{ position:'absolute', bottom:-6, left:0, width:'100%' }} height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
              <path d="M0 5 Q50 0 100 5 Q150 10 200 5" stroke="#2563eb" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
          {' '}to track attendance
        </h1>

        <p className="fu" style={{ animationDelay:'.32s', fontSize:'clamp(1rem,1.8vw,1.15rem)', color:'#475569', maxWidth:520, lineHeight:1.8, marginBottom:36 }}>
          AttendIQ lets university lecturers mark, track and report attendance faster than it takes to call the register. Built for humans.
        </p>

        <div className="fu" style={{ animationDelay:'.46s', display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:48 }}>
          <button className="btn-p" onClick={() => navigate('/signup')}>
            Start free — no card needed →
          </button>
          <button className="btn-o" onClick={() => navigate('/login')}>
            Sign in to dashboard
          </button>
        </div>

        {/* Social proof nudge */}
        <div className="fu" style={{ animationDelay:'.58s', display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
          <div style={{ display:'flex' }}>
            {['#bfdbfe','#93c5fd','#60a5fa','#3b82f6'].map((c,i) => (
              <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:c, border:'2px solid #fff', marginLeft: i>0 ? -8:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.62rem', fontWeight:700, color:'#1e40af' }}>{['JM','BK','AW','+'][i]}</div>
            ))}
          </div>
          <div style={{ fontSize:'.78rem', color:'#64748b' }}><strong style={{ color:'#1e40af' }}>2,800+</strong> lecturers already using AttendIQ</div>
        </div>

        {/* Dashboard preview */}
        <div className="fu" style={{ animationDelay:'.68s', width:'100%', maxWidth:880, position:'relative' }}>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'linear-gradient(to top,#f0f4ff,transparent)', zIndex:2, pointerEvents:'none', borderRadius:'0 0 16px 16px' }} />
          <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, overflow:'hidden', boxShadow:'0 40px 120px rgba(37,99,235,.25)' }}>
            {/* Window chrome */}
            <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', gap:10, background:'#0a0f1e' }}>
              <div style={{ display:'flex', gap:5 }}>{['#ff5f57','#febc2e','#28c840'].map((c,i)=><div key={i} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}</div>
              <div style={{ flex:1, background:'rgba(255,255,255,.07)', borderRadius:5, height:20, maxWidth:280, display:'flex', alignItems:'center', paddingLeft:9, gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }} />
                <span style={{ fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,.35)' }}>attendiq.app/dashboard</span>
              </div>
              {/* Scan line effect */}
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                {['rgba(37,99,235,.3)','rgba(37,99,235,.5)','rgba(37,99,235,.8)'].map((c,i)=><div key={i} style={{ width:6, height:6, borderRadius:1, background:c }} />)}
              </div>
            </div>
            <div style={{ display:'flex', height:300 }}>
              <div style={{ width:170, borderRight:'1px solid rgba(255,255,255,.06)', padding:'14px 10px', display:'flex', flexDirection:'column', gap:3 }}>
                {['Dashboard','Students','Courses','Attendance','Reports'].map((item,i)=>(
                  <div key={i} style={{ padding:'7px 10px', borderRadius:7, background:i===0?'rgba(37,99,235,.2)':'transparent', color:i===0?'#60a5fa':'rgba(255,255,255,.3)', fontSize:'.72rem', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                    {i===0 && <div style={{ width:4, height:4, borderRadius:'50%', background:'#60a5fa' }} />}
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ flex:1, padding:18 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[['23','Students'],['5','Courses'],['18','Present'],['78%','Rate']].map(([v,l],i)=>(
                    <div key={i} style={{ background:i===3?'linear-gradient(135deg,#2563eb,#1d4ed8)':'rgba(255,255,255,.05)', border:`1px solid ${i===3?'transparent':'rgba(255,255,255,.07)'}`, borderRadius:10, padding:'11px 12px' }}>
                      <div style={{ fontSize:'.52rem', fontFamily:"'JetBrains Mono',monospace", color:i===3?'rgba(255,255,255,.65)':'rgba(255,255,255,.35)', letterSpacing:'.08em', textTransform:'uppercase' }}>{l}</div>
                      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'1.3rem', fontWeight:700, color:i===3?'#fff':'rgba(255,255,255,.9)', marginTop:4, letterSpacing:'-.03em' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'11px 14px' }}>
                  <div style={{ fontSize:'.58rem', color:'rgba(255,255,255,.25)', fontFamily:"'JetBrains Mono',monospace", marginBottom:10, letterSpacing:'.06em' }}>TODAY'S ATTENDANCE · LIVE</div>
                  {[['Brian Otieno','104298','present'],['Alice Wanjiku','104299','present'],['Kevin Mwangi','104300','absent']].map(([n,id,st],i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<2?'1px solid rgba(255,255,255,.05)':'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:'rgba(37,99,235,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.55rem', fontFamily:"'JetBrains Mono',monospace", color:'#93c5fd' }}>{id.slice(-2)}</div>
                        <span style={{ fontSize:'.7rem', fontWeight:500, color:'rgba(255,255,255,.8)' }}>{n}</span>
                      </div>
                      <span style={{ fontSize:'.58rem', padding:'2px 8px', borderRadius:5, background:st==='present'?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)', color:st==='present'?'#4ade80':'#f87171', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'.04em' }}>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────── */}
      <div style={{ overflow:'hidden', borderTop:'1px solid rgba(37,99,235,.1)', borderBottom:'1px solid rgba(37,99,235,.1)', padding:'13px 0', background:'#e0e7ff' }}>
        <div style={{ display:'flex', animation:'marquee 20s linear infinite', width:'max-content' }}>
          {[...Array(2)].map((_,ii)=>(
            <div key={ii} style={{ display:'flex' }}>
              {['QR Check-in','Live Analytics','Multi-Institution','75% Alerts','Class Reports','Student Tracking','Bulk Marking','PDF Export'].map((t,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'0 24px', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:'.72rem', fontFamily:"'JetBrains Mono',monospace", color:'#3b82f6', letterSpacing:'.06em', textTransform:'uppercase', fontWeight:500 }}>{t}</span>
                  <span style={{ color:'#2563eb', fontSize:'.65rem' }}>✦</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding:'100px 40px', maxWidth:1100, margin:'0 auto' }}>
        <div data-id="fh" className={v('fh')} style={{ textAlign:'center', marginBottom:60 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(37,99,235,.08)', border:'1px solid rgba(37,99,235,.15)', borderRadius:100, padding:'5px 14px', fontSize:'.65rem', fontFamily:"'JetBrains Mono',monospace", color:'#2563eb', letterSpacing:'.08em', marginBottom:16, textTransform:'uppercase' }}>⚡ Features</div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:800, letterSpacing:'-.04em', lineHeight:1.1, marginBottom:12 }}>
            Built for lecturers,<br /><span style={{ color:'#2563eb' }}>not administrators</span>
          </h2>
          <p style={{ color:'#64748b', fontSize:'.92rem', maxWidth:460, margin:'0 auto', lineHeight:1.8 }}>Every feature designed around one question: how do we save lecturers the most time possible?</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
          {FEATURES.map((f,i)=>(
            <div key={i} data-id={`f${i}`} className={`feat ${v(`f${i}`)}`} style={{ transitionDelay:`${i*.07}s` }}>
              <div style={{ width:44, height:44, background:'linear-gradient(135deg,rgba(37,99,235,.1),rgba(37,99,235,.05))', border:'1px solid rgba(37,99,235,.15)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:'.97rem', marginBottom:7, letterSpacing:'-.02em' }}>{f.title}</div>
              <div style={{ fontSize:'.82rem', color:'#64748b', lineHeight:1.8 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how" style={{ padding:'80px 40px', background:'linear-gradient(135deg,#eff6ff,#e0e7ff)', borderTop:'1px solid rgba(37,99,235,.1)', borderBottom:'1px solid rgba(37,99,235,.1)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div data-id="hh" className={v('hh')} style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:'.65rem', fontFamily:"'JetBrains Mono',monospace", color:'#2563eb', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:12 }}>Simple workflow</div>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(1.8rem,3.5vw,2.5rem)', fontWeight:800, letterSpacing:'-.04em' }}>Up and running in 3 steps</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, position:'relative' }}>
            <div style={{ position:'absolute', top:30, left:'16.5%', right:'16.5%', height:2, background:'linear-gradient(90deg,transparent,rgba(37,99,235,.3),transparent)', pointerEvents:'none' }} />
            {[
              { n:'01', title:'Create your account', body:'Sign up free as a lecturer. Pick your institution and you\'re set in under 2 minutes.', icon:'🔑' },
              { n:'02', title:'Add courses & students', body:'Create units with schedule info. Add students by their 6-digit ID, organised by class.', icon:'📚' },
              { n:'03', title:'Start marking', body:'Open attendance, pick a date — mark manually or show the session QR code to students.', icon:'✅' },
            ].map((s,i)=>(
              <div key={i} data-id={`h${i}`} className={v(`h${i}`)} style={{ transitionDelay:`${i*.12}s`, textAlign:'center' }}>
                <div style={{ position:'relative', display:'inline-block', marginBottom:18 }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', margin:'0 auto', boxShadow:'0 8px 24px rgba(37,99,235,.3)' }}>{s.icon}</div>
                  <div style={{ position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%', background:'#fff', border:'2px solid #2563eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.6rem', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#2563eb' }}>{s.n}</div>
                </div>
                <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, marginBottom:9, fontSize:'.97rem', letterSpacing:'-.02em' }}>{s.title}</div>
                <div style={{ fontSize:'.82rem', color:'#475569', lineHeight:1.8 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section id="stats" data-id="stats" style={{ padding:'100px 40px', maxWidth:900, margin:'0 auto' }}>
        <div data-id="sh" className={v('sh')} style={{ textAlign:'center', marginBottom:52 }}>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(1.8rem,3.5vw,2.5rem)', fontWeight:800, letterSpacing:'-.04em', marginBottom:10 }}>Numbers that speak for themselves</h2>
          <p style={{ color:'#64748b', fontSize:'.9rem' }}>Real usage across universities in Kenya and beyond.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {[
            { val: `${counter.students.toLocaleString()}+`, label:'Students tracked', color:'#2563eb' },
            { val: `${counter.classes}+`,  label:'Active classes',    color:'#3b82f6' },
            { val: `${counter.rate}%`,      label:'Average attendance rate', color:'#1d4ed8' },
            { val: '10s',                   label:'To mark a full class',    color:'#2563eb' },
          ].map((s,i)=>(
            <div key={i} className="stat-c" data-id={`st${i}`} style={{ transitionDelay:`${i*.09}s` }}>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'2.4rem', fontWeight:800, letterSpacing:'-.05em', color:s.color, marginBottom:6 }}>{s.val}</div>
              <div style={{ fontSize:'.78rem', color:'#64748b', lineHeight:1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding:'0 40px 100px', maxWidth:920, margin:'0 auto' }}>
        <div data-id="cta" className={v('cta')} style={{ background:'linear-gradient(135deg,#1e40af,#2563eb,#3b82f6)', backgroundSize:'200% 200%', animation:'gradMove 6s ease infinite', borderRadius:24, padding:'60px 52px', textAlign:'center', position:'relative', overflow:'hidden', boxShadow:'0 24px 80px rgba(37,99,235,.35)' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 20% 50%,rgba(255,255,255,.08) 0%,transparent 50%),radial-gradient(circle at 80% 50%,rgba(255,255,255,.05) 0%,transparent 50%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' }} />
          <div style={{ fontSize:'.64rem', fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,.6)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:14, position:'relative' }}>Start today</div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(1.7rem,3.8vw,2.5rem)', fontWeight:800, letterSpacing:'-.04em', color:'#fff', marginBottom:12, lineHeight:1.15, position:'relative' }}>
            Ready to modernise your attendance?
          </h2>
          <p style={{ color:'rgba(255,255,255,.65)', marginBottom:32, fontSize:'.9rem', position:'relative' }}>Free for individual lecturers. No credit card. No setup fees.</p>
          <button style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 32px', background:'#fff', color:'#1d4ed8', border:'none', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontSize:'.9rem', fontWeight:700, cursor:'pointer', position:'relative', letterSpacing:'-.01em', boxShadow:'0 8px 24px rgba(0,0,0,.15)', transition:'all .18s' }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}
            onClick={() => navigate('/signup')}>
            Create your free account →
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop:'1px solid rgba(37,99,235,.1)', padding:'26px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, background:'#f0f4ff' }}>
        <Logo size="sm" />
        <div style={{ fontSize:'.68rem', fontFamily:"'JetBrains Mono',monospace", color:'#94a3b8' }}>Built for lecturers who value their time.</div>
        <div style={{ display:'flex', gap:18 }}>
          {['Sign in','Sign up'].map((t,i)=>(
            <button key={i} onClick={() => navigate(i===0?'/login':'/signup')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.78rem', color:'#64748b', fontFamily:"'Space Grotesk',sans-serif", transition:'color .14s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#2563eb'}
              onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>{t}</button>
          ))}
        </div>
      </footer>

      {/* ── CHATBOT ──────────────────────────────────────────── */}
      <Chatbot onNavigate={navigate} />
    </div>
  )
}