import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    --success: #16a34a;
    --border: rgba(10,10,15,0.12);
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  .signup-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    font-family: var(--font-body);
    overflow: hidden;
  }

  /* LEFT */
  .signup-left {
    background: var(--accent);
    position: relative;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    overflow: hidden;
  }

  .signup-left-deco {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(10,10,15,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(10,10,15,0.06) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* Giant number decoration */
  .signup-big-num {
    position: absolute;
    bottom: -20px; right: -20px;
    font-family: var(--font-display);
    font-size: 18rem; font-weight: 800;
    line-height: 1; letter-spacing: -0.06em;
    color: rgba(10,10,15,0.08);
    pointer-events: none; user-select: none;
  }

  .signup-brand {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 800;
    font-size: 1.25rem; color: var(--ink); letter-spacing: -0.03em;
  }
  .signup-brand-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--ink);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
  }

  .signup-left-copy { position: relative; z-index: 1; }
  .signup-headline {
    font-family: var(--font-display);
    font-size: clamp(2rem, 3vw, 3rem);
    font-weight: 800; letter-spacing: -0.04em; line-height: 1.05;
    color: var(--ink); margin-bottom: 20px;
  }
  .signup-sub { font-size: 0.9rem; color: rgba(10,10,15,0.55); line-height: 1.7; max-width: 300px; }

  .signup-checklist { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
  .signup-check {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 0.875rem; color: rgba(10,10,15,0.7);
  }
  .check-icon {
    width: 22px; height: 22px; border-radius: 6px;
    background: var(--ink); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 700; flex-shrink: 0; margin-top: 1px;
  }
  .check-text { line-height: 1.5; }
  .check-text strong { color: var(--ink); display: block; font-weight: 600; font-size: 0.85rem; }

  /* RIGHT */
  .signup-right {
    background: var(--paper);
    display: flex; align-items: center; justify-content: center;
    padding: 48px; position: relative;
    overflow-y: auto;
  }

  .signup-form-wrap {
    width: 100%; max-width: 480px;
    animation: slideIn 0.6s ease both;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .form-header { margin-bottom: 36px; }
  .form-eyebrow {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 10px;
  }
  .form-title {
    font-family: var(--font-display); font-size: 2.2rem; font-weight: 800;
    letter-spacing: -0.04em; color: var(--ink); line-height: 1.1;
  }

  /* ROLE SELECTOR */
  .role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .role-option {
    border: 2px solid var(--border); border-radius: 14px;
    padding: 16px 14px; cursor: pointer; background: white;
    transition: all 0.2s; text-align: left;
  }
  .role-option:hover { border-color: rgba(10,10,15,0.3); }
  .role-option.selected { border-color: var(--ink); background: var(--ink); }
  .role-option.selected .role-opt-title { color: white; }
  .role-option.selected .role-opt-desc { color: rgba(255,255,255,0.5); }
  .role-opt-emoji { font-size: 1.5rem; margin-bottom: 8px; }
  .role-opt-title { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--ink); letter-spacing: -0.02em; }
  .role-opt-desc { font-size: 0.72rem; color: var(--muted); margin-top: 4px; }

  /* FIELDS */
  .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { margin-bottom: 16px; }
  .field.full { grid-column: 1 / -1; }
  .field-label {
    display: block; font-size: 0.8rem; font-weight: 500;
    color: var(--ink); margin-bottom: 7px;
  }
  .field-label span { color: var(--danger); }
  .field-input {
    width: 100%; padding: 12px 15px;
    border: 1.5px solid var(--border); border-radius: 11px;
    background: white; font-family: var(--font-body);
    font-size: 0.875rem; color: var(--ink);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(10,10,15,0.07); }
  .field-input.has-error { border-color: var(--danger); }
  .field-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b6860' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    cursor: pointer;
  }

  /* PASSWORD STRENGTH */
  .pw-strength { margin-top: 8px; }
  .pw-bars { display: flex; gap: 4px; margin-bottom: 5px; }
  .pw-bar { height: 3px; flex: 1; border-radius: 2px; background: var(--border); transition: background 0.3s; }
  .pw-bar.weak { background: #ef4444; }
  .pw-bar.fair { background: #f59e0b; }
  .pw-bar.good { background: #3b82f6; }
  .pw-bar.strong { background: var(--success); }
  .pw-label { font-size: 0.7rem; color: var(--muted); }

  /* DIVIDER */
  .field-divider {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    display: flex; align-items: center; gap: 12px;
    margin: 8px 0 20px;
  }
  .field-divider::before, .field-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  /* ERRORS */
  .error-box {
    background: #fdf2f1; border: 1px solid #f5c6c3;
    border-radius: 10px; padding: 12px 16px;
    font-size: 0.82rem; color: var(--danger);
    margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px;
  }
  .success-box {
    background: #f0fdf4; border: 1px solid #86efac;
    border-radius: 10px; padding: 14px 16px;
    font-size: 0.85rem; color: var(--success);
    margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

  .submit-btn {
    width: 100%; padding: 14px;
    background: var(--ink); color: var(--paper);
    border: none; border-radius: 12px;
    font-family: var(--font-display); font-size: 1rem; font-weight: 700;
    letter-spacing: -0.02em; cursor: pointer; margin-top: 8px;
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(10,10,15,0.2); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .form-footer { text-align: center; margin-top: 24px; font-size: 0.82rem; color: var(--muted); }
  .form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .form-footer a:hover { text-decoration: underline; }

  .back-link {
    position: absolute; top: 32px; left: 32px;
    font-size: 0.82rem; color: var(--muted);
    text-decoration: none; display: flex; align-items: center; gap: 6px;
    transition: color 0.2s;
  }
  .back-link:hover { color: var(--ink); }

  .terms-note { font-size: 0.72rem; color: var(--muted); margin-top: 14px; text-align: center; line-height: 1.6; }

  @media (max-width: 768px) {
    .signup-root { grid-template-columns: 1fr; }
    .signup-left { display: none; }
    .signup-right { padding: 32px 20px; padding-top: 80px; align-items: flex-start; }
    .fields-grid { grid-template-columns: 1fr; }
  }
`;

const ROLES = [
  { value: "lecturer", emoji: "🎓", title: "Lecturer", desc: "Mark attendance & view your classes" },
  { value: "admin", emoji: "🛡️", title: "Administrator", desc: "Full system access & management" },
];

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const PW_CLASSES = ["", "weak", "fair", "good", "strong"];

export default function Signup() {
  const [role, setRole] = useState("lecturer");
  const [form, setForm] = useState({
    full_name: "", username: "", email: "", password: "", confirm_password: "",
    school: "", department: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = pwStrength(form.password);

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.username.trim()) return "Username is required.";
    if (form.username.includes(" ")) return "Username cannot contain spaces.";
    if (!form.email.trim() || !form.email.includes("@")) return "A valid email is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirm_password) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await client.post("/auth/register", {
        full_name: form.full_name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role,
        school: form.school.trim() || undefined,
        department: form.department.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join(", "));
      } else if (!err.response) {
        setError("Cannot reach the server. Please check your connection.");
      } else {
        setError("Registration failed. The username or email may already be taken.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{style}</style>
      <div className="signup-root">

        {/* ── LEFT ── */}
        <div className="signup-left">
          <div className="signup-left-deco" />
          <div className="signup-big-num">IQ</div>

          <div className="signup-brand">
            <span className="signup-brand-dot" />
            AttendIQ
          </div>

          <div className="signup-left-copy">
            <h2 className="signup-headline">
              Join hundreds<br />of educators<br />already using<br />AttendIQ
            </h2>
            <p className="signup-sub">
              Set up your account in 60 seconds and start tracking attendance across all your classes today.
            </p>
          </div>

          <div className="signup-checklist">
            {[
              { title: "Free to get started", desc: "No credit card required." },
              { title: "Works across institutions", desc: "Teach at multiple universities? No problem." },
              { title: "Real-time insights", desc: "Live dashboards and attendance analytics." },
              { title: "Secure & private", desc: "Your data stays yours." },
            ].map(c => (
              <div className="signup-check" key={c.title}>
                <div className="check-icon">✓</div>
                <div className="check-text">
                  <strong>{c.title}</strong>
                  {c.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="signup-right">
          <Link to="/login" className="back-link">← Sign in instead</Link>

          <div className="signup-form-wrap">
            <div className="form-header">
              <div className="form-eyebrow">Create your account</div>
              <div className="form-title">Join<br />AttendIQ</div>
            </div>

            {/* Role selector */}
            <div className="role-selector">
              {ROLES.map(r => (
                <div
                  key={r.value}
                  className={`role-option ${role === r.value ? "selected" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  <div className="role-opt-emoji">{r.emoji}</div>
                  <div className="role-opt-title">{r.title}</div>
                  <div className="role-opt-desc">{r.desc}</div>
                </div>
              ))}
            </div>

            {success ? (
              <div className="success-box">
                <span>✅</span>
                <div>
                  <strong>Account created!</strong><br />
                  Redirecting you to the login page…
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="field-divider">Personal info</div>
                <div className="fields-grid">
                  <div className="field full">
                    <label className="field-label" htmlFor="full_name">Full name <span>*</span></label>
                    <input id="full_name" className="field-input" type="text" placeholder="Dr. Jane Muthoni" value={form.full_name} onChange={set("full_name")} autoFocus />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="username">Username <span>*</span></label>
                    <input id="username" className="field-input" type="text" placeholder="dr.muthoni" value={form.username} onChange={set("username")} autoComplete="username" spellCheck={false} />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="email">Email <span>*</span></label>
                    <input id="email" className="field-input" type="email" placeholder="jane@university.ac.ke" value={form.email} onChange={set("email")} autoComplete="email" />
                  </div>
                </div>

                <div className="field-divider">Institution (optional)</div>
                <div className="fields-grid">
                  <div className="field">
                    <label className="field-label" htmlFor="school">School / University</label>
                    <input id="school" className="field-input" type="text" placeholder="Strathmore University" value={form.school} onChange={set("school")} />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="department">Department</label>
                    <input id="department" className="field-input" type="text" placeholder="Computer Science" value={form.department} onChange={set("department")} />
                  </div>
                </div>

                <div className="field-divider">Security</div>
                <div className="field">
                  <label className="field-label" htmlFor="password">Password <span>*</span></label>
                  <input id="password" className="field-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} autoComplete="new-password" />
                  {form.password && (
                    <div className="pw-strength">
                      <div className="pw-bars">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`pw-bar ${i <= strength ? PW_CLASSES[strength] : ""}`} />
                        ))}
                      </div>
                      <div className="pw-label">{PW_LABELS[strength]}</div>
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="confirm_password">Confirm password <span>*</span></label>
                  <input
                    id="confirm_password"
                    className={`field-input ${form.confirm_password && form.password !== form.confirm_password ? "has-error" : ""}`}
                    type="password" placeholder="Repeat your password"
                    value={form.confirm_password} onChange={set("confirm_password")}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="error-box">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Creating account…</> : <>Create account →</>}
                </button>

                <div className="terms-note">
                  By signing up you agree to AttendIQ's terms of service and privacy policy.
                </div>
              </form>
            )}

            <div className="form-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}