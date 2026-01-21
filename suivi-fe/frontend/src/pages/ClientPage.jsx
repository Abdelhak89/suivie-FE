import { useState } from "react";
import FeGrid from "../components/FeGrid.jsx";
import { PAGES } from "../config/fePages.js";

export default function ClientPage() {
  const config = PAGES["client"];
  const [rows, setRows] = useState([{}]);

  const onChange = (rowIndex, col, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [col]: value };
      return next;
    });
  };

  return (
    <div>
      <h2 style={{ margin: 0 }}>{config.title}</h2>
      <div style={{ color: "#666", margin: "6px 0 14px" }}>
        Tableau à remplir par FE (V1 front-only)
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setRows((r) => [...r, {}])}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "white" }}
        >
          + Ajouter une ligne
        </button>
      </div>

      <FeGrid config={config} rows={rows} onChange={onChange} />
    </div>
  );
}
