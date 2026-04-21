import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '⚡', title: 'Mark in seconds', body: 'One-tap per student. Bulk mark entire classes present with a single click.' },
  { icon: '⬛', title: 'QR attendance', body: 'Generate a unique QR per session. Students scan — they\'re marked. No lists, no friction.' },
  { icon: '↗', title: 'Live analytics', body: 'Attendance rates, trends, and at-risk students surfaced automatically.' },
  { icon: '◎', title: 'Multi-institution', body: 'Teach at more than one university? Manage all your classes from one place.' },
  { icon: '◆', title: 'Threshold alerts', body: 'Get notified when a student drops below the 75% attendance requirement.' },
  { icon: '⤓', title: 'Export reports', body: 'Download per-student or per-class attendance sheets anytime.' },
]

const STATS = [
  { val: '10s',  label: 'To mark a full class' },
  { val: '100%', label: 'Browser-based, no install' },
  { val: '75%',  label: 'Threshold tracking built-in' },
  { val: '∞',    label: 'Classes & students' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState({})
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.id]: true })) }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('[data-id]').forEach(el => obs.observe(el))
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <div style={{ background: '#f5f0e8', color: '#1e1a14', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:#c8760a; color:#fff; }
        ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:#c4b8a8; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .vis       { opacity:0; transform:translateY(18px); transition:opacity .65s ease, transform .65s ease; }
        .vis.show  { opacity:1; transform:none; }

        .cta-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 26px; border-radius:8px;
          font-family:'DM Sans',sans-serif; font-size:0.9rem; font-weight:600;
          cursor:pointer; border:none; transition:all .18s;
          text-decoration:none; letter-spacing:-0.01em;
        }
        .cta-warm { background:#c8760a; color:#fff; }
        .cta-warm:hover { background:#a85f06; transform:translateY(-2px); box-shadow:0 8px 28px rgba(200,118,10,0.25); }
        .cta-outline { background:transparent; color:#3d3729; border:1.5px solid rgba(30,26,20,0.2); }
        .cta-outline:hover { border-color:rgba(30,26,20,0.4); background:rgba(30,26,20,0.04); }
        .cta-dark { background:#1e1a14; color:#f5f0e8; }
        .cta-dark:hover { background:#3d3729; transform:translateY(-2px); }

        .feat-card {
          background:#faf7f2; border:1px solid rgba(30,26,20,0.1);
          border-radius:12px; padding:24px 22px;
          transition:border-color .2s, transform .2s, box-shadow .2s;
        }
        .feat-card:hover { border-color:rgba(200,118,10,0.3); transform:translateY(-3px); box-shadow:0 8px 32px rgba(30,26,20,0.08); }

        .nav-a {
          color:#6b6050; text-decoration:none; font-size:0.84rem; font-weight:500;
          transition:color .15s;
        }
        .nav-a:hover { color:#1e1a14; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 44px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 30 ? 'rgba(245,240,232,0.92)' : 'transparent',
        backdropFilter: scrollY > 30 ? 'blur(14px)' : 'none',
        borderBottom: scrollY > 30 ? '1px solid rgba(30,26,20,0.08)' : 'none',
        transition: 'background .3s, border-color .3s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'#c8760a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.7rem', color:'#fff', fontFamily:"'DM Mono',monospace" }}>IQ</div>
          <span style={{ fontWeight:600, fontSize:'1rem', letterSpacing:'-0.02em', color:'#1e1a14' }}>AttendIQ</span>
        </div>
        <div style={{ display:'flex', gap:26 }}>
          <a href="#features" className="nav-a">Features</a>
          <a href="#how" className="nav-a">How it works</a>
          <a href="#stats" className="nav-a">Why us</a>
        </div>
        <div style={{ display:'flex', gap:9 }}>
          <button className="cta-btn cta-outline" style={{ padding:'8px 16px', fontSize:'0.82rem' }} onClick={() => navigate('/login')}>Sign in</button>
          <button className="cta-btn cta-warm" style={{ padding:'8px 18px', fontSize:'0.82rem' }} onClick={() => navigate('/signup')}>Get started →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background texture */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 15% 85%, rgba(200,118,10,0.08) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(184,76,42,0.07) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(200,118,10,0.04) 0%, transparent 60%)', pointerEvents:'none' }} />
        {/* Subtle grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(30,26,20,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(30,26,20,0.04) 1px,transparent 1px)', backgroundSize:'56px 56px', pointerEvents:'none' }} />

        <div style={{ animation:'fadeUp .6s ease both', animationDelay:'.1s' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(200,118,10,0.1)', border:'1px solid rgba(200,118,10,0.25)', borderRadius:100, padding:'5px 13px', marginBottom:30, fontSize:'0.68rem', fontFamily:"'DM Mono',monospace", color:'#c8760a', letterSpacing:'0.06em' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#c8760a', display:'inline-block', animation:'fadeIn 1s ease infinite alternate' }} />
            NOW IN BETA · FREE FOR LECTURERS
          </div>
        </div>

        <h1 style={{ animation:'fadeUp .65s ease both', animationDelay:'.2s', fontFamily:"'Playfair Display',serif", fontSize:'clamp(3rem,7vw,5.5rem)', fontWeight:700, letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:10, maxWidth:820, color:'#1e1a14' }}>
          Attendance that{' '}
          <em style={{ color:'#c8760a', fontStyle:'italic' }}>actually works</em>
        </h1>

        <p style={{ animation:'fadeUp .65s ease both', animationDelay:'.35s', fontSize:'clamp(1rem,2vw,1.15rem)', color:'#6b6050', maxWidth:500, lineHeight:1.75, marginBottom:38 }}>
          AttendIQ is the modern attendance platform built for university lecturers — mark, track, and report in less time than it takes to call the register.
        </p>

        <div style={{ animation:'fadeUp .65s ease both', animationDelay:'.5s', display:'flex', gap:11, flexWrap:'wrap', justifyContent:'center' }}>
          <button className="cta-btn cta-warm" onClick={() => navigate('/signup')}>Create free account →</button>
          <button className="cta-btn cta-outline" onClick={() => navigate('/login')}>Sign in to dashboard</button>
        </div>

        {/* Dashboard preview */}
        <div style={{ animation:'fadeUp .7s ease both', animationDelay:'.7s', marginTop:72, width:'100%', maxWidth:900, position:'relative' }}>
          <div style={{ position:'absolute', inset:-1, background:'linear-gradient(180deg,transparent 50%,#f5f0e8 100%)', zIndex:2, borderRadius:14, pointerEvents:'none' }} />
          <div style={{ background:'#1e1a14', border:'1px solid rgba(30,26,20,0.2)', borderRadius:14, overflow:'hidden', boxShadow:'0 32px 80px rgba(30,26,20,0.18)', position:'relative' }}>
            <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10, background:'#15120e' }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f57','#febc2e','#28c840'].map((c,i) => <div key={i} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}
              </div>
              <div style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:5, height:20, maxWidth:280, display:'flex', alignItems:'center', paddingLeft:10 }}>
                <span style={{ fontSize:'0.62rem', fontFamily:"'DM Mono',monospace", color:'rgba(255,255,255,0.3)' }}>attendiq.app/dashboard</span>
              </div>
            </div>
            <div style={{ display:'flex', height:300 }}>
              <div style={{ width:170, borderRight:'1px solid rgba(255,255,255,0.06)', padding:'14px 10px', display:'flex', flexDirection:'column', gap:3 }}>
                {['Dashboard','Students','Courses','Attendance','Reports'].map((item,i) => (
                  <div key={i} style={{ padding:'7px 10px', borderRadius:7, background: i===0 ? 'rgba(200,118,10,0.2)' : 'transparent', color: i===0 ? '#c8760a' : 'rgba(255,255,255,0.3)', fontSize:'0.72rem', fontWeight:500 }}>{item}</div>
                ))}
              </div>
              <div style={{ flex:1, padding:18 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[['23','Students'],['5','Courses'],['18','Present'],['78%','Rate']].map(([v,l],i) => (
                    <div key={i} style={{ background: i===3?'#c8760a':'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9, padding:'11px 12px' }}>
                      <div style={{ fontSize:'0.52rem', fontFamily:"'DM Mono',monospace", color: i===3?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.35)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.4rem', fontWeight:600, letterSpacing:'-0.03em', color: i===3?'#fff':'rgba(255,255,255,0.9)', marginTop:5 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9, padding:'11px 14px' }}>
                  <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace", marginBottom:10 }}>TODAY'S ATTENDANCE</div>
                  {[['Brian Otieno','104298','present'],['Alice Wanjiku','104299','present'],['Kevin Mwangi','104300','absent']].map(([n,id,st],i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom: i<2?'1px solid rgba(255,255,255,0.05)':'none' }}>
                      <div style={{ fontSize:'0.7rem', fontWeight:500, color:'rgba(255,255,255,0.8)' }}>{n}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:'0.58rem', fontFamily:"'DM Mono',monospace", color:'rgba(255,255,255,0.25)' }}>{id}</span>
                        <span style={{ fontSize:'0.58rem', padding:'2px 7px', borderRadius:4, background: st==='present'?'rgba(90,122,92,0.2)':'rgba(184,76,42,0.2)', color: st==='present'?'#7ab87e':'#d4795a', fontFamily:"'DM Mono',monospace" }}>{st}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ overflow:'hidden', borderTop:'1px solid rgba(30,26,20,0.1)', borderBottom:'1px solid rgba(30,26,20,0.1)', padding:'12px 0', background:'#ede8de' }}>
        <div style={{ display:'flex', gap:0, animation:'marquee 22s linear infinite', width:'max-content' }}>
          {[...Array(2)].map((_,ii) => (
            <div key={ii} style={{ display:'flex', gap:0 }}>
              {['QR Check-in','Live Analytics','Multi-Institution','Auto Alerts','Class Reports','Student Tracking','Bulk Marking','Export PDF'].map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:18, padding:'0 24px', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:'0.72rem', fontFamily:"'DM Mono',monospace", color:'#9e9080', letterSpacing:'0.06em', textTransform:'uppercase' }}>{t}</span>
                  <span style={{ color:'#c8760a', fontSize:'0.65rem' }}>✦</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding:'100px 48px', maxWidth:1100, margin:'0 auto' }}>
        <div data-id="fh" className={`vis${visible['fh']?' show':''}`} style={{ textAlign:'center', marginBottom:60 }}>
          <div style={{ fontSize:'0.65rem', fontFamily:"'DM Mono',monospace", color:'#c8760a', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:12 }}>Everything you need</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.9rem,4vw,2.8rem)', fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.1 }}>
            Built for lecturers,<br /><em>not administrators</em>
          </h2>
          <p style={{ color:'#6b6050', marginTop:14, fontSize:'0.92rem', maxWidth:460, margin:'14px auto 0', lineHeight:1.8 }}>
            Every feature was designed around a single question: how do we make marking attendance take the least amount of time possible?
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14 }}>
          {FEATURES.map((f,i) => (
            <div key={i} data-id={`f${i}`} className={`feat-card vis${visible[`f${i}`]?' show':''}`} style={{ transitionDelay:`${i*0.08}s` }}>
              <div style={{ fontSize:'1.3rem', marginBottom:14, opacity:0.7 }}>{f.icon}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:'1rem', marginBottom:8, letterSpacing:'-0.01em' }}>{f.title}</div>
              <div style={{ fontSize:'0.82rem', color:'#6b6050', lineHeight:1.75 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding:'80px 48px', background:'#ede8de', borderTop:'1px solid rgba(30,26,20,0.1)', borderBottom:'1px solid rgba(30,26,20,0.1)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div data-id="hh" className={`vis${visible['hh']?' show':''}`} style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:'0.65rem', fontFamily:"'DM Mono',monospace", color:'#c8760a', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:12 }}>Simple workflow</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:700, letterSpacing:'-0.03em' }}>Up and running in 3 steps</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, position:'relative' }}>
            <div style={{ position:'absolute', top:28, left:'16%', right:'16%', height:1, background:'linear-gradient(90deg,transparent,rgba(200,118,10,0.35),transparent)', pointerEvents:'none' }} />
            {[
              { n:'01', title:'Create your account', body:'Sign up as a lecturer. Add your institution, courses, and students in minutes.' },
              { n:'02', title:'Set up your classes', body:'Add your units with schedule and venue info. Enrol students with their 6-digit ID.' },
              { n:'03', title:'Start marking', body:'Open the attendance page, pick a class and date — mark manually or show the QR code.' },
            ].map((step,i) => (
              <div key={i} data-id={`s${i}`} className={`vis${visible[`s${i}`]?' show':''}`} style={{ transitionDelay:`${i*0.15}s`, textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(200,118,10,0.1)', border:'2px solid rgba(200,118,10,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontFamily:"'DM Mono',monospace", fontSize:'0.8rem', fontWeight:500, color:'#c8760a' }}>{step.n}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, marginBottom:9, fontSize:'0.97rem', letterSpacing:'-0.01em' }}>{step.title}</div>
                <div style={{ fontSize:'0.82rem', color:'#6b6050', lineHeight:1.75 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" style={{ padding:'100px 48px', maxWidth:900, margin:'0 auto' }}>
        <div data-id="sh" className={`vis${visible['sh']?' show':''}`} style={{ textAlign:'center', marginBottom:52 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:700, letterSpacing:'-0.03em', marginBottom:12 }}>
            Designed around<br /><em>what matters</em>
          </h2>
          <p style={{ color:'#6b6050', fontSize:'0.9rem' }}>No bloat. No enterprise pricing. No training required.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {STATS.map((st,i) => (
            <div key={i} data-id={`st${i}`} className={`vis${visible[`st${i}`]?' show':''}`} style={{ transitionDelay:`${i*0.1}s`, textAlign:'center', padding:'28px 20px', background:'#faf7f2', border:'1px solid rgba(30,26,20,0.1)', borderRadius:12 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.6rem', fontWeight:700, letterSpacing:'-0.04em', color:'#c8760a', marginBottom:8 }}>{st.val}</div>
              <div style={{ fontSize:'0.78rem', color:'#6b6050', lineHeight:1.6 }}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding:'0 48px 100px', maxWidth:920, margin:'0 auto' }}>
        <div data-id="cta" className={`vis${visible['cta']?' show':''}`} style={{ background:'#1e1a14', borderRadius:20, padding:'56px 52px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 80% 50%, rgba(200,118,10,0.12) 0%, transparent 60%)', pointerEvents:'none' }} />
          <div style={{ fontSize:'0.65rem', fontFamily:"'DM Mono',monospace", color:'rgba(200,118,10,0.7)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:14, position:'relative' }}>Get started today</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.7rem,4vw,2.4rem)', fontWeight:700, letterSpacing:'-0.03em', color:'#f5f0e8', marginBottom:12, lineHeight:1.2, position:'relative' }}>
            Ready to modernise<br /><em style={{ color:'#c8760a' }}>your attendance?</em>
          </h2>
          <p style={{ color:'rgba(245,240,232,0.5)', marginBottom:28, fontSize:'0.9rem', position:'relative' }}>Free for individual lecturers. No credit card. No setup fees.</p>
          <button className="cta-btn cta-warm" style={{ position:'relative' }} onClick={() => navigate('/signup')}>
            Create your free account →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(30,26,20,0.1)', padding:'26px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, background:'#c8760a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:700, color:'#fff', fontFamily:"'DM Mono',monospace" }}>IQ</div>
          <span style={{ fontWeight:600, fontSize:'0.9rem', letterSpacing:'-0.02em', color:'#1e1a14' }}>AttendIQ</span>
        </div>
        <div style={{ fontSize:'0.7rem', fontFamily:"'DM Mono',monospace", color:'#9e9080' }}>Built for lecturers who value their time.</div>
        <div style={{ display:'flex', gap:18 }}>
          <button onClick={() => navigate('/login')}  style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.78rem', color:'#9e9080', fontFamily:"'DM Sans',sans-serif" }}>Sign in</button>
          <button onClick={() => navigate('/signup')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.78rem', color:'#9e9080', fontFamily:"'DM Sans',sans-serif" }}>Sign up</button>
        </div>
      </footer>
    </div>
  )
}