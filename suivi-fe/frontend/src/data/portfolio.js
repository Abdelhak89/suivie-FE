// src/data/portfolio.js
export const QUALITICIENS = [
  "BLANQUART Nicolas",
  "BRISDET Trystan",
  "DOBY Sandrine",
  "SANCHEZ WRIGHT Juliette",
  "SDRAULIG Florence",
];

// ✅ A REMPLIR : codes client (3 premiers de REF) attribués
export const PORTFOLIO_BY_QUALITICIEN = {
  "BLANQUART Nicolas": ["141", "162", "150", "214", "148", "142", "240"],
  "BRISDET Trystan": ["151"], // exemple
  "SANCHEZ WRIGHT Juliette": ["182","162","150","214","154"], // exemple
  "SDRAULIG Florence": ["141", "148", "143", "250"], // exemple
  "DOBY Sandrine": ["193", "393"], // exemple
};

export const PROFILES = {
  all: { key: "all", label: "Toutes les FE", role: "all", clientCodes: [] },
  manager: { key: "manager", label: "Responsable", role: "manager", clientCodes: [] },
};
