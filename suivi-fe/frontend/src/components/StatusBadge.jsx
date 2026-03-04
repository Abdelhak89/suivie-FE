// src/components/StatusBadge.jsx
import "../styles/badge.css";

function getTone(status) {
  const s = String(status || "").trim().toLowerCase();
  if (!s) return "muted";
  if (s.includes("clôt") || s.includes("clos") || s.includes("term") || s.includes("trait")) return "success";
  if (s.includes("retard") || s.includes("bloq") || s.includes("ko")) return "danger";
  if (s.includes("en cours") || s.includes("cours")) return "warning";
  if (s.includes("ouvert") || s.includes("nouveau") || s.includes("à faire")) return "info";
  return "neutral";
}

export default function StatusBadge({ value }) {
  return (
    <span className={`badge badge--${getTone(value)}`}>
      {String(value || "—")}
    </span>
  );
}
