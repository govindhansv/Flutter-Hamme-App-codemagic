// Self-contained admin panel HTML (no external assets).
// - Sign-in with personal admin accounts (owner / moderator roles).
// - Overview: users, Pro, activity and sign-up chart.
// - Money (owners): store earnings by platform with daily/monthly/yearly charts.
// - Moderation queue for user reports. Apple Guideline 1.2 requires acting on
//   every report within 24 hours (remove the content + eject the user).
// - Users: detail view, complimentary Pro grants, bans and account deletion.
// - Play settings (app config), admin accounts and the activity (audit) log.
// Served by routes/adminRoutes.js under a strict CSP (inline script/style only,
// same-origin fetch only). Every API call sends the admin's session token as
// `Authorization: Bearer`.
// All user-controlled strings are HTML-escaped before rendering, and only
// http(s)/data:image URLs are ever placed in an <img src>.
// NOTE: this whole page is a JS template literal. Inside it, double every
// backslash and never use backticks or a dollar sign followed by a brace.
module.exports = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hamme Admin · Moderation</title>
<style>
  :root {
    --purple:#7838FE; --purple2:#9E57FF; --bg:#f5f5f7; --line:#e6e6ef; --ink:#1c1c28; --muted:#9a9aae;
    --red:#e5484d; --red-ink:#c62828; --red-bg:#ffe9e9; --amber:#9a5b00; --amber-bg:#fff4e0;
    --green:#1a8f3c; --green-bg:#e8f7ee;
  }
  * { box-sizing: border-box; }
  [hidden] { display:none !important; }
  body { margin:0; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:var(--bg); color:var(--ink); }
  body.modal-open { overflow:hidden; }
  header { background:linear-gradient(90deg,var(--purple2),var(--purple)); color:#fff; padding:18px 16px 12px; }
  .header-inner { max-width:968px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; }
  header h1 { margin:0; font-size:20px; font-weight:800; }
  header p { margin:4px 0 0; opacity:.9; font-size:13px; }
  .nav { max-width:968px; margin:12px auto 0; display:flex; gap:18px; font-size:13px; font-weight:700; }
  .nav a { color:#fff; opacity:.85; text-decoration:none; }
  .nav a:hover { opacity:1; text-decoration:underline; }
  .counters { display:flex; gap:8px; }
  .counter { display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:92px; padding:8px 12px; border-radius:12px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.35); color:#fff; text-decoration:none; }
  .counter-num { font-size:22px; font-weight:800; line-height:1.1; }
  .counter-label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; opacity:.92; }
  .counter.alarm { background:var(--red); border-color:#fff; box-shadow:0 0 0 3px rgba(229,72,77,.4); }
  .wrap { max-width:1000px; margin:0 auto; padding:20px 16px 60px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px; margin-bottom:16px; }
  .card.primary { border-color:#d8c8ff; box-shadow:0 2px 12px rgba(120,56,254,.08); }
  label { font-size:12px; font-weight:700; color:#6b6b80; display:block; margin-bottom:6px; }
  input, textarea { width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:10px; font-size:14px; font-family:inherit; }
  textarea { resize:vertical; min-height:76px; }
  .row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
  .row > div { flex:1; min-width:200px; }
  button { cursor:pointer; border:none; border-radius:10px; padding:10px 14px; font-weight:700; font-size:14px; font-family:inherit; }
  button:disabled { opacity:.5; cursor:not-allowed; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, .modal:focus-visible { outline:2px solid var(--purple); outline-offset:2px; }
  .btn-primary { background:var(--purple); color:#fff; }
  .btn-ghost { background:#f0eefe; color:var(--purple); }
  .btn-danger { background:var(--red-bg); color:#d33; }
  .btn-danger-solid { background:var(--red); color:#fff; }
  .btn-outline-danger { background:#fff; color:#d33; border:1px solid #f0b8b8; }
  .btn-sm { padding:7px 11px; font-size:13px; }
  .link-btn { background:none; padding:0; margin-top:4px; border-radius:0; color:var(--purple); font-size:12px; font-weight:700; text-decoration:underline; }
  table { width:100%; border-collapse:collapse; }
  th, td { text-align:left; padding:10px 8px; border-bottom:1px solid var(--line); font-size:14px; vertical-align:middle; }
  th { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
  .table-scroll { overflow-x:auto; }
  .avatar { width:38px; height:38px; border-radius:50%; object-fit:cover; background:#eee; flex:0 0 auto; display:block; }
  .avatar-link { flex:0 0 auto; display:block; border-radius:50%; }
  .avatar-anon { display:flex; align-items:center; justify-content:center; background:#e4e4ee; color:#6b6b80; font-weight:800; font-size:18px; }
  .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:800; white-space:nowrap; }
  .badge.pro { background:#efeaff; color:var(--purple); }
  .badge.free { background:#eef0f3; color:#7a7a8c; }
  .badge.st-open { background:var(--amber-bg); color:var(--amber); }
  .badge.st-actioned { background:var(--green-bg); color:var(--green); }
  .badge.st-dismissed { background:#eef0f3; color:#6b6b80; }
  .badge.st-reviewed { background:#e9f1ff; color:#2f5fb3; }
  .badge.overdue { background:var(--red); color:#fff; }
  .badge.banned { background:#1c1c28; color:#fff; }
  .badge.anon { background:#eef0f3; color:#3a3a4c; }
  .badge.kind { background:#efeaff; color:var(--purple); }
  .muted { color:var(--muted); font-size:12px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap:anywhere; }
  .toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:12px; flex-wrap:wrap; }
  .pager { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  #status { font-size:13px; min-height:18px; }
  .status-line { font-size:13px; min-height:18px; margin:6px 0; }
  .err { color:#d33; }
  .ok { color:var(--green); }
  .section-title { font-size:15px; font-weight:800; color:var(--ink); margin:0 0 14px; }
  .settings-row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
  .settings-row > div { flex:1; min-width:180px; }
  .number-input { width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:10px; font-size:14px; }
  .hint { font-size:11px; color:var(--muted); margin-top:4px; }
  #settingsStatus { font-size:13px; min-height:18px; margin-top:10px; }

  /* Moderation queue */
  .queue-intro { font-size:13px; color:#6b6b80; max-width:560px; }
  .pills { display:flex; gap:8px; flex-wrap:wrap; }
  .pill { display:inline-flex; align-items:center; padding:6px 12px; border-radius:999px; font-size:13px; font-weight:800; background:#f0eefe; color:var(--purple); }
  .pill.alarm { background:var(--red); color:#fff; }
  .pill.calm { background:var(--green-bg); color:var(--green); }
  .alert { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin:12px 0 4px; padding:12px 14px; border-radius:12px; background:var(--red); color:#fff; font-size:14px; font-weight:700; }
  .alert button { background:#fff; color:var(--red-ink); }
  .tabs { display:flex; gap:6px; flex-wrap:wrap; margin:14px 0 10px; }
  .tab { background:#f0eefe; color:var(--purple); }
  .tab.active { background:var(--purple); color:#fff; }
  .tab-count { display:inline-block; min-width:20px; margin-left:6px; padding:1px 7px; border-radius:999px; background:rgba(120,56,254,.14); font-size:12px; text-align:center; }
  .tab.active .tab-count { background:rgba(255,255,255,.25); }
  .tab-count:empty { display:none; }
  .stale { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin:0 0 10px; padding:8px 12px; border-radius:10px; background:#f0eefe; color:var(--purple); font-size:13px; font-weight:700; }
  .report { border:1px solid var(--line); border-radius:12px; padding:14px; margin-bottom:12px; background:#fff; }
  .report.is-overdue { border-color:#f1a9ab; box-shadow:inset 4px 0 0 var(--red); background:#fffafa; }
  .report.is-resolved { background:#fcfcfd; }
  .report.busy { opacity:.7; }
  .reason { font-size:16px; font-weight:800; overflow-wrap:anywhere; }
  .badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
  .report-time { font-size:12px; color:#6b6b80; margin-top:8px; }
  .due { font-weight:700; }
  .due.soon { color:var(--amber); }
  .due.overdue { color:var(--red-ink); font-weight:800; }
  .details { margin-top:10px; padding:10px 12px; border-left:3px solid var(--purple2); border-radius:8px; background:#f7f6fb; font-size:14px; white-space:pre-wrap; overflow-wrap:anywhere; }
  .details.none { border-left-color:var(--line); color:var(--muted); font-style:italic; }
  .people { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
  .person-box { border:1px solid var(--line); border-radius:10px; padding:10px; min-width:0; }
  .person-box.offender { border-color:#e2d6ff; background:#fbf9ff; }
  .person-label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-bottom:8px; }
  .person { display:flex; align-items:flex-start; gap:10px; min-width:0; }
  .who { min-width:0; overflow-wrap:anywhere; }
  .who-name { font-weight:700; }
  .resolution { margin-top:12px; padding:10px 12px; border-radius:10px; font-size:13px; background:#f3f4f7; }
  .resolution.res-actioned { background:var(--green-bg); }
  .resolution .note { margin-top:6px; white-space:pre-wrap; overflow-wrap:anywhere; }
  .report-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:12px; }
  .action-msg { font-size:13px; }
  .report-meta { margin-top:10px; font-size:11px; color:var(--muted); }
  .empty { padding:28px 8px; text-align:center; color:var(--muted); font-size:14px; }
  .pager-bottom { justify-content:flex-end; margin-top:4px; }

  /* Users */
  .search-row { margin-bottom:6px; }
  .btn-group { display:flex; flex-wrap:wrap; gap:6px; }
  .btn-group button { white-space:nowrap; }
  .ban-info { margin-top:4px; max-width:240px; overflow-wrap:anywhere; }
  .users-table .person { min-width:200px; align-items:center; }
  tr.is-banned td { background:#fff7f7; }

  /* Confirm dialog */
  .modal-backdrop { position:fixed; top:0; right:0; bottom:0; left:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(20,16,40,.55); }
  .modal { width:100%; max-width:480px; max-height:calc(100vh - 32px); overflow:auto; padding:20px; border-radius:16px; background:#fff; box-shadow:0 20px 60px rgba(0,0,0,.25); }
  .modal h2 { margin:0 0 10px; font-size:18px; overflow-wrap:anywhere; }
  .modal-body p { margin:0 0 10px; font-size:14px; line-height:1.45; color:#3a3a4c; overflow-wrap:anywhere; }
  .modal-body p.modal-warning { padding:8px 10px; border-radius:8px; background:var(--amber-bg); color:var(--amber); font-weight:700; }
  #modalError { font-size:13px; min-height:18px; margin-top:8px; }
  .modal-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-top:10px; }

  @media (max-width: 640px) {
    header { padding:14px 12px 10px; }
    header h1 { font-size:18px; }
    .counters { width:100%; }
    .counter { flex:1; min-width:0; }
    .wrap { padding:12px 10px 48px; }
    .card { padding:14px 12px; border-radius:12px; }
    input, textarea { font-size:16px; }
    .toolbar .pager { width:100%; justify-content:space-between; }
    .tab { padding:8px 11px; font-size:13px; }
    .report { padding:12px; }
    .people { grid-template-columns:1fr; }
    .report-actions button { flex:1 1 auto; }
    .action-msg { flex-basis:100%; }
    .users-table thead { display:none; }
    .users-table, .users-table tbody, .users-table tr, .users-table td { display:block; width:100%; }
    .users-table tr { border:1px solid var(--line); border-radius:12px; padding:10px 12px; margin-bottom:10px; }
    .users-table tr.is-banned { border-color:#f0b8b8; background:#fff7f7; }
    .users-table td, tr.is-banned td { border:none; padding:6px 0; background:none; }
    .users-table td[data-label] { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; text-align:right; }
    .users-table td[data-label]::before { content:attr(data-label); flex:0 0 auto; padding-top:3px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); text-align:left; }
    .users-table .person { min-width:0; }
    .users-table .btn-group button { flex:1 1 auto; }
    .ban-info { margin-left:auto; }
    .modal-backdrop { align-items:flex-end; padding:0; }
    .modal { max-width:none; max-height:92vh; border-radius:16px 16px 0 0; padding:18px 16px 22px; }
    .modal-actions button { flex:1 1 auto; }
  }

  /* Sign-in */
  .auth-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px; background:linear-gradient(160deg,var(--purple2),var(--purple)); }
  .auth-card { width:100%; max-width:400px; margin:0; }
  .auth-card h1 { margin:0 0 4px; font-size:22px; }
  .auth-card p { margin:0 0 14px; font-size:13px; color:#6b6b80; line-height:1.45; }
  .field { margin-bottom:12px; }
  .auth-card button[type=submit] { width:100%; margin-top:4px; }

  /* Header account + tabs */
  .account { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:13px; }
  .account strong { font-weight:800; }
  .account .role { padding:2px 8px; border-radius:999px; background:rgba(255,255,255,.2); font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
  .account button { background:rgba(255,255,255,.18); color:#fff; padding:6px 10px; font-size:12px; }
  .nav { overflow-x:auto; }
  .nav button { background:none; color:#fff; opacity:.8; padding:6px 2px; border-radius:0; font-size:13px; border-bottom:2px solid transparent; white-space:nowrap; }
  .nav button:hover { opacity:1; }
  .nav button.active { opacity:1; border-bottom-color:#fff; }

  /* Stat cards */
  .stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:16px; }
  .stat { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px; min-width:0; }
  .stat-label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
  .stat-value { font-size:24px; font-weight:800; margin-top:4px; overflow-wrap:anywhere; }
  .stat-sub { font-size:12px; color:#6b6b80; margin-top:4px; line-height:1.4; }
  .stat.alarm { border-color:#f1a9ab; background:#fffafa; }
  .stat.alarm .stat-value { color:var(--red-ink); }
  button.stat { text-align:left; font:inherit; color:inherit; cursor:pointer; }
  button.stat:hover { border-color:#d8c8ff; }

  /* Money */
  .filters { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; margin-bottom:14px; }
  .filters > div { min-width:0; }
  .seg { display:inline-flex; background:#f0eefe; border-radius:10px; padding:3px; gap:2px; }
  .seg button { background:none; color:var(--purple); padding:7px 12px; font-size:13px; border-radius:8px; }
  .seg button.active { background:var(--purple); color:#fff; }
  select { padding:9px 10px; border:1px solid var(--line); border-radius:10px; font-size:14px; font-family:inherit; background:#fff; }
  .check { display:flex; align-items:center; gap:6px; font-size:13px; color:#3a3a4c; font-weight:600; margin:0; padding-bottom:9px; }
  .check input { width:auto; }
  .chart-wrap { position:relative; }
  .chart { width:100%; height:auto; display:block; }
  .chart text { font-size:11px; fill:#8a8aa0; font-family:inherit; }
  .chart .grid { stroke:#ececf3; }
  .chart .hit { fill:transparent; cursor:default; }
  .chart .bar-col:hover .hit { fill:rgba(120,56,254,.06); }
  .chart-tip { min-height:20px; font-size:13px; color:#3a3a4c; margin-top:6px; }
  .legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12px; font-weight:700; color:#3a3a4c; }
  .swatch { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
  .split { display:flex; height:12px; border-radius:999px; overflow:hidden; background:#eef0f3; margin:10px 0 6px; }
  .split span { display:block; height:100%; }
  .note { font-size:12px; color:#6b6b80; line-height:1.5; margin:0; }
  .note + .note { margin-top:6px; }
  .num { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .badge.android { background:#e6f6ec; color:#1a7f3c; }
  .badge.ios { background:#efeaff; color:var(--purple); }
  .badge.test { background:var(--amber-bg); color:var(--amber); }
  .badge.refund { background:var(--red-bg); color:var(--red-ink); }
  .badge.inactive { background:#eef0f3; color:#7a7a8c; }

  /* User detail */
  .modal.wide { max-width:720px; }
  .detail-head { display:flex; gap:14px; align-items:flex-start; }
  .detail-head .avatar { width:64px; height:64px; }
  .kv { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px 16px; margin:12px 0; font-size:13px; }
  .kv div > span:first-child { display:block; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
  .mini-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; margin:12px 0; }
  .mini-stats div { border:1px solid var(--line); border-radius:10px; padding:8px 10px; font-size:12px; color:#6b6b80; }
  .mini-stats strong { display:block; font-size:18px; color:var(--ink); }
  .detail-section { margin-top:14px; }
  .detail-section h3 { font-size:13px; margin:0 0 8px; }
  .modal-fields .field input, .modal-fields .field select { width:100%; }
  .readonly-note { font-size:12px; color:var(--amber); font-weight:700; margin-top:8px; }

  @media (max-width: 640px) {
    .stats { grid-template-columns:1fr 1fr; }
    .stat-value { font-size:20px; }
    .filters > div { width:100%; }
    .seg { width:100%; }
    .seg button { flex:1; }
    select { width:100%; }
    .detail-head .avatar { width:48px; height:48px; }
    .hide-sm { display:none; }
  }
</style>
</head>
<body>
<div id="authView" class="auth-wrap" hidden>
  <div class="card auth-card">
    <form id="loginForm" novalidate>
      <h1>Hamme Admin</h1>
      <p>Sign in with your admin account.</p>
      <div class="field"><label for="loginEmail">Email</label><input id="loginEmail" type="email" autocomplete="username" required /></div>
      <div class="field"><label for="loginPassword">Password</label><input id="loginPassword" type="password" autocomplete="current-password" required /></div>
      <button type="submit" class="btn-primary" id="loginBtn">Sign in</button>
      <div id="loginStatus" class="status-line" aria-live="polite"></div>
    </form>
    <form id="bootstrapForm" novalidate hidden>
      <h1>Create the first owner</h1>
      <p>No admin accounts exist yet. Enter the server&rsquo;s ADMIN_API_KEY once to create your owner account. After that, everyone signs in with their own email and password.</p>
      <div class="field"><label for="bootKey">ADMIN_API_KEY</label><input id="bootKey" type="password" autocomplete="off" required /></div>
      <div class="field"><label for="bootName">Your name</label><input id="bootName" type="text" autocomplete="name" maxlength="80" required /></div>
      <div class="field"><label for="bootEmail">Email</label><input id="bootEmail" type="email" autocomplete="username" required /></div>
      <div class="field"><label for="bootPassword">Password (at least 10 characters)</label><input id="bootPassword" type="password" autocomplete="new-password" required /></div>
      <button type="submit" class="btn-primary" id="bootBtn">Create owner account</button>
      <div id="bootStatus" class="status-line" aria-live="polite"></div>
    </form>
  </div>
</div>

<div id="appView" hidden>
<header>
  <div class="header-inner">
    <div>
      <h1>Hamme Admin</h1>
      <div class="account"><span>Signed in as <strong id="meName"></strong></span><span class="role" id="meRole"></span>
        <button type="button" id="changePasswordBtn">Change password</button><button type="button" id="signOutBtn">Sign out</button></div>
    </div>
    <div class="counters">
      <a class="counter" id="hdrOpen" href="#reports" title="Open reports"><span class="counter-num" id="openCount">&ndash;</span><span class="counter-label">Open</span></a>
      <a class="counter" id="hdrOverdue" href="#reports" title="Open reports older than 24 hours"><span class="counter-num" id="overdueCount">&ndash;</span><span class="counter-label">Overdue &gt;24h</span></a>
    </div>
  </div>
  <nav class="nav" id="nav" aria-label="Sections">
    <button type="button" data-view="overview">Overview</button>
    <button type="button" data-view="money" data-owner>Money</button>
    <button type="button" data-view="reports">Reports</button>
    <button type="button" data-view="users">Users</button>
    <button type="button" data-view="settings">Settings</button>
    <button type="button" data-view="admins" data-owner>Admins</button>
    <button type="button" data-view="activity" data-owner>Activity log</button>
  </nav>
</header>
<div class="wrap">
  <div id="status" class="status-line" aria-live="polite"></div>

  <section id="overview" data-view-section="overview" aria-labelledby="overviewTitle" hidden>
    <div class="toolbar">
      <div class="section-title" id="overviewTitle" style="margin:0;">📊 Overview</div>
      <button type="button" class="btn-ghost" id="overviewRefresh">Refresh</button>
    </div>
    <div class="stats" id="overviewStats"><div class="stat"><div class="stat-label">Loading…</div></div></div>
    <div class="card">
      <div class="section-title">New sign-ups · last 30 days</div>
      <div class="chart-wrap" id="signupChart"></div>
      <div class="chart-tip" id="signupTip"></div>
    </div>
  </section>

  <section id="money" data-view-section="money" aria-labelledby="moneyTitle" hidden>
    <div class="card">
      <div class="toolbar">
        <div>
          <div class="section-title" id="moneyTitle" style="margin-bottom:3px;">💰 Money</div>
          <div class="muted" id="moneySynced"></div>
        </div>
        <div class="pager">
          <button type="button" class="btn-ghost" id="moneyRefresh">Refresh</button>
          <button type="button" class="btn-primary" id="moneySync">Sync with stores</button>
        </div>
      </div>
      <div class="filters">
        <div><label>Store</label><div class="seg" id="moneyPlatform"><button type="button" data-v="all" class="active">All</button><button type="button" data-v="android">Android</button><button type="button" data-v="ios">iOS</button></div></div>
        <div><label>Chart by</label><div class="seg" id="moneyGranularity"><button type="button" data-v="day" class="active">Daily</button><button type="button" data-v="month">Monthly</button><button type="button" data-v="year">Yearly</button></div></div>
        <div><label for="moneyRange">Period</label><select id="moneyRange"></select></div>
        <div><label for="moneyCurrency">Currency</label><select id="moneyCurrency"><option value="">&ndash;</option></select></div>
        <div><label for="moneyMetric">Show</label><select id="moneyMetric"><option value="gross">Customer paid</option><option value="net">Your earnings</option></select></div>
        <div><label class="check"><input type="checkbox" id="moneyTest" /> Include test purchases</label></div>
      </div>
      <div id="moneyStatus" class="status-line" aria-live="polite"></div>
    </div>
    <div class="stats" id="moneyQuick"></div>
    <div class="card">
      <div class="toolbar">
        <div class="section-title" style="margin:0;" id="moneyChartTitle">Earnings</div>
        <div class="legend"><span><span class="swatch" style="background:#2e9e5b"></span>Android</span><span><span class="swatch" style="background:#7838FE"></span>iOS</span></div>
      </div>
      <div class="chart-wrap" id="moneyChart"></div>
      <div class="chart-tip" id="moneyTip">Hover a bar for details.</div>
    </div>
    <div class="stats" id="moneyTotals"></div>
    <div class="card">
      <div class="section-title">Recent payments</div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Date</th><th>Store</th><th>Type</th><th class="hide-sm">User</th><th class="num">Paid</th><th class="num">Your share</th><th>Status</th></tr></thead>
          <tbody id="moneyRecent"><tr><td colspan="7" class="muted">Loading…</td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <p class="note"><strong>Customer paid</strong> is what buyers were charged, including tax, minus refunds. <strong>Your earnings</strong> is your share after the store fee and tax.</p>
      <p class="note"><strong>Google Play</strong> figures come from the Play Orders API and are exact. <strong>App Store</strong> earnings are estimated as price minus 15%, because Apple does not report your share per transaction (prices in some countries also include tax, so the real amount can be lower).</p>
      <p class="note">New payments are recorded automatically. Use <strong>Sync with stores</strong> to import older purchases or refresh refunds. Your official payouts are in Play Console and App Store Connect.</p>
    </div>
  </section>

  <section class="card primary" id="reports" data-view-section="reports" aria-labelledby="reportsTitle" hidden>
    <div class="toolbar">
      <div>
        <div class="section-title" id="reportsTitle" style="margin-bottom:3px;">🚩 Moderation queue</div>
        <div class="queue-intro">Act on every report within 24 hours: remove content that breaks the rules and ban the user responsible.</div>
      </div>
      <div class="pills">
        <span class="pill" id="qOpen">&ndash; open</span>
        <span class="pill" id="qOverdue">&ndash; overdue</span>
      </div>
    </div>
    <div class="alert" id="overdueAlert" role="alert" hidden>
      <span id="overdueAlertText"></span>
      <button type="button" class="btn-sm" id="overdueShow">Show open reports</button>
    </div>
    <div class="tabs" id="reportTabs" role="tablist" aria-label="Report status">
      <button type="button" class="tab active" role="tab" aria-selected="true" data-status="open">Open<span class="tab-count" id="tabOpenCount"></span></button>
      <button type="button" class="tab" role="tab" aria-selected="false" data-status="actioned">Actioned</button>
      <button type="button" class="tab" role="tab" aria-selected="false" data-status="dismissed">Dismissed</button>
      <button type="button" class="tab" role="tab" aria-selected="false" data-status="all">All</button>
    </div>
    <div class="toolbar">
      <div>
        <div class="muted" id="reportSummary">No reports loaded.</div>
        <div class="muted" id="countersUpdated"></div>
      </div>
      <div class="pager">
        <button type="button" class="btn-ghost" id="reportRefresh">Refresh</button>
        <button type="button" class="btn-ghost report-prev" id="reportPrev">&lsaquo; Prev</button>
        <span class="muted report-page-info" id="reportPageInfo">&ndash;</span>
        <button type="button" class="btn-ghost report-next" id="reportNext">Next &rsaquo;</button>
      </div>
    </div>
    <div id="reportStatus" class="status-line" aria-live="polite"></div>
    <div class="stale" id="reportStale" hidden>
      <span>The queue has changed since this list was loaded.</span>
      <button type="button" class="btn-primary btn-sm" id="reportStaleRefresh">Refresh list</button>
    </div>
    <div id="reportList"><div class="empty">Loading…</div></div>
    <div class="pager pager-bottom">
      <button type="button" class="btn-ghost report-prev">&lsaquo; Prev</button>
      <span class="muted report-page-info">&ndash;</span>
      <button type="button" class="btn-ghost report-next">Next &rsaquo;</button>
    </div>
  </section>

  <section class="card" id="users" data-view-section="users" aria-labelledby="usersTitle" hidden>
    <div class="toolbar">
      <div>
        <div class="section-title" id="usersTitle" style="margin-bottom:3px;">👥 Users</div>
        <div class="muted" id="summary">No data loaded.</div>
      </div>
      <div class="pager">
        <button type="button" class="btn-ghost" id="prev">&lsaquo; Prev</button>
        <span class="muted" id="pageInfo">&ndash;</span>
        <button type="button" class="btn-ghost" id="next">Next &rsaquo;</button>
      </div>
    </div>
    <div class="search-row">
      <label for="search">Search (name, username, email, code)</label>
      <input id="search" type="text" placeholder="Type to search…" />
    </div>
    <div id="userStatus" class="status-line" aria-live="polite"></div>
    <div class="table-scroll">
      <table class="users-table">
        <thead>
          <tr><th>User</th><th>Share code</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody id="rows"><tr><td colspan="5" class="muted">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>

  <section class="card" id="settings" data-view-section="settings" hidden>
    <div class="section-title">⚙️ Play Settings</div>
    <div class="settings-row">
      <div>
        <label for="cardLimit">Free card limit per session</label>
        <input id="cardLimit" class="number-input" type="number" min="1" max="1000" placeholder="10" />
        <div class="hint">How many cards free users can view before cooldown.</div>
      </div>
      <div>
        <label for="cooldownMinutes">Cooldown duration (minutes)</label>
        <input id="cooldownMinutes" class="number-input" type="number" min="1" max="1440" placeholder="5" />
        <div class="hint">How many minutes free users wait before seeing more cards.</div>
      </div>
      <div style="flex:0 0 auto;">
        <button type="button" class="btn-primary" id="saveSettings">Save Settings</button>
      </div>
    </div>
    <div id="settingsStatus"></div>
    <div class="readonly-note" id="settingsReadonly" hidden>Only an owner can change these settings.</div>
  </section>

  <section class="card" id="admins" data-view-section="admins" aria-labelledby="adminsTitle" hidden>
    <div class="toolbar">
      <div>
        <div class="section-title" id="adminsTitle" style="margin-bottom:3px;">🔑 Admin accounts</div>
        <div class="muted">Owners can do everything. Moderators can handle reports and ban or unban users, but cannot see money, give Pro, delete accounts or change settings.</div>
      </div>
      <button type="button" class="btn-primary" id="addAdminBtn">Add admin</button>
    </div>
    <div id="adminsStatus" class="status-line" aria-live="polite"></div>
    <div class="table-scroll">
      <table>
        <thead><tr><th>Admin</th><th>Role</th><th>Status</th><th class="hide-sm">Last sign-in</th><th>Actions</th></tr></thead>
        <tbody id="adminRows"><tr><td colspan="5" class="muted">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>

  <section class="card" id="activity" data-view-section="activity" aria-labelledby="activityTitle" hidden>
    <div class="toolbar">
      <div>
        <div class="section-title" id="activityTitle" style="margin-bottom:3px;">🧾 Activity log</div>
        <div class="muted" id="activitySummary">Every admin action, newest first.</div>
      </div>
      <div class="pager">
        <select id="activityFilter" aria-label="Filter actions">
          <option value="">All actions</option>
          <option value="auth.">Sign-ins</option>
          <option value="user.">Users</option>
          <option value="report.">Reports</option>
          <option value="config.">Settings</option>
          <option value="admin.">Admin accounts</option>
          <option value="revenue.">Money</option>
        </select>
        <button type="button" class="btn-ghost" id="activityPrev">&lsaquo; Prev</button>
        <span class="muted" id="activityPage">&ndash;</span>
        <button type="button" class="btn-ghost" id="activityNext">Next &rsaquo;</button>
      </div>
    </div>
    <div id="activityStatus" class="status-line" aria-live="polite"></div>
    <div class="table-scroll">
      <table>
        <thead><tr><th>When</th><th>Admin</th><th>What happened</th><th class="hide-sm">IP</th></tr></thead>
        <tbody id="activityRows"><tr><td colspan="4" class="muted">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>
</div>
</div>

<div class="modal-backdrop" id="drawer" hidden>
  <div class="modal wide" id="drawerDialog" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" tabindex="-1">
    <div class="toolbar" style="margin-bottom:0;">
      <h2 id="drawerTitle" style="margin:0;">User</h2>
      <button type="button" class="btn-ghost btn-sm" id="drawerClose">Close</button>
    </div>
    <div id="drawerStatus" class="status-line" aria-live="polite"></div>
    <div id="drawerBody"></div>
  </div>
</div>

<div class="modal-backdrop" id="modal" hidden>
  <div class="modal" id="modalDialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalBody" tabindex="-1">
    <h2 id="modalTitle"></h2>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-fields" id="modalFields"></div>
    <div id="modalField" hidden>
      <label for="modalInput" id="modalInputLabel"></label>
      <textarea id="modalInput" rows="3" maxlength="500"></textarea>
    </div>
    <div id="modalError" class="err" role="alert"></div>
    <div class="modal-actions">
      <button type="button" class="btn-ghost" id="modalCancel">Cancel</button>
      <button type="button" class="btn-danger-solid" id="modalConfirm">Confirm</button>
    </div>
  </div>
</div>

<script>
  var API_BASE = location.pathname.replace(/\\/$/, '');
  var HOUR_MS = 60 * 60 * 1000;
  var DAY_MS = 24 * HOUR_MS;
  var COUNTER_POLL_MS = 60 * 1000;
  var state = { page: 1, limit: 25, search: '', pages: 1, seq: 0, byId: Object.create(null) };
  var reportState = { page: 1, limit: 25, pages: 1, status: 'open', seq: 0, loading: false, byId: Object.create(null), listOpenCount: null };
  var counterState = { busy: false, lastAt: 0 };
  var SESSION_KEY = 'hamme_admin_session';
  var memorySession = null;
  var currentView = null;
  var TZ = (function () {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  })();
  var $ = function (id) { return document.getElementById(id); };
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  var REASON_LABELS = {
    harassment: 'Bullying or harassment',
    sexual: 'Nudity or sexual content',
    hate: 'Hate speech or symbols',
    violence: 'Violence or threats',
    self_harm: 'Self-harm or suicide',
    impersonation: 'Fake account or impersonation',
    underage: 'User may be under 13',
    spam: 'Spam or scam',
    other: 'Something else'
  };
  var TYPE_LABELS = { friend: 'Friend', crush: 'Crush', frenemy: 'Frenemy' };
  var STATUS_LABELS = { open: 'Open', actioned: 'Actioned', dismissed: 'Dismissed', reviewed: 'Reviewed' };
  var STATUS_CLASSES = { open: 'st-open', actioned: 'st-actioned', dismissed: 'st-dismissed', reviewed: 'st-reviewed' };
  // Admin actions, plus the side-effect resolutions set when a ban or account
  // deletion closes other open reports automatically.
  var RESOLUTION_LABELS = {
    remove_content: 'Content removed',
    remove_and_ban: 'Content removed and offender banned',
    dismiss: 'Dismissed',
    dismissed: 'Dismissed',
    user_banned: 'Closed automatically: user banned',
    session_banned: 'Closed automatically: anonymous voter banned',
    account_deleted: 'Closed automatically: account deleted'
  };

  // ── Session ───────────────────────────────────────────────────────────────
  // { token, admin: { id, email, name, role } } from POST /auth/login.
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : memorySession;
    } catch (e) { return memorySession; }
  }
  function setSession(s) {
    memorySession = s;
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }
  function signedIn() { var s = getSession(); return !!(s && s.token); }
  function isOwner() { var s = getSession(); return !!(s && s.admin && s.admin.role === 'owner'); }
  // The old shared-key login stored the raw key in the browser: remove it.
  try { localStorage.removeItem('hamme_admin_key'); } catch (e) {}

  function setStatus(msg, kind) { setLine('status', msg, kind); }
  function setLine(id, msg, kind) {
    var el = $(id);
    el.textContent = msg || '';
    el.className = 'status-line' + (kind ? ' ' + kind : '');
  }
  function setUserStatus(msg, kind) { setLine('userStatus', msg, kind); }
  function setReportStatus(msg, kind) { setLine('reportStatus', msg, kind); }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function lookup(map, key, fallback) {
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback;
  }

  function humanize(s) {
    var t = String(s == null ? '' : s).replace(/_/g, ' ').trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  // Only http(s) and inline data:image URLs may be used as an image source.
  function safeImgSrc(url) {
    if (typeof url !== 'string') return '';
    var u = url.trim();
    var lower = u.toLowerCase();
    if (lower.indexOf('https://') === 0 || lower.indexOf('http://') === 0 || lower.indexOf('data:image/') === 0) return u;
    return '';
  }

  function avatarHtml(url, linkToFull) {
    var src = safeImgSrc(url);
    if (!src) return '<div class="avatar"></div>';
    var img = '<img class="avatar" alt="" loading="lazy" referrerpolicy="no-referrer" src="' + escapeHtml(src) + '"/>';
    if (linkToFull && src.toLowerCase().indexOf('http') === 0) {
      return '<a class="avatar-link" href="' + escapeHtml(src) + '" target="_blank" rel="noopener noreferrer" title="Open full-size photo">' + img + '</a>';
    }
    return img;
  }

  // Swap broken avatars for the grey placeholder (replaces inline onerror handlers).
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG' || !t.classList.contains('avatar')) return;
    var placeholder = document.createElement('div');
    placeholder.className = 'avatar';
    if (t.replaceWith) t.replaceWith(placeholder); else t.style.visibility = 'hidden';
  }, true);

  async function api(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var s = getSession();
    if (s && s.token) headers.Authorization = 'Bearer ' + s.token;
    options.headers = Object.assign(headers, options.headers || {});
    var res;
    try {
      res = await fetch(API_BASE + path, options);
    } catch (e) {
      throw new Error('Network error. Check your connection and try again.');
    }
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      // Only the user-facing message is shown; the error details are never relied on.
      var err = new Error((data && data.message) || ('Request failed (' + res.status + ')'));
      err.status = res.status;
      // An expired or revoked session sends the admin back to the sign-in screen.
      if (res.status === 401 && path.indexOf('/auth/') !== 0 && signedIn()) signOut(err.message);
      throw err;
    }
    return data || {};
  }

  function noteAuthError(e) {
    if (e && e.status === 503) setStatus(e.message, 'err');
  }

  // ── Time helpers ──────────────────────────────────────────────────────────
  function toTime(v) {
    if (v == null || v === '') return null;
    var t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  function fmtDate(v) {
    var t = toTime(v);
    return t == null ? '' : new Date(t).toLocaleString();
  }
  function fmtDuration(ms) {
    var mins = Math.max(0, Math.floor(ms / 60000));
    if (mins < 60) return mins + 'm';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ' + (mins % 60) + 'm';
    var days = Math.floor(hours / 24);
    return days + 'd ' + (hours % 24) + 'h';
  }
  function timeAgo(v) {
    var t = toTime(v);
    if (t == null) return '';
    var secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (secs < 60) return 'just now';
    var mins = Math.floor(secs / 60);
    if (mins < 60) return mins + 'm ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 60) return days + 'd ago';
    return Math.floor(days / 30) + 'mo ago';
  }
  // Time left before an open report breaches the 24h deadline.
  function dueInfo(createdAt, serverOverdue) {
    var t = toTime(createdAt);
    var left = t == null ? null : t + DAY_MS - Date.now();
    if (left != null && left <= 0) return { text: 'Overdue by ' + fmtDuration(-left), cls: 'due overdue', overdue: true };
    if (serverOverdue) return { text: 'Overdue', cls: 'due overdue', overdue: true };
    if (left == null) return { text: '', cls: 'due', overdue: false };
    return { text: fmtDuration(left) + ' left to act', cls: left < 4 * HOUR_MS ? 'due soon' : 'due', overdue: false };
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  function whoLabel(p) {
    p = p || {};
    if (p.username) return '@' + p.username;
    return p.name || p.email || 'this user';
  }

  function userCellHtml(u) {
    var lines = '';
    if (u.username) lines += '<div class="muted">@' + escapeHtml(u.username) + '</div>';
    if (u.email) lines += '<div class="muted">' + escapeHtml(u.email) + '</div>';
    return '<div class="person">' + avatarHtml(u.avatarUrl, false) +
      '<div class="who"><div class="who-name">' + escapeHtml(u.name || 'Unnamed user') + '</div>' + lines + '</div></div>';
  }

  function proSource(u) {
    var store = u.storeProActive ? (u.proPlatform === 'ios' ? 'APP STORE' : 'PLAY') : '';
    if (store && u.adminPro) return store + ' + ADMIN';
    return store || (u.adminPro ? 'ADMIN' : 'LEGACY');
  }

  function render(data) {
    var tbody = $('rows');
    var users = Array.isArray(data.users) ? data.users : [];
    state.pages = Math.max(1, Number(data.pages) || 1);
    state.byId = Object.create(null);
    $('summary').textContent = (Number(data.total) || 0) + ' user(s) total';
    $('pageInfo').textContent = 'Page ' + (Number(data.page) || state.page) + ' / ' + state.pages;
    $('prev').disabled = state.page <= 1;
    $('next').disabled = state.page >= state.pages;
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(function (u) {
      u = u || {};
      var id = String(u.id == null ? '' : u.id);
      state.byId[id] = u;
      var idAttr = escapeHtml(id);
      var adminPro = !!u.adminPro;
      var storePro = !!u.storeProActive;
      var badge = u.isPro ? '<span class="badge pro">PRO · ' + proSource(u) + '</span>' : '<span class="badge free">FREE</span>';
      var viewBtn = '<button type="button" class="btn-ghost btn-sm" data-id="' + idAttr + '" data-view-user>View</button>';
      var planBtn = !isOwner() ? '' : adminPro
        ? '<button type="button" class="btn-danger btn-sm" data-id="' + idAttr + '" data-pro="false">Remove admin grant</button>'
        : '<button type="button" class="btn-primary btn-sm" data-id="' + idAttr + '" data-pro="true">Grant Pro</button>';
      var banBtn = u.isBanned
        ? '<button type="button" class="btn-ghost btn-sm" data-id="' + idAttr + '" data-ban="unban">Unban</button>'
        : '<button type="button" class="btn-outline-danger btn-sm" data-id="' + idAttr + '" data-ban="ban">Ban</button>';
      var statusHtml = u.isBanned
        ? '<span class="badge banned">BANNED</span>' +
          (u.banReason ? '<div class="muted ban-info">Reason: ' + escapeHtml(u.banReason) + '</div>' : '') +
          (u.bannedAt ? '<div class="muted ban-info">Since ' + escapeHtml(fmtDate(u.bannedAt)) + '</div>' : '')
        : '<span class="muted">Active</span>';
      return '<tr' + (u.isBanned ? ' class="is-banned"' : '') + '>' +
        '<td>' + userCellHtml(u) + '</td>' +
        '<td data-label="Share code"><span class="muted">' + escapeHtml(u.shareCode || '') + '</span></td>' +
        '<td data-label="Plan">' + badge + '</td>' +
        '<td data-label="Status"><div>' + statusHtml + '</div></td>' +
        '<td><div class="btn-group">' + viewBtn + planBtn + banBtn + '</div></td>' +
      '</tr>';
    }).join('');
  }

  async function load() {
    if (!signedIn()) return;
    var seq = ++state.seq;
    setUserStatus('Loading…');
    try {
      var q = '/users?page=' + state.page + '&limit=' + state.limit + '&search=' + encodeURIComponent(state.search);
      var data = await api(q);
      if (seq !== state.seq) return;
      render(data);
      setUserStatus('Loaded.', 'ok');
    } catch (e) {
      if (seq !== state.seq) return;
      setUserStatus(e.message, 'err');
      noteAuthError(e);
    }
  }

  async function setPlan(id, isPro) {
    setUserStatus('Updating…');
    try {
      await api('/users/' + encodeURIComponent(id) + '/plan', { method: 'PATCH', body: JSON.stringify({ isPro: isPro }) });
      setUserStatus(isPro ? 'Admin Pro grant added.' : 'Admin Pro grant removed.', 'ok');
      load();
      if (drawerState.userId === id) openUserDetail(id);
    } catch (e) {
      setUserStatus(e.message, 'err');
    }
  }

  function openBan(u) {
    var who = whoLabel(u);
    openModal({
      title: 'Ban ' + who + '?',
      body: [
        'This permanently suspends the account. ' + who + ' is signed out on every device, every vote they sent and all of their matches are deleted, their profile photo is removed and their public poll page goes offline.',
        'They cannot sign in, or register again from the same device, until you unban them.'
      ],
      inputLabel: 'Reason (optional, only admins see this)',
      inputPlaceholder: 'e.g. Harassment in votes, reported by several users',
      confirmLabel: 'Ban user',
      danger: true,
      onConfirm: function (reason) {
        return api('/users/' + encodeURIComponent(u.id) + '/ban', { method: 'POST', body: JSON.stringify(reason ? { reason: reason } : {}) });
      },
      onSuccess: function () {
        setUserStatus(who + ' has been banned.', 'ok');
        load();
        loadReports();
        if (drawerState.userId === u.id) openUserDetail(u.id);
      }
    });
  }

  function openUnban(u) {
    var who = whoLabel(u);
    openModal({
      title: 'Unban ' + who + '?',
      body: [
        'They will be able to sign in and use Hamme again.',
        'Votes, matches and the profile photo deleted by the ban are not restored.'
      ],
      confirmLabel: 'Unban user',
      danger: false,
      onConfirm: function () {
        return api('/users/' + encodeURIComponent(u.id) + '/unban', { method: 'POST', body: '{}' });
      },
      onSuccess: function () {
        setUserStatus(who + ' has been unbanned.', 'ok');
        load();
        loadReports();
        if (drawerState.userId === u.id) openUserDetail(u.id);
      }
    });
  }

  function findUser(term) {
    clearTimeout(searchTimer); // a pending keystroke search must not override this
    $('search').value = term;
    state.search = term;
    state.page = 1;
    showView('users');
  }

  // ── Reports / moderation queue ────────────────────────────────────────────
  function targetTypeOf(r) {
    if (r.targetType === 'profile' || r.targetType === 'interaction') return r.targetType;
    return r.interactionId ? 'interaction' : 'profile';
  }

  function reasonLabel(reason) {
    if (!reason) return 'No reason given';
    return lookup(REASON_LABELS, reason, humanize(reason));
  }

  function personHtml(person, id, extra) {
    person = person || {};
    var lines = '';
    if (person.username) lines += '<div class="muted">@' + escapeHtml(person.username) + '</div>';
    if (person.email) lines += '<div class="muted">' + escapeHtml(person.email) + '</div>';
    if (person.shareCode) lines += '<div class="muted">Share code: ' + escapeHtml(person.shareCode) + '</div>';
    if (id) lines += '<div class="muted mono">ID: ' + escapeHtml(id) + '</div>';
    return '<div class="person">' + avatarHtml(person.avatarUrl, true) +
      '<div class="who"><div class="who-name">' + escapeHtml(person.name || 'Unknown user') + '</div>' + lines + (extra || '') + '</div></div>';
  }

  function anonymousVoterHtml(sessionId) {
    return '<div class="person"><div class="avatar avatar-anon" aria-hidden="true">?</div>' +
      '<div class="who"><div class="who-name">Anonymous web voter</div>' +
      '<div class="muted">Not signed in</div>' +
      '<div class="muted mono">Session: ' + escapeHtml(sessionId || 'not recorded') + '</div></div></div>';
  }

  function reportCardHtml(r) {
    var id = String(r.id == null ? '' : r.id);
    var status = String(r.status || 'open');
    var isOpen = status === 'open';
    var kind = targetTypeOf(r);
    var created = r.createdAt == null ? '' : String(r.createdAt);
    var due = isOpen ? dueInfo(created, !!r.overdue) : null;
    var overdue = !!(due && due.overdue);

    var badges = '<span class="badge ' + lookup(STATUS_CLASSES, status, 'free') + '">' + escapeHtml(status.toUpperCase()) + '</span>';
    if (overdue) badges += '<span class="badge overdue">OVERDUE</span>';
    var kindText = kind === 'profile'
      ? 'Profile'
      : 'Vote' + (r.interactionType ? ' · ' + lookup(TYPE_LABELS, r.interactionType, humanize(r.interactionType)) : '');
    badges += '<span class="badge kind">' + escapeHtml(kindText) + '</span>';
    if (r.anonymous) badges += '<span class="badge anon">Anonymous voter</span>';
    if (r.reportedUserBanned) badges += '<span class="badge banned">Banned</span>';

    var time = '<div class="report-time">Reported <span title="' + escapeHtml(created) + '">' + escapeHtml(fmtDate(created)) + '</span>' +
      ' · <span data-age="' + escapeHtml(created) + '">' + escapeHtml(timeAgo(created)) + '</span>' +
      (due && due.text
        ? ' · <span class="' + due.cls + '" data-due="' + escapeHtml(created) + '" data-over="' + (r.overdue ? '1' : '0') + '">' + escapeHtml(due.text) + '</span>'
        : '') +
      '</div>';

    var details = r.details
      ? '<div class="details">' + escapeHtml(r.details) + '</div>'
      : '<div class="details none">No details provided by the reporter.</div>';

    var reportedHtml;
    if (r.reportedUserId || r.reportedUser) {
      var snap = r.reportedUser || {};
      var extra = '';
      if (r.anonymous && r.anonymousSessionId) extra += '<div class="muted mono">Session: ' + escapeHtml(r.anonymousSessionId) + '</div>';
      var findTerm = snap.shareCode || snap.email || snap.username || '';
      if (r.reportedUserId && findTerm) extra += '<button type="button" class="link-btn" data-find="' + escapeHtml(findTerm) + '">Find in Users</button>';
      reportedHtml = personHtml(snap, r.reportedUserId, extra);
    } else {
      reportedHtml = anonymousVoterHtml(r.anonymousSessionId);
    }
    var people = '<div class="people">' +
      '<div class="person-box offender"><div class="person-label">' + (kind === 'profile' ? 'Reported profile' : 'Reported voter') + '</div>' + reportedHtml + '</div>' +
      '<div class="person-box"><div class="person-label">Reported by</div>' + personHtml(r.reporter, r.reporterId, '') + '</div>' +
    '</div>';

    var resolution = '';
    if (!isOpen) {
      var resolvedT = toTime(r.resolvedAt);
      var createdT = toTime(created);
      var statusText = lookup(STATUS_LABELS, status, humanize(status));
      var resolutionText = r.resolution ? lookup(RESOLUTION_LABELS, r.resolution, humanize(r.resolution)) : '';
      if (resolutionText.toLowerCase() === statusText.toLowerCase()) resolutionText = '';
      resolution = '<div class="resolution' + (status === 'actioned' ? ' res-actioned' : '') + '">' +
        '<div><strong>' + escapeHtml(statusText) + '</strong>' +
        (resolutionText ? ' · ' + escapeHtml(resolutionText) : '') + '</div>' +
        (resolvedT != null
          ? '<div class="muted">Resolved ' + escapeHtml(fmtDate(r.resolvedAt)) +
            (createdT != null ? ' · handled in ' + escapeHtml(fmtDuration(resolvedT - createdT)) : '') + '</div>'
          : '') +
        (r.adminNote ? '<div class="note"><span class="muted">Admin note:</span> ' + escapeHtml(r.adminNote) + '</div>' : '') +
      '</div>';
    }

    var actions = '';
    if (isOpen && id) {
      var idAttr = escapeHtml(id);
      actions = '<div class="report-actions">' +
        '<button type="button" class="btn-danger" data-action="remove_content" data-id="' + idAttr + '">Remove content</button>' +
        '<button type="button" class="btn-danger-solid" data-action="remove_and_ban" data-id="' + idAttr + '">Remove &amp; ban</button>' +
        '<button type="button" class="btn-ghost" data-action="dismiss" data-id="' + idAttr + '">Dismiss</button>' +
        '<span class="action-msg" aria-live="polite"></span>' +
      '</div>';
    }

    var meta = '<div class="report-meta mono">Report ' + escapeHtml(id) + (r.interactionId ? ' · Vote ' + escapeHtml(r.interactionId) : '') + '</div>';

    return '<article class="report' + (overdue ? ' is-overdue' : '') + (isOpen ? '' : ' is-resolved') + '" data-id="' + escapeHtml(id) + '">' +
      '<div class="reason">' + escapeHtml(reasonLabel(r.reason)) + '</div>' +
      '<div class="badges">' + badges + '</div>' +
      time + details + people + resolution + actions + meta +
    '</article>';
  }

  function updateReportPager() {
    each(document.querySelectorAll('.report-page-info'), function (el) {
      el.textContent = 'Page ' + reportState.page + ' / ' + reportState.pages;
    });
    each(document.querySelectorAll('.report-prev'), function (b) { b.disabled = reportState.page <= 1; });
    each(document.querySelectorAll('.report-next'), function (b) { b.disabled = reportState.page >= reportState.pages; });
  }

  function renderReports(data) {
    var list = $('reportList');
    var reports = Array.isArray(data.reports) ? data.reports : [];
    var status = reportState.status;
    var statusWord = lookup(STATUS_LABELS, status, status).toLowerCase();
    reportState.pages = Math.max(1, Number(data.pages) || 1);
    reportState.page = Math.max(1, Number(data.page) || reportState.page);
    reportState.byId = Object.create(null);
    reports.forEach(function (r) { if (r && r.id != null) reportState.byId[String(r.id)] = r; });
    var total = Number(data.total) || 0;
    $('reportSummary').textContent = status === 'all' ? total + ' report(s) total' : total + ' ' + statusWord + ' report(s)';
    updateReportPager();
    if (!reports.length) {
      var empty = status === 'open' ? 'No open reports. The queue is clear. 🎉'
        : status === 'all' ? 'No reports yet.' : 'No ' + statusWord + ' reports.';
      list.innerHTML = '<div class="empty">' + escapeHtml(empty) + '</div>';
      return;
    }
    list.innerHTML = reports.map(function (r) { return reportCardHtml(r || {}); }).join('');
  }

  function numOrNull(v) {
    if (v == null || v === '') return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }

  function updateCounters(data) {
    var open = numOrNull(data && data.openCount);
    if (open == null) return; // Backend did not send counters.
    var overdue = numOrNull(data.overdueCount) || 0;
    $('openCount').textContent = String(open);
    $('overdueCount').textContent = String(overdue);
    $('hdrOverdue').classList.toggle('alarm', overdue > 0);
    $('qOpen').textContent = open + ' open';
    $('qOverdue').textContent = overdue + ' overdue';
    $('qOverdue').className = 'pill ' + (overdue > 0 ? 'alarm' : 'calm');
    $('tabOpenCount').textContent = open > 0 ? String(open) : '';
    $('overdueAlert').hidden = overdue === 0;
    $('overdueAlertText').textContent = '⚠️ ' + overdue + (overdue === 1 ? ' report is' : ' reports are') +
      ' past the 24-hour deadline. Apple requires action within 24 hours. Handle these first.';
    $('overdueShow').hidden = reportState.status === 'open';
    document.title = (overdue > 0 ? '(' + overdue + ' overdue) ' : open > 0 ? '(' + open + ') ' : '') + 'Hamme Admin · Moderation';
    counterState.lastAt = Date.now();
    $('countersUpdated').textContent = 'Counts updated ' +
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · auto-refresh every minute';
  }

  async function loadReports() {
    if (!signedIn()) return;
    var seq = ++reportState.seq;
    reportState.loading = true;
    $('reportSummary').textContent = 'Loading reports…';
    try {
      var q = '/reports?status=' + encodeURIComponent(reportState.status) + '&page=' + reportState.page + '&limit=' + reportState.limit;
      var data = await api(q);
      if (seq !== reportState.seq) return;
      var pages = Math.max(1, Number(data.pages) || 1);
      var reports = Array.isArray(data.reports) ? data.reports : [];
      if (!reports.length && reportState.page > pages) {
        // The last page emptied (e.g. after an action): step back.
        reportState.page = pages;
        return loadReports();
      }
      renderReports(data);
      updateCounters(data);
      reportState.listOpenCount = numOrNull(data.openCount);
      $('reportStale').hidden = true;
    } catch (e) {
      if (seq !== reportState.seq) return;
      $('reportSummary').textContent = e.message;
      $('reportList').innerHTML = '<div class="empty err">Could not load reports.</div>';
      noteAuthError(e);
    } finally {
      if (seq === reportState.seq) reportState.loading = false;
    }
  }

  // Lightweight poll: only the counters (limit=1), never re-renders the list.
  async function refreshCounters() {
    if (!signedIn() || counterState.busy || document.hidden) return;
    counterState.busy = true;
    try {
      var data = await api('/reports?status=open&page=1&limit=1');
      updateCounters(data);
      var open = numOrNull(data.openCount);
      if (open != null && reportState.listOpenCount != null && open !== reportState.listOpenCount &&
          !reportState.loading && (reportState.status === 'open' || reportState.status === 'all')) {
        $('reportStale').hidden = false;
      }
    } catch (e) {
      noteAuthError(e);
    } finally {
      counterState.busy = false;
    }
  }

  function tickAges() {
    each(document.querySelectorAll('#reportList [data-age]'), function (el) {
      el.textContent = timeAgo(el.getAttribute('data-age'));
    });
    each(document.querySelectorAll('#reportList [data-due]'), function (el) {
      var info = dueInfo(el.getAttribute('data-due'), el.getAttribute('data-over') === '1');
      el.textContent = info.text;
      el.className = info.cls;
    });
  }

  function setReportFilter(status) {
    reportState.status = status;
    reportState.page = 1;
    each(document.querySelectorAll('#reportTabs [data-status]'), function (tab) {
      var on = tab.getAttribute('data-status') === status;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('overdueShow').hidden = status === 'open';
    setReportStatus('');
    loadReports();
  }

  function findCard(id) {
    var cards = document.querySelectorAll('#reportList .report');
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute('data-id') === String(id)) return cards[i];
    }
    return null;
  }

  function setCardBusy(id, busy, msg, kind) {
    var card = findCard(id);
    if (!card) return;
    each(card.querySelectorAll('.report-actions button'), function (b) { b.disabled = busy; });
    card.classList.toggle('busy', busy);
    var m = card.querySelector('.action-msg');
    if (m) {
      m.textContent = msg || '';
      m.className = 'action-msg' + (kind ? ' ' + kind : '');
    }
  }

  // Confirmation copy: spell out exactly what each action does.
  function describeAction(r, action) {
    var kind = targetTypeOf(r);
    var hasAccount = !!r.reportedUserId;
    var who = hasAccount ? whoLabel(r.reportedUser) : 'the anonymous voter';
    var vote = r.interactionType ? lookup(TYPE_LABELS, r.interactionType, humanize(r.interactionType)) + ' vote' : 'vote';
    if (action === 'dismiss') {
      return {
        title: 'Dismiss this report?',
        body: [
          'Nothing is removed and nobody is banned. The report moves to Dismissed.',
          'Only dismiss a report when the content does not break the community guidelines.'
        ],
        confirmLabel: 'Dismiss report',
        danger: false,
        success: 'Report dismissed.'
      };
    }
    if (action === 'remove_content') {
      if (kind === 'profile') {
        return {
          title: 'Remove profile photo?',
          body: [
            'Deletes the profile photo of ' + who + '. The account stays active and is not banned.',
            'The report is marked as actioned.'
          ],
          confirmLabel: 'Remove photo',
          danger: true,
          success: 'Profile photo removed. Report actioned.'
        };
      }
      return {
        title: 'Remove this vote?',
        body: [
          "Permanently deletes this " + vote + " from the recipient's feed. " + (hasAccount ? who + ' is not banned.' : 'The anonymous voter is not banned.'),
          'The report is marked as actioned.'
        ],
        confirmLabel: 'Remove vote',
        danger: true,
        success: 'Vote removed. Report actioned.'
      };
    }
    if (action !== 'remove_and_ban') return null;
    if (!hasAccount) {
      var sid = r.anonymousSessionId;
      return {
        title: 'Remove vote and ban anonymous voter?',
        body: [
          "Deletes this " + vote + " and bans this anonymous voter's browser session" + (sid ? ' (' + sid + ')' : '') + '.',
          'Every anonymous vote from that session is deleted and it can no longer vote on Hamme.',
          'Other open reports against the same session are resolved as actioned.'
        ],
        warning: sid ? '' : 'No session id was recorded for this vote, so there may be no session to ban. The vote will still be deleted.',
        confirmLabel: 'Remove & ban voter',
        danger: true,
        success: 'Vote removed and anonymous voter banned.'
      };
    }
    var body = [
      (kind === 'profile' ? 'Removes the profile photo' : 'Deletes this ' + vote) + ' and permanently bans ' + who + '.',
      'The ban signs them out everywhere, deletes every vote they sent and all of their matches, removes their profile photo and takes their public poll page offline. They cannot sign in or register again from the same device.',
      'Other open reports against this user are resolved as actioned.'
    ];
    if (r.anonymous) body.splice(1, 0, 'The vote was shown anonymously but was sent from this signed-in account, so the account is banned.');
    return {
      title: 'Remove & ban ' + who + '?',
      body: body,
      warning: r.reportedUserBanned ? 'This user is already banned.' : '',
      confirmLabel: 'Remove & ban',
      danger: true,
      success: (kind === 'profile' ? 'Profile photo removed' : 'Vote removed') + ' and ' + who + ' banned.'
    };
  }

  function openReportAction(r, action) {
    var cfg = describeAction(r, action);
    if (!cfg) return;
    openModal({
      title: cfg.title,
      body: cfg.body,
      warning: cfg.warning,
      inputLabel: 'Internal note (optional)',
      inputPlaceholder: 'Only admins see this, e.g. why you chose this action.',
      confirmLabel: cfg.confirmLabel,
      danger: cfg.danger,
      onConfirm: async function (note) {
        var payload = { action: action };
        if (note) payload.note = note;
        setCardBusy(r.id, true, 'Working…');
        try {
          return await api('/reports/' + encodeURIComponent(r.id) + '/action', { method: 'POST', body: JSON.stringify(payload) });
        } catch (e) {
          setCardBusy(r.id, false, e.message, 'err');
          throw e;
        }
      },
      onSuccess: function () {
        setCardBusy(r.id, true, 'Done. Refreshing…', 'ok');
        setReportStatus(cfg.success, 'ok');
        loadReports();
        if (action !== 'dismiss') load();
      }
    });
  }

  // ── Confirm dialog ────────────────────────────────────────────────────────
  var modal = { opts: null, busy: false, returnFocus: null };

  function openModal(opts) {
    modal.opts = opts;
    modal.busy = false;
    modal.returnFocus = document.activeElement;
    $('modalTitle').textContent = opts.title || 'Are you sure?';
    var body = $('modalBody');
    body.textContent = '';
    (opts.body || []).forEach(function (text) {
      if (!text) return;
      var p = document.createElement('p');
      p.textContent = text;
      body.appendChild(p);
    });
    if (opts.warning) {
      var w = document.createElement('p');
      w.className = 'modal-warning';
      w.textContent = opts.warning;
      body.appendChild(w);
    }
    // Optional form fields: [{ name, label, type, placeholder, options: [[value, label]], value }].
    var fieldsEl = $('modalFields');
    fieldsEl.textContent = '';
    (opts.fields || []).forEach(function (f, i) {
      var wrap = document.createElement('div');
      wrap.className = 'field';
      var label = document.createElement('label');
      label.textContent = f.label;
      label.htmlFor = 'mf_' + i;
      var input;
      if (f.type === 'select') {
        input = document.createElement('select');
        (f.options || []).forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o[0];
          opt.textContent = o[1];
          input.appendChild(opt);
        });
      } else {
        input = document.createElement('input');
        input.type = f.type || 'text';
        input.placeholder = f.placeholder || '';
        input.autocomplete = f.autocomplete || 'off';
      }
      input.id = 'mf_' + i;
      input.setAttribute('data-name', f.name);
      if (f.value != null) input.value = f.value;
      wrap.appendChild(label);
      wrap.appendChild(input);
      fieldsEl.appendChild(wrap);
    });
    $('modalField').hidden = !opts.inputLabel;
    $('modalInputLabel').textContent = opts.inputLabel || '';
    $('modalInput').value = '';
    $('modalInput').placeholder = opts.inputPlaceholder || '';
    $('modalInput').disabled = false;
    $('modalError').textContent = '';
    var confirmBtn = $('modalConfirm');
    confirmBtn.textContent = opts.confirmLabel || 'Confirm';
    confirmBtn.className = opts.danger ? 'btn-danger-solid' : 'btn-primary';
    confirmBtn.disabled = false;
    $('modalCancel').disabled = false;
    $('modal').hidden = false;
    document.body.classList.add('modal-open');
    var firstField = fieldsEl.querySelector('input, select');
    if (firstField) firstField.focus(); else $('modalDialog').focus();
  }

  function modalValues() {
    var values = {};
    each($('modalFields').querySelectorAll('[data-name]'), function (el) {
      values[el.getAttribute('data-name')] = el.type === 'password' ? el.value : el.value.trim();
    });
    return values;
  }

  function closeModal() {
    if (!modal.opts || modal.busy) return;
    $('modal').hidden = true;
    $('modalFields').textContent = '';
    if ($('drawer').hidden) document.body.classList.remove('modal-open');
    var back = modal.returnFocus;
    modal.opts = null;
    modal.returnFocus = null;
    if (back && typeof back.focus === 'function' && document.body.contains(back)) back.focus();
  }

  function setModalBusy(busy) {
    modal.busy = busy;
    $('modalConfirm').disabled = busy;
    $('modalCancel').disabled = busy;
    $('modalInput').disabled = busy;
    each($('modalFields').querySelectorAll('[data-name]'), function (el) { el.disabled = busy; });
    $('modalConfirm').textContent = busy ? 'Working…' : (modal.opts && modal.opts.confirmLabel) || 'Confirm';
  }

  async function confirmModal() {
    var opts = modal.opts;
    if (!opts || modal.busy) return;
    var value = opts.fields ? modalValues() : opts.inputLabel ? $('modalInput').value.trim() : '';
    $('modalError').textContent = '';
    setModalBusy(true);
    try {
      var result = await opts.onConfirm(value);
      setModalBusy(false);
      closeModal();
      if (opts.onSuccess) opts.onSuccess(result, value);
    } catch (e) {
      setModalBusy(false);
      $('modalError').textContent = (e && e.message) || 'Something went wrong.';
    }
  }

  $('modalCancel').addEventListener('click', closeModal);
  $('modalConfirm').addEventListener('click', confirmModal);
  // Close on a backdrop click, but not when a text selection drag ends outside.
  var backdropDown = false;
  $('modal').addEventListener('mousedown', function (e) { backdropDown = e.target === $('modal'); });
  $('modal').addEventListener('click', function (e) {
    if (backdropDown && e.target === $('modal')) closeModal();
    backdropDown = false;
  });
  document.addEventListener('keydown', function (e) {
    if (!modal.opts) {
      if (e.key === 'Escape' && !$('drawer').hidden) { e.preventDefault(); closeDrawer(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); confirmModal(); return; }
    if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') { e.preventDefault(); confirmModal(); return; }
    if (e.key !== 'Tab') return;
    var dialog = $('modalDialog');
    var focusables = Array.prototype.filter.call(dialog.querySelectorAll('button, textarea, input, select'), function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (!focusables.length) { e.preventDefault(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !dialog.contains(active))) { e.preventDefault(); first.focus(); }
  });

  // ── Sign-in & navigation ──────────────────────────────────────────────────
  var VIEWS = ['overview', 'money', 'reports', 'users', 'settings', 'admins', 'activity'];
  var OWNER_VIEWS = { money: true, admins: true, activity: true };
  var VIEW_LOADERS = {
    overview: function () { loadOverview(); },
    money: function () { loadMoney(); },
    reports: function () { loadReports(); },
    users: function () { load(); },
    settings: function () { loadSettings(); },
    admins: function () { loadAdmins(); },
    activity: function () { loadActivity(); }
  };

  function showView(name, skipHash) {
    if (VIEWS.indexOf(name) < 0 || (OWNER_VIEWS[name] && !isOwner())) {
      name = 'overview';
      skipHash = false;
    }
    currentView = name;
    each(document.querySelectorAll('[data-view-section]'), function (s) {
      s.hidden = s.getAttribute('data-view-section') !== name;
    });
    each(document.querySelectorAll('#nav [data-view]'), function (b) {
      var on = b.getAttribute('data-view') === name;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (!skipHash && location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    setStatus('');
    VIEW_LOADERS[name]();
    window.scrollTo(0, 0);
  }

  function showApp() {
    var s = getSession();
    $('authView').hidden = true;
    $('appView').hidden = false;
    $('meName').textContent = (s.admin && (s.admin.name || s.admin.email)) || 'Admin';
    $('meRole').textContent = s.admin && s.admin.role === 'owner' ? 'Owner' : 'Moderator';
    $('changePasswordBtn').hidden = !(s.admin && s.admin.id);
    each(document.querySelectorAll('#nav [data-owner]'), function (b) { b.hidden = !isOwner(); });
    $('settingsReadonly').hidden = isOwner();
    $('saveSettings').hidden = !isOwner();
    $('cardLimit').disabled = !isOwner();
    $('cooldownMinutes').disabled = !isOwner();
    refreshCounters();
    showView((location.hash || '').slice(1) || 'overview', true);
  }

  async function showAuth(message) {
    $('appView').hidden = true;
    $('authView').hidden = false;
    var needsBootstrap = false;
    try {
      needsBootstrap = !!(await api('/auth/status')).needsBootstrap;
    } catch (e) {
      setLine('loginStatus', e.message, 'err');
    }
    $('bootstrapForm').hidden = !needsBootstrap;
    $('loginForm').hidden = needsBootstrap;
    if (message && !needsBootstrap) setLine('loginStatus', message, 'err');
    (needsBootstrap ? $('bootKey') : $('loginEmail')).focus();
  }

  function signOut(message) {
    setSession(null);
    closeDrawer();
    if (modal.opts) { modal.busy = false; closeModal(); }
    showAuth(message || '');
  }

  $('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = $('loginEmail').value.trim();
    var password = $('loginPassword').value;
    if (!email || !password) { setLine('loginStatus', 'Enter your email and password.', 'err'); return; }
    $('loginBtn').disabled = true;
    setLine('loginStatus', 'Signing in…');
    try {
      var s = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
      setSession(s);
      $('loginPassword').value = '';
      setLine('loginStatus', '');
      showApp();
    } catch (err) {
      setLine('loginStatus', err.message, 'err');
    } finally {
      $('loginBtn').disabled = false;
    }
  });

  $('bootstrapForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var key = $('bootKey').value;
    var body = { name: $('bootName').value.trim(), email: $('bootEmail').value.trim(), password: $('bootPassword').value };
    if (!key || !body.name || !body.email || !body.password) { setLine('bootStatus', 'Fill in every field.', 'err'); return; }
    if (body.password.length < 10) { setLine('bootStatus', 'Use a password of at least 10 characters.', 'err'); return; }
    $('bootBtn').disabled = true;
    setLine('bootStatus', 'Creating account…');
    try {
      var s = await api('/auth/bootstrap', { method: 'POST', headers: { 'x-admin-key': key }, body: JSON.stringify(body) });
      setSession(s);
      $('bootKey').value = '';
      $('bootPassword').value = '';
      showApp();
    } catch (err) {
      setLine('bootStatus', err.message, 'err');
    } finally {
      $('bootBtn').disabled = false;
    }
  });

  $('signOutBtn').addEventListener('click', function () { signOut(''); });
  $('changePasswordBtn').addEventListener('click', function () {
    openModal({
      title: 'Change your password',
      body: ['You stay signed in here. Other devices signed in to your account are signed out.'],
      fields: [
        { name: 'current', label: 'Current password', type: 'password', autocomplete: 'current-password' },
        { name: 'next', label: 'New password (at least 10 characters)', type: 'password', autocomplete: 'new-password' },
        { name: 'repeat', label: 'Repeat new password', type: 'password', autocomplete: 'new-password' }
      ],
      confirmLabel: 'Change password',
      danger: false,
      onConfirm: function (v) {
        if (!v.current || !v.next) throw new Error('Fill in every field.');
        if (v.next.length < 10) throw new Error('Use a password of at least 10 characters.');
        if (v.next !== v.repeat) throw new Error('The new passwords do not match.');
        return api('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword: v.current, newPassword: v.next }) });
      },
      onSuccess: function (s) {
        if (s && s.token) setSession(s);
        setStatus('Password changed.', 'ok');
      }
    });
  });

  each(document.querySelectorAll('#nav [data-view]'), function (b) {
    b.addEventListener('click', function () { showView(b.getAttribute('data-view')); });
  });
  window.addEventListener('hashchange', function () {
    var name = (location.hash || '').slice(1);
    if (signedIn() && name && name !== currentView) showView(name, true);
  });

  var searchTimer = null;
  $('search').addEventListener('input', function (e) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.search = e.target.value.trim();
      state.page = 1;
      load();
    }, 350);
  });

  $('prev').addEventListener('click', function () {
    if (state.page > 1) { state.page--; load(); }
  });
  $('next').addEventListener('click', function () {
    if (state.page < state.pages) { state.page++; load(); }
  });

  $('rows').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-id]') : null;
    if (!b || b.disabled) return;
    var id = b.getAttribute('data-id');
    if (b.hasAttribute('data-view-user')) { openUserDetail(id); return; }
    if (b.hasAttribute('data-pro')) { setPlan(id, b.getAttribute('data-pro') === 'true'); return; }
    var u = state.byId[id];
    if (!u) return;
    if (b.getAttribute('data-ban') === 'ban') openBan(u);
    else if (b.getAttribute('data-ban') === 'unban') openUnban(u);
  });

  function scrollToReports() {
    $('reports').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('reportRefresh').addEventListener('click', loadReports);
  $('reportStaleRefresh').addEventListener('click', loadReports);
  each(document.querySelectorAll('.report-prev'), function (b) {
    b.addEventListener('click', function () {
      if (reportState.page <= 1) return;
      reportState.page--;
      var fromBottom = !!b.closest('.pager-bottom');
      loadReports().then(function () { if (fromBottom) scrollToReports(); });
    });
  });
  each(document.querySelectorAll('.report-next'), function (b) {
    b.addEventListener('click', function () {
      if (reportState.page >= reportState.pages) return;
      reportState.page++;
      var fromBottom = !!b.closest('.pager-bottom');
      loadReports().then(function () { if (fromBottom) scrollToReports(); });
    });
  });
  each(document.querySelectorAll('#reportTabs [data-status]'), function (tab) {
    tab.addEventListener('click', function () { setReportFilter(tab.getAttribute('data-status')); });
  });
  $('overdueShow').addEventListener('click', function () { setReportFilter('open'); });
  each([$('hdrOpen'), $('hdrOverdue')], function (a) {
    a.addEventListener('click', function () {
      if (reportState.status !== 'open') setReportFilter('open');
    });
  });

  $('reportList').addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var findBtn = e.target.closest('[data-find]');
    if (findBtn) { findUser(findBtn.getAttribute('data-find')); return; }
    var b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    var r = reportState.byId[b.getAttribute('data-id')];
    if (r) openReportAction(r, b.getAttribute('data-action'));
  });

  // Keep the open/overdue counters fresh while the page is open.
  setInterval(function () {
    refreshCounters();
    tickAges();
  }, COUNTER_POLL_MS);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    tickAges();
    if (Date.now() - counterState.lastAt > 15000) refreshCounters();
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  function setSettingsStatus(msg, kind) {
    var el = $('settingsStatus');
    el.textContent = msg || '';
    el.className = kind || '';
  }

  async function loadSettings() {
    if (!signedIn()) return;
    try {
      var data = await api('/config');
      if (data && data.config) {
        $('cardLimit').value = data.config.freeUserCardLimit || 10;
        $('cooldownMinutes').value = data.config.cardCooldownMinutes || 5;
      }
    } catch (e) {
      // Non-fatal: leave placeholders
    }
  }

  $('saveSettings').addEventListener('click', async function () {
    if (!isOwner()) { setSettingsStatus('Only an owner can change these settings.', 'err'); return; }
    var cardLimit = parseInt($('cardLimit').value, 10);
    var cooldown = parseInt($('cooldownMinutes').value, 10);
    if (!cardLimit || cardLimit < 1) { setSettingsStatus('Card limit must be at least 1.', 'err'); return; }
    if (!cooldown || cooldown < 1) { setSettingsStatus('Cooldown must be at least 1 minute.', 'err'); return; }
    setSettingsStatus('Saving…');
    try {
      await api('/config', { method: 'PATCH', body: JSON.stringify({ freeUserCardLimit: cardLimit, cardCooldownMinutes: cooldown }) });
      setSettingsStatus('Settings saved!', 'ok');
    } catch (e) {
      setSettingsStatus(e.message, 'err');
    }
  });

  // ── Formatting & charts ───────────────────────────────────────────────────
  var ANDROID_COLOR = '#2e9e5b';
  var IOS_COLOR = '#7838FE';

  function fmtInt(v) { return (Number(v) || 0).toLocaleString(); }
  function fmtMoney(v, currency) {
    if (v == null || !isFinite(v)) return '\\u2013';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(v);
    } catch (e) {
      return (currency ? currency + ' ' : '') + Number(v).toFixed(2);
    }
  }
  function fmtMoneyShort(v, currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);
    } catch (e) {
      return fmtMoney(v, currency);
    }
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  // Stacked bar chart as inline SVG. buckets: [{ key, label, title }],
  // stacks: [{ name, color, values: [] }], fmt(value, isAxis) formats numbers.
  var charts = Object.create(null);
  function barChart(el, tipEl, buckets, stacks, fmt, wholeNumbers) {
    charts[el.id] = { buckets: buckets, stacks: stacks, fmt: fmt, tipEl: tipEl, wholeNumbers: wholeNumbers };
    // Drawn at the container's real width so labels stay readable on phones.
    var W = Math.round(Math.max(300, Math.min(760, el.clientWidth || 760)));
    var narrow = W < 500;
    var H = narrow ? 210 : 250, L = narrow ? 52 : 64, R = 8, T = 10, B = 30;
    var n = Math.max(buckets.length, 1);
    var totals = buckets.map(function (_, i) {
      return stacks.reduce(function (sum, st) { return sum + (st.values[i] || 0); }, 0);
    });
    var max = niceMax(Math.max.apply(null, totals.concat([0])));
    // Counts get whole-number gridlines (4 equal integer steps).
    if (wholeNumbers) max = Math.max(1, Math.ceil(max / 4)) * 4;
    var pw = W - L - R, ph = H - T - B, slot = pw / n, bw = Math.max(2, Math.min(34, slot * 0.68));
    var out = '';
    for (var k = 0; k <= 4; k++) {
      var gy = r1(T + ph - ph * k / 4);
      out += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/>' +
        '<text x="' + (L - 6) + '" y="' + (gy + 4) + '" text-anchor="end">' + escapeHtml(fmt(max * k / 4, true)) + '</text>';
    }
    var step = Math.ceil(n / (narrow ? 5 : 12));
    buckets.forEach(function (b, i) {
      var x = L + slot * i;
      var bx = r1(x + (slot - bw) / 2);
      var y = T + ph;
      out += '<g class="bar-col" data-i="' + i + '"><rect class="hit" x="' + r1(x) + '" y="' + T + '" width="' + r1(slot) + '" height="' + ph + '"/>';
      stacks.forEach(function (st) {
        var v = st.values[i] || 0;
        if (v <= 0) return;
        var h = Math.max(1, ph * v / max);
        y -= h;
        out += '<rect x="' + bx + '" y="' + r1(y) + '" width="' + r1(bw) + '" height="' + r1(h) + '" rx="2" fill="' + st.color + '"/>';
      });
      out += '</g>';
      if (i % step === 0) {
        out += '<text x="' + r1(x + slot / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + escapeHtml(b.label) + '</text>';
      }
    });
    el.innerHTML = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bar chart">' + out + '</svg>';
  }

  function chartHover(e) {
    var col = e.target.closest ? e.target.closest('.bar-col') : null;
    var chart = charts[this.id];
    if (!col || !chart) return;
    var i = Number(col.getAttribute('data-i'));
    var b = chart.buckets[i];
    var parts = [];
    var total = 0;
    chart.stacks.forEach(function (st) {
      var v = st.values[i] || 0;
      total += v;
      if (chart.stacks.length > 1) parts.push(st.name + ' ' + chart.fmt(v, false));
    });
    chart.tipEl.textContent = b.title + ': ' + chart.fmt(total, false) + (parts.length ? ' (' + parts.join(' \\u00b7 ') + ')' : '');
  }
  each([$('moneyChart'), $('signupChart')], function (el) {
    el.addEventListener('mouseover', chartHover);
    el.addEventListener('click', chartHover);
  });
  // Redraw at the new width after rotating a phone or resizing the window.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      Object.keys(charts).forEach(function (id) {
        var c = charts[id];
        var el = $(id);
        if (el && el.offsetParent !== null) barChart(el, c.tipEl, c.buckets, c.stacks, c.fmt, c.wholeNumbers);
      });
    }, 200);
  });

  // Local-time chart buckets, matching the server's grouping in the same time zone.
  function bucketKey(gran, d) {
    if (gran === 'year') return String(d.getFullYear());
    if (gran === 'month') return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function periodStart(gran, count) {
    var now = new Date();
    if (gran === 'year') return new Date(now.getFullYear() - (count - 1), 0, 1);
    if (gran === 'month') return new Date(now.getFullYear(), now.getMonth() - (count - 1), 1);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - 1));
  }
  function bucketList(gran, start) {
    var list = [];
    var d = new Date(start.getTime());
    var now = new Date();
    while (d <= now && list.length < 400) {
      var label, title;
      if (gran === 'year') { label = title = String(d.getFullYear()); }
      else if (gran === 'month') {
        label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        title = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      } else {
        label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        title = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }
      list.push({ key: bucketKey(gran, d), label: label, title: title });
      if (gran === 'year') d = new Date(d.getFullYear() + 1, 0, 1);
      else if (gran === 'month') d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      else d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return list;
  }

  function statCard(label, value, sub, opts) {
    opts = opts || {};
    var cls = 'stat' + (opts.alarm ? ' alarm' : '');
    var inner = '<div class="stat-label">' + escapeHtml(label) + '</div>' +
      '<div class="stat-value">' + escapeHtml(value) + '</div>' +
      (sub ? '<div class="stat-sub">' + (opts.subHtml ? sub : escapeHtml(sub)) + '</div>' : '');
    if (opts.view) return '<button type="button" class="' + cls + '" data-goto="' + escapeHtml(opts.view) + '">' + inner + '</button>';
    return '<div class="' + cls + '">' + inner + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-goto]') : null;
    if (b) showView(b.getAttribute('data-goto'));
  });

  // ── Overview ──────────────────────────────────────────────────────────────
  var overviewSeq = 0;
  async function loadOverview() {
    var seq = ++overviewSeq;
    try {
      var d = await api('/stats?tz=' + encodeURIComponent(TZ));
      if (seq !== overviewSeq) return;
      var u = d.users || {}, pro = d.pro || {}, act = d.activity || {}, rep = d.reports || {};
      var cards = [
        statCard('Users', fmtInt(u.total), '+' + fmtInt(u.new1d) + ' today \\u00b7 +' + fmtInt(u.new7d) + ' this week \\u00b7 +' + fmtInt(u.new30d) + ' in 30 days', { view: 'users' }),
        statCard('Pro members', fmtInt(pro.total), 'Google Play ' + fmtInt(pro.android) + ' \\u00b7 App Store ' + fmtInt(pro.ios) + ' \\u00b7 free grants ' + fmtInt(pro.admin), { view: 'users' }),
        statCard('Open reports', fmtInt(rep.open), rep.overdue ? fmtInt(rep.overdue) + ' past the 24-hour deadline' : 'None overdue', { alarm: rep.overdue > 0, view: 'reports' }),
        statCard('Votes this week', fmtInt(act.votes7d), fmtInt(act.matches7d) + ' new matches this week'),
        statCard('Banned / guests', fmtInt(u.banned) + ' / ' + fmtInt(u.guests), 'Banned accounts \\u00b7 guest accounts')
      ];
      if (isOwner()) {
        var rev = d.revenue30d || [];
        cards.splice(2, 0, rev.length
          ? statCard('Earnings \\u00b7 30 days', fmtMoney(rev[0].gross, rev[0].currency),
            'Your share \\u2248 ' + fmtMoney(rev[0].net, rev[0].currency) + ' \\u00b7 ' + fmtInt(rev[0].count) + ' payments' +
            (rev.length > 1 ? ' \\u00b7 also ' + rev.slice(1).map(function (r) { return fmtMoney(r.gross, r.currency); }).join(', ') : ''), { view: 'money' })
          : statCard('Earnings \\u00b7 30 days', '\\u2013', 'No payments recorded yet. Open Money to sync.', { view: 'money' }));
      }
      $('overviewStats').innerHTML = cards.join('');

      var buckets = bucketList('day', periodStart('day', 30));
      var byDay = Object.create(null);
      (d.signups || []).forEach(function (row) { byDay[row.day] = row.count; });
      barChart($('signupChart'), $('signupTip'), buckets,
        [{ name: 'Sign-ups', color: '#9E57FF', values: buckets.map(function (b) { return byDay[b.key] || 0; }) }],
        function (v, axis) { return axis ? String(Math.round(v)) : fmtInt(v) + ' sign-up' + (v === 1 ? '' : 's'); }, true);
      $('signupTip').textContent = 'Hover a bar for details.';
    } catch (e) {
      if (seq !== overviewSeq) return;
      $('overviewStats').innerHTML = statCard('Overview', '\\u2013', e.message, { alarm: true });
    }
  }
  $('overviewRefresh').addEventListener('click', loadOverview);

  // ── Money ─────────────────────────────────────────────────────────────────
  var moneyState = { platform: 'all', granularity: 'day', range: { day: 30, month: 12, year: 5 }, currency: '', includeTest: false, metric: 'gross', seq: 0, syncing: false };
  var RANGE_OPTIONS = {
    day: [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']],
    month: [[6, 'Last 6 months'], [12, 'Last 12 months'], [24, 'Last 24 months']],
    year: [[5, 'Last 5 years'], [10, 'Last 10 years']]
  };
  var PLATFORM_LABELS = { android: 'Android', ios: 'iOS' };

  function fillRangeSelect() {
    var sel = $('moneyRange');
    sel.textContent = '';
    RANGE_OPTIONS[moneyState.granularity].forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = String(o[0]);
      opt.textContent = o[1];
      sel.appendChild(opt);
    });
    sel.value = String(moneyState.range[moneyState.granularity]);
  }

  function setSeg(id, value) {
    each(document.querySelectorAll('#' + id + ' [data-v]'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-v') === value);
    });
  }

  async function loadMoney() {
    if (!isOwner()) return;
    var seq = ++moneyState.seq;
    var gran = moneyState.granularity;
    var start = periodStart(gran, moneyState.range[gran]);
    var now = new Date();
    var q = '/revenue?platform=' + moneyState.platform +
      '&granularity=' + gran +
      '&from=' + encodeURIComponent(start.toISOString()) +
      '&to=' + encodeURIComponent(new Date(now.getTime() + 60000).toISOString()) +
      '&tz=' + encodeURIComponent(TZ) +
      '&includeTest=' + (moneyState.includeTest ? 'true' : 'false') +
      '&todayStart=' + encodeURIComponent(new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()) +
      '&monthStart=' + encodeURIComponent(new Date(now.getFullYear(), now.getMonth(), 1).toISOString()) +
      '&yearStart=' + encodeURIComponent(new Date(now.getFullYear(), 0, 1).toISOString()) +
      (moneyState.currency ? '&currency=' + encodeURIComponent(moneyState.currency) : '');
    if (!moneyState.syncing) setLine('moneyStatus', 'Loading…');
    try {
      var d = await api(q);
      if (seq !== moneyState.seq) return;
      renderMoney(d, start);
      if (!moneyState.syncing) setLine('moneyStatus', d.currency ? '' : 'No payments recorded yet. Click \\u201cSync with stores\\u201d to import existing purchases from Google Play and the App Store.', d.currency ? '' : 'err');
    } catch (e) {
      if (seq !== moneyState.seq) return;
      setLine('moneyStatus', e.message, 'err');
    }
  }

  function renderMoney(d, start) {
    var cur = d.currency || '';
    moneyState.currency = cur;
    var sel = $('moneyCurrency');
    sel.textContent = '';
    var list = (d.currencies || []).slice();
    if (cur && !list.some(function (c) { return c.currency === cur; })) list.unshift({ currency: cur, count: 0 });
    if (!list.length) list.push({ currency: '', count: 0 });
    list.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.currency;
      opt.textContent = c.currency ? c.currency + (c.count ? ' (' + c.count + ')' : '') : '\\u2013';
      sel.appendChild(opt);
    });
    sel.value = cur;
    $('moneySynced').textContent = d.lastSyncedAt ? 'Last updated from the stores ' + timeAgo(d.lastSyncedAt) : 'Not synced with the stores yet';

    var m = function (v) { return fmtMoney(v, cur); };
    var metric = moneyState.metric;
    var quick = d.quick || {};
    function quickCard(label, t) {
      t = t || { gross: 0, net: 0, count: 0 };
      var value = metric === 'net' ? t.net : t.gross;
      var other = metric === 'net' ? 'Customer paid ' + m(t.gross) : 'Your share ' + (t.netEstimated ? '\\u2248 ' : '') + m(t.net);
      return statCard(label, m(value), other + ' \\u00b7 ' + fmtInt(t.count) + ' payment' + (t.count === 1 ? '' : 's'));
    }
    $('moneyQuick').innerHTML = quickCard('Today', quick.today) + quickCard('This month', quick.month) + quickCard('This year', quick.year);

    var gran = d.range && d.range.granularity || moneyState.granularity;
    var buckets = bucketList(gran, start);
    var index = Object.create(null);
    buckets.forEach(function (b, i) { index[b.key] = i; });
    var android = buckets.map(function () { return 0; });
    var ios = buckets.map(function () { return 0; });
    (d.series || []).forEach(function (row) {
      var i = index[row.bucket];
      if (i == null) return;
      var v = metric === 'net' ? row.net : row.gross;
      if (row.platform === 'ios') ios[i] += v; else android[i] += v;
    });
    var stacks = [];
    if (moneyState.platform !== 'ios') stacks.push({ name: 'Android', color: ANDROID_COLOR, values: android });
    if (moneyState.platform !== 'android') stacks.push({ name: 'iOS', color: IOS_COLOR, values: ios });
    $('moneyChartTitle').textContent = (metric === 'net' ? 'Your earnings' : 'Customer paid') + ' \\u00b7 ' +
      ({ day: 'per day', month: 'per month', year: 'per year' })[gran] + (cur ? ' (' + cur + ')' : '');
    barChart($('moneyChart'), $('moneyTip'), buckets, stacks, function (v, axis) { return axis ? fmtMoneyShort(v, cur) : m(v); });
    $('moneyTip').textContent = 'Hover a bar for details.';

    var t = d.total || {};
    var p = d.platforms || {};
    var a = p.android || {}, i2 = p.ios || {};
    var sum = (a.gross || 0) + (i2.gross || 0);
    var aPct = sum > 0 ? Math.round((a.gross || 0) / sum * 100) : 0;
    var subs = d.subscribers || {};
    $('moneyTotals').innerHTML = [
      statCard('Customer paid \\u00b7 period', m(t.gross), 'Tax included ' + m(t.tax) + ' (Google Play only)'),
      statCard('Your earnings \\u00b7 period', (t.netEstimated ? '\\u2248 ' : '') + m(t.net), t.netEstimated ? 'App Store part is an estimate' : 'After store fees and tax'),
      statCard('Payments', fmtInt(t.count), fmtInt(t.count - t.renewals) + ' new \\u00b7 ' + fmtInt(t.renewals) + ' renewals \\u00b7 ' + fmtInt(t.refunds) + ' refunded'),
      statCard('Active subscribers', fmtInt((subs.android || 0) + (subs.ios || 0)), 'Android ' + fmtInt(subs.android) + ' \\u00b7 iOS ' + fmtInt(subs.ios) + ' \\u00b7 ' + fmtInt(subs.autoRenewing) + ' set to renew'),
      statCard('Android vs iOS', sum > 0 ? aPct + '% / ' + (100 - aPct) + '%' : '\\u2013',
        '<div class="split"><span style="width:' + aPct + '%;background:' + ANDROID_COLOR + '"></span><span style="width:' + (sum > 0 ? 100 - aPct : 0) + '%;background:' + IOS_COLOR + '"></span></div>' +
        escapeHtml('Android ' + m(a.gross) + ' \\u00b7 iOS ' + m(i2.gross)), { subHtml: true })
    ].join('');

    var rows = (d.recent || []).map(function (r) {
      var badges = '';
      if (r.refundedAmount > 0) badges += '<span class="badge refund">Refunded</span> ';
      if (r.isTest) badges += '<span class="badge test">Test</span> ';
      if (!badges) badges = '<span class="muted">Paid</span>';
      var user = r.userId
        ? '<button type="button" class="link-btn" data-user="' + escapeHtml(r.userId) + '">' + escapeHtml(r.userName || 'View user') + '</button>'
        : '<span class="muted">Unknown</span>';
      return '<tr>' +
        '<td>' + escapeHtml(fmtDate(r.purchasedAt)) + '</td>' +
        '<td><span class="badge ' + (r.platform === 'ios' ? 'ios' : 'android') + '">' + escapeHtml(lookup(PLATFORM_LABELS, r.platform, r.platform)) + '</span></td>' +
        '<td>' + (r.kind === 'renewal' ? 'Renewal' : 'New') + '</td>' +
        '<td class="hide-sm">' + user + '</td>' +
        '<td class="num">' + escapeHtml(fmtMoney(r.amount, r.currency)) + '</td>' +
        '<td class="num">' + (r.net == null ? '\\u2013' : (r.netEstimated ? '\\u2248 ' : '') + escapeHtml(fmtMoney(r.net, r.currency))) + '</td>' +
        '<td>' + badges + '</td>' +
      '</tr>';
    });
    $('moneyRecent').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="7" class="muted">No payments in this period.</td></tr>';
  }

  $('moneyRecent').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-user]') : null;
    if (b) openUserDetail(b.getAttribute('data-user'));
  });
  $('moneyPlatform').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-v]') : null;
    if (!b) return;
    moneyState.platform = b.getAttribute('data-v');
    setSeg('moneyPlatform', moneyState.platform);
    loadMoney();
  });
  $('moneyGranularity').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-v]') : null;
    if (!b) return;
    moneyState.granularity = b.getAttribute('data-v');
    setSeg('moneyGranularity', moneyState.granularity);
    fillRangeSelect();
    loadMoney();
  });
  $('moneyRange').addEventListener('change', function () {
    moneyState.range[moneyState.granularity] = Number($('moneyRange').value);
    loadMoney();
  });
  $('moneyCurrency').addEventListener('change', function () {
    moneyState.currency = $('moneyCurrency').value;
    loadMoney();
  });
  $('moneyMetric').addEventListener('change', function () {
    moneyState.metric = $('moneyMetric').value;
    loadMoney();
  });
  $('moneyTest').addEventListener('change', function () {
    moneyState.includeTest = $('moneyTest').checked;
    loadMoney();
  });
  $('moneyRefresh').addEventListener('click', loadMoney);
  $('moneySync').addEventListener('click', async function () {
    var btn = $('moneySync');
    btn.disabled = true;
    moneyState.syncing = true;
    setLine('moneyStatus', 'Syncing with Google Play and the App Store\\u2026 this can take a minute.');
    try {
      var r = await api('/revenue/sync', { method: 'POST', body: '{}' });
      var msg = 'Synced ' + fmtInt(r.subscriptions) + ' subscription(s), ' + fmtInt(r.payments) + ' payment(s).' +
        (r.skipped ? ' ' + fmtInt(r.skipped) + ' ended too long ago for the store to return them.' : '') +
        (r.failed ? ' ' + fmtInt(r.failed) + ' failed: ' + (r.errors || []).join(' ') : '');
      setLine('moneyStatus', msg, r.failed ? 'err' : 'ok');
    } catch (e) {
      setLine('moneyStatus', e.message, 'err');
    } finally {
      moneyState.syncing = false;
      btn.disabled = false;
      loadMoney();
    }
  });
  fillRangeSelect();

  // ── User detail ───────────────────────────────────────────────────────────
  var drawerState = { userId: null, seq: 0, user: null, returnFocus: null };

  function closeDrawer() {
    if ($('drawer').hidden) return;
    $('drawer').hidden = true;
    drawerState.userId = null;
    drawerState.user = null;
    if (!modal.opts) document.body.classList.remove('modal-open');
    var back = drawerState.returnFocus;
    drawerState.returnFocus = null;
    if (back && typeof back.focus === 'function' && document.body.contains(back)) back.focus();
  }

  function kvHtml(pairs) {
    return '<div class="kv">' + pairs.filter(function (p) { return p[1] !== '' && p[1] != null; }).map(function (p) {
      return '<div><span>' + escapeHtml(p[0]) + '</span>' + (p[2] ? p[1] : escapeHtml(p[1])) + '</div>';
    }).join('') + '</div>';
  }

  async function openUserDetail(id) {
    if ($('drawer').hidden) drawerState.returnFocus = document.activeElement;
    drawerState.userId = id;
    var seq = ++drawerState.seq;
    $('drawer').hidden = false;
    document.body.classList.add('modal-open');
    $('drawerTitle').textContent = 'User';
    $('drawerBody').innerHTML = '';
    setLine('drawerStatus', 'Loading…');
    $('drawerDialog').focus();
    try {
      var d = await api('/users/' + encodeURIComponent(id));
      if (seq !== drawerState.seq) return;
      setLine('drawerStatus', '');
      renderUserDetail(d);
      if (isOwner()) loadUserActivity(id, seq);
    } catch (e) {
      if (seq !== drawerState.seq) return;
      setLine('drawerStatus', e.message, 'err');
    }
  }

  function renderUserDetail(d) {
    var u = d.user || {};
    var id = String(u.id || '');
    drawerState.user = u;
    state.byId[id] = u;
    $('drawerTitle').textContent = u.name || 'Unnamed user';
    var badges = (u.isPro ? '<span class="badge pro">PRO \\u00b7 ' + escapeHtml(proSource(u)) + '</span> ' : '<span class="badge free">FREE</span> ') +
      (u.isBanned ? '<span class="badge banned">BANNED</span>' : '');
    var head = '<div class="detail-head">' + avatarHtml(u.avatarUrl, true) + '<div class="who">' +
      (u.username ? '<div class="muted">@' + escapeHtml(u.username) + '</div>' : '') +
      (u.email ? '<div class="muted">' + escapeHtml(u.email) + '</div>' : '') +
      '<div class="badges">' + badges + '</div></div></div>';

    var account = kvHtml([
      ['Joined', fmtDate(u.createdAt)],
      ['Account type', u.isGuestUser ? 'Guest' : 'Registered'],
      ['Share code', u.shareCode || ''],
      ['Devices', (u.devicePlatforms || []).map(function (p) { return lookup(PLATFORM_LABELS, p, p); }).join(', ') || 'None registered'],
      ['Terms accepted', u.termsAcceptedAt ? fmtDate(u.termsAcceptedAt) : 'Not yet'],
      ['User ID', '<span class="mono">' + escapeHtml(id) + '</span>', true]
    ].concat(u.isBanned ? [['Banned', fmtDate(u.bannedAt) + (u.banReason ? ' \\u00b7 ' + u.banReason : '')]] : []));

    var hasStore = u.proPlatform === 'android' || u.proPlatform === 'ios';
    var subscription = hasStore || u.adminPro ? kvHtml([
      ['Store', hasStore ? (u.proPlatform === 'ios' ? 'App Store' : 'Google Play') : 'None (free grant)'],
      ['Product', u.proProductId || ''],
      ['Store status', u.proSubscriptionState ? humanize(String(u.proSubscriptionState).replace('SUBSCRIPTION_STATE_', '').toLowerCase()) : ''],
      [u.proAutoRenewing ? 'Renews' : 'Ends', u.proExpiryAt ? fmtDate(u.proExpiryAt) : ''],
      ['Auto-renew', hasStore ? (u.proAutoRenewing ? 'On' : 'Off') : ''],
      ['Free Pro grant', u.adminPro ? 'Yes' : 'No'],
      ['Last checked with store', u.proLastVerifiedAt ? fmtDate(u.proLastVerifiedAt) : '']
    ]) : '<div class="muted">Never subscribed.</div>';

    var s = d.stats || {};
    var mini = '<div class="mini-stats">' + [
      ['Votes sent', s.votesSent], ['Votes received', s.votesReceived], ['Matches', s.matches],
      ['Reports against', s.reportsAgainst + (s.openReportsAgainst ? ' (' + s.openReportsAgainst + ' open)' : '')],
      ['Reports filed', s.reportsFiled]
    ].map(function (x) { return '<div><strong>' + escapeHtml(String(x[1] == null ? 0 : x[1])) + '</strong>' + escapeHtml(x[0]) + '</div>'; }).join('') + '</div>';

    var payments = (d.payments || []).length
      ? '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Store</th><th>Type</th><th class="num">Paid</th><th>Status</th></tr></thead><tbody>' +
        d.payments.map(function (p) {
          return '<tr><td>' + escapeHtml(fmtDate(p.purchasedAt)) + '</td>' +
            '<td><span class="badge ' + (p.platform === 'ios' ? 'ios' : 'android') + '">' + escapeHtml(lookup(PLATFORM_LABELS, p.platform, p.platform)) + '</span></td>' +
            '<td>' + (p.kind === 'renewal' ? 'Renewal' : 'New') + '</td>' +
            '<td class="num">' + escapeHtml(fmtMoney(p.amount, p.currency)) + '</td>' +
            '<td>' + (p.refundedAmount > 0 ? '<span class="badge refund">Refunded</span> ' : '') + (p.isTest ? '<span class="badge test">Test</span>' : '') +
              (!p.counted ? '<span class="badge inactive">Not charged</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<div class="muted">No payments recorded.</div>';

    var idAttr = escapeHtml(id);
    var actions = '<div class="btn-group" style="margin-top:14px;">' +
      (isOwner() ? (u.adminPro
        ? '<button type="button" class="btn-danger btn-sm" data-act="unpro" data-id="' + idAttr + '">Remove free Pro</button>'
        : '<button type="button" class="btn-primary btn-sm" data-act="pro" data-id="' + idAttr + '">Give free Pro</button>') : '') +
      (u.isBanned
        ? '<button type="button" class="btn-ghost btn-sm" data-act="unban" data-id="' + idAttr + '">Unban</button>'
        : '<button type="button" class="btn-outline-danger btn-sm" data-act="ban" data-id="' + idAttr + '">Ban</button>') +
      (isOwner() ? '<button type="button" class="btn-danger-solid btn-sm" data-act="delete" data-id="' + idAttr + '">Delete account</button>' : '') +
      '</div>';

    $('drawerBody').innerHTML = head + actions +
      '<div class="detail-section"><h3>Account</h3>' + account + '</div>' +
      '<div class="detail-section"><h3>Activity in the app</h3>' + mini + '</div>' +
      '<div class="detail-section"><h3>Subscription</h3>' + subscription + '</div>' +
      '<div class="detail-section"><h3>Payments</h3>' + payments + '</div>' +
      (isOwner() ? '<div class="detail-section"><h3>Admin actions on this user</h3><div id="drawerActivity" class="muted">Loading…</div></div>' : '');
  }

  async function loadUserActivity(id, seq) {
    try {
      var d = await api('/audit?targetId=' + encodeURIComponent(id) + '&limit=10');
      if (seq !== drawerState.seq || !$('drawerActivity')) return;
      var entries = d.entries || [];
      $('drawerActivity').innerHTML = entries.length
        ? entries.map(function (a) {
          return '<div style="margin-bottom:6px;"><strong>' + escapeHtml(a.summary || a.action) + '</strong><div class="muted">' +
            escapeHtml(fmtDate(a.createdAt) + ' \\u00b7 ' + (a.adminName || a.adminEmail || 'Unknown admin')) + '</div></div>';
        }).join('')
        : 'No admin actions yet.';
    } catch (e) {
      if ($('drawerActivity')) $('drawerActivity').textContent = e.message;
    }
  }

  function openDeleteUser(u) {
    var who = whoLabel(u);
    var hasActiveStore = u.storeProActive && (u.proPlatform === 'android' || u.proPlatform === 'ios');
    openModal({
      title: 'Delete the account of ' + who + '?',
      body: [
        'This permanently deletes the account, every vote they sent and received, their matches and their profile photo. It cannot be undone.',
        'Reports they filed are kept without their personal details. Their payment records stay in Money.'
      ],
      warning: hasActiveStore ? 'They have an active ' + (u.proPlatform === 'ios' ? 'App Store' : 'Google Play') + ' subscription. Deleting the account does not cancel it: they must cancel it in the store, or you refund it from the store console.' : '',
      fields: [
        { name: 'reason', label: 'Reason (optional, saved in the activity log)' },
        { name: 'confirm', label: 'Type DELETE to confirm', placeholder: 'DELETE' }
      ],
      confirmLabel: 'Delete account',
      danger: true,
      onConfirm: function (v) {
        if (v.confirm !== 'DELETE') throw new Error('Type DELETE in capital letters to confirm.');
        return api('/users/' + encodeURIComponent(u.id), { method: 'DELETE', body: JSON.stringify(v.reason ? { reason: v.reason } : {}) });
      },
      onSuccess: function () {
        closeDrawer();
        load().then(function () { setUserStatus('The account of ' + who + ' was deleted.', 'ok'); });
        loadReports();
      }
    });
  }

  $('drawerClose').addEventListener('click', closeDrawer);
  var drawerDown = false;
  $('drawer').addEventListener('mousedown', function (e) { drawerDown = e.target === $('drawer'); });
  $('drawer').addEventListener('click', function (e) {
    if (drawerDown && e.target === $('drawer')) closeDrawer();
    drawerDown = false;
  });
  $('drawerBody').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-act]') : null;
    if (!b || b.disabled) return;
    var u = drawerState.user;
    if (!u) return;
    var act = b.getAttribute('data-act');
    if (act === 'pro' || act === 'unpro') setPlan(u.id, act === 'pro');
    else if (act === 'ban') openBan(u);
    else if (act === 'unban') openUnban(u);
    else if (act === 'delete') openDeleteUser(u);
  });

  // ── Admin accounts ────────────────────────────────────────────────────────
  var adminState = { byId: Object.create(null) };

  async function loadAdmins() {
    if (!isOwner()) return;
    try {
      var d = await api('/admins');
      var me = getSession().admin || {};
      adminState.byId = Object.create(null);
      $('adminRows').innerHTML = (d.admins || []).map(function (a) {
        adminState.byId[a.id] = a;
        var idAttr = escapeHtml(a.id);
        var self = a.id === me.id;
        var roleSel = '<select data-role-for="' + idAttr + '" aria-label="Role">' +
          '<option value="owner"' + (a.role === 'owner' ? ' selected' : '') + '>Owner</option>' +
          '<option value="moderator"' + (a.role !== 'owner' ? ' selected' : '') + '>Moderator</option></select>';
        var actions = '<button type="button" class="btn-ghost btn-sm" data-admin-act="password" data-id="' + idAttr + '">Reset password</button>' +
          (self ? '' : a.isActive
            ? '<button type="button" class="btn-outline-danger btn-sm" data-admin-act="deactivate" data-id="' + idAttr + '">Deactivate</button>'
            : '<button type="button" class="btn-ghost btn-sm" data-admin-act="activate" data-id="' + idAttr + '">Reactivate</button>');
        return '<tr>' +
          '<td><div class="who-name">' + escapeHtml(a.name) + (self ? ' <span class="muted">(you)</span>' : '') + '</div><div class="muted">' + escapeHtml(a.email) + '</div></td>' +
          '<td>' + roleSel + '</td>' +
          '<td>' + (a.isActive ? '<span class="muted">Active</span>' : '<span class="badge inactive">Deactivated</span>') + '</td>' +
          '<td class="hide-sm">' + escapeHtml(a.lastLoginAt ? timeAgo(a.lastLoginAt) : 'Never') + '</td>' +
          '<td><div class="btn-group">' + actions + '</div></td>' +
        '</tr>';
      }).join('') || '<tr><td colspan="5" class="muted">No admins.</td></tr>';
    } catch (e) {
      setLine('adminsStatus', e.message, 'err');
    }
  }

  function updateAdmin(id, patch, okMsg) {
    return api('/admins/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(patch) })
      .then(function () { setLine('adminsStatus', okMsg, 'ok'); loadAdmins(); });
  }

  $('adminRows').addEventListener('change', function (e) {
    var sel = e.target;
    if (!sel.hasAttribute || !sel.hasAttribute('data-role-for')) return;
    var id = sel.getAttribute('data-role-for');
    var a = adminState.byId[id];
    updateAdmin(id, { role: sel.value }, (a ? a.email : 'Admin') + ' is now ' + (sel.value === 'owner' ? 'an owner.' : 'a moderator.'))
      .catch(function (err) { setLine('adminsStatus', err.message, 'err'); loadAdmins(); });
  });

  $('adminRows').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-admin-act]') : null;
    if (!b) return;
    var a = adminState.byId[b.getAttribute('data-id')];
    if (!a) return;
    var act = b.getAttribute('data-admin-act');
    if (act === 'password') {
      openModal({
        title: 'Reset the password of ' + a.email + '?',
        body: ['They are signed out everywhere and must use the new password. Share it with them privately.'],
        fields: [{ name: 'password', label: 'New password (at least 10 characters)', type: 'password', autocomplete: 'new-password' }],
        confirmLabel: 'Reset password',
        danger: false,
        onConfirm: function (v) {
          if (!v.password || v.password.length < 10) throw new Error('Use a password of at least 10 characters.');
          return updateAdmin(a.id, { password: v.password }, 'Password reset for ' + a.email + '.');
        }
      });
    } else if (act === 'deactivate' || act === 'activate') {
      var off = act === 'deactivate';
      openModal({
        title: (off ? 'Deactivate ' : 'Reactivate ') + a.email + '?',
        body: [off ? 'They are signed out at once and can no longer sign in. Their past actions stay in the activity log.' : 'They can sign in again with their password.'],
        confirmLabel: off ? 'Deactivate' : 'Reactivate',
        danger: off,
        onConfirm: function () {
          return updateAdmin(a.id, { isActive: !off }, a.email + (off ? ' was deactivated.' : ' was reactivated.'));
        }
      });
    }
  });

  $('addAdminBtn').addEventListener('click', function () {
    openModal({
      title: 'Add an admin',
      body: ['They sign in at this page with this email and password. Share the password privately; they can change it after signing in.'],
      fields: [
        { name: 'name', label: 'Name' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'role', label: 'Role', type: 'select', options: [['moderator', 'Moderator: reports and bans'], ['owner', 'Owner: everything, including money']] },
        { name: 'password', label: 'Password (at least 10 characters)', type: 'password', autocomplete: 'new-password' }
      ],
      confirmLabel: 'Add admin',
      danger: false,
      onConfirm: function (v) {
        if (!v.name || !v.email || !v.password) throw new Error('Fill in every field.');
        if (v.password.length < 10) throw new Error('Use a password of at least 10 characters.');
        return api('/admins', { method: 'POST', body: JSON.stringify(v) });
      },
      onSuccess: function (r) {
        setLine('adminsStatus', 'Added ' + (r && r.admin ? r.admin.email : 'admin') + '.', 'ok');
        loadAdmins();
      }
    });
  });

  // ── Activity log ──────────────────────────────────────────────────────────
  var activityState = { page: 1, pages: 1, action: '', seq: 0 };
  var ACTION_LABELS = {
    'auth.login': 'Signed in',
    'auth.login_failed': 'Failed sign-in',
    'admin.bootstrap': 'Created first owner',
    'admin.create': 'Added admin',
    'admin.update': 'Changed admin',
    'admin.password_change': 'Changed password',
    'user.grant_pro': 'Gave free Pro',
    'user.revoke_pro': 'Removed free Pro',
    'user.ban': 'Banned user',
    'user.unban': 'Unbanned user',
    'user.delete': 'Deleted account',
    'report.remove_content': 'Removed content',
    'report.remove_and_ban': 'Removed & banned',
    'report.dismiss': 'Dismissed report',
    'config.update': 'Changed settings',
    'revenue.sync': 'Synced payments'
  };

  async function loadActivity() {
    if (!isOwner()) return;
    var seq = ++activityState.seq;
    setLine('activityStatus', 'Loading…');
    try {
      var d = await api('/audit?page=' + activityState.page + '&limit=50' + (activityState.action ? '&action=' + encodeURIComponent(activityState.action) : ''));
      if (seq !== activityState.seq) return;
      activityState.pages = Math.max(1, Number(d.pages) || 1);
      $('activityPage').textContent = 'Page ' + activityState.page + ' / ' + activityState.pages;
      $('activityPrev').disabled = activityState.page <= 1;
      $('activityNext').disabled = activityState.page >= activityState.pages;
      $('activitySummary').textContent = fmtInt(d.total) + ' action(s) recorded, newest first.';
      $('activityRows').innerHTML = (d.entries || []).map(function (a) {
        var label = lookup(ACTION_LABELS, a.action, humanize(a.action));
        var failed = a.action === 'auth.login_failed';
        var target = a.targetType === 'user' && a.targetId
          ? ' <button type="button" class="link-btn" data-user="' + escapeHtml(a.targetId) + '">View user</button>' : '';
        return '<tr>' +
          '<td><div>' + escapeHtml(fmtDate(a.createdAt)) + '</div><div class="muted">' + escapeHtml(timeAgo(a.createdAt)) + '</div></td>' +
          '<td><div class="who-name">' + escapeHtml(a.adminName || a.adminEmail || 'Unknown') + '</div>' + (a.adminName && a.adminEmail ? '<div class="muted">' + escapeHtml(a.adminEmail) + '</div>' : '') + '</td>' +
          '<td><span class="badge ' + (failed ? 'refund' : 'kind') + '">' + escapeHtml(label) + '</span><div style="margin-top:4px;">' + escapeHtml(a.summary || '') + target + '</div></td>' +
          '<td class="hide-sm mono muted">' + escapeHtml(a.ip || '') + '</td>' +
        '</tr>';
      }).join('') || '<tr><td colspan="4" class="muted">No actions recorded yet.</td></tr>';
      setLine('activityStatus', '');
    } catch (e) {
      if (seq !== activityState.seq) return;
      setLine('activityStatus', e.message, 'err');
    }
  }

  $('activityRows').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-user]') : null;
    if (b) openUserDetail(b.getAttribute('data-user'));
  });
  $('activityFilter').addEventListener('change', function () {
    activityState.action = $('activityFilter').value;
    activityState.page = 1;
    loadActivity();
  });
  $('activityPrev').addEventListener('click', function () {
    if (activityState.page > 1) { activityState.page--; loadActivity(); }
  });
  $('activityNext').addEventListener('click', function () {
    if (activityState.page < activityState.pages) { activityState.page++; loadActivity(); }
  });

  // ── Start ─────────────────────────────────────────────────────────────────
  (async function start() {
    if (!signedIn()) { showAuth(''); return; }
    try {
      var me = await api('/auth/me');
      var s = getSession();
      s.admin = me.admin;
      setSession(s);
      showApp();
    } catch (e) {
      if (e.status === 401) signOut('Your session ended. Sign in again.');
      else { showApp(); setStatus(e.message, 'err'); }
    }
  })();
</script>
</body>
</html>`;
