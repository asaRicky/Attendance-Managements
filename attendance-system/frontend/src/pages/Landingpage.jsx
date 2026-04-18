import { useState, useEffect, useRef } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0a0a0f;
    --paper: #f5f2eb;
    --accent: #c8f04c;
    --accent2: #4cf0b8;
    --muted: #6b6860;
    --card-bg: #ffffff;
    --border: rgba(10,10,15,0.1);
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-body);
    overflow-x: hidden;
  }

  /* NAV */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 48px;
    backdrop-filter: blur(12px);
    background: rgba(245,242,235,0.85);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.35rem;
    letter-spacing: -0.03em;
    display: flex; align-items: center; gap: 8px;
  }
  .nav-logo span { color: var(--muted); font-weight: 400; }
  .logo-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent);
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.7; }
  }
  .nav-links { display: flex; align-items: center; gap: 36px; }
  .nav-links a {
    font-size: 0.875rem; font-weight: 500; color: var(--muted);
    text-decoration: none; letter-spacing: 0.01em;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--ink); }
  .nav-cta {
    background: var(--ink); color: var(--paper);
    padding: 10px 22px; border-radius: 100px;
    font-size: 0.85rem; font-weight: 500;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s;
  }
  .nav-cta:hover { background: #222; transform: scale(1.03); color: var(--paper) !important; }

  /* HERO */
  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 120px 24px 80px;
    position: relative;
    overflow: hidden;
  }

  .hero-bg-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
    pointer-events: none;
  }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: white; border: 1px solid var(--border);
    border-radius: 100px; padding: 6px 16px 6px 8px;
    font-size: 0.75rem; font-weight: 500; color: var(--muted);
    margin-bottom: 40px;
    animation: fadeUp 0.6s ease both;
  }
  .hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent2);
  }

  .hero-headline {
    font-family: var(--font-display);
    font-size: clamp(3.5rem, 8vw, 7rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.95;
    max-width: 900px;
    animation: fadeUp 0.7s 0.1s ease both;
    position: relative;
  }
  .hero-headline em {
    font-style: normal;
    position: relative;
    display: inline-block;
  }
  .hero-headline em::after {
    content: '';
    position: absolute; left: 0; right: 0; bottom: -4px;
    height: 8px;
    background: var(--accent);
    border-radius: 4px;
    transform: scaleX(0);
    transform-origin: left;
    animation: underlineIn 0.5s 0.9s ease forwards;
  }
  @keyframes underlineIn { to { transform: scaleX(1); } }

  .hero-sub {
    font-size: 1.1rem; color: var(--muted); font-weight: 300;
    max-width: 500px; line-height: 1.7; margin-top: 28px;
    animation: fadeUp 0.7s 0.2s ease both;
  }

  .hero-actions {
    display: flex; align-items: center; gap: 16px; margin-top: 44px;
    animation: fadeUp 0.7s 0.3s ease both;
    flex-wrap: wrap; justify-content: center;
  }
  .btn-primary {
    background: var(--ink); color: var(--paper);
    padding: 14px 32px; border-radius: 100px;
    font-size: 0.95rem; font-weight: 500;
    text-decoration: none; border: none; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
    font-family: var(--font-body);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(10,10,15,0.2); }
  .btn-secondary {
    background: transparent; color: var(--ink);
    padding: 14px 32px; border-radius: 100px;
    font-size: 0.95rem; font-weight: 500;
    text-decoration: none; border: 1.5px solid var(--border);
    display: inline-flex; align-items: center; gap: 8px;
    transition: border-color 0.2s, background 0.2s;
    font-family: var(--font-body);
  }
  .btn-secondary:hover { border-color: var(--ink); background: rgba(10,10,15,0.04); }

  .hero-stats {
    display: flex; gap: 48px; margin-top: 72px;
    animation: fadeUp 0.7s 0.4s ease both;
    flex-wrap: wrap; justify-content: center;
  }
  .stat { text-align: center; }
  .stat-num {
    font-family: var(--font-display); font-weight: 800; font-size: 2rem;
    letter-spacing: -0.04em; color: var(--ink);
  }
  .stat-label { font-size: 0.8rem; color: var(--muted); font-weight: 400; margin-top: 4px; }

  /* SCROLL TICKER */
  .ticker-wrap {
    overflow: hidden; background: var(--ink); padding: 14px 0;
    border-top: 1px solid rgba(255,255,255,0.1);
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .ticker {
    display: flex; gap: 0;
    animation: ticker 20s linear infinite;
    width: max-content;
  }
  .ticker-item {
    display: flex; align-items: center; gap: 24px;
    padding: 0 40px;
    font-family: var(--font-display); font-size: 0.8rem;
    font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    white-space: nowrap;
  }
  .ticker-item strong { color: var(--accent); }
  .ticker-sep { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.2); flex-shrink: 0; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* FEATURES */
  .section { padding: 100px 48px; max-width: 1200px; margin: 0 auto; }
  .section-label {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 20px;
  }
  .section-title {
    font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.5rem);
    font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; max-width: 600px;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2px;
    margin-top: 64px;
    border: 2px solid var(--ink);
    border-radius: 24px;
    overflow: hidden;
  }
  .feature-card {
    background: white; padding: 40px 36px;
    transition: background 0.25s;
    position: relative;
  }
  .feature-card:hover { background: var(--accent); }
  .feature-card:hover .feature-icon { background: var(--ink); color: var(--accent); }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--ink); color: var(--paper);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem; margin-bottom: 24px;
    transition: background 0.25s, color 0.25s;
  }
  .feature-title {
    font-family: var(--font-display); font-size: 1.15rem; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 12px;
  }
  .feature-desc { font-size: 0.875rem; color: var(--muted); line-height: 1.7; }
  .feature-card:hover .feature-desc { color: rgba(10,10,15,0.65); }

  /* HOW IT WORKS */
  .how-section { background: var(--ink); color: var(--paper); }
  .how-wrap { max-width: 1200px; margin: 0 auto; padding: 100px 48px; }
  .how-section .section-label { color: rgba(255,255,255,0.4); }
  .how-section .section-title { color: var(--paper); }

  .steps { display: flex; flex-direction: column; gap: 0; margin-top: 64px; }
  .step {
    display: grid; grid-template-columns: 80px 1fr;
    gap: 32px; align-items: start;
    padding: 40px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .step:last-child { border-bottom: none; }
  .step-num {
    font-family: var(--font-display); font-size: 4rem; font-weight: 800;
    color: rgba(255,255,255,0.12); line-height: 1; letter-spacing: -0.05em;
  }
  .step-content-title {
    font-family: var(--font-display); font-size: 1.5rem; font-weight: 700;
    letter-spacing: -0.03em; margin-bottom: 12px; color: var(--paper);
  }
  .step-content-desc { font-size: 0.9rem; color: rgba(255,255,255,0.5); line-height: 1.7; }
  .step-tag {
    display: inline-block; background: var(--accent); color: var(--ink);
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 100px;
    margin-bottom: 14px;
  }

  /* ROLES */
  .roles-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px; margin-top: 64px;
  }
  .role-card {
    border: 1.5px solid var(--border); border-radius: 20px;
    padding: 36px 28px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .role-card:hover {
    border-color: var(--ink); transform: translateY(-4px);
    box-shadow: 0 20px 48px rgba(10,10,15,0.1);
  }
  .role-emoji { font-size: 2rem; margin-bottom: 20px; }
  .role-title {
    font-family: var(--font-display); font-size: 1.2rem; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 10px;
  }
  .role-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.65; }
  .role-list { list-style: none; margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
  .role-list li {
    font-size: 0.82rem; color: var(--muted);
    display: flex; align-items: center; gap: 8px;
  }
  .role-list li::before { content: '→'; color: var(--ink); font-weight: 700; flex-shrink: 0; }

  /* CTA */
  .cta-section {
    background: var(--accent); text-align: center;
    padding: 100px 48px;
  }
  .cta-title {
    font-family: var(--font-display); font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 800; letter-spacing: -0.04em; color: var(--ink); max-width: 700px;
    margin: 0 auto 16px;
  }
  .cta-sub { font-size: 1rem; color: rgba(10,10,15,0.6); margin-bottom: 44px; }

  /* FOOTER */
  .footer {
    background: var(--ink); color: rgba(255,255,255,0.4);
    padding: 40px 48px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    font-size: 0.8rem;
  }
  .footer-brand {
    font-family: var(--font-display); font-weight: 800; font-size: 1.1rem;
    color: white; letter-spacing: -0.03em;
  }

  /* ANIMATIONS */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .reveal {
    opacity: 0; transform: translateY(40px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible { opacity: 1; transform: none; }

  /* FLOATING CARDS */
  .hero-float {
    position: absolute; border-radius: 16px;
    background: white; border: 1px solid var(--border);
    padding: 14px 18px; font-size: 0.78rem;
    box-shadow: 0 8px 32px rgba(10,10,15,0.08);
    pointer-events: none; animation: float 4s ease-in-out infinite;
  }
  .hero-float-1 {
    left: 6%; top: 35%;
    animation-delay: 0s;
  }
  .hero-float-2 {
    right: 6%; top: 40%;
    animation-delay: 1.5s;
  }
  .hero-float-label { color: var(--muted); font-size: 0.7rem; margin-bottom: 6px; }
  .hero-float-val {
    font-family: var(--font-display); font-weight: 700;
    font-size: 1.2rem; letter-spacing: -0.03em;
  }
  .hero-float-bar { display: flex; gap: 4px; margin-top: 8px; }
  .bar { height: 4px; border-radius: 2px; background: var(--accent); }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @media (max-width: 768px) {
    .nav { padding: 16px 20px; }
    .nav-links { display: none; }
    .section { padding: 60px 20px; }
    .hero-float { display: none; }
    .footer { padding: 24px 20px; }
    .how-wrap { padding: 60px 20px; }
    .cta-section { padding: 60px 20px; }
  }
`;

const features = [
  { icon: "📍", title: "Real-Time Check-In", desc: "Mark attendance instantly with QR codes or manual entry. Sync across all devices in seconds." },
  { icon: "📊", title: "Live Analytics", desc: "Beautiful dashboards showing attendance trends, patterns, and alerts — per class, per lecturer, per institution." },
  { icon: "🏫", title: "Multi-Institution", desc: "One account. Multiple universities. Manage classes across every campus you teach at, side by side." },
  { icon: "🔔", title: "Smart Alerts", desc: "Automated notifications for absenteeism thresholds. Keep students and departments informed." },
  { icon: "📄", title: "Export Reports", desc: "Generate PDF or CSV reports for any class, date range, or student — in one click." },
  { icon: "🔐", title: "Role-Based Access", desc: "Separate workflows for Admins, Lecturers. Every user sees exactly what they need." },
];

const steps = [
  { tag: "Setup", title: "Create your institution & classes", desc: "Admins configure schools, departments, class schedules, venues, and enrollments in minutes." },
  { tag: "Enroll", title: "Add students to each unit", desc: "Bulk import or manually enroll students per class. Each student gets a unique ID tracked across all their units." },
  { tag: "Mark", title: "Lecturers take attendance live", desc: "Open the class, tap through the roster. Present, Absent, Late — done in under 2 minutes per session." },
  { tag: "Analyse", title: "Review insights & export", desc: "The dashboard surfaces attendance rates, at-risk students, and trends automatically." },
];

const roles = [
  {
    emoji: "🛡️", title: "Administrator",
    desc: "Full system control.",
    list: ["Manage all users & roles", "Create institutions & departments", "View cross-institution reports", "Configure system settings"],
  },
  {
    emoji: "🎓", title: "Lecturer",
    desc: "Focused on your classes.",
    list: ["Mark attendance per session", "View your class rosters", "Track student attendance rates", "Export reports for your units"],
  },
];

const tickerItems = ["AttendIQ", "Multi-Institution", "Real-Time Sync", "Smart Analytics", "Role-Based Access", "QR Check-In", "Export Reports", "Zero Paper"];

export default function LandingPage() {
  const [count, setCount] = useState({ sessions: 0, students: 0, classes: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    // Animate counters
    const targets = { sessions: 12400, students: 3800, classes: 180 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        sessions: Math.round(targets.sessions * ease),
        students: Math.round(targets.students * ease),
        classes: Math.round(targets.classes * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    // Intersection observer for reveals
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    els.forEach(el => obs.observe(el));
    return () => { clearInterval(timer); obs.disconnect(); };
  }, []);

  const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;

  return (
    <>
      <style>{style}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <span className="logo-dot" />
          AttendIQ <span>by EduTech</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#roles">For who</a>
          <a href="/login" className="nav-cta">Sign in →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg-grid" />

        {/* Floating UI cards */}
        <div className="hero-float hero-float-1">
          <div className="hero-float-label">Today's Attendance</div>
          <div className="hero-float-val" style={{ color: '#16a34a' }}>92%</div>
          <div className="hero-float-bar">
            <div className="bar" style={{ width: 60 }} />
            <div className="bar" style={{ width: 24, opacity: 0.3 }} />
          </div>
        </div>
        <div className="hero-float hero-float-2">
          <div className="hero-float-label">Active Sessions</div>
          <div className="hero-float-val">14</div>
          <div style={{ fontSize: '0.7rem', color: '#6b6860', marginTop: 6 }}>↑ 3 since last hour</div>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Now supporting multi-campus institutions
        </div>

        <h1 className="hero-headline">
          Attendance,<br />
          <em>reimagined</em><br />
          for Kenya
        </h1>

        <p className="hero-sub">
          AttendIQ gives lecturers and administrators a single, beautiful workspace to track every session — across every campus.
        </p>

        <div className="hero-actions">
          <a href="/signup" className="btn-primary">Get started free →</a>
          <a href="/login" className="btn-secondary">Sign in</a>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">{fmt(count.sessions)}+</div>
            <div className="stat-label">Sessions tracked</div>
          </div>
          <div className="stat">
            <div className="stat-num">{fmt(count.students)}+</div>
            <div className="stat-label">Students enrolled</div>
          </div>
          <div className="stat">
            <div className="stat-num">{count.classes}+</div>
            <div className="stat-label">Active classes</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
            <div className="ticker-item" key={i}>
              {i % 2 === 0 ? <strong>{t}</strong> : t}
              <span className="ticker-sep" />
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ background: 'var(--paper)' }}>
        <div className="section">
          <div className="section-label reveal">Everything you need</div>
          <div className="section-title reveal">Built for the way educators actually work</div>
          <div className="features-grid reveal">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="how-wrap">
          <div className="section-label reveal">How it works</div>
          <div className="section-title reveal">Four steps from setup to insights</div>
          <div className="steps">
            {steps.map((s, i) => (
              <div className="step reveal" key={i}>
                <div className="step-num">0{i + 1}</div>
                <div>
                  <div className="step-tag">{s.tag}</div>
                  <div className="step-content-title">{s.title}</div>
                  <div className="step-content-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <div id="roles" style={{ background: 'var(--paper)' }}>
        <div className="section">
          <div className="section-label reveal">Built for everyone</div>
          <div className="section-title reveal">A role for every person on campus</div>
          <div className="roles-grid">
            {roles.map(r => (
              <div className="role-card reveal" key={r.title}>
                <div className="role-emoji">{r.emoji}</div>
                <div className="role-title">{r.title}</div>
                <div className="role-desc">{r.desc}</div>
                <ul className="role-list">
                  {r.list.map(l => <li key={l}>{l}</li>)}
                </ul>
              </div>
            ))}
            {/* Demo card */}
            <div className="role-card reveal" style={{ background: 'var(--ink)', borderColor: 'transparent', color: 'white' }}>
              <div className="role-emoji">🚀</div>
              <div className="role-title" style={{ color: 'white' }}>Ready to try?</div>
              <div className="role-desc" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                Use the demo credentials to explore the full system right now.
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', background: 'rgba(255,255,255,0.07)', padding: '16px', borderRadius: '12px', lineHeight: 2, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: 'var(--accent)' }}>admin</span> / admin123<br />
                <span style={{ color: 'var(--accent2)' }}>dr.omondi</span> / lecturer123<br />
                <span style={{ color: 'var(--accent2)' }}>prof.waweru</span> / lecturer123
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-title reveal">Start tracking in under 5 minutes</div>
        <p className="cta-sub reveal">No setup fees. No complex configuration. Just sign up and go.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/signup" className="btn-primary" style={{ background: 'var(--ink)' }}>Create free account →</a>
          <a href="/login" className="btn-secondary" style={{ borderColor: 'rgba(10,10,15,0.25)' }}>Sign in instead</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">AttendIQ</div>
        <div>Built for Kenyan higher education · {new Date().getFullYear()}</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Login</a>
          <a href="/signup" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Sign Up</a>
        </div>
      </footer>
    </>
  );
}