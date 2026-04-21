import httpx
import os
from datetime import datetime

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL     = os.getenv("FROM_EMAIL", "noreply@attendiq.app")
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL", "")
APP_URL        = os.getenv("APP_URL", "http://localhost:5173")


async def _send(to: str, subject: str, html: str):
    """Fire-and-forget email via Resend REST API."""
    if not RESEND_API_KEY:
        print(f"[email] RESEND_API_KEY not set — skipping email to {to}")
        return
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html},
            timeout=8,
        )
    if r.status_code not in (200, 201):
        print(f"[email] Resend error {r.status_code}: {r.text}")


# ── Base template ─────────────────────────────────────────────────────────────
def _base(content: str) -> str:
    return f"""
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body {{ margin:0; padding:0; background:#f5f0e8; font-family:'Helvetica Neue',Arial,sans-serif; }}
  .wrap {{ max-width:560px; margin:40px auto; background:#faf7f2; border-radius:12px; overflow:hidden; border:1px solid #e8e0d0; }}
  .header {{ background:#1e1a14; padding:28px 36px; }}
  .logo-box {{ display:inline-flex; align-items:center; gap:10px; }}
  .logo-icon {{ width:36px; height:36px; background:#c8760a; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; font-family:monospace; font-weight:700; font-size:12px; color:#fff; }}
  .logo-name {{ font-weight:600; font-size:16px; color:#fff; letter-spacing:-0.02em; }}
  .body {{ padding:32px 36px; }}
  .footer {{ padding:20px 36px; border-top:1px solid #ede8de; text-align:center; font-size:11px; color:#b0a090; font-family:monospace; }}
  h1 {{ font-size:22px; color:#1e1a14; margin:0 0 8px; font-weight:700; letter-spacing:-0.03em; }}
  p {{ font-size:14px; color:#4a4030; line-height:1.75; margin:0 0 16px; }}
  .btn {{ display:inline-block; padding:12px 28px; background:#c8760a; color:#fff!important; text-decoration:none; border-radius:8px; font-weight:600; font-size:14px; margin:8px 0 20px; }}
  .pill {{ display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-family:monospace; }}
  .pill-amber {{ background:rgba(200,118,10,0.12); color:#c8760a; border:1px solid rgba(200,118,10,0.3); }}
  .pill-green {{ background:rgba(74,122,85,0.12); color:#4a7a55; border:1px solid rgba(74,122,85,0.3); }}
  .pill-red   {{ background:rgba(184,76,42,0.12); color:#b84c2a; border:1px solid rgba(184,76,42,0.3); }}
  .stat-row {{ display:flex; gap:12px; margin:20px 0; }}
  .stat {{ flex:1; background:#ede8de; border-radius:8px; padding:14px 16px; text-align:center; }}
  .stat-val {{ font-size:22px; font-weight:700; color:#1e1a14; font-family:Georgia,serif; }}
  .stat-lbl {{ font-size:11px; color:#9e8070; font-family:monospace; margin-top:4px; }}
  .divider {{ height:1px; background:#ede8de; margin:24px 0; }}
  .code-box {{ background:#1e1a14; color:#c8760a; font-family:monospace; font-size:28px; letter-spacing:0.2em; text-align:center; padding:18px; border-radius:8px; margin:20px 0; }}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="logo-box">
      <div class="logo-icon">IQ</div>
      <span class="logo-name">AttendIQ</span>
    </div>
  </div>
  <div class="body">{content}</div>
  <div class="footer">AttendIQ · University Attendance Platform · {datetime.now().year}</div>
</div>
</body></html>"""


# ── 1. Email verification ─────────────────────────────────────────────────────
async def send_verification_email(to: str, name: str, token: str):
    link = f"{APP_URL}/verify-email?token={token}"
    html = _base(f"""
      <span class="pill pill-amber">Verify your account</span>
      <h1 style="margin-top:16px">Welcome, {name.split()[0]} 👋</h1>
      <p>Thanks for joining AttendIQ. Click below to verify your email and unlock your dashboard.</p>
      <a href="{link}" class="btn">Verify my email →</a>
      <p style="font-size:12px;color:#9e8070">This link expires in <strong>24 hours</strong>. If you didn't create an account, ignore this email.</p>
      <div class="divider"></div>
      <p style="font-size:12px;color:#9e8070">Or copy this URL into your browser:<br>{link}</p>
    """)
    await _send(to, "Verify your AttendIQ account", html)


# ── 2. Welcome email (after verification) ────────────────────────────────────
async def send_welcome_email(to: str, name: str):
    html = _base(f"""
      <span class="pill pill-green">You're in!</span>
      <h1 style="margin-top:16px">You're all set, {name.split()[0]}.</h1>
      <p>Your AttendIQ account is verified and ready. Here's what to do next:</p>
      <p>① <strong>Create your first class</strong> — add your unit code and students.<br>
         ② <strong>Start a session</strong> — generate a QR code for instant check-in.<br>
         ③ <strong>Mark attendance</strong> — done in under 10 seconds.</p>
      <a href="{APP_URL}/dashboard" class="btn">Go to my dashboard →</a>
    """)
    await _send(to, "Welcome to AttendIQ — you're verified!", html)


# ── 3. Low attendance alert ───────────────────────────────────────────────────
async def send_low_attendance_alert(to: str, name: str, unit: str, student: str, pct: float):
    html = _base(f"""
      <span class="pill pill-red">Attendance alert</span>
      <h1 style="margin-top:16px">Low attendance detected</h1>
      <p>Hi {name.split()[0]}, a student in <strong>{unit}</strong> has fallen below the 75% threshold.</p>
      <div class="stat-row">
        <div class="stat"><div class="stat-val">{pct:.0f}%</div><div class="stat-lbl">attendance rate</div></div>
        <div class="stat"><div class="stat-val" style="font-size:16px;padding-top:4px">{student}</div><div class="stat-lbl">student</div></div>
      </div>
      <a href="{APP_URL}/dashboard" class="btn">View attendance report →</a>
    """)
    await _send(to, f"⚠️ Low attendance: {unit}", html)


# ── 4. Weekly digest ──────────────────────────────────────────────────────────
async def send_weekly_digest(to: str, name: str, stats: dict):
    rows = "".join(
        f"<tr><td style='padding:8px 0;font-size:13px;color:#1e1a14;border-bottom:1px solid #ede8de'>{u}</td>"
        f"<td style='padding:8px 0;text-align:right;font-family:monospace;font-size:13px;color:#c8760a;border-bottom:1px solid #ede8de'>{p:.0f}%</td></tr>"
        for u, p in stats.get("units", {}).items()
    )
    html = _base(f"""
      <span class="pill pill-amber">Weekly digest</span>
      <h1 style="margin-top:16px">Your week in review</h1>
      <p>Hi {name.split()[0]}, here's your attendance summary for the past 7 days.</p>
      <div class="stat-row">
        <div class="stat"><div class="stat-val">{stats.get('sessions',0)}</div><div class="stat-lbl">sessions marked</div></div>
        <div class="stat"><div class="stat-val">{stats.get('students',0)}</div><div class="stat-lbl">students tracked</div></div>
        <div class="stat"><div class="stat-val">{stats.get('avg_pct',0):.0f}%</div><div class="stat-lbl">avg attendance</div></div>
      </div>
      {'<table style="width:100%">' + rows + '</table>' if rows else '<p style="color:#9e8070;font-size:13px">No sessions this week.</p>'}
      <div class="divider"></div>
      <a href="{APP_URL}/dashboard" class="btn">Open dashboard →</a>
    """)
    await _send(to, "AttendIQ — your weekly attendance digest", html)


# ── 5. Feedback notification (to admin) ──────────────────────────────────────
async def send_feedback_to_admin(sender_name: str, sender_email: str, category: str, message: str):
    if not ADMIN_EMAIL:
        return
    html = _base(f"""
      <span class="pill pill-amber">New feedback</span>
      <h1 style="margin-top:16px">Feedback received</h1>
      <p><strong>From:</strong> {sender_name} ({sender_email or 'no email'})<br>
         <strong>Category:</strong> {category}</p>
      <div class="divider"></div>
      <p style="background:#ede8de;padding:16px;border-radius:8px;font-style:italic">"{message}"</p>
    """)
    await _send(ADMIN_EMAIL, f"[AttendIQ Feedback] {category} — {sender_name}", html)


# ── 6. Password reset ─────────────────────────────────────────────────────────
async def send_password_reset_email(to: str, name: str, token: str):
    link = f"{APP_URL}/reset-password?token={token}"
    html = _base(f"""
      <span class="pill pill-red">Password reset</span>
      <h1 style="margin-top:16px">Reset your password</h1>
      <p>Hi {name.split()[0]}, we received a request to reset your AttendIQ password.</p>
      <a href="{link}" class="btn">Reset my password →</a>
      <p style="font-size:12px;color:#9e8070">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your account is safe.</p>
    """)
    await _send(to, "Reset your AttendIQ password", html)