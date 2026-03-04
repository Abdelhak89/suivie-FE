// src/pages/PlaceholderPage.jsx
import "../styles/app.css";

export default function PlaceholderPage({ title }) {
  return (
    <div className="container">
      <div className="pageHead">
        <h2 className="h1">{title}</h2>
      </div>
      <div className="panel">
        <div className="sub">Page en cours de développement.</div>
      </div>
    </div>
  );
}
