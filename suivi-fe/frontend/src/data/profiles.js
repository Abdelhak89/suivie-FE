// src/data/profiles.js
export const PROFILES = [
  {
    key: "blanquart-nicolas",
    label: "BLANQUART Nicolas",
    clientCodes: ["141", "162", "150", "214", "148", "142", "240"],
    kind: "qualiticien",
  },
  {
    key: "brisdet-trystan",
    label: "BRISDET Trystan",
    clientCodes: ["151"],
    kind: "qualiticien",
  },
  {
    key: "doby-sandrine",
    label: "DOBY Sandrine",
    clientCodes: ["193", "393"],
    kind: "qualiticien",
  },
  {
    key: "sanchez-wright-juliette",
    label: "SANCHEZ WRIGHT Juliette",
    clientCodes: ["182", "162", "150", "214", "154"],
    kind: "qualiticien",
  },
  {
    key: "sdraulig-florence",
    label: "SDRAULIG Florence",
    clientCodes: ["141", "148", "143", "250"],
    kind: "qualiticien",
  },

  // cartes spéciales
  { key: "responsable", label: "Responsable", kind: "responsable", clientCodes: [] },
  { key: "all", label: "Toutes les FE", kind: "all", clientCodes: [] },
];

export function getProfileByKey(key) {
  return PROFILES.find((p) => p.key === key) || null;
}
