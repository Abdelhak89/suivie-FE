// src/pages/CliniqueQualitePage.jsx
import { useEffect, useMemo, useState } from "react";
import { PARTICIPANTS, matchesPerson } from "../data/participantsDirectory.js";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function CliniqueQualitePage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedFe, setSelectedFe] = useState(null);

  const [qualiticien, setQualiticien] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [picked, setPicked] = useState([]);

  const [participantsSansMail, setParticipantsSansMail] = useState("");

  const [finalFile, setFinalFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedOk, setUploadedOk] = useState(false);

  const [sending, setSending] = useState(false);
  const [mailSubject, setMailSubject] = useState("Compte-rendu Clinique Qualité (PPT)");
  const [mailMessage, setMailMessage] = useState(
    "Bonjour,\n\nVeuillez trouver en pièce jointe le PPT de la clinique qualité.\n\nCordialement,"
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: "1", pageSize: "200" });
    if (annee) params.set("annee", annee);
    if (q.trim()) params.set("q", q.trim());

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch((e) => {
        if (e?.name !== "AbortError") console.error(e);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee, q]);

  const options = useMemo(
    () => (items || []).filter((x) => x?.numero_fe).map((x) => ({ id: x.id, numero_fe: x.numero_fe, designation: x.designation || "" })),
    [items]
  );

  const loadFe = async (id) => {
    if (!id) return;
    setSelectedFe({ loading: true });
    setUploadedOk(false);
    setFinalFile(null);
    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedFe(d);
      setQualiticien(d?.animateur || "");
    } catch {
      setSelectedFe({ error: "Impossible de charger la FE" });
    }
  };

  const onSelectChange = (val) => {
    setSelectedId(val);
    loadFe(val);
  };

  const participantsTextForPpt = useMemo(() => {
    const withMailNames = picked.map((p) => p.name).join("\n");
    const noMail = participantsSansMail.trim();
    return [withMailNames, noMail].filter(Boolean).join("\n");
  }, [picked, participantsSansMail]);

  const downloadPptx = () => {
    if (!selectedId) return;
    const params = new URLSearchParams();
    if (qualiticien.trim()) params.set("qualiticien", qualiticien.trim());
    if (participantsTextForPpt.trim()) params.set("participants", participantsTextForPpt.trim());
    window.open(`${API}/exports/clinique-qualite/${selectedId}.pptx?${params.toString()}`, "_blank");
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

  const uploadFinalPptx = async () => {
    if (!selectedId || !finalFile) return;
    setUploading(true);
    setUploadedOk(false);
    try {
      const fd = new FormData();
      fd.append("pptx", finalFile);

      const r = await fetch(`${API}/clinique-qualite/${selectedId}/final`, { method: "POST", body: fd });
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || "Upload failed");
      setUploadedOk(true);
    } catch (e) {
      alert(`Upload PPTX impossible: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const sendEndMeetingMail = async () => {
    if (!selectedId) return;

    const emails = picked.map((p) => p.email).filter(Boolean);
    if (!emails.length) return alert("Aucun participant avec email sélectionné.");
    if (!uploadedOk) return alert("Upload le PPTX final d’abord (fin de réunion), puis envoie.");

    setSending(true);
    try {
      const r = await fetch(`${API}/clinique-qualite/${selectedId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: mailSubject, message: mailMessage, to: emails }),
      });
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || "Envoi KO");
      alert(`Mail envoyé à ${d.sent || emails.length} personnes`);
    } catch (e) {
      alert(`Envoi mail impossible: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Clinique Qualité (A3 DMAIC)</h2>
          <div className="sub">{loading ? "chargement..." : `${options.length} FE`}</div>
        </div>
        <span className="badge badgeBlue">PPT + Mail fin réunion</span>
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

        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (N° FE / REF / désignation / lancement...)" style={{ maxWidth: 520 }} />

        <select className="select selectWide" value={selectedId} onChange={(e) => onSelectChange(e.target.value)}>
          <option value="">— Choisir une FE —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.numero_fe} {o.designation ? `— ${o.designation}` : ""}
            </option>
          ))}
        </select>

        <button className="btn btnDark" onClick={downloadPptx} disabled={!selectedId}>
          Générer .pptx
        </button>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="panel">
          <div className="label">Qualiticien</div>
          <input className="input" value={qualiticien} onChange={(e) => setQualiticien(e.target.value)} placeholder="Ex: BLANQUART Nicolas" />
        </div>

        <div className="panel">
          <div className="label">Participants (avec mail)</div>
          <button className="btn btnPrimary" onClick={() => setPickerOpen(true)} style={{ width: "100%" }}>
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
          <textarea className="textarea" value={participantsSansMail} onChange={(e) => setParticipantsSansMail(e.target.value)} placeholder={"Nom Prénom\nNom Prénom\n..."} />
        </div>

        <div className="panel">
          <div className="label">Fin de réunion : upload PPTX final</div>
          <input type="file" accept=".pptx" onChange={(e) => setFinalFile(e.target.files?.[0] || null)} />
          <div className="toolbar" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" onClick={uploadFinalPptx} disabled={!selectedId || !finalFile || uploading}>
              {uploading ? "Upload..." : "Uploader le PPTX"}
            </button>
            <span className="badge">{uploadedOk ? "OK ✅" : "—"}</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="pageHead" style={{ marginBottom: 10 }}>
          <div>
            <div className="panelTitle">Envoi mail de fin de réunion</div>
            <div className="sub">Envoie le PPTX uploadé à tous les participants sélectionnés (ceux sans mail ne reçoivent rien).</div>
          </div>
          <button className="btn btnDark" onClick={sendEndMeetingMail} disabled={!selectedId || sending}>
            {sending ? "Envoi..." : "Envoyer le mail"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div className="label">Objet</div>
            <input className="input" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} />
          </div>
          <div>
            <div className="label">Message</div>
            <textarea className="textarea" value={mailMessage} onChange={(e) => setMailMessage(e.target.value)} style={{ minHeight: 120 }} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {!selectedId ? (
          <div className="sub">Choisis une FE pour voir l’aperçu.</div>
        ) : selectedFe?.loading ? (
          <div className="sub">Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div style={{ color: "#b91c1c", fontWeight: 900 }}>{selectedFe.error}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>N° FE</div><div>{selectedFe?.numero_fe || "—"}</div>
            <div style={{ fontWeight: 900 }}>REF</div><div>{selectedFe?.code_article || "—"}</div>
            <div style={{ fontWeight: 900 }}>Date création</div><div>{String(selectedFe?.date_creation || "").slice(0, 10) || "—"}</div>
            <div style={{ fontWeight: 900 }}>Désignation</div><div>{selectedFe?.designation || "—"}</div>
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
