// src/pages/KpiPage.jsx
import { useEffect, useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { getClientNameFromRef } from "../data/clients.js";
import { getAllFE } from "../services/feApi.js";
import StatCard from "../components/StatCard.jsx";
import "../styles/app.css";

/* ── Utilitaires ── */
const cleanKey = (k) =>
  String(k || "").trim().replace(/\s+/g, " ").replace(/\//g, "_").replace(/[.]/g, "").replace(/[%]/g, "pct");

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
    getDataByKeys(fe, "Qte estimee", "Qte estimée", "Qté estimée", "Qte NC", "Qté NC") || "";
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
  const v = fe.type_nc || getDataByKeys(fe, "Type de défaut", "Type de defaut", "Type défaut", "Type defaut");
  return String(v || "Non renseigné");
}

function getIlot(fe) {
  return String(getDataByKeys(fe, "ILOT GENERATEUR", "Ilot générateur", "Ilot generateur") || "Non renseigné");
}

function isoToYmd(v) {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  if (Number.isFinite(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function groupCount(rows, keyFn) {
  const m = new Map();
  for (const r of rows) { const k = keyFn(r); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

function toPareto(map, top = 10) {
  const arr = [...map.entries()].map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value);
  const sliced = arr.slice(0, top);
  const other  = arr.slice(top).reduce((s, x) => s + x.value, 0);
  if (other > 0) sliced.push({ label: "Autres", value: other });
  return sliced;
}

const NIVO_THEME = {
  axis: { ticks: { text: { fontSize: 11, fill: "#64748b" } } },
  grid: { line: { stroke: "#f1f5f9" } },
};

const BAR_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];

/* ── Composant ── */
export default function KpiPage() {
  const [annee,      setAnnee]      = useState("2026");
  const [loading,    setLoading]    = useState(false);
  const [all,        setAll]        = useState([]);
  const [fClient,    setFClient]    = useState("");
  const [fIlot,      setFIlot]      = useState("");
  const [fOrigine,   setFOrigine]   = useState("");
  const [fTypeDefaut,setFTypeDefaut]= useState("");
  const [drill,      setDrill]      = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getAllFE({ annee: annee || null, limit: 5000 })
      .then((r) => { if (!ctrl.signal.aborted) setAll(r.items || []); })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [annee]);

  const enriched = useMemo(() => all.map((fe) => ({
    ...fe,
    _client:    getClientNameFromRef(fe?.code_article || ""),
    _ilot:      getIlot(fe),
    _origine:   getInterneExterne(fe),
    _typeDefaut:getTypeDefaut(fe),
    _qteNc:     parseQteEstimee(fe),
    _date:      isoToYmd(fe?.date_creation),
  })), [all]);

  const clientsList  = useMemo(() => [...new Set(enriched.map((x) => x._client).filter(Boolean))].sort((a,b) => a.localeCompare(b,"fr")), [enriched]);
  const ilotsList    = useMemo(() => [...new Set(enriched.map((x) => x._ilot).filter(Boolean))].sort((a,b) => a.localeCompare(b,"fr")), [enriched]);
  const originesList = useMemo(() => [...new Set(enriched.map((x) => x._origine).filter(Boolean))].sort((a,b) => a.localeCompare(b,"fr")), [enriched]);
  const typesList    = useMemo(() => [...new Set(enriched.map((x) => x._typeDefaut).filter(Boolean))].sort((a,b) => a.localeCompare(b,"fr")), [enriched]);

  const filtered = useMemo(() => enriched.filter((x) =>
    (!fClient    || x._client     === fClient)    &&
    (!fIlot      || x._ilot       === fIlot)      &&
    (!fOrigine   || x._origine    === fOrigine)   &&
    (!fTypeDefaut|| x._typeDefaut === fTypeDefaut)
  ), [enriched, fClient, fIlot, fOrigine, fTypeDefaut]);

  const total      = filtered.length;
  const totalQteNc = filtered.reduce((s, x) => s + (x._qteNc || 0), 0);

  const paretoIlot   = useMemo(() => toPareto(groupCount(filtered, (x) => x._ilot),   10), [filtered]);
  const paretoType   = useMemo(() => toPareto(groupCount(filtered, (x) => x._typeDefaut), 10), [filtered]);
  const paretoClient = useMemo(() => toPareto(groupCount(filtered, (x) => x._client),  10), [filtered]);
  const pieOrigine   = useMemo(() => {
    const map = groupCount(filtered, (x) => x._origine);
    return [...map.entries()].map(([k, v]) => ({ id: k, label: k, value: v })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const lineWeekly = useMemo(() => {
    const map = new Map();
    for (const x of filtered) {
      const key = x._date ? x._date.slice(0, 7) : "NA";
      map.set(key, (map.get(key) || 0) + 1);
    }
    const points = [...map.entries()].map(([k, v]) => ({ x: k, y: v })).sort((a,b) => String(a.x).localeCompare(String(b.x)));
    return [{ id: "FE", data: points }];
  }, [filtered]);

  const drillBy = (title, fn) => setDrill({ title, rows: filtered.filter(fn) });
  const resetFilters = () => { setFClient(""); setFIlot(""); setFOrigine(""); setFTypeDefaut(""); };

  return (
    <div className="container">
      {/* Header */}
      <div className="pageHead">
        <div>
          <h2 className="h1">KPI Qualité</h2>
          <div className="sub">{loading ? "Chargement…" : `${total} FE`} — filtres dynamiques + Pareto + drilldown</div>
        </div>

        <div className="toolbar" style={{ border: "none", background: "none", padding: 0, marginBottom: 0 }}>
          <select className="select" value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>
          <select className="select" value={fClient} onChange={(e) => setFClient(e.target.value)} style={{ minWidth: 200 }}>
            <option value="">Client (tous)</option>
            {clientsList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={fIlot} onChange={(e) => setFIlot(e.target.value)}>
            <option value="">Îlot (tous)</option>
            {ilotsList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={fOrigine} onChange={(e) => setFOrigine(e.target.value)}>
            <option value="">Origine (tous)</option>
            {originesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={fTypeDefaut} onChange={(e) => setFTypeDefaut(e.target.value)} style={{ minWidth: 200 }}>
            <option value="">Type défaut (tous)</option>
            {typesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btnDark" onClick={resetFilters}>Reset</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid4" style={{ marginBottom: 16 }}>
        <StatCard label="FE (filtrées)"     value={total.toLocaleString("fr-FR")}           sub={`Année : ${annee || "Toutes"}`}      accent="var(--primary)" />
        <StatCard label="Qté NC estimée"    value={totalQteNc.toLocaleString("fr-FR")}       sub="Somme Qte NC"                        accent="var(--red)" />
        <StatCard label="Clients touchés"   value={new Set(filtered.map((x) => x._client)).size} sub="via 3 chiffres REF"             accent="var(--amber)" />
        <StatCard label="Îlots touchés"     value={new Set(filtered.map((x) => x._ilot)).size}   sub="ILOT GENERATEUR"                accent="var(--green)" />
      </div>

      {/* Graphiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>

        <ChartPanel title="Pareto — Îlot générateur (Top 10)" sub="Clique une barre pour voir le détail">
          <ResponsiveBar
            data={paretoIlot.map((d) => ({ label: d.label, FE: d.value }))}
            keys={["FE"]} indexBy="label"
            margin={{ top: 10, right: 18, bottom: 70, left: 50 }}
            padding={0.25} enableLabel={false}
            colors={BAR_COLORS} theme={NIVO_THEME}
            axisBottom={{ tickRotation: -35 }}
            onClick={(bar) => drillBy(`Détail — Îlot : ${bar.indexValue}`, (x) => x._ilot === bar.indexValue)}
          />
        </ChartPanel>

        <ChartPanel title="Pareto — Type de défaut (Top 10)" sub="Clique une barre pour voir le détail">
          <ResponsiveBar
            data={paretoType.map((d) => ({ label: d.label, FE: d.value }))}
            keys={["FE"]} indexBy="label"
            margin={{ top: 10, right: 18, bottom: 70, left: 50 }}
            padding={0.25} enableLabel={false}
            colors={BAR_COLORS} theme={NIVO_THEME}
            axisBottom={{ tickRotation: -35 }}
            onClick={(bar) => drillBy(`Détail — Type défaut : ${bar.indexValue}`, (x) => x._typeDefaut === bar.indexValue)}
          />
        </ChartPanel>

        <ChartPanel title="Répartition — Interne / Client / Fournisseur" sub="Clique une part pour voir le détail">
          <ResponsivePie
            data={pieOrigine}
            margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
            innerRadius={0.55} padAngle={1.2} cornerRadius={6}
            activeOuterRadiusOffset={8} enableArcLabels={false}
            theme={NIVO_THEME}
            onClick={(slice) => drillBy(`Détail — Origine : ${slice.id}`, (x) => x._origine === slice.id)}
          />
        </ChartPanel>

        <ChartPanel title="Pareto — Clients (Top 10)" sub="Client = 3 premiers chiffres de la REF">
          <ResponsiveBar
            data={paretoClient.map((d) => ({ label: d.label, FE: d.value }))}
            keys={["FE"]} indexBy="label"
            margin={{ top: 10, right: 18, bottom: 70, left: 50 }}
            padding={0.25} enableLabel={false}
            colors={BAR_COLORS} theme={NIVO_THEME}
            axisBottom={{ tickRotation: -35 }}
            onClick={(bar) => drillBy(`Détail — Client : ${bar.indexValue}`, (x) => x._client === bar.indexValue)}
          />
        </ChartPanel>

        <ChartPanel title="Tendance — FE par mois" sub="Clique un point pour voir le détail" fullWidth>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={lineWeekly}
              margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: 0, max: "auto" }}
              axisBottom={{ tickRotation: -35 }}
              pointSize={8} useMesh
              colors={["#2563eb"]} theme={NIVO_THEME}
              onClick={(point) => {
                const key = point?.data?.x;
                drillBy(`Détail — Période : ${key}`, (x) => (x._date?.slice(0, 7) || "NA") === key);
              }}
            />
          </div>
        </ChartPanel>

      </div>

      {/* Drill modal */}
      {drill && (
        <div className="modalBackdrop" onMouseDown={() => setDrill(null)}>
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: 1200, padding: 16, display: "flex", flexDirection: "column", maxHeight: "88vh" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div className="h1" style={{ fontSize: 16 }}>{drill.title}</div>
                <div className="sub">{drill.rows.length} FE</div>
              </div>
              <button className="btn btnDark" onClick={() => setDrill(null)}>Fermer</button>
            </div>

            <div className="tableWrap" style={{ flex: 1, overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    {["N° FE","Date","Client","Îlot","Type défaut","REF","Désignation","Qté NC"].map((h) => (
                      <th key={h} className="th" style={{ position: "sticky", top: 0, background: "var(--surfaceAlt)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drill.rows.slice(0, 300).map((x) => (
                    <tr key={x.numero_fe} className="rowHover">
                      <td className="td"><b>{x.numero_fe || "—"}</b></td>
                      <td className="td">{x._date || "—"}</td>
                      <td className="td">{x._client || "—"}</td>
                      <td className="td">{x._ilot || "—"}</td>
                      <td className="td">{x._typeDefaut || "—"}</td>
                      <td className="td mono">{x.code_article || "—"}</td>
                      <td className="td">{x.designation || "—"}</td>
                      <td className="td" style={{ textAlign: "right" }}>{(x._qteNc || 0).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ChartPanel ── */
function ChartPanel({ title, sub, children, fullWidth }) {
  return (
    <div className="panel" style={fullWidth ? { gridColumn: "1 / -1" } : {}}>
      <div className="panelTitle">{title}</div>
      {sub && <div className="sub" style={{ marginBottom: 8 }}>{sub}</div>}
      <div style={{ height: 260, marginTop: 8 }}>
        {children}
      </div>
    </div>
  );
}