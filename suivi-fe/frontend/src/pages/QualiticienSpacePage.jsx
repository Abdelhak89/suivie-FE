// frontend/src/pages/QualiticienSpacePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../auth/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function clientCodeFromRef(ref) {
  const s = String(ref || "").trim();
  return s.slice(0, 3);
}

export default function QualiticienSpacePage() {
  const nav = useNavigate();
  const session = getSession();
  const qualiticien = session?.name || "";

  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [portfolio, setPortfolio] = useState([]);
  const [clientFilter, setClientFilter] = useState(""); // ex: "SEP Niort" (nom client)
  const [items, setItems] = useState([]);

  const logout = () => {
    clearSession();
    nav("/login");
  };

  // portfolio clients
  useEffect(() => {
    if (!qualiticien) return;
    fetch(`${API}/portfolio?qualiticien=${encodeURIComponent(qualiticien)}`)
      .then((r) => r.json())
      .then((d) => setPortfolio(d.items || []))
      .catch(() => setPortfolio([]));
  }, [qualiticien]);

  // FE list filtrée
  useEffect(() => {
    if (!qualiticien) return;
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: "1", pageSize: "200", animateur: qualiticien });
    if (annee) params.set("annee", annee);
    if (q.trim()) params.set("q", q.trim());

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee, q, qualiticien]);

  const filtered = useMemo(() => {
    if (!clientFilter) return items;
    // on garde les FE dont REF commence par un code client correspondant au libellé (portfolio)
    // => V1 : on compare par "nom client" dans portfolio, donc on filtre par code dans la REF via mapping backend plus tard si besoin.
    // En attendant : si tu stockes le nom client dans portfolio, on fait simple: match texte dans ref/designation.
    const needle = clientFilter.toLowerCase();
    return (items || []).filter((x) => {
      const ref = String(x.code_article || "").toLowerCase();
      const des = String(x.designation || "").toLowerCase();
      return ref.includes(needle) || des.includes(needle);
    });
  }, [items, clientFilter]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
        <div>
          <h2 style={{ margin: 0 }}>Espace Qualiticien</h2>
          <div style={{ color: "#6b7280", marginTop: 4 }}>
            Connecté : <b>{qualiticien}</b>
          </div>
        </div>
        <button onClick={logout} style={{ ...btnStyle, background: "white", color: "#111827" }}>
          Déconnexion
        </button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "360px 1fr", gap: 12, alignItems: "start" }}>
        {/* Portfolio */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 800 }}>Mes clients</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{portfolio.length}</div>
          </div>

          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={{ ...selectStyleWide, marginTop: 10 }}>
            <option value="">— Tous —</option>
            {portfolio.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {portfolio.map((c) => (
              <span key={c} style={pill}>{c}</span>
            ))}
          </div>

          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 12 }}>
            (Les “cases vertes” d’affectation se font côté manager.)
          </div>
        </div>

        {/* FE */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Mes FE</div>
            <div style={{ color: "#6b7280" }}>{loading ? "chargement..." : `${filtered.length} FE`}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={selectStyle}>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="">Toutes</option>
            </select>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (N° FE / REF / désignation / lancement...)"
              style={{ ...inputStyle, minWidth: 360 }}
            />
          </div>

          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>N° FE</th>
                  <th style={th}>REF</th>
                  <th style={th}>ClientCode</th>
                  <th style={th}>Désignation</th>
                  <th style={th}>Lancement</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(filtered || []).map((x) => (
                  <tr key={x.id}>
                    <td style={td}>{x.numero_fe || "—"}</td>
                    <td style={td}>{x.code_article || "—"}</td>
                    <td style={td}>{clientCodeFromRef(x.code_article) || "—"}</td>
                    <td style={td}>{x.designation || "—"}</td>
                    <td style={td}>{x.code_lancement || "—"}</td>
                    <td style={td}>{String(x.date_creation || "").slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  background: "white",
};

const btnStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const inputStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
};

const selectStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  minWidth: 140,
};

const selectStyleWide = {
  ...selectStyle,
  minWidth: 320,
};

const pill = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: 12,
};

const table = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" };
const td = { padding: 10, borderBottom: "1px solid #f3f4f6", fontSize: 13 };
