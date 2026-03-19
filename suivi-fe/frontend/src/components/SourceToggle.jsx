// src/components/SourceToggle.jsx
// Toggle Diapason / App — à mettre dans le header de chaque page
import { T } from "../styles/appleTokens.js";

export default function SourceToggle({ source, onChange, appCount, diapasonCount, diapasonLabel = "SILOG" }) {
  const opts = [
    { key: "diapason", label: `${diapasonLabel}${diapasonCount != null ? ` (${diapasonCount})` : ""}` },
    { key: "app",      label: `App KEP${appCount != null ? ` (${appCount})` : ""}` },
  ];

  return (
    <div style={{
      display: "inline-flex", borderRadius: 10, overflow: "hidden",
      border: `1.5px solid ${T.border}`, background: T.surface,
    }}>
      {opts.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: "7px 16px", border: "none", cursor: "pointer",
            fontFamily: T.font, fontSize: 12, fontWeight: 600,
            background: source === key ? T.accent : "transparent",
            color:      source === key ? "#fff"   : T.muted,
            transition: "all .12s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}