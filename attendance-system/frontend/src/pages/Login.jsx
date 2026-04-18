import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import client from "../api/client";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0a0a0f;
    --paper: #f5f2eb;
    --accent: #c8f04c;
    --accent2: #4cf0b8;
    --muted: #6b6860;
    --danger: #e03e3e;
    --border: rgba(10,10,15,0.12);
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  .login-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: var(--font-body);
    overflow: hidden;
  }

  /* LEFT PANEL */
  .login-left {
    background: var(--ink);
    position: relative;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    overflow: hidden;
  }

  .login-left-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 60% at 30% 40%, rgba(200,240,76,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 70% 70%, rgba(76,240,184,0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  .login-left-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .left-brand {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 800;
    font-size: 1.25rem; color: white; letter-spacing: -0.03em;
  }
  .brand-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.7; }
  }

  .left-copy { position: relative; z-index: 1; }
  .left-headline {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 3.5vw, 3.2rem);
    font-weight: 800; letter-spacing: -0.04em; line-height: 1.05;
    color: white; margin-bottom: 20px;
  }
  .left-headline span {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .left-sub { font-size: 0.9rem; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 320px; }

  .left-stats {
    position: relative; z-index: 1;
    display: flex; gap: 32px; flex-wrap: wrap;
  }
  .left-stat {}
  .left-stat-num {
    font-family: var(--font-display); font-size: 1.6rem; font-weight: 800;
    color: var(--accent); letter-spacing: -0.04em;
  }
  .left-stat-label { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 2px; }

  /* Floating live card */
  .live-card {
    position: absolute; top: 38%; right: 40px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border-radius: 16px; padding: 16px 20px;
    animation: float 4s ease-in-out infinite;
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .live-label { font-size: 0.68rem; color: rgba(255,255,255,0.4); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent2); animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
  .live-val { font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; color: white; letter-spacing: -0.03em; }
  .live-sub { font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 4px; }

  /* RIGHT PANEL */
  .login-right {
    background: var(--paper);
    display: flex; align-items: center; justify-content: center;
    padding: 48px;
    position: relative;
  }

  .login-form-wrap {
    width: 100%; max-width: 400px;
    animation: slideIn 0.6s ease both;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .form-header { margin-bottom: 40px; }
  .form-eyebrow {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 10px;
  }
  .form-title {
    font-family: var(--font-display); font-size: 2.2rem; font-weight: 800;
    letter-spacing: -0.04em; color: var(--ink); line-height: 1.1;
  }

  /* ROLE TABS */
  .role-tabs {
    display: flex; gap: 8px; margin-bottom: 32px;
    background: white; border: 1px solid var(--border);
    border-radius: 12px; padding: 4px;
  }
  .role-tab {
    flex: 1; padding: 8px 12px; border-radius: 8px; border: none;
    background: transparent; font-family: var(--font-body);
    font-size: 0.8rem; font-weight: 500; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .role-tab.active {
    background: var(--ink); color: white;
    box-shadow: 0 2px 8px rgba(10,10,15,0.2);
  }

  /* QUICK-FILL */
  .quickfill {
    background: white; border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 16px;
    margin-bottom: 28px;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  .quickfill-label { font-size: 0.7rem; color: var(--muted); font-weight: 500; margin-bottom: 10px; letter-spacing: 0.04em; text-transform: uppercase; }
  .quickfill-items { display: flex; flex-wrap: wrap; gap: 6px; }
  .quickfill-btn {
    background: var(--paper); border: 1px solid var(--border);
    border-radius: 8px; padding: 6px 12px;
    font-size: 0.76rem; font-weight: 500; color: var(--ink);
    cursor: pointer; font-family: var(--font-body);
    transition: all 0.15s;
  }
  .quickfill-btn:hover { background: var(--accent); border-color: var(--accent); }

  /* FORM */
  .field { margin-bottom: 20px; }
  .field-label {
    display: block; font-size: 0.8rem; font-weight: 500;
    color: var(--ink); margin-bottom: 8px;
  }
  .field-input {
    width: 100%; padding: 13px 16px;
    border: 1.5px solid var(--border); border-radius: 12px;
    background: white; font-family: var(--font-body);
    font-size: 0.9rem; color: var(--ink);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
  }
  .field-input:focus {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(10,10,15,0.08);
  }
  .field-input.error { border-color: var(--danger); }
  .field-hint { font-size: 0.72rem; color: var(--muted); margin-top: 5px; }

  .error-box {
    background: #fdf2f1; border: 1px solid #f5c6c3;
    border-radius: 10px; padding: 12px 16px;
    font-size: 0.82rem; color: var(--danger);
    margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
  }

  .submit-btn {
    width: 100%; padding: 14px;
    background: var(--ink); color: var(--paper);
    border: none; border-radius: 12px;
    font-family: var(--font-display); font-size: 1rem; font-weight: 700;
    letter-spacing: -0.02em; cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(10,10,15,0.2);
  }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .submit-btn.loading { background: #333; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .form-footer {
    text-align: center; margin-top: 24px;
    font-size: 0.82rem; color: var(--muted);
  }
  .form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .form-footer a:hover { text-decoration: underline; }

  .back-link {
    position: absolute; top: 32px; left: 32px;
    font-size: 0.82rem; color: var(--muted);
    text-decoration: none; display: flex; align-items: center; gap: 6px;
    transition: color 0.2s;
  }
  .back-link:hover { color: var(--ink); }

  @media (max-width: 768px) {
    .login-root { grid-template-columns: 1fr; }
    .login-left { display: none; }
    .login-right { padding: 32px 24px; align-items: flex-start; padding-top: 80px; }
  }
`;

// Demo credentials matching seed.py
const DEMO_ACCOUNTS = [
  { label: "Admin", username: "admin", password: "admin123", role: "admin" },
  { label: "Dr. Omondi", username: "dr.omondi", password: "lecturer123", role: "lecturer" },
  { label: "Prof. Waweru", username: "prof.waweru", password: "lecturer123", role: "lecturer" },
];

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState("lecturer");
  const [liveCount, setLiveCount] = useState(7);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  // Simulate live active sessions
  useEffect(() => {
    const t = setInterval(() => {
      setLiveCount(n => n + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 1 : 0));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await client.post('/auth/login', {
        username: form.username.trim(),
        password: form.password,
      })

      const token = res.data.access_token

      // Fetch the actual user profile after login
      const meRes = await client.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      login(token, meRes.data)
      navigate('/')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Incorrect username or password.')
      } else if (!err.response) {
        setError('Cannot reach the server.')
      } else {
        setError(err.response?.data?.detail || 'Login failed.')
      }
    } finally {
      setLoading(false)
    }
  };

  const quickFill = (account) => {
    setForm({ username: account.username, password: account.password });
    setError("");
  };

  const filteredDemo = DEMO_ACCOUNTS.filter(a =>
    activeRole === "admin" ? a.role === "admin" : a.role === "lecturer"
  );

  return (
    <>
      <style>{style}</style>
      <div className="login-root">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-grid" />

          <div className="left-brand">
            <span className="brand-dot" />
            AttendIQ
          </div>

          <div className="left-copy">
            <h1 className="left-headline">
              Track every<br />
              <span>session,</span><br />
              everywhere.
            </h1>
            <p className="left-sub">
              The modern attendance platform built for Kenyan universities — multi-campus, real-time, and beautifully simple.
            </p>
          </div>

          {/* Live sessions card */}
          <div className="live-card">
            <div className="live-label">
              <span className="live-dot" />
              Live right now
            </div>
            <div className="live-val">{liveCount}</div>
            <div className="live-sub">active sessions across campuses</div>
          </div>

          <div className="left-stats">
            <div className="left-stat">
              <div className="left-stat-num">3</div>
              <div className="left-stat-label">Institutions</div>
            </div>
            <div className="left-stat">
              <div className="left-stat-num">5</div>
              <div className="left-stat-label">Classes</div>
            </div>
            <div className="left-stat">
              <div className="left-stat-num">15</div>
              <div className="left-stat-label">Students enrolled</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <Link to="/" className="back-link">← Home</Link>

          <div className="login-form-wrap">
            <div className="form-header">
              <div className="form-eyebrow">Welcome back</div>
              <div className="form-title">Sign in to<br />AttendIQ</div>
            </div>

            {/* Role selector */}
            <div className="role-tabs">
              <button
                className={`role-tab ${activeRole === "lecturer" ? "active" : ""}`}
                onClick={() => { setActiveRole("lecturer"); setForm({ username: "", password: "" }); setError(""); }}
                type="button"
              >
                🎓 Lecturer
              </button>
              <button
                className={`role-tab ${activeRole === "admin" ? "active" : ""}`}
                onClick={() => { setActiveRole("admin"); setForm({ username: "", password: "" }); setError(""); }}
                type="button"
              >
                🛡️ Admin
              </button>
            </div>

            {/* Quick-fill demo accounts */}
            <div className="quickfill">
              <div className="quickfill-label">Demo · Quick fill</div>
              <div className="quickfill-items">
                {filteredDemo.map(a => (
                  <button key={a.username} className="quickfill-btn" type="button" onClick={() => quickFill(a)}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  className={`field-input ${error ? "error" : ""}`}
                  type="text"
                  placeholder={activeRole === "admin" ? "admin" : "Your username"}
                  value={form.username}
                  onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setError(""); }}
                  autoFocus
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  className={`field-input ${error ? "error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(""); }}
                  autoComplete="current-password"
                />
                {activeRole === "admin" && (
                  <div className="field-hint">Admin password: admin123</div>
                )}
                {activeRole === "lecturer" && (
                  <div className="field-hint">Lecturer password: lecturer123</div>
                )}
              </div>

              {error && (
                <div className="error-box">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                className={`submit-btn ${loading ? "loading" : ""}`}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" /> Signing in...</>
                ) : (
                  <>Sign in →</>
                )}
              </button>
            </form>

            <div className="form-footer">
              Don't have an account?{" "}
              <Link to="/signup">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}