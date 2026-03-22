// src/pages/InterneFAI.jsx
import { useEffect, useMemo, useState } from "react";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import { getAllFE } from "../services/feApi.js";
import { useAppFE } from "../hooks/useAppFE.js";
import SourceToggle from "../components/SourceToggle.jsx";
import { getClientNameFromCode } from "../data/clients.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import Badge8D from "../components/Badge8D.jsx";
import { useAnalyses8D } from "../hooks/useAnalyses8D.js";
import { getSiteFromJWT } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const FAI_CSS = `
.fai-tabs {
  display: flex; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px);
  border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden;
  margin-bottom: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.fai-tab {
  flex: 1; padding: 12px 20px; border: none; border-right: 1px solid rgba(0,0,0,0.07);
  background: transparent; font-family: -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
  font-size: 13px; font-weight: 500; color: #6e6e73; cursor: pointer;
  transition: background .12s, color .12s; text-align: center;
}
.fai-tab:last-child { border-right: none; }
.fai-tab:hover { background: rgba(0,0,0,0.03); }
.fai-tab.active { background: rgba(0,113,227,0.10); color: #0071e3; font-weight: 700; }
.fai-table-wrap {
  overflow-x: auto; border-radius: 14px; background: #fff;
  border: 1.5px solid rgba(0,0,0,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.fai-table { width: 100%; border-collapse: collapse; font-size: 13px; font-family: -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif; }
.fai-th {
  padding: 11px 14px; text-align: left; font-size: 10.5px; font-weight: 700;
  color: #6e6e73; text-transform: uppercase; letter-spacing: .5px;
  background: #f5f5f7; border-bottom: 1.5px solid rgba(0,0,0,0.08); white-space: nowrap;
}
.fai-td { padding: 13px 14px; border-bottom: 1px solid rgba(0,0,0,0.04); vertical-align: middle; color: #1d1d1f; }
.fai-row { transition: background .1s; }
.fai-row:hover .fai-td { background: #f5f8ff; }
.fai-row:last-child .fai-td { border-bottom: none; }
.fai-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  padding: 12px 16px; background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
  border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.eff-toggle {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
  border-radius: 20px; font-size: 11.5px; font-weight: 600; cursor: pointer;
  border: 1.5px solid; transition: all .15s; user-select: none; white-space: nowrap;
}
.eff-toggle.oui     { background: #e8fdf0; border-color: #30d158; color: #1a7a3f; }
.eff-toggle.non     { background: #fff0f0; border-color: #ff3b30; color: #c0392b; }
.eff-toggle.pending { background: #f5f5f7; border-color: rgba(0,0,0,.10); color: #aeaeb2; }
.cloture-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
  border-radius: 8px; font-size: 11.5px; font-weight: 600; cursor: pointer;
  border: 1.5px solid; transition: all .15s;
  font-family: -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif; white-space: nowrap;
}
.cloture-btn.done    { background: #e8fdf0; border-color: #30d158; color: #1a7a3f; cursor: default; }
.cloture-btn.ready   { background: #1d1d1f; border-color: #1d1d1f; color: #fff; }
.cloture-btn.ready:hover { background: #2d2d2f; }
.cloture-btn.blocked { background: #f5f5f7; border-color: rgba(0,0,0,.08); color: #aeaeb2; cursor: not-allowed; opacity: .6; }
.lct-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px;
  border-radius: 8px; font-size: 11.5px; font-weight: 600; cursor: pointer;
  border: 1.5px solid rgba(255,159,10,.35); background: #fff8ed; color: #b45309;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
.lct-btn:hover { background: #ffefd0; border-color: #ff9f0a; }
.lct-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px); display: flex; align-items: center;
  justify-content: center; z-index: 1200;
}
.lct-modal {
  background: #fff; border-radius: 20px; width: min(820px, 95vw); max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 32px 80px rgba(0,0,0,0.22); overflow: hidden;
}
.lct-modal-head {
  padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.08);
  display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0;
}
.lct-modal-body { flex: 1; overflow-y: auto; padding: 18px 24px 24px; }
.lct-row-sel { background: rgba(0,113,227,0.06) !important; }
.lct-row-sel .fai-td { background: rgba(0,113,227,0.06) !important; }
.mail-box {
  background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 16px 18px; font-size: 13px; line-height: 1.75; color: #1d1d1f;
  white-space: pre-wrap; font-family: -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif; margin-top: 12px;
}
.fai-confirm {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  backdrop-filter: blur(6px); display: flex; align-items: center;
  justify-content: center; z-index: 9999;
}
.fai-confirm-box {
  background: #fff; border-radius: 18px; padding: 28px 32px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.22); max-width: 400px; width: 90vw;
  font-family: -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
}
.empl-pill {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px;
  border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid; white-space: nowrap;
}
.empl-pill.prison  { background: #fff0f0; border-color: rgba(255,59,48,.3); color: #c0392b; }
.empl-pill.normal  { background: #f0f5ff; border-color: rgba(0,113,227,.2); color: #0051a8; }
.empl-pill.unknown { background: #f5f5f7; border-color: rgba(0,0,0,.08); color: #aeaeb2; }
`;

const GRAVITE_BADGE = {
  mineur: "ap-badge-green",
  majeur: "ap-badge-orange",
  critique: "ap-badge-red",
};
const STATUT_BADGE = {
  ouvert: "ap-badge-blue",
  en_cours: "ap-badge-orange",
  clos: "ap-badge-green",
};

function is8DComplete(fe) {
  try {
    const p = JSON.parse(fe.analyse_8d || "");
    return !!(p?.responsable_qualite && p?.date_cloture);
  } catch {
    return false;
  }
}

function clientFromFE(fe) {
  const prefix = (fe.code_article || "").slice(0, 3);
  return { code: prefix, name: getClientNameFromCode(prefix) || prefix || "—" };
}

function EmplacementCell({ lct }) {
  const zone = (lct.ZoneMagasin || "").trim();
  const rawDetail = (lct.EmplacementStock || "").trim();
  const principal = (lct.AdressePrecise || "").trim();
  const pills = rawDetail
    ? rawDetail
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean)
    : principal
      ? [principal]
      : [];
  const hasPrison =
    pills.some((p) => p.toUpperCase().includes("PRISON")) ||
    zone.toUpperCase().includes("PRISON");
  if (!pills.length && !zone)
    return <span className="empl-pill unknown">NON LOCALISÉ</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {zone && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: hasPrison ? "#ff3b30" : "#6e6e73",
            textTransform: "uppercase",
            letterSpacing: ".4px",
          }}
        >
          📦 {zone}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {pills.map((pill, i) => {
          const isPrison = pill.toUpperCase().includes("PRISON");
          return (
            <span
              key={i}
              className={`empl-pill ${isPrison ? "prison" : "normal"}`}
            >
              {isPrison ? "🔒 " : ""}
              {pill}
            </span>
          );
        })}
      </div>
    </div>
  );
}

async function fetchLancements(codeArticle) {
  if (!codeArticle) return [];
  try {
    const r = await fetch(
      `${API}/api/lancements?code_article=${encodeURIComponent(codeArticle)}&limit=30`,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return d.data || [];
  } catch {
    return [];
  }
}

function buildMail(fe, lct) {
  const numFE = fe?.numero_fe || "SOUXXXXXX";
  const numLct = fe?.code_lancement || "LSXXXXXX";
  const newLct = lct?.CodeLancement || "LSxxxxxxx";
  return `Bonjour,

Suite à la non‑conformité N° ${numFE} concernant le ${numLct} (lancement en NC), il apparaît que le DVI n'est pas complet. Notre client demande désormais la réalisation d'un nouveau DVI sur le ${newLct}.

📌 INDUS : pouvez-vous procéder au blocage du lancement en DVI ?
📌 Gestionnaire de flux : pouvez-vous réévaluer les délais de livraison, en intégrant le temps nécessaire à la réalisation et à la validation du nouveau DVI ?

Merci pour votre retour.`;
}

function LctStatutBadge({ lct }) {
  const termine = lct?.LctTermine === "O" || lct?.LancementSolde === "O";
  const poste = lct?.CodePosteEnCours;
  if (termine) return <span className="ap-badge ap-badge-green">Terminé</span>;
  if (poste)
    return <span className="ap-badge ap-badge-orange">En cours · {poste}</span>;
  return <span className="ap-badge ap-badge-gray">Non démarré</span>;
}

function LancementModal({ fe, onClose }) {
  const [lcts, setLcts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selLct, setSelLct] = useState(null);

  useEffect(() => {
    fetchLancements(fe?.code_article)
      .then(setLcts)
      .catch(() => setLcts([]))
      .finally(() => setLoading(false));
  }, [fe?.code_article]);

  const mail = buildMail(fe, selLct);
  const client = clientFromFE(fe);

  const openMailto = () => {
    const subj = encodeURIComponent(
      `DVI incomplet — FE ${fe?.numero_fe || ""} — ${selLct?.CodeLancement || ""}`,
    );
    const body = encodeURIComponent(mail);
    window.open(`mailto:?subject=${subj}&body=${body}`);
  };

  return (
    <div className="lct-backdrop" onMouseDown={onClose}>
      <div className="lct-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lct-modal-head">
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Lancements article — {fe?.code_article}
            </div>
            <div style={{ fontSize: 12, color: "#6e6e73" }}>
              FE <b style={{ color: "#0071e3" }}>{fe?.numero_fe}</b> ·{" "}
              {client.name}
            </div>
          </div>
          <button
            className="ap-btn ap-btn-ghost"
            onClick={onClose}
            style={{ fontSize: 18, padding: "3px 10px" }}
          >
            ✕
          </button>
        </div>
        <div className="lct-modal-body">
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#aeaeb2" }}>
              Chargement…
            </div>
          ) : lcts.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#aeaeb2" }}>
              Aucun lancement trouvé
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#6e6e73",
                  marginBottom: 12,
                  background: "rgba(0,113,227,0.06)",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                💡 Cliquez sur un lancement pour générer le mail automatique
              </div>
              <div className="fai-table-wrap" style={{ marginBottom: 20 }}>
                <table className="fai-table">
                  <thead>
                    <tr>
                      <th className="fai-th" style={{ width: 32 }}></th>
                      <th className="fai-th">N° Lancement</th>
                      <th className="fai-th">Statut</th>
                      <th className="fai-th">Poste en cours</th>
                      <th className="fai-th">Date fin planif.</th>
                      <th className="fai-th">Qté lancée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lcts.map((lct) => {
                      const sel = selLct?.CodeLancement === lct.CodeLancement;
                      return (
                        <tr
                          key={lct.CodeLancement}
                          className={`fai-row${sel ? " lct-row-sel" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelLct(sel ? null : lct)}
                        >
                          <td className="fai-td" style={{ paddingLeft: 14 }}>
                            <input
                              type="radio"
                              readOnly
                              checked={sel}
                              style={{
                                accentColor: "#0071e3",
                                cursor: "pointer",
                                width: 14,
                                height: 14,
                              }}
                            />
                          </td>
                          <td className="fai-td">
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#0071e3",
                                fontSize: 13,
                              }}
                            >
                              {lct.CodeLancement}
                            </span>
                          </td>
                          <td className="fai-td">
                            <LctStatutBadge lct={lct} />
                          </td>
                          <td
                            className="fai-td"
                            style={{ fontSize: 12, color: "#6e6e73" }}
                          >
                            {lct.CodePosteEnCours || "—"}
                          </td>
                          <td
                            className="fai-td"
                            style={{ fontSize: 12, color: "#6e6e73" }}
                          >
                            {lct.DateFinPlanifiee
                              ? new Date(
                                  lct.DateFinPlanifiee,
                                ).toLocaleDateString("fr-FR")
                              : "—"}
                          </td>
                          <td className="fai-td" style={{ fontWeight: 600 }}>
                            {lct.QuantiteLancee != null
                              ? Number(lct.QuantiteLancee).toLocaleString(
                                  "fr-FR",
                                )
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {selLct && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#6e6e73",
                        textTransform: "uppercase",
                        letterSpacing: ".5px",
                      }}
                    >
                      Aperçu du mail
                    </div>
                    <button
                      className="ap-btn ap-btn-primary"
                      onClick={openMailto}
                      style={{ fontSize: 12, padding: "6px 14px" }}
                    >
                      ✉️ Ouvrir dans ma messagerie
                    </button>
                  </div>
                  <div className="mail-box">{mail}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const BLOC_PAGE = 20;
const BLOC_COLS = [
  { key: "CodeLancement", label: "N° Lancement" },
  { key: "EmplacementStock", label: "Localisation / Emplacement" },
  { key: "CodeArticle", label: "Article" },
  { key: "DesignationArt1", label: "Désignation" },
  { key: "DateSoldeLancement", label: "Date Solde" },
  { key: "QuantiteLancee", label: "Qté en Stock" },
  { key: "MotifBlocage", label: "Motif" },
  { key: "CommentaireBlocage", label: "Commentaire" },
];

function BlocageTab() {
  const [lcts, setLcts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQ, setFilterQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "DateSoldeLancement", dir: "desc" });

  useEffect(() => {
    fetch(`${API}/api/lancements?statut=termine_dvi&limit=500`)
      .then((r) => r.json())
      .then((d) => setLcts(d.data || []))
      .catch(() => setLcts([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (key) => {
    setPage(1);
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  const sorted = useMemo(() => {
    const arr = [...lcts];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let va = a[key] ?? "",
        vb = b[key] ?? "";
      if (key === "DateSoldeLancement" || key === "DateFinPlanifiee") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else if (key === "QuantiteLancee") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      return dir === "asc"
        ? va > vb
          ? 1
          : va < vb
            ? -1
            : 0
        : va < vb
          ? 1
          : va > vb
            ? -1
            : 0;
    });
    return arr;
  }, [lcts, sort]);

  const filtered = useMemo(() => {
    let base = sorted.filter((l) => {
      const qte = Number(l.QuantiteLancee);
      return !isNaN(qte) && qte > 0;
    });
    if (!filterQ.trim()) return base;
    const q = filterQ.toLowerCase();
    return base.filter(
      (l) =>
        (l.CodeLancement || "").toLowerCase().includes(q) ||
        (l.CodeArticle || "").toLowerCase().includes(q) ||
        (l.DesignationArt1 || "").toLowerCase().includes(q) ||
        (l.EmplacementStock || "").toLowerCase().includes(q),
    );
  }, [sorted, filterQ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BLOC_PAGE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * BLOC_PAGE, page * BLOC_PAGE),
    [filtered, page],
  );
  const SortIcon = ({ col }) =>
    sort.key !== col ? (
      <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>
    ) : (
      <span style={{ marginLeft: 4, color: "#0071e3" }}>
        {sort.dir === "asc" ? "↑" : "↓"}
      </span>
    );

  return (
    <div>
      <div className="fai-toolbar">
        {!loading && (
          <span className="ap-badge ap-badge-orange">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
        <input
          className="ap-input"
          style={{ flex: 1, minWidth: 200 }}
          value={filterQ}
          onChange={(e) => {
            setFilterQ(e.target.value);
            setPage(1);
          }}
          placeholder="🔍  Recherche N° lancement, article, emplacement…"
        />
        {filterQ && (
          <button
            className="ap-btn"
            onClick={() => {
              setFilterQ("");
              setPage(1);
            }}
          >
            ✕
          </button>
        )}
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#aeaeb2" }}>
          Chargement…
        </div>
      ) : (
        <>
          <div className="fai-table-wrap">
            <table className="fai-table">
              <thead>
                <tr>
                  {BLOC_COLS.map((col) => (
                    <th
                      key={col.key}
                      className="fai-th"
                      style={{ cursor: "pointer", userSelect: "none" }}
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon col={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((lct) => (
                  <tr
                    key={lct.CodeLancement}
                    className="fai-row"
                    style={{ background: "#fffcf0" }}
                  >
                    <td
                      className="fai-td"
                      style={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      {lct.CodeLancement}
                    </td>
                    <td className="fai-td">
                      <EmplacementCell lct={lct} />
                    </td>
                    <td
                      className="fai-td"
                      style={{ fontFamily: "monospace", fontSize: 12 }}
                    >
                      {lct.CodeArticle}
                    </td>
                    <td
                      className="fai-td"
                      style={{ fontSize: 12, color: "#6e6e73" }}
                    >
                      {lct.DesignationArt1 || lct.DesignationLct1 || "—"}
                    </td>
                    <td
                      className="fai-td"
                      style={{
                        fontSize: 12,
                        color: "#6e6e73",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lct.DateSoldeLancement
                        ? new Date(lct.DateSoldeLancement).toLocaleDateString(
                            "fr-FR",
                          )
                        : "—"}
                    </td>
                    <td
                      className="fai-td"
                      style={{ fontWeight: 800, textAlign: "right" }}
                    >
                      {Number(lct.QuantiteLancee).toLocaleString("fr-FR")}
                    </td>
                    <td className="fai-td">
                      <span className="ap-badge ap-badge-orange">
                        {lct.MotifBlocage || "DVI"}
                      </span>
                    </td>
                    <td
                      className="fai-td"
                      style={{
                        fontSize: 11.5,
                        color: "#6e6e73",
                        maxWidth: 200,
                      }}
                    >
                      {lct.CommentaireBlocage || "—"}
                    </td>
                  </tr>
                ))}
                {!paged.length && (
                  <tr>
                    <td
                      className="fai-td"
                      colSpan={BLOC_COLS.length}
                      style={{
                        textAlign: "center",
                        padding: 48,
                        color: "#aeaeb2",
                      }}
                    >
                      Aucun lancement bloqué trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ap-pagination">
            <button
              className="ap-btn"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              «
            </button>
            <button
              className="ap-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Préc.
            </button>
            <span style={{ color: "#6e6e73", fontSize: 13 }}>
              Page <b>{page}</b> / {totalPages}
              <span style={{ color: "#aeaeb2", marginLeft: 8 }}>
                ({filtered.length} résultats)
              </span>
            </span>
            <button
              className="ap-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suiv. →
            </button>
            <button
              className="ap-btn"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              »
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function InterneFAI() {
  const [tab, setTab] = useState("suivi");
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("En cours");
  const [annee, setAnnee] = useState("2026");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [assignments, setAssignments] = useState({});
  const [modal8D, setModal8D] = useState({ open: false, fe: null, value: "" });
  const [lctModal, setLctModal] = useState(null);
  const [confirmCloture, setConfirmCloture] = useState(null);

  // ── 8D depuis tous les sites accessibles ────────────────
  const { map: analyses8D, update: updateAnalyses8D } = useAnalyses8D();

  // ── Source toggle ─────────────────────────────────────────
  const [source, setSource] = useState("diapason");
  const appFE = useAppFE("interne-fai", {
    q: source === "app" ? q : "",
    statut: source === "app" ? statut : "Tous",
    annee: source === "app" ? annee : null,
  });
  const isApp = source === "app";

  useEffect(() => {
    injectGlobalCSS();
    if (!document.getElementById("fai-css")) {
      const s = document.createElement("style");
      s.id = "fai-css";
      s.textContent = FAI_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // ── Chargement FE Silog ───────────────────────────────────
  useEffect(() => {
    setLoadingData(true);
    getAllFE({
      q: q.trim() || null,
      statut: statut === "Tous" ? null : statut,
      annee,
      limit: 2000,
    })
      .then((r) => {
        const fai = (r.items || []).filter((fe) => fe.is_dvi === true);
        setItems(fai);
        setAssignments((prev) => {
          const next = { ...prev };
          fai.forEach((fe) => {
            if (!next[fe.numero_fe])
              next[fe.numero_fe] = {
                mesure_efficacite: null,
                cloture: fe.statut?.toLowerCase().includes("traité") || false,
              };
          });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [q, statut, annee]);

  const setAss = (fid, field, val) =>
    setAssignments((p) => ({ ...p, [fid]: { ...p[fid], [field]: val } }));

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pagedRows = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page],
  );

  const rows = isApp ? appFE.items : pagedRows;
  const loading = isApp ? appFE.loading : loadingData;

  const open8D = (fe) =>
    setModal8D({
      open: true,
      fe,
      value: analyses8D[fe.numero_fe] || fe.analyse_8d || "",
    });

  const handleCloture = (fe) => {
    const ass = assignments[fe.numero_fe];
    if (ass?.cloture || !is8DComplete(fe)) return;
    setConfirmCloture(fe.numero_fe);
  };

  const confirmAndClose = () => {
    if (!confirmCloture) return;
    setAss(confirmCloture, "cloture", true);
    setConfirmCloture(null);
  };

  // Mise à jour locale du 8D après sauvegarde dans le modal
  const handleSave8D = (v) => {
    const fe = modal8D.fe;
    if (fe?.numero_fe) updateAnalyses8D(fe.numero_fe, v);
    setModal8D({ open: false, fe: null, value: "" });
  };

  const nbTotal = items.length;
  const nbClotures = Object.values(assignments).filter((a) => a.cloture).length;
  const nbEffOui = Object.values(assignments).filter(
    (a) => a.mesure_efficacite === true,
  ).length;

  // Compteurs 8D depuis KEP_NC
  const nb8DEnCours = items.filter(
    (fe) =>
      analyses8D[fe.numero_fe] &&
      !is8DComplete({ analyse_8d: analyses8D[fe.numero_fe] }),
  ).length;
  const nb8DComplets = items.filter(
    (fe) =>
      analyses8D[fe.numero_fe] &&
      is8DComplete({ analyse_8d: analyses8D[fe.numero_fe] }),
  ).length;

  return (
    <div
      style={{
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",
        padding: "24px 28px",
        background: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">Interne FAI</div>
          <div
            style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}
          >
            {!loadingData && (
              <>
                <span className="ap-badge ap-badge-blue">
                  {isApp ? appFE.total : nbTotal} FE
                </span>
                {!isApp && (
                  <span className="ap-badge ap-badge-orange">
                    {nb8DEnCours} 8D en cours
                  </span>
                )}
                {!isApp && (
                  <span className="ap-badge ap-badge-green">
                    {nb8DComplets} 8D complets
                  </span>
                )}
                {!isApp && (
                  <span className="ap-badge ap-badge-green">
                    {nbClotures} clôturées
                  </span>
                )}
                {!isApp && (
                  <span className="ap-badge ap-badge-orange">
                    {nbEffOui} efficacité OK
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {tab === "suivi" && (
          <SourceToggle
            source={source}
            onChange={setSource}
            diapasonLabel="SILOG"
            diapasonCount={items.length}
            appCount={appFE.total}
          />
        )}
      </div>

      <div className="fai-tabs">
        <button
          className={`fai-tab${tab === "suivi" ? " active" : ""}`}
          onClick={() => setTab("suivi")}
        >
          📋 Suivi FAI
        </button>
        <button
          className={`fai-tab${tab === "blocage" ? " active" : ""}`}
          onClick={() => setTab("blocage")}
        >
          🔒 Blocage DVI
        </button>
      </div>

      {tab === "suivi" && (
        <>
          <div className="fai-toolbar">
            <select
              className="ap-select"
              style={{ minWidth: 80 }}
              value={annee}
              onChange={(e) => {
                setPage(1);
                setAnnee(e.target.value);
              }}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="">Toutes</option>
            </select>
            <select
              className="ap-select"
              style={{ minWidth: 120 }}
              value={statut}
              onChange={(e) => {
                setPage(1);
                setStatut(e.target.value);
              }}
            >
              <option value="En cours">En cours</option>
              <option value="Traitée">Traitée</option>
              <option value="Tous">Tous</option>
            </select>
            <input
              className="ap-input"
              style={{ flex: 1, minWidth: 180 }}
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Recherche N° FE, article…"
            />
            <button
              className="ap-btn"
              onClick={() => {
                setQ("");
                setStatut("En cours");
                setAnnee("2026");
                setPage(1);
              }}
            >
              Réinitialiser
            </button>
          </div>

          <div className="fai-table-wrap">
            <table className="fai-table">
              <thead>
                <tr>
                  <th className="fai-th">N° FE</th>
                  {isApp ? (
                    <>
                      <th className="fai-th">Statut</th>
                      <th className="fai-th">Type</th>
                      <th className="fai-th">Quantité</th>
                      <th className="fai-th">Gravité</th>
                      <th className="fai-th">Déclarant</th>
                      <th className="fai-th">Description</th>
                    </>
                  ) : (
                    <>
                      <th className="fai-th">Client</th>
                      <th className="fai-th">Qté NC</th>
                      <th className="fai-th">Type FAI</th>
                      <th className="fai-th">Prochains lancements</th>
                      <th className="fai-th">Avancement 8D</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* ── Mode App ── */}
                {isApp &&
                  rows.map((fe, idx) => (
                    <tr key={fe.id || idx} className="fai-row">
                      <td className="fai-td">
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0071e3",
                            fontSize: 13,
                          }}
                        >
                          {fe.numero_fe}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6e6e73",
                            marginTop: 2,
                          }}
                        >
                          {fe.date_creation
                            ? new Date(fe.date_creation).toLocaleDateString(
                                "fr-FR",
                              )
                            : ""}
                        </div>
                      </td>
                      <td className="fai-td">
                        <span
                          className={`ap-badge ${STATUT_BADGE[fe.statut] || "ap-badge-gray"}`}
                        >
                          {fe.statut || "—"}
                        </span>
                      </td>
                      <td className="fai-td">
                        <span
                          className="ap-badge ap-badge-blue"
                          style={{ fontSize: 11 }}
                        >
                          {fe.type_evenement || "—"}
                        </span>
                      </td>
                      <td className="fai-td" style={{ fontWeight: 600 }}>
                        {fe.quantite || "—"}
                      </td>
                      <td className="fai-td">
                        <span
                          className={`ap-badge ${GRAVITE_BADGE[fe.gravite] || "ap-badge-gray"}`}
                        >
                          {fe.gravite || "—"}
                        </span>
                      </td>
                      <td
                        className="fai-td"
                        style={{ fontSize: 12, color: "#6e6e73" }}
                      >
                        {fe.declarant_nom || "—"}
                      </td>
                      <td
                        className="fai-td"
                        style={{
                          fontSize: 12,
                          color: "#6e6e73",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fe.description || "—"}
                      </td>
                    </tr>
                  ))}

                {/* ── Mode Silog ── */}
                {!isApp &&
                  rows.map((fe, idx) => {
                    const ass = assignments[fe.numero_fe] || {
                      mesure_efficacite: null,
                      cloture: false,
                    };
                    const complete = is8DComplete(fe);
                    const clotured = ass.cloture;
                    const client = clientFromFE(fe);
                    // FE enrichie avec le 8D depuis KEP_NC
                    const feEnrichi = {
                      ...fe,
                      analyse_8d: analyses8D[fe.numero_fe] || fe.analyse_8d,
                    };
                    return (
                      <tr key={fe.numero_fe || idx} className="fai-row">
                        <td className="fai-td">
                          <button
                            onClick={() => open8D(feEnrichi)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 700,
                              color: "#0071e3",
                              fontSize: 13,
                              padding: 0,
                              fontFamily: "inherit",
                            }}
                          >
                            {fe.numero_fe || "—"}
                          </button>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6e6e73",
                              marginTop: 2,
                            }}
                          >
                            {fe.date_creation
                              ? new Date(fe.date_creation).toLocaleDateString(
                                  "fr-FR",
                                )
                              : ""}
                          </div>
                        </td>
                        <td className="fai-td">
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 12,
                              maxWidth: 150,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={client.name}
                          >
                            {client.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#aeaeb2",
                              fontFamily: "monospace",
                              marginTop: 1,
                            }}
                          >
                            {client.code}
                          </div>
                        </td>
                        <td className="fai-td">
                          <span
                            style={{
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                              fontSize: 14,
                            }}
                          >
                            {fe.qte_non_conforme
                              ? Number(fe.qte_non_conforme).toLocaleString(
                                  "fr-FR",
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="fai-td">
                          <span
                            className="ap-badge ap-badge-blue"
                            style={{ fontSize: 11 }}
                          >
                            {fe.dvi_label || fe.type_nc || "—"}
                          </span>
                        </td>
                        <td
                          className="fai-td"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {fe.code_article ? (
                            <button
                              className="lct-btn"
                              onClick={() => setLctModal(fe)}
                            >
                              🔍 {(fe.code_article || "").slice(0, 10)}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "#aeaeb2" }}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="fai-td">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            {/* Badge lit analyse_8d depuis KEP_NC en priorité */}
                            <Badge8D fe={feEnrichi} />
                            <button
                              className="ap-btn ap-btn-primary"
                              style={{
                                padding: "3px 9px",
                                fontSize: 11,
                                flexShrink: 0,
                              }}
                              onClick={() => open8D(feEnrichi)}
                            >
                              8D
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!rows.length && !loading && (
                  <tr>
                    <td
                      className="fai-td"
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: 48,
                        color: "#aeaeb2",
                      }}
                    >
                      Aucune FE FAI {isApp ? "dans l'app" : "trouvée"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!isApp && (
            <div className="ap-pagination">
              <button
                className="ap-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Précédent
              </button>
              <span style={{ color: "#6e6e73" }}>
                Page <b>{page}</b> / {totalPages}
                <span style={{ color: "#aeaeb2", marginLeft: 8 }}>
                  ({items.length} FE)
                </span>
              </span>
              <button
                className="ap-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      {tab === "blocage" && <BlocageTab />}

      <Analyse8DModal
        open={modal8D.open}
        fe={modal8D.fe}
        initialValue={modal8D.value}
        site={getSiteFromJWT()}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={handleSave8D}
      />

      {lctModal && (
        <LancementModal fe={lctModal} onClose={() => setLctModal(null)} />
      )}

      {confirmCloture && (
        <div
          className="fai-confirm"
          onMouseDown={() => setConfirmCloture(null)}
        >
          <div
            className="fai-confirm-box"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              Confirmer la clôture
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6e6e73",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              La FE <b style={{ color: "#1d1d1f" }}>{confirmCloture}</b> va être
              marquée comme <b>Traitée</b>. Cette action est définitive.
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                className="ap-btn"
                onClick={() => setConfirmCloture(null)}
              >
                Annuler
              </button>
              <button className="ap-btn ap-btn-dark" onClick={confirmAndClose}>
                ✓ Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
