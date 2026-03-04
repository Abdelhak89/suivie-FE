// src/pages/AlerteQualitePage.jsx
import { useEffect, useMemo, useState } from "react";
import { getAllFE, getFEByNumero, exportAlerteQualite } from "../services/feApi.js";
import "../styles/app.css";

function toIsoShort(v) {
  if (!v) return "";
  const s = String(v).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  return isNaN(d) ? s : d.toISOString().slice(0, 10);
}

function getDesc(fe) {
  const d = fe?.data;
  if (!d || typeof d !== "object") return "";
  return d["Details de l'anomalie"] || d["Détails de l'anomalie"] || d["Detail de l'anomalie"] || "";
}

export default function AlerteQualitePage() {
  const [annee,   setAnnee]   = useState("2026");
  const [q,       setQ]       = useState("");
  const [loading, setLoading] = useState(false);
  const [items,   setItems]   = useState([]);
  const [selectedNumero, setSelectedNumero] = useState("");
  const [selectedFe,     setSelectedFe]     = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [ok,      setOk]      = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getAllFE({ annee: annee || null, limit: 200 })
      .then((r) => { if (!ctrl.signal.aborted) setItems(r.items || []); })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [annee]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((fe) =>
      [fe.numero_fe, fe.code_article, fe.designation, fe.code_lancement]
        .some((v) => v?.toLowerCase().includes(s))
    );
  }, [items, q]);

  const loadFe = async (num) => {
    if (!num) return;
    setSelectedFe({ loading: true });
    setOk(false);
    try { setSelectedFe(await getFEByNumero(num)); }
    catch { setSelectedFe({ error: "Impossible de charger" }); }
  };

  const handleExport = async () => {
    if (!selectedNumero) return;
    setBusy(true); setOk(false);
    try {
      const r = await exportAlerteQualite(selectedNumero);
      setOk(true);
      alert(`Export créé !\n${r.filename}\n${r.path}`);
      setTimeout(() => setOk(false), 3000);
    } catch (e) { alert(`Erreur : ${e.message}`); }
    finally { setBusy(false); }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div><h2 className="h1">Alerte Qualité</h2><div className="sub">{loading ? "Chargement…" : `${filtered.length} FE`}</div></div>
        <span className="badge badgeBlue">Export XLSX</span>
      </div>

      <div className="toolbar">
        <div className="field">
          <span className="label">Année</span>
          <select className="select" value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option><option value="">Toutes</option>
          </select>
        </div>
        <input className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° FE / REF / désignation / lancement…" />
        <select className="selectWide" value={selectedNumero} onChange={(e) => { setSelectedNumero(e.target.value); loadFe(e.target.value); }}>
          <option value="">— Choisir une FE —</option>
          {filtered.filter((x) => x?.numero_fe).map((o) => (
            <option key={o.numero_fe} value={o.numero_fe}>{o.numero_fe}{o.designation ? ` — ${o.designation.slice(0, 40)}` : ""}</option>
          ))}
        </select>
        <button className="btn btnDark" onClick={handleExport} disabled={!selectedNumero || busy}>
          {busy ? "Génération…" : ok ? "✅ Généré" : "Générer .xlsx"}
        </button>
      </div>

      <div className="panel">
        {!selectedNumero ? <div className="sub">Choisis une FE pour afficher l'aperçu.</div>
        : selectedFe?.loading ? <div className="sub">Chargement…</div>
        : selectedFe?.error  ? <div style={{ color: "var(--red)", fontWeight: 700 }}>{selectedFe.error}</div>
        : (
          <div className="kv">
            {[
              ["N° FE",        selectedFe?.numero_fe],
              ["REF",          selectedFe?.code_article],
              ["Désignation",  selectedFe?.designation],
              ["Lancement",    selectedFe?.code_lancement],
              ["Date",         toIsoShort(selectedFe?.date_creation)],
              ["Lieu détection",selectedFe?.lieu_detection],
              ["Description",  getDesc(selectedFe)],
            ].map(([k, v]) => (
              <div key={k} className="kvRow">
                <div className="kvKey">{k}</div>
                <div className="kvVal" style={{ whiteSpace: "pre-wrap" }}>{v || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
