import { useEffect, useState } from "react";
import FeDrawer from "../components/FeDrawer.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const [qualiticiens, setQualiticiens] = useState([]);
  const [me, setMe] = useState("");

  // ✅ filtre année
  const [annee, setAnnee] = useState("2026");

  const [loadingQ, setLoadingQ] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);

  const [dash, setDash] = useState({
    nouvelles: 0,
    en_cours: 0,
    cloturees: 0,
    annulees: 0,
    a_relancer: 0,
    relances: [],
  });

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ✅ charge la liste des qualiticiens (Animateur) filtrée par année
  useEffect(() => {
    const ctrl = new AbortController();
    setLoadingQ(true);

    fetch(`${API}/qualiticiens?annee=${encodeURIComponent(annee)}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => setQualiticiens(d.items || []))
      .finally(() => setLoadingQ(false));

    return () => ctrl.abort();
  }, [annee]);

  // ✅ charge dashboard quand user OU année change
  useEffect(() => {
    if (!me) return;

    const ctrl = new AbortController();
    setLoadingDash(true);

    fetch(
      `${API}/dashboard?user=${encodeURIComponent(me)}&annee=${encodeURIComponent(annee)}`,
      { signal: ctrl.signal }
    )
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) throw new Error(d?.error || "Erreur dashboard");
        setDash({
          nouvelles: d.nouvelles ?? 0,
          en_cours: d.en_cours ?? 0,
          cloturees: d.cloturees ?? 0,
          annulees: d.annulees ?? 0,
          a_relancer: d.a_relancer ?? 0,
          relances: Array.isArray(d.relances) ? d.relances : [],
        });
      })
      .catch((e) => {
        console.error("dashboard error:", e);
        setDash({
          nouvelles: 0,
          en_cours: 0,
          cloturees: 0,
          annulees: 0,
          a_relancer: 0,
          relances: [],
        });
      })
      .finally(() => setLoadingDash(false));

    return () => ctrl.abort();
  }, [me, annee]);

  const openDetail = async (id) => {
    setDrawerOpen(true);
    setSelectedRecord({ numero_fe: "", statut: "", data: { Chargement: "..." } });

    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedRecord(d);
    } catch (e) {
      setSelectedRecord({
        numero_fe: "",
        statut: "",
        data: { Erreur: String(e) },
      });
    }
  };

  const onChangeYear = (v) => {
    // ✅ quand on change d'année, on reset le user (sinon mismatch année/user)
    setAnnee(v);
    setMe("");
    setDash({
      nouvelles: 0,
      en_cours: 0,
      cloturees: 0,
      annulees: 0,
      a_relancer: 0,
      relances: [],
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Accueil</h2>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            {loadingDash ? "Chargement..." : "Vue qualiticien (Animateur)"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#6b7280" }}>Année :</span>
          <select
            value={annee}
            onChange={(e) => onChangeYear(e.target.value)}
            style={selectStyle}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>

          <span style={{ color: "#6b7280" }}>Qualiticien :</span>
          <select
            value={me}
            onChange={(e) => setMe(e.target.value)}
            disabled={loadingQ}
            style={selectStyle}
          >
            <option value="">
              {loadingQ ? "Chargement..." : "— choisir —"}
            </option>
            {qualiticiens.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <Card title="Nouvelles FE" value={dash.nouvelles} />
        <Card title="FE en cours" value={dash.en_cours} />
        <Card title="FE clôturées" value={dash.cloturees} />
        <Card title="FE annulées" value={dash.annulees} />
        <Card
          title="FE à relancer"
          value={dash.a_relancer}
          subtitle="Date de création + 3 jours"
        />
      </div>

      {/* Relances list */}
      <div style={{ marginTop: 14 }}>
        <Panel title="FE à relancer (top 20)">
          {!me ? (
            <div style={{ color: "#6b7280" }}>
              Sélectionne un qualiticien. (Année : {annee || "toutes"})
            </div>
          ) : loadingDash ? (
            <div style={{ color: "#6b7280" }}>Chargement...</div>
          ) : dash.relances.length === 0 ? (
            <div style={{ color: "#6b7280" }}>Aucune FE à relancer 🎉</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6b7280" }}>
                    <th style={th}>Relance due</th>
                    <th style={th}>N° FE</th>
                    <th style={th}>Statut</th>
                    <th style={th}>REF</th>
                    <th style={th}>Désignation</th>
                    <th style={th}>Lancement</th>
                    <th style={th}>Fournisseur</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.relances.map((r) => (
                    <tr
                      key={r.id}
                      onMouseDown={() => openDetail(r.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={td}>{formatDate(r.relance_due)}</td>
                      <td style={td}>
                        <b>{r.numero_fe || "—"}</b>
                      </td>
                      <td style={td}>{r.statut || "—"}</td>
                      <td style={td}>{r.code_article || "—"}</td>
                      <td style={td}>{r.designation || "—"}</td>
                      <td style={td}>{r.code_lancement || "—"}</td>
                      <td style={td}>{r.nom_fournisseur || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
                Clique une ligne pour ouvrir le détail.
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Drawer */}
      <FeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
      />
    </div>
  );
}

function Card({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div style={{ color: "#6b7280", fontWeight: 800 }}>{title}</div>
      {subtitle ? (
        <div style={{ color: "#9aa0a6", fontSize: 12, marginTop: 4 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 10 }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
}

const th = { padding: "10px 8px", borderBottom: "1px solid var(--border)" };
const td = { padding: "10px 8px", borderBottom: "1px solid #f0f0f3" };

const selectStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  minWidth: 180,
};
