export default function PlaceholderPage({ title }) {
  return (
    <div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <div style={{ marginTop: 10, color: "#666" }}>
        Page en attente (on la remplira après).
      </div>
    </div>
  );
}
