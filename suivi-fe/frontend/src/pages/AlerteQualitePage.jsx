// src/pages/AlerteQualitePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getDescFromFe(fe) {
  const data = fe?.data;
  if (!data || typeof data !== "object") return "";
  return (
    data["Details de l'anomalie"] ||
    data["Détails de l'anomalie"] ||
    data["Detail de l'anomalie"] ||
    data["Détail de l'anomalie"] ||
    ""
  );
}

function toIsoShort(v) {
  if (!v) return "";
  const s = String(v).trim();
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

export default function AlerteQualitePage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedFe, setSelectedFe] = useState(null);

  const fileRef = useRef(null);
  const [imgStatus, setImgStatus] = useState("");

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
    () => (items || []).filter((x) => x?.numero_fe).map((x) => ({ id: x.id, numero_fe: x.numero_fe })),
    [items]
  );

  const loadFe = async (id) => {
    if (!id) return;
    setSelectedFe({ loading: true });
    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedFe(d);
    } catch {
      setSelectedFe({ error: "Impossible de charger la FE" });
    }
  };

  const onSelectChange = (val) => {
    setSelectedId(val);
    setImgStatus("");
    loadFe(val);
  };

  const openXlsx = () => selectedId && window.open(`${API}/exports/alerte-qualite/${selectedId}.xlsx`, "_blank");
  const onPickImage = () => selectedId && fileRef.current?.click();

  const uploadImage = async (file) => {
    if (!selectedId || !file) return;
    setImgStatus("upload...");
    try {
      const fd = new FormData();
      fd.append("image", file);

      const r = await fetch(`${API}/exports/alerte-qualite/${selectedId}/image`, { method: "POST", body: fd });
      const d = await r.json();

      if (!d?.ok) {
        setImgStatus("error");
        alert(d?.error || "Erreur upload image");
        return;
      }
      setImgStatus("ok");
    } catch (e) {
      console.error(e);
      setImgStatus("error");
      alert("Erreur upload image");
    }
  };

  const descPreview = selectedFe?.loading || selectedFe?.error ? "" : getDescFromFe(selectedFe);

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Alerte qualité</h2>
          <div className="sub">{loading ? "chargement..." : `${options.length} FE`}</div>
        </div>
        <span className="badge badgeBlue">Export XLSX</span>
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

        <select className="selectWide select" value={selectedId} onChange={(e) => onSelectChange(e.target.value)}>
          <option value="">— Choisir une FE —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.numero_fe}
            </option>
          ))}
        </select>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => uploadImage(e.target.files?.[0])}
        />

        <button className="btn btnPrimary" onClick={onPickImage} disabled={!selectedId} title="Uploader une image">
          Ajouter image{imgStatus === "upload..." ? "…" : imgStatus === "ok" ? " ✅" : imgStatus === "error" ? " ❌" : ""}
        </button>

        <button className="btn btnDark" onClick={openXlsx} disabled={!selectedId}>
          Générer .xlsx
        </button>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {!selectedId ? (
          <div className="sub">Choisis une FE pour afficher l’aperçu.</div>
        ) : selectedFe?.loading ? (
          <div className="sub">Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div style={{ color: "#b91c1c", fontWeight: 800 }}>{selectedFe.error}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>N° FE</div><div>{selectedFe?.numero_fe || "—"}</div>
            <div style={{ fontWeight: 900 }}>REF</div><div>{selectedFe?.code_article || "—"}</div>
            <div style={{ fontWeight: 900 }}>Désignation</div><div>{selectedFe?.designation || "—"}</div>
            <div style={{ fontWeight: 900 }}>Lancement</div><div>{selectedFe?.code_lancement || "—"}</div>
            <div style={{ fontWeight: 900 }}>Date</div><div>{toIsoShort(selectedFe?.date_creation || "") || "—"}</div>
            <div style={{ fontWeight: 900 }}>Lieu détection</div><div>{selectedFe?.lieu_detection || "—"}</div>
            <div style={{ fontWeight: 900 }}>Description</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{descPreview || "—"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
