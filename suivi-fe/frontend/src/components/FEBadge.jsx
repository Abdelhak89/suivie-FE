import React, { useState } from "react";
import FEHistoriqueModal from "./FEHistoriqueModal";
import "../styles/FEBadge.css";


export default function FEBadge({
  codeArticle,
  count = 0,
  enCours = 0,
  site = "soucy",
  designation = "",
}) {
  const [open, setOpen] = useState(false);
 
  if (!count) return null;
 
  const hasAlert = enCours > 0;
 
  return (
    <>
      <span
        className={`fe-badge ${hasAlert ? "fe-badge--alert" : "fe-badge--ok"}`}
        title={`${count} FE — ${enCours} en cours`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {count} FE{enCours > 0 ? ` · ${enCours}⚠` : ""}
      </span>
 
      {open && (
        <FEHistoriqueModal
          codeArticle={codeArticle}
          designation={designation}
          site={site}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}