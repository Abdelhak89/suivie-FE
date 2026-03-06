// src/styles/appleTokens.js
// Design tokens Apple — partagés entre toutes les pages

export const T = {
  bg:          "#f5f5f7",
  surface:     "#ffffff",
  surfaceAlt:  "#f5f5f7",
  surfaceHover:"#f0f0f2",
  border:      "rgba(0,0,0,0.08)",
  borderMid:   "rgba(0,0,0,0.12)",
  borderFocus: "#0071e3",
  accent:      "#0071e3",
  accentHover: "#0077ed",
  accentLight: "rgba(0,113,227,0.10)",
  green:       "#30d158",
  greenLight:  "#e8fdf0",
  greenText:   "#1a7a3f",
  orange:      "#ff9f0a",
  orangeLight: "#fff8ed",
  orangeText:  "#b45309",
  red:         "#ff3b30",
  redLight:    "#fff0ef",
  redText:     "#c0392b",
  blue:        "#0071e3",
  blueLight:   "#e8f0fe",
  blueText:    "#1a56a0",
  textPrimary: "#1d1d1f",
  textSecond:  "#6e6e73",
  textLight:   "#aeaeb2",
  font:        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
  fontDisplay: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
  r:           "12px",
  rSm:         "8px",
  rLg:         "16px",
  rXl:         "20px",
  shadow:      "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)",
  shadowMd:    "0 6px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)",
  shadowLg:    "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
};

export const GLOBAL_PAGE_CSS = `
/* ── Reset Apple ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: ${T.font};
  background: ${T.bg};
  color: ${T.textPrimary};
  -webkit-font-smoothing: antialiased;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.14); border-radius: 3px; }

/* ── Input / Select / Textarea ── */
.ap-input, .ap-select, .ap-textarea {
  font-family: ${T.font};
  font-size: 13px;
  color: ${T.textPrimary};
  background: ${T.surfaceAlt};
  border: 1.5px solid ${T.border};
  border-radius: ${T.rSm};
  padding: 8px 11px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
  -webkit-appearance: none;
  appearance: none;
}
.ap-input:focus, .ap-select:focus, .ap-textarea:focus {
  border-color: ${T.borderFocus};
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,113,227,.12);
}
.ap-input::placeholder, .ap-textarea::placeholder { color: ${T.textLight}; }
.ap-textarea { resize: vertical; line-height: 1.5; }
.ap-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23aeaeb2' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  cursor: pointer;
}

/* ── Buttons ── */
.ap-btn {
  font-family: ${T.font};
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: ${T.rSm};
  border: 1.5px solid ${T.border};
  background: ${T.surface};
  color: ${T.textPrimary};
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}
.ap-btn:hover:not(:disabled) { background: ${T.surfaceAlt}; border-color: rgba(0,0,0,.16); }
.ap-btn:disabled { opacity: .4; cursor: not-allowed; }
.ap-btn-primary { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
.ap-btn-primary:hover:not(:disabled) { background: ${T.accentHover}; }
.ap-btn-dark    { background: ${T.textPrimary}; border-color: ${T.textPrimary}; color: #fff; }
.ap-btn-dark:hover:not(:disabled)    { background: #2d2d2f; }
.ap-btn-danger  { background: ${T.redLight}; border-color: ${T.red}; color: ${T.red}; }
.ap-btn-danger:hover:not(:disabled)  { background: #ffe5e3; }
.ap-btn-ghost   { border-color: transparent; background: transparent; color: ${T.textSecond}; }
.ap-btn-ghost:hover:not(:disabled)   { background: ${T.surfaceAlt}; border-color: ${T.border}; }

/* ── Card / Panel ── */
.ap-card {
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  padding: 16px 18px;
  box-shadow: ${T.shadow};
}

/* ── Badge ── */
.ap-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .2px;
  white-space: nowrap;
}
.ap-badge-blue   { background: ${T.blueLight};   color: ${T.blueText}; }
.ap-badge-green  { background: ${T.greenLight};  color: ${T.greenText}; }
.ap-badge-orange { background: ${T.orangeLight}; color: ${T.orangeText}; }
.ap-badge-red    { background: ${T.redLight};    color: ${T.redText}; }
.ap-badge-gray   { background: ${T.surfaceAlt};  color: ${T.textLight}; }

/* ── Table ── */
.ap-table-wrap {
  overflow-x: auto;
  border-radius: ${T.rLg};
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  box-shadow: ${T.shadow};
}
.ap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ap-th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  color: ${T.textSecond};
  text-transform: uppercase;
  letter-spacing: .5px;
  background: ${T.surfaceAlt};
  border-bottom: 1.5px solid ${T.border};
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
}
.ap-td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0,0,0,.04);
  color: ${T.textPrimary};
  vertical-align: middle;
}
.ap-tr-hover { cursor: pointer; transition: background .1s; }
.ap-tr-hover:hover .ap-td { background: #f0f6ff; }
.ap-tr-hover:last-child .ap-td { border-bottom: none; }

/* ── Label ── */
.ap-label {
  font-size: 11px;
  font-weight: 600;
  color: ${T.textSecond};
  letter-spacing: .3px;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}

/* ── Toolbar ── */
.ap-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  margin-bottom: 16px;
  box-shadow: ${T.shadow};
}

/* ── Page header ── */
.ap-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.ap-h1 {
  font-family: ${T.fontDisplay};
  font-size: 22px;
  font-weight: 800;
  color: ${T.textPrimary};
  letter-spacing: -.4px;
}
.ap-sub {
  font-size: 12px;
  color: ${T.textSecond};
  margin-top: 3px;
}

/* ── Radio pill ── */
.ap-rpill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid ${T.border};
  background: ${T.surfaceAlt};
  color: ${T.textSecond};
  transition: all .15s;
  user-select: none;
}
.ap-rpill input { display: none; }
.ap-rpill.active { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }

/* ── Chip checkbox ── */
.ap-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid ${T.border};
  background: ${T.surfaceAlt};
  color: ${T.textSecond};
  transition: all .15s;
  user-select: none;
}
.ap-chip input { display: none; }
.ap-chip.active { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }

/* ── KV pairs ── */
.ap-kv-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,.04);
  align-items: baseline;
}
.ap-kv-row:last-child { border-bottom: none; }
.ap-kv-key {
  font-size: 11px;
  font-weight: 600;
  color: ${T.textSecond};
  text-transform: uppercase;
  letter-spacing: .3px;
}
.ap-kv-val { font-size: 13px; color: ${T.textPrimary}; font-weight: 500; }

/* ── Pagination ── */
.ap-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  font-size: 13px;
  font-weight: 600;
  color: ${T.textSecond};
}

/* ── Stat card ── */
.ap-stat {
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  padding: 16px 18px;
  box-shadow: ${T.shadow};
}
.ap-stat-label {
  font-size: 10.5px;
  font-weight: 700;
  color: ${T.textSecond};
  text-transform: uppercase;
  letter-spacing: .5px;
}
.ap-stat-value {
  font-family: ${T.fontDisplay};
  font-size: 30px;
  font-weight: 800;
  color: ${T.textPrimary};
  letter-spacing: -.5px;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.ap-stat-sub { font-size: 12px; color: ${T.textLight}; margin-top: 4px; }

/* ── Nav card ── */
.ap-nav-card {
  display: block;
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  padding: 16px 18px;
  box-shadow: ${T.shadow};
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: box-shadow .15s, border-color .15s, transform .12s;
}
.ap-nav-card:hover {
  box-shadow: ${T.shadowMd};
  border-color: rgba(0,0,0,.16);
  transform: translateY(-1px);
}

/* ── Section divider ── */
.ap-section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid ${T.border};
}

/* ── Modal backdrop ── */
.ap-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
  backdrop-filter: blur(8px) saturate(160%);
  -webkit-backdrop-filter: blur(8px) saturate(160%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ── Grid utilities ── */
.ap-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.ap-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.ap-grid4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }

/* ── Mono ── */
.ap-mono { font-family: 'DM Mono', 'SF Mono', monospace; }
.ap-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

export function injectGlobalCSS() {
  if (document.getElementById("ap-global-styles")) return;
  const s = document.createElement("style");
  s.id = "ap-global-styles";
  s.textContent = GLOBAL_PAGE_CSS;
  document.head.appendChild(s);
}