// src/utils/compute8DProgress.js
// Partagé entre Analyse8DModal et les pages de liste

export function compute8DProgress(d) {
  if (!d) return 0;
  const p = arr => Math.round((arr.filter(Boolean).length / arr.length) * 100);
  const actionsRemplies = (d.actions||[]).filter(a => a.description?.trim());
  const scores = {
    3: p([d.actions_immediates?.length>0, !!d.responsable_immediat, !!d.date_immediat]),
    4: p([!!d.ilot, Object.values(d.causes_6m||{}).some(f => f.selected?.length>0||f.autre)]),
    5: p([(d.why_apparition||[]).some(w=>w?.trim()), (d.why_non_detection||[]).some(w=>w?.trim())]),
    6: actionsRemplies.length===0 ? 0 : p([actionsRemplies.length>0, actionsRemplies.every(a=>a.responsable?.trim())]),
    7: p([!!d.methode_verif, !!d.resultat_verif, !!d.date_verif]),
    8: p([!!d.responsable_qualite, !!d.date_cloture, !!d.recurrente]),
  };
  return Math.round(Object.values(scores).reduce((a,b)=>a+b,0) / Object.keys(scores).length);
}

export function parse8DData(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(String(raw)); } catch { return null; }
}