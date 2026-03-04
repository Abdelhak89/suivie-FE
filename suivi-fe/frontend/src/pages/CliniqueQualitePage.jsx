// src/pages/CliniqueQualitePage.jsx
import { useEffect, useMemo, useState } from "react";
import { PARTICIPANTS, matchesPerson } from "../data/participantsDirectory.js";
import { getAllFE, getFEByNumero, exportCliniqueQualite } from "../services/feApi.js";
import "../styles/app.css";

export default function CliniqueQualitePage() {
  const [annee,   setAnnee]   = useState("2026");
  const [q,       setQ]       = useState("");
  const [loading, setLoading] = useState(false);
  const [items,   setItems]   = useState([]);

  const [selectedNumero, setSelectedNumero] = useState("");
  const [selectedFe,     setSelectedFe]     = useState(null);
  const [qualiticien,    setQualiticien]     = useState("");

  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [picked,      setPicked]      = useState([]);
  const [participantsSansMail, setParticipantsSansMail] = useState("");

  const [busy, setBusy] = useState(false);
  const [ok,   setOk]   = useState(false);

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
    return items.filter((fe) => [fe.numero_fe, fe.code_article, fe.designation, fe.code_lancement].some((v) => v?.toLowerCase().includes(s)));
  }, [items, q]);

  const loadFe = async (num) => {
    if (!num) return;
    setSelectedFe({ loading: true }); setOk(false);
    try {
      const fe = await getFEByNumero(num);
      setSelectedFe(fe);
      setQualiticien(fe?.animateur || "");
    } catch { setSelectedFe({ error: "Impossible de charger" }); }
  };

  const participantsText = useMemo(() => [picked.map((p) => p.name).join("\n"), participantsSansMail.trim()].filter(Boolean).join("\n"), [picked, participantsSansMail]);

  const handleExport = async () => {
    if (!selectedNumero) return;
    setBusy(true); setOk(false);
    try {
      const r = await exportCliniqueQualite(selectedNumero, qualiticien.trim(), participantsText.trim());
      setOk(true);
      alert(`Export créé !\n${r.filename}\n${r.path}`);
      setTimeout(() => setOk(false), 3000);
    } catch (e) { alert(`Erreur : ${e.message}`); }
    finally { setBusy(false); }
  };

  const filteredPeople = useMemo(() => PARTICIPANTS.filter((p) => matchesPerson(p, pickerQuery)).slice(0, 80), [pickerQuery]);
  const isPicked  = (email) => picked.some((x) => x.email === email);
  const toggle    = (p)     => isPicked(p.email) ? setPicked((prev) => prev.filter((x) => x.email !== p.email)) : setPicked((prev) => [...prev, p]);

  return (
    <div className="container">
      <div className="pageHead">
        <div><h2 className="h1">Clinique Qualité (A3 DMAIC)</h2><div className="sub">{loading ? "Chargement…" : `${filtered.length} FE`}</div></div>
        <span className="badge badgeBlue">PPT</span>
      </div>

      <div className="toolbar">
        <div className="field">
          <span className="label">Année</span>
          <select className="select" value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option><option value="">Toutes</option>
          </select>
        </div>
        <input className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° FE / REF / désignation…" />
        <select className="selectWide" value={selectedNumero} onChange={(e) => { setSelectedNumero(e.target.value); loadFe(e.target.value); }}>
          <option value="">— Choisir une FE —</option>
          {filtered.filter((x) => x?.numero_fe).map((o) => (
            <option key={o.numero_fe} value={o.numero_fe}>{o.numero_fe}{o.designation ? ` — ${o.designation}` : ""}</option>
          ))}
        </select>
        <button className="btn btnDark" onClick={handleExport} disabled={!selectedNumero || busy}>
          {busy ? "Génération…" : ok ? "✅ Généré" : "Générer .pptx"}
        </button>
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="panel">
          <div className="panelTitle">Qualiticien</div>
          <input className="input" style={{ width: "100%" }} value={qualiticien} onChange={(e) => setQualiticien(e.target.value)} placeholder="Ex: BLANQUART Nicolas" />
        </div>

        <div className="panel">
          <div className="panelTitle">Participants (avec mail)</div>
          <button className="btn btnPrimary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPickerOpen(true)}>
            Ajouter / Retirer des participants…
          </button>
          <div className="chips">
            {picked.length ? picked.map((p) => (
              <span key={p.email} className="chip">
                {p.name}
                <button className="chipX" onClick={() => toggle(p)}>×</button>
              </span>
            )) : <div className="sub">Aucun participant sélectionné.</div>}
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">Participants sans mail (1 ligne = 1 personne)</div>
          <textarea className="textarea" value={participantsSansMail} onChange={(e) => setParticipantsSansMail(e.target.value)} placeholder={"Nom Prénom\nNom Prénom\n…"} rows={4} />
        </div>
      </div>

      <div className="panel">
        {!selectedNumero ? <div className="sub">Choisis une FE pour voir l'aperçu.</div>
        : selectedFe?.loading ? <div className="sub">Chargement…</div>
        : selectedFe?.error  ? <div style={{ color: "var(--red)", fontWeight: 700 }}>{selectedFe.error}</div>
        : (
          <div className="kv">
            {[
              ["N° FE",         selectedFe?.numero_fe],
              ["REF",           selectedFe?.code_article],
              ["Date création", String(selectedFe?.date_creation || "").slice(0, 10)],
              ["Désignation",   selectedFe?.designation],
              ["Description FE",selectedFe?.data?.["Details de l'anomalie"] || selectedFe?.data?.["Détails de l'anomalie"] || selectedFe?.designation],
            ].map(([k, v]) => (
              <div key={k} className="kvRow">
                <div className="kvKey">{k}</div>
                <div className="kvVal" style={{ whiteSpace: "pre-wrap" }}>{v || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picker modal */}
      {pickerOpen && (
        <div className="modalBackdrop" onMouseDown={() => setPickerOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pageHead" style={{ marginBottom: 10 }}>
              <div>
                <div className="h1" style={{ fontSize: 16 }}>Participants</div>
                <div className="sub">Recherche nom / prénom / service / mail</div>
              </div>
              <button className="btn" onClick={() => setPickerOpen(false)}>Fermer</button>
            </div>
            <input className="input" style={{ width: "100%" }} value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="Ex: sandrine / qualité…" />
            <div className="listBox">
              {filteredPeople.map((p) => (
                <div key={p.email} className={`listItem ${isPicked(p.email) ? "listItemActive" : ""}`} onClick={() => toggle(p)}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="sub">{p.service || ""}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--inkLight)" }}>{p.email}</div>
                </div>
              ))}
            </div>
            <div className="sub" style={{ marginTop: 10 }}>Sélectionnés : {picked.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
