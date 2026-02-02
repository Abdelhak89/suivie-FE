import { useState } from "react";
import FeGrid from "../components/FeGrid.jsx";
import { PAGES } from "../config/fePages.js";
import "../styles/app.css";

export default function InterneSeriePage() {
  const config = PAGES["interne-serie"];
  const [rows, setRows] = useState([{}]);

  const onChange = (rowIndex, col, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [col]: value };
      return next;
    });
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">{config.title}</h2>
          <div className="sub">Tableau à remplir par FE (V1 front-only)</div>
        </div>

        <span className="badge badgeBlue">Interne Série</span>
      </div>

      <div className="panel">
        <div className="toolbar">
          <button className="btn btnPrimary" onClick={() => setRows((r) => [...r, {}])}>
            + Ajouter une ligne
          </button>

          <button className="btn" onClick={() => setRows([{}])}>
            Reset
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <FeGrid config={config} rows={rows} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
