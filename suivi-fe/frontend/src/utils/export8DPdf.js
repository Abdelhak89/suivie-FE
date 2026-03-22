// src/utils/export8DPdf.js
// Génère un HTML imprimable pour le 8D et déclenche window.print()
// Usage : export8DPdf(data, fe, membres)

export function export8DPdf(data, fe, membres = []) {
  const feNum  = fe?.numero_fe || "NC";
  const feDesc = fe?.designation || "";
  const feArt  = fe?.designation_article || fe?.code_article || "";
  const today  = new Date().toLocaleDateString("fr-FR");

  const outils = data.outils_analyse || {};
  const useIshikawa = outils.ishikawa === true;
  const use5P       = outils.cinq_pourquoi === true;

  // ── Causes 6M ───────────────────────────────────────────────
  const causes6mHtml = Object.entries(data.causes_6m || {}).map(([f, v]) => {
    const items = [...(v.selected || []), v.autre ? `Autre : ${v.autre}` : null].filter(Boolean);
    if (!items.length) return "";
    return `<div class="cause-famille"><strong>${f}</strong><ul>${items.map(i=>`<li>${i}</li>`).join("")}</ul></div>`;
  }).join("");

  // ── Actions plan ─────────────────────────────────────────────
  const actionsHtml = (data.actions || []).map((a, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${a.description || "—"}</td>
      <td>${a.type || "—"}</td>
      <td>${a.responsable || "—"}</td>
      <td>${a.echeance || "—"}</td>
      <td class="statut-${(a.statut||"").toLowerCase().replace(/\s/g,"-")}">${a.statut || "—"}</td>
    </tr>`).join("");

  // ── Membres groupe de travail ─────────────────────────────────
  const membresHtml = membres.length
    ? `<table><thead><tr><th>Prénom</th><th>Nom</th><th>Rôle</th><th>Site</th><th>Email</th></tr></thead><tbody>
        ${membres.map(m=>`<tr><td>${m.prenom}</td><td>${m.nom}</td><td>${m.role||"—"}</td><td>${m.site||"—"}</td><td>${m.email||"—"}</td></tr>`).join("")}
      </tbody></table>`
    : "<p>Aucun membre enregistré</p>";

  // ── Photos ───────────────────────────────────────────────────
  const photosHtml = (data.photos || []).map(src =>
    `<img src="${src}" style="width:120px;height:90px;object-fit:cover;border-radius:6px;margin:4px;border:1px solid #ddd;">`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Analyse 8D — ${feNum}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif; font-size:12px; color:#1d1d1f; padding:20mm; line-height:1.5; }
    h1 { font-size:20px; font-weight:800; color:#0071e3; margin-bottom:4px; }
    h2 { font-size:13px; font-weight:700; color:#0071e3; text-transform:uppercase; letter-spacing:.5px; margin:20px 0 8px; padding:6px 10px; background:#eef4ff; border-left:3px solid #0071e3; border-radius:4px; }
    h3 { font-size:11px; font-weight:700; color:#6e6e73; text-transform:uppercase; letter-spacing:.4px; margin:12px 0 6px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0071e3; padding-bottom:12px; margin-bottom:20px; }
    .header-left h1 { font-size:22px; }
    .header-right { text-align:right; font-size:11px; color:#6e6e73; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
    .meta-item { padding:8px 12px; background:#f5f5f7; border-radius:6px; }
    .meta-item label { font-size:10px; font-weight:700; color:#6e6e73; text-transform:uppercase; display:block; margin-bottom:2px; }
    .meta-item span { font-size:12px; font-weight:600; }
    .section { margin-bottom:20px; page-break-inside:avoid; }
    table { width:100%; border-collapse:collapse; margin-top:8px; font-size:11px; }
    th { background:#f5f5f7; padding:6px 8px; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; color:#6e6e73; border:1px solid #e5e5e5; }
    td { padding:6px 8px; border:1px solid #e5e5e5; vertical-align:top; }
    tr:nth-child(even) td { background:#fafafa; }
    .statut-terminé { color:#1a7a3f; font-weight:700; }
    .statut-en-cours { color:#b45309; font-weight:700; }
    .statut-à-faire { color:#6e6e73; }
    .statut-non-réalisable { color:#ff3b30; }
    .skipped { color:#aeaeb2; font-style:italic; padding:8px 12px; background:#f5f5f7; border-radius:6px; }
    .cause-famille { margin-bottom:8px; }
    .cause-famille ul { margin-left:16px; margin-top:4px; }
    .cause-famille li { font-size:11px; color:#1d1d1f; margin-bottom:2px; }
    .photos { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
    .why-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .why-block { padding:10px; border-radius:6px; }
    .why-block.apparition { background:#fff5f5; border:1px solid rgba(255,59,48,.2); }
    .why-block.non-detection { background:#fffbf0; border:1px solid rgba(255,159,10,.2); }
    .why-block h4 { font-size:11px; font-weight:700; margin-bottom:6px; }
    .why-item { display:flex; gap:6px; margin-bottom:4px; font-size:11px; }
    .why-num { width:18px; height:18px; border-radius:4px; background:#ff3b30; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0; }
    .why-num.nd { background:#ff9f0a; }
    .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; }
    .badge-green { background:#e8fdf0; color:#1a7a3f; }
    .badge-orange { background:#fff8ed; color:#b45309; }
    .badge-blue { background:#eef4ff; color:#0071e3; }
    .footer { margin-top:30px; padding-top:12px; border-top:1px solid #e5e5e5; font-size:10px; color:#aeaeb2; display:flex; justify-content:space-between; }
    @media print { body { padding:15mm; } }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>Analyse 8D</h1>
      <div style="font-size:16px;font-weight:700;color:#1d1d1f;margin-top:4px;">FE ${feNum}</div>
      ${feDesc ? `<div style="font-size:12px;color:#6e6e73;margin-top:2px;">${feDesc}</div>` : ""}
      ${feArt  ? `<div style="font-size:11px;color:#aeaeb2;font-family:monospace;">Article : ${feArt}</div>` : ""}
    </div>
    <div class="header-right">
      <div style="font-size:18px;font-weight:800;color:#0071e3;">KEP METAL</div>
      <div>Édité le ${today}</div>
      <div style="margin-top:6px;">
        <span class="badge ${data.responsable_qualite ? "badge-green" : "badge-orange"}">
          ${data.responsable_qualite ? "✓ " + data.responsable_qualite : "En cours"}
        </span>
      </div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>Description du défaut</label><span>${data.description_defaut || "—"}</span></div>
    <div class="meta-item"><label>Responsable immédiat</label><span>${data.responsable_immediat || "—"}</span></div>
    <div class="meta-item"><label>Date action immédiate</label><span>${data.date_immediat || "—"}</span></div>
    <div class="meta-item"><label>NC récurrente</label><span>${data.recurrente || "—"}</span></div>
  </div>

  ${data.description_defaut || data.photos?.length ? `
  <div class="section">
    <h2>D1–D2 · Contexte & Défaut</h2>
    <p style="margin-bottom:8px;">${data.description_defaut || "—"}</p>
    ${photosHtml ? `<div class="photos">${photosHtml}</div>` : ""}
  </div>` : ""}

  <div class="section">
    <h2>D3 · Actions immédiates</h2>
    ${data.actions_immediates?.length ? `<ul style="margin-left:16px;">${data.actions_immediates.map(a=>`<li>${a}</li>`).join("")}</ul>` : "<p>—</p>"}
    ${data.action_immediate_autre ? `<p style="margin-top:6px;"><em>Autre : ${data.action_immediate_autre}</em></p>` : ""}
  </div>

  <div class="section">
    <h2>D4 · Analyse Ishikawa (6M)</h2>
    ${useIshikawa ? (data.ilot ? `<p><strong>Îlot :</strong> ${data.ilot}</p>` : "") + (causes6mHtml || "<p>—</p>") : `<div class="skipped">Non utilisé pour cette analyse</div>`}
  </div>

  <div class="section">
    <h2>D5 · 5 Pourquoi</h2>
    ${use5P ? `
    <div class="why-grid">
      <div class="why-block apparition">
        <h4 style="color:#ff3b30;">Causes d'apparition</h4>
        ${data.why_apparition?.filter(Boolean).map((w,i)=>`<div class="why-item"><div class="why-num">${i+1}</div><span>${w}</span></div>`).join("") || "<p style='font-size:11px;color:#aeaeb2;'>—</p>"}
        ${data.cause_racine_apparition ? `<div style="margin-top:8px;padding:6px;background:#e8fdf0;border-radius:4px;font-size:11px;"><strong>Cause racine :</strong> ${data.cause_racine_apparition}</div>` : ""}
      </div>
      <div class="why-block non-detection">
        <h4 style="color:#ff9f0a;">Causes de non-détection</h4>
        ${data.why_non_detection?.filter(Boolean).map((w,i)=>`<div class="why-item"><div class="why-num nd">${i+1}</div><span>${w}</span></div>`).join("") || "<p style='font-size:11px;color:#aeaeb2;'>—</p>"}
      </div>
    </div>` : `<div class="skipped">Non utilisé pour cette analyse</div>`}
  </div>

  <div class="section">
    <h2>D6 · Plan d'action</h2>
    <table>
      <thead><tr><th>#</th><th>Description</th><th>Type</th><th>Responsable</th><th>Échéance</th><th>Statut</th></tr></thead>
      <tbody>${actionsHtml || `<tr><td colspan="6" style="text-align:center;color:#aeaeb2;">Aucune action</td></tr>`}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>D7 · Vérification d'efficacité</h2>
    <div style="display:flex;gap:20px;">
      <div><strong>Méthode :</strong> ${data.methode_verif || "—"}</div>
      <div><strong>Résultat :</strong> <span class="${data.resultat_verif==="Efficace"?"badge badge-green":"badge badge-orange"}">${data.resultat_verif || "—"}</span></div>
      <div><strong>Date :</strong> ${data.date_verif || "—"}</div>
    </div>
  </div>

  <div class="section">
    <h2>D8 · Clôture</h2>
    <div style="display:flex;gap:20px;">
      <div><strong>Responsable Qualité :</strong> ${data.responsable_qualite || "—"}</div>
      <div><strong>Date clôture :</strong> ${data.date_cloture || "—"}</div>
      <div><strong>NC récurrente :</strong> ${data.recurrente || "—"}</div>
    </div>
  </div>

  <div class="section">
    <h2>👥 Groupe de travail</h2>
    ${membresHtml}
  </div>

  <div class="footer">
    <span>Suivi FE · KEP METAL</span>
    <span>FE ${feNum} · Analyse 8D · ${today}</span>
    <span>Confidentiel interne</span>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}