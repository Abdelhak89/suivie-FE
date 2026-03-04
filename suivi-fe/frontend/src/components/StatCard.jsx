// src/components/StatCard.jsx
import "../styles/app.css";

export default function StatCard({ label, value, sub, accent }) {
  return (
    <div className="statCard" style={accent ? { borderTopColor: accent, borderTopWidth: 3 } : {}}>
      <div className="statCard__label">{label}</div>
      <div className="statCard__value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="statCard__sub">{sub}</div>}
    </div>
  );
}
