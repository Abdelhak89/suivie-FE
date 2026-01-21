import "../styles/badge.css";

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

function getTone(status) {
  const s = normalize(status);

  if (!s) return "muted";

  // à adapter plus tard selon vos vrais statuts
  if (s.includes("clôt") || s.includes("clos") || s.includes("term")) return "success";
  if (s.includes("retard") || s.includes("bloq") || s.includes("ko")) return "danger";
  if (s.includes("en cours") || s.includes("cours") || s.includes("trait")) return "warning";
  if (s.includes("ouvert") || s.includes("nouveau") || s.includes("à faire") || s.includes("a faire")) return "info";

  return "neutral";
}

export default function StatusBadge({ value }) {
  const tone = getTone(value);
  const label = String(value || "—");

  return <span className={`badge badge--${tone}`}>{label}</span>;
}
