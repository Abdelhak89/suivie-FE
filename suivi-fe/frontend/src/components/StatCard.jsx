// frontend/src/components/StatCard.jsx
export default function StatCard({ label, value, sub }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 14,
      background: "white",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }}>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {sub ? <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}
