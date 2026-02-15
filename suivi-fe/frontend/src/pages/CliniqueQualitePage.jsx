// src/pages/CliniqueQualitePage.jsx - VERSION ADAPTÉE
import { useEffect, useMemo, useState } from "react";
import { PARTICIPANTS, matchesPerson } from "../data/participantsDirectory.js";
import { getAllFE, getFEByNumero, exportCliniqueQualite } from "../services/feApi.js";
import "../styles/app.css";

export default function CliniqueQualitePage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedNumero, setSelectedNumero] = useState("");
  const [selectedFe, setSelectedFe] = useState(null);

  const [qualiticien, setQualiticien] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [picked, setPicked] = useState([]);

  const [participantsSansMail, setParticipantsSansMail] = useState("");

  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getAllFE({
          annee: annee || null,
          limit: 200
        });
        
        if (!ctrl.signal.aborted) {
          setItems(result.items || []);
        }
      } catch (error) {
        if (!ctrl.signal.aborted) {
          console.error("Erreur chargement FE:", error);
        }
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => ctrl.abort();
  }, [annee, q]);

  const filteredItems = useMemo(() => {
    if (!q.trim()) return items;
    const search = q.toLowerCase();
    return items.filter(fe => 
      fe.numero_fe?.toLowerCase().includes(search) ||
      fe.code_article?.toLowerCase().includes(search) ||
      fe.designation?.toLowerCase().includes(search) ||
      fe.code_lancement?.toLowerCase().includes(search)
    );
  }, [items, q]);

  const options = useMemo(
    () => filteredItems.filter(x => x?.numero_fe).map(x => ({ 
      numero_fe: x.numero_fe, 
      designation: x.designation || "" 
    })),
    [filteredItems]
  );

  const loadFe = async (numeroFE) => {
    if (!numeroFE) return;
    setSelectedFe({ loading: true });
    setExportSuccess(false);
    
    try {
      const fe = await getFEByNumero(numeroFE);
      setSelectedFe(fe);
      setQualiticien(fe?.animateur || "");
    } catch (error) {
      setSelectedFe({ error: "Impossible de charger la FE" });
    }
  };

  const onSelectChange = (val) => {
    setSelectedNumero(val);
    loadFe(val);
  };

  const participantsTextForPpt = useMemo(() => {
    const withMailNames = picked.map((p) => p.name).join("\n");
    const noMail = participantsSansMail.trim();
    return [withMailNames, noMail].filter(Boolean).join("\n");
  }, [picked, participantsSansMail]);

  const downloadPptx = async () => {
    if (!selectedNumero) return;
    
    setExportLoading(true);
    setExportSuccess(false);
    
    try {
      const result = await exportCliniqueQualite(
        selectedNumero,
        qualiticien.trim(),
        participantsTextForPpt.trim()
      );
      
      setExportSuccess(true);
      alert(`Export créé avec succès !\n\nFichier : ${result.filename}\nChemin : ${result.path}`);
      
      // Auto-reset après 3 secondes
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Erreur export:", error);
      alert(`Erreur lors de l'export : ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const filteredPeople = useMemo(
    () => PARTICIPANTS.filter((p) => matchesPerson(p, pickerQuery)).slice(0, 80),
    [pickerQuery]
  );

  const isPicked = (email) => picked.some((x) => x.email === email);

  const togglePick = (p) => {
    if (isPicked(p.email)) setPicked((prev) => prev.filter((x) => x.email !== p.email));
    else setPicked((prev) => [...prev, p]);
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Clinique Qualité (A3 DMAIC)</h2>
          <div className="sub">{loading ? "chargement..." : `${options.length} FE`}</div>
        </div>
        <span className="badge badgeBlue">PPT</span>
      </div>

      <div className="toolbar">
        <div className="field">
          <span className="label">Année :</span>
          <select className="select" value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>
        </div>

        <input 
          className="input" 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="Rechercher (N° FE / REF / désignation / lancement...)" 
          style={{ maxWidth: 520 }} 
        />

        <select 
          className="select selectWide" 
          value={selectedNumero} 
          onChange={(e) => onSelectChange(e.target.value)}
        >
          <option value="">— Choisir une FE —</option>
          {options.map((o) => (
            <option key={o.numero_fe} value={o.numero_fe}>
              {o.numero_fe} {o.designation ? `— ${o.designation}` : ""}
            </option>
          ))}
        </select>

        <button 
          className="btn btnDark" 
          onClick={downloadPptx} 
          disabled={!selectedNumero || exportLoading}
        >
          {exportLoading ? "Génération..." : exportSuccess ? "✅ Généré" : "Générer .pptx"}
        </button>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="panel">
          <div className="label">Qualiticien</div>
          <input 
            className="input" 
            value={qualiticien} 
            onChange={(e) => setQualiticien(e.target.value)} 
            placeholder="Ex: BLANQUART Nicolas" 
          />
        </div>

        <div className="panel">
          <div className="label">Participants (avec mail)</div>
          <button 
            className="btn btnPrimary" 
            onClick={() => setPickerOpen(true)} 
            style={{ width: "100%" }}
          >
            Ajouter / Retirer des participants…
          </button>

          <div className="chips">
            {picked.length ? (
              picked.map((p) => (
                <span key={p.email} className="chip">
                  {p.name}
                  <button className="chipX" onClick={() => togglePick(p)} title="Retirer">×</button>
                </span>
              ))
            ) : (
              <div className="sub">Aucun participant sélectionné.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="label">Participants sans mail (1 ligne = 1 personne)</div>
          <textarea 
            className="textarea" 
            value={participantsSansMail} 
            onChange={(e) => setParticipantsSansMail(e.target.value)} 
            placeholder={"Nom Prénom\nNom Prénom\n..."} 
          />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {!selectedNumero ? (
          <div className="sub">Choisis une FE pour voir l'aperçu.</div>
        ) : selectedFe?.loading ? (
          <div className="sub">Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div style={{ color: "#b91c1c", fontWeight: 900 }}>{selectedFe.error}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>N° FE</div>
            <div>{selectedFe?.numero_fe || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>REF</div>
            <div>{selectedFe?.code_article || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Date création</div>
            <div>{String(selectedFe?.date_creation || "").slice(0, 10) || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Désignation</div>
            <div>{selectedFe?.designation || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Description FE</div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {selectedFe?.data?.["Details de l'anomalie"] ||
                selectedFe?.data?.["Détails de l'anomalie"] ||
                selectedFe?.designation ||
                "—"}
            </div>
          </div>
        )}
      </div>

      {pickerOpen ? (
        <div className="modalBackdrop" onMouseDown={() => setPickerOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pageHead" style={{ marginBottom: 0 }}>
              <div>
                <div className="panelTitle">Participants</div>
                <div className="sub">Recherche nom / prénom / service / mail</div>
              </div>
              <button className="btn" onClick={() => setPickerOpen(false)}>Fermer</button>
            </div>

            <input
              className="input"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Ex: sandrine / qualité / labedie..."
              style={{ marginTop: 10 }}
            />

            <div className="listBox">
              {filteredPeople.map((p) => {
                const active = isPicked(p.email);
                return (
                  <div
                    key={p.email}
                    onClick={() => togglePick(p)}
                    className={`listItem ${active ? "listItemActive" : ""}`}
                  >
                    <div>
                      <div style={{ fontWeight: 950 }}>{p.name}</div>
                      <div style={{ opacity: 0.85, fontSize: 12 }}>{p.service || ""}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, opacity: 0.9 }}>{p.email}</div>
                  </div>
                );
              })}
            </div>

            <div className="sub" style={{ marginTop: 10 }}>Sélectionnés : {picked.length}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
