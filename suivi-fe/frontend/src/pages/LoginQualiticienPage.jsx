import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSession } from "../auth/session";

const QUALITICIENS = [
  "BLANQUART Nicolas",
  "BRISDET Trystan",
  "DOBY Sandrine",
  "SANCHEZ WRIGHT Juliette",
  "SDRAULIG Florence",
];

export default function LoginPage() {
  const nav = useNavigate();
  const [role, setRole] = useState("qualiticien");
  const [name, setName] = useState(QUALITICIENS[0]);

  const submit = () => {
    if (role === "manager") {
      setSession({ role: "manager", name: "Responsable" });
      nav("/manager", { replace: true });
      return;
    }

    setSession({ role: "qualiticien", name });
    nav("/dashboard", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f4f6" }}>
      <div style={{ width: 520, background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18 }}>
        <h2 style={{ margin: 0 }}>Connexion</h2>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#6b7280", fontSize: 13 }}>Profil</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={input}>
              <option value="qualiticien">Qualiticien</option>
              <option value="manager">Responsable / Manager</option>
            </select>
          </label>

          {role === "qualiticien" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>Qualiticien</span>
              <select value={name} onChange={(e) => setName(e.target.value)} style={input}>
                {QUALITICIENS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </label>
          )}

          <button onClick={submit} style={btn}>
            Entrer
          </button>
        </div>
      </div>
    </div>
  );
}

const input = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
};

const btn = {
  marginTop: 8,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};
