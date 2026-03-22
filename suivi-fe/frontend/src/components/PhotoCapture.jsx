// src/components/PhotoCapture.jsx
// Zone d'ajout de photo universelle
// — Desktop : upload depuis fichier
// — Mobile/tablette : ouvre l'appareil photo directement
import { useRef } from "react";

export default function PhotoCapture({
  onPhoto,           // callback(base64string)
  label = "Ajouter une photo",
  icon  = "📷",
  accept = "image/*",
  multiple = false,
  style = {},
  className = "",
}) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => onPhoto(ev.target.result, file.name);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <label
      className={`photo-capture-zone ${className}`}
      style={style}
      onClick={() => inputRef.current?.click()}
    >
      <span className="photo-capture-icon">{icon}</span>
      <span className="photo-capture-label">{label}</span>
      <span className="photo-capture-sub">Photo ou fichier depuis la galerie</span>

      {/* 
         → ouvre l'appareil photo arrière sur mobile
        Si on veut laisser le choix entre galerie et caméra, on n'utilise PAS capture
        Sur iOS/Android, sans capture= l'OS propose une feuille avec les options
      */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </label>
  );
}

/**
 * Variante photo — ouvre le sélecteur natif de l'OS
 * Sur mobile : l'OS propose "Prendre une photo" OU "Choisir dans la galerie"
 * Sur desktop : ouvre l'explorateur de fichiers
 * Ne PAS utiliser capture= pour laisser le choix à l'utilisateur
 */
export function PhotoCaptureCamera({ onPhoto, label = "Ajouter une photo", style = {} }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onPhoto(ev.target.result, file.name);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <label className="photo-capture-zone" style={{ borderColor: "rgba(0,113,227,0.3)", background: "rgba(0,113,227,0.04)", ...style }}>
      <span className="photo-capture-icon">📷</span>
      <span className="photo-capture-label" style={{ color: "#0071e3" }}>{label}</span>
      <span className="photo-capture-sub">📸 Prendre une photo  •  🖼️ Choisir depuis la galerie</span>
      {/* Sans capture= → l'OS mobile propose les deux options */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </label>
  );
}