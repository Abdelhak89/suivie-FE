// src/pages/LoginQualiticienPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSession } from "../auth/session";
import "../styles/app.css";

const QUALITICIENS = [
  "BLANQUART Nicolas",
  "BRISDET Trystan",
  "DOBY Sandrine",
  "SANCHEZ WRIGHT Juliette",
  "SDRAULIG Florence",
];

export default function LoginQualiticienPage() {
  const nav  = useNavigate();
  const [role, setRole] = useState("qualiticien");
  const [name, setName] = useState(QUALITICIENS[0]);

  const submit = () => {
    if (role === "manager") {
      setSession({ role: "manager", name: "Responsable" });
      nav("/manager", { replace: true });
    } else {
      setSession({ role: "qualiticien", name });
      nav("/dashboard", { replace: true });
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }}>
      <div className="panel" style={{ width: "min(480px, 96vw)" }}>
        <div className="pageHead" style={{ marginBottom: 20 }}>
          <div className="h1">Connexion</div>
          <span className="badge badgeBlue">Suivi-FE</span>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Profil</div>
            <select className="select" style={{ width: "100%" }} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="qualiticien">Qualiticien</option>
              <option value="manager">Responsable / Manager</option>
            </select>
          </div>

          {role === "qualiticien" && (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Qualiticien</div>
              <select className="select" style={{ width: "100%" }} value={name} onChange={(e) => setName(e.target.value)}>
                {QUALITICIENS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          )}

          <button className="btn btnDark" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit}>
            Entrer →
          </button>
        </div>
      </div>
    </div>
  );
}
