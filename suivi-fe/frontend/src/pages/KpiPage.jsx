// src/pages/KpiPage.jsx - VERSION ADAPTÉE POUR NOUVELLE API
import { useEffect, useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { getClientNameFromRef } from "../data/clients.js";
import { getAllFE, getStats } from "../services/feApi.js";

// ... (garder toutes les fonctions utilitaires: cleanKey, getDataByKeys, parseQteEstimee, etc.)
const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

function getDataByKeys(fe, ...keys) {
  const data = fe?.data;
  if (!data || typeof data !== "object") return "";
  const wanted = new Set(keys.map(cleanKey));
  for (const [k, v] of Object.entries(data)) {
    if (wanted.has(cleanKey(k))) return v ?? "";
  }
  return "";
}

function parseQteEstimee(fe) {
  const v = fe.qte_non_conforme || 
    getDataByKeys(fe, "Qte estimee", "Qte estimée", "Qté estimée", "Qte NC", "Qté NC") ||
    "";
  const n = Number(String(v).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getInterneExterne(fe) {
  const o = String(fe?.origine || "").toLowerCase();
  if (!o) return "Non renseigné";
  if (o.includes("fourn")) return "Fournisseur";
  if (o.includes("client")) return "Client";
  if (o.includes("inter") || o.includes("cint")) return "Interne";
  return (fe?.origine || "Autre").toString();
}

function getTypeDefaut(fe) {
  const v = fe.type_nc || getDataByKeys(
    fe,
    "Type de défaut",
    "Type de defaut",
    "Type défaut",
    "Type defaut"
  );
  return String(v || "Non renseigné");
}

function getIlot(fe) {
  return String(
    getDataByKeys(fe, "ILOT GENERATEUR", "Ilot générateur", "Ilot generateur") || 
    "Non renseigné"
  );
}

function isoToYmd(v) {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  if (Number.isFinite(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

function groupCount(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function toPareto(map, top = 12) {
  const arr = [...map.entries()].map(([k, v]) => ({ label: k, value: v }));
  arr.sort((a, b) => b.value - a.value);
  const sliced = arr.slice(0, top);
  const other = arr.slice(top).reduce((s, x) => s + x.value, 0);
  if (other > 0) sliced.push({ label: "Autres", value: other });
  return sliced;
}

function Card({ title, value, sub }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
      {sub ? <div style={styles.cardSub}>{sub}</div> : null}
    </div>
  );
}

export default function KpiPage() {
  const [annee, setAnnee] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState([]);
  const [stats, setStats] = useState(null);

  const [fClient, setFClient] = useState("");
  const [fIlot, setFIlot] = useState("");
  const [fOrigine, setFOrigine] = useState("");
  const [fTypeDefaut, setFTypeDefaut] = useState("");

  const [drill, setDrill] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Charger les stats globales
        const statsData = await getStats();
        setStats(statsData);

        // Charger toutes les FE pour les graphiques
        const result = await getAllFE({ 
          annee: annee || null,
          limit: 5000 // Limite haute pour KPI
        });
        
        setAll(result.items || []);
      } catch (error) {
        console.error("Erreur chargement KPI:", error);
        setAll([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [annee]);

  const enriched = useMemo(() => {
    return (all || []).map((fe) => {
      const ref = fe?.code_article || "";
      const client = getClientNameFromRef(ref);
      const ilot = getIlot(fe);
      const origine = getInterneExterne(fe);
      const typeDefaut = getTypeDefaut(fe);
      const qteNc = parseQteEstimee(fe);

      return {
        ...fe,
        _client: client,
        _ilot: ilot,
        _origine: origine,
        _typeDefaut: typeDefaut,
        _qteNc: qteNc,
        _date: isoToYmd(fe?.date_creation),
      };
    });
  }, [all]);

  const clientsList = useMemo(() => {
    const set = new Set(enriched.map((x) => x._client).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [enriched]);

  const ilotsList = useMemo(() => {
    const set = new Set(enriched.map((x) => x._ilot).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [enriched]);

  const originesList = useMemo(() => {
    const set = new Set(enriched.map((x) => x._origine).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [enriched]);

  const typesList = useMemo(() => {
    const set = new Set(enriched.map((x) => x._typeDefaut).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter((x) => {
      if (fClient && x._client !== fClient) return false;
      if (fIlot && x._ilot !== fIlot) return false;
      if (fOrigine && x._origine !== fOrigine) return false;
      if (fTypeDefaut && x._typeDefaut !== fTypeDefaut) return false;
      return true;
    });
  }, [enriched, fClient, fIlot, fOrigine, fTypeDefaut]);

  const total = filtered.length;
  const totalQteNc = filtered.reduce((s, x) => s + (x._qteNc || 0), 0);

  const paretoClient = useMemo(() => {
    const map = groupCount(filtered, (x) => x._client);
    return toPareto(map, 10).map((d) => ({ id: d.label, label: d.label, value: d.value }));
  }, [filtered]);

  const paretoIlot = useMemo(() => {
    const map = groupCount(filtered, (x) => x._ilot);
    const arr = toPareto(map, 10);
    return arr.map((d) => ({ label: d.label, value: d.value }));
  }, [filtered]);

  const paretoType = useMemo(() => {
    const map = groupCount(filtered, (x) => x._typeDefaut);
    const arr = toPareto(map, 10);
    return arr.map((d) => ({ label: d.label, value: d.value }));
  }, [filtered]);

  const pieOrigine = useMemo(() => {
    const map = groupCount(filtered, (x) => x._origine);
    const arr = [...map.entries()].map(([k, v]) => ({ id: k, label: k, value: v }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [filtered]);

  const lineWeekly = useMemo(() => {
    const map = new Map();
    for (const x of filtered) {
      const key = x._date ? x._date.slice(0, 7) : "NA";
      map.set(key, (map.get(key) || 0) + 1);
    }
    const points = [...map.entries()]
      .map(([k, v]) => ({ x: k, y: v }))
      .sort((a, b) => String(a.x).localeCompare(String(b.x)));

    return [{ id: "FE", data: points }];
  }, [filtered]);

  function openDrill(title, rows) {
    setDrill({ title, rows });
  }

  function drillBy(predicateTitle, predicateFn) {
    const rows = filtered.filter(predicateFn);
    openDrill(predicateTitle, rows);
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.h1}>KPI Qualité</div>
          <div style={styles.h2}>
            {loading ? "Chargement…" : `${filtered.length} FE`} — filtres dynamiques + Pareto + drilldown
          </div>
        </div>

        <div style={styles.filters}>
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={styles.select}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>

          <select value={fClient} onChange={(e) => setFClient(e.target.value)} style={styles.selectWide}>
            <option value="">Client (tous)</option>
            {clientsList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={fIlot} onChange={(e) => setFIlot(e.target.value)} style={styles.select}>
            <option value="">Îlot (tous)</option>
            {ilotsList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={fOrigine} onChange={(e) => setFOrigine(e.target.value)} style={styles.select}>
            <option value="">Interne/Client/Fourn. (tous)</option>
            {originesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={fTypeDefaut} onChange={(e) => setFTypeDefaut(e.target.value)} style={styles.selectWide}>
            <option value="">Type défaut (tous)</option>
            {typesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            style={styles.btn}
            onClick={() => {
              setFClient(""); setFIlot(""); setFOrigine(""); setFTypeDefaut("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={styles.cards}>
        <Card title="FE (filtrées)" value={total} sub={`Année: ${annee || "Toutes"}`} />
        <Card title="Qté NC estimée" value={totalQteNc.toLocaleString("fr-FR")} sub="Somme Qte NC" />
        <Card title="Clients touchés" value={new Set(filtered.map(x => x._client)).size} sub="via 3 chiffres REF" />
        <Card title="Îlots touchés" value={new Set(filtered.map(x => x._ilot)).size} sub="ILOT GENERATEUR" />
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Pareto — Îlot générateur (Top 10)</div>
          <div style={styles.panelSub}>Clique une barre pour voir le détail</div>
          <div style={styles.chart}>
            <ResponsiveBar
              data={paretoIlot.map((d) => ({ label: d.label, FE: d.value }))}
              keys={["FE"]}
              indexBy="label"
              margin={{ top: 10, right: 18, bottom: 60, left: 60 }}
              padding={0.22}
              enableLabel={false}
              axisBottom={{ tickRotation: -35 }}
              onClick={(bar) => {
                const label = bar.indexValue;
                drillBy(`Détail — Îlot: ${label}`, (x) => x._ilot === label);
              }}
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Pareto — Type de défaut (Top 10)</div>
          <div style={styles.panelSub}>Clique une barre pour voir le détail</div>
          <div style={styles.chart}>
            <ResponsiveBar
              data={paretoType.map((d) => ({ label: d.label, FE: d.value }))}
              keys={["FE"]}
              indexBy="label"
              margin={{ top: 10, right: 18, bottom: 60, left: 60 }}
              padding={0.22}
              enableLabel={false}
              axisBottom={{ tickRotation: -35 }}
              onClick={(bar) => {
                const label = bar.indexValue;
                drillBy(`Détail — Type défaut: ${label}`, (x) => x._typeDefaut === label);
              }}
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Répartition — Interne / Client / Fournisseur</div>
          <div style={styles.panelSub}>Clique une part pour voir le détail</div>
          <div style={styles.chart}>
            <ResponsivePie
              data={pieOrigine}
              margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
              innerRadius={0.55}
              padAngle={1.2}
              cornerRadius={6}
              activeOuterRadiusOffset={8}
              enableArcLabels={false}
              onClick={(slice) => {
                const label = slice.id;
                drillBy(`Détail — Origine: ${label}`, (x) => x._origine === label);
              }}
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Pareto — Clients (Top 10)</div>
          <div style={styles.panelSub}>Client = 3 premiers chiffres de la REF</div>
          <div style={styles.chart}>
            <ResponsiveBar
              data={paretoClient.map((d) => ({ label: d.label, FE: d.value }))}
              keys={["FE"]}
              indexBy="label"
              margin={{ top: 10, right: 18, bottom: 60, left: 60 }}
              padding={0.22}
              enableLabel={false}
              axisBottom={{ tickRotation: -35 }}
              onClick={(bar) => {
                const label = bar.indexValue;
                drillBy(`Détail — Client: ${label}`, (x) => x._client === label);
              }}
            />
          </div>
        </div>

        <div style={{ ...styles.panel, gridColumn: "1 / -1" }}>
          <div style={styles.panelTitle}>Tendance — FE par mois</div>
          <div style={styles.panelSub}>Clique un point pour zoomer</div>
          <div style={{ ...styles.chart, height: 320 }}>
            <ResponsiveLine
              data={lineWeekly}
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: 0, max: "auto" }}
              axisBottom={{ tickRotation: -35 }}
              pointSize={8}
              useMesh={true}
              onClick={(point) => {
                const key = point?.data?.x;
                drillBy(`Détail — Période: ${key}`, (x) => {
                  const k = x._date ? x._date.slice(0, 7) : "NA";
                  return k === key;
                });
              }}
            />
          </div>
        </div>
      </div>

      {drill ? (
        <div style={styles.drillOverlay} onClick={() => setDrill(null)}>
          <div style={styles.drill} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drillTop}>
              <div>
                <div style={styles.drillTitle}>{drill.title}</div>
                <div style={styles.drillSub}>{drill.rows.length} FE</div>
              </div>
              <button style={styles.btn} onClick={() => setDrill(null)}>Fermer</button>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>N° FE</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Îlot</th>
                    <th style={styles.th}>Type défaut</th>
                    <th style={styles.th}>REF</th>
                    <th style={styles.th}>Désignation</th>
                    <th style={styles.th}>Qté NC</th>
                  </tr>
                </thead>
                <tbody>
                  {drill.rows.slice(0, 300).map((x) => (
                    <tr key={x.numero_fe}>
                      <td style={styles.td}>{x.numero_fe || "—"}</td>
                      <td style={styles.td}>{x._date || "—"}</td>
                      <td style={styles.td}>{x._client || "—"}</td>
                      <td style={styles.td}>{x._ilot || "—"}</td>
                      <td style={styles.td}>{x._typeDefaut || "—"}</td>
                      <td style={styles.td}>{x.code_article || "—"}</td>
                      <td style={styles.td}>{x.designation || "—"}</td>
                      <td style={styles.td}>{(x._qteNc || 0).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ... (garder tous les styles)
const styles = {
  page: {
    padding: 16,
    background: "#f6f7fb",
    minHeight: "calc(100vh - 64px)",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  h1: { fontSize: 22, fontWeight: 900, color: "#111827" },
  h2: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  filters: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  select: {
    padding: 10,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    minWidth: 170,
  },
  selectWide: {
    padding: 10,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    minWidth: 260,
  },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 8px 24px rgba(17,24,39,0.06)",
  },
  cardTitle: { fontSize: 12, color: "#6b7280", fontWeight: 700 },
  cardValue: { fontSize: 28, fontWeight: 900, marginTop: 6, color: "#111827" },
  cardSub: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(360px, 1fr))",
    gap: 12,
  },
  panel: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 8px 24px rgba(17,24,39,0.06)",
  },
  panelTitle: { fontSize: 14, fontWeight: 900, color: "#111827" },
  panelSub: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  chart: { height: 260, marginTop: 8 },
  drillOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,24,39,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 50,
  },
  drill: {
    width: "min(1200px, 96vw)",
    maxHeight: "86vh",
    background: "white",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 16px 48px rgba(17,24,39,0.22)",
    padding: 14,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  drillTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  drillTitle: { fontSize: 16, fontWeight: 900, color: "#111827" },
  drillSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  tableWrap: { overflow: "auto", borderTop: "1px solid #f1f5f9", paddingTop: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 800,
    padding: "10px 8px",
    borderBottom: "1px solid #eef2f7",
    position: "sticky",
    top: 0,
    background: "white",
  },
  td: {
    fontSize: 13,
    color: "#111827",
    padding: "10px 8px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
};
