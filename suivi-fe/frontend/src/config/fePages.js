// ===============================
// MENU (Sidebar)
// ===============================
export const MENU = [
  { key: "dashboard", label: "Accueil", path: "/dashboard" },
  { key: "manager", label: "Manager", path: "/manager" },

  { key: "interne-serie", label: "Interne série", path: "/interne-serie" },
  { key: "interne-fai", label: "Interne FAI", path: "/interne-fai" },
  { key: "client", label: "Client", path: "/client" },
  { key: "fournisseur", label: "Fournisseur", path: "/fournisseur" },
  { key: "derogation", label: "Dérogation", path: "/derogation" },
  { key: "kpi", label: "KPI", path: "/kpi" },
  { key: "alerte-qualite", label: "Alerte qualité", path: "/alerte-qualite" },
  {
    key: "clinique-qualite",
    label: "Clinique qualité",
    path: "/clinique-qualite",
  },
];
// ===============================
// CONFIG “tableau à remplir”
// ===============================
export const PAGES = {
  "interne-serie": {
    title: "Interne série",
    groups: [
      { label: "Suivi", columns: ["N° FE", "QUAND", "Statut"] },
      {
        label: "Quoi",
        columns: ["REF", "Désignation", "Lancement", "Description"],
      },
      { label: "Combien", columns: ["Qté NC", "Qté Produite"] },
      { label: "Où", columns: ["Type NC", "Détection"] }, // ✅ Détection = Lieu Detection (Excel)
      {
        label: "Comment",
        columns: [
          "D2R",
          "Analyse", // ✅ nouvelle colonne (popup 6M)
          "Ilot Générateur", // ✅ = ILOT GENERATEUR (Excel)
          "Plan d'action", // ✅ pastille 🟠/🟢 + popup
          "Mesure efficacité",
        ],
      },
      // exemple : Interne série
      
    ],
  },
  "interne-fai": {
    title: "Interne FAI",
    groups: [
      { label: "Suivi", columns: ["N° FE", "QUAND", "Statut", "Animateur"] },
      {
        label: "Quoi",
        columns: ["REF", "Désignation", "Lancement", "Description"],
      },
      { label: "Combien", columns: ["Qté NC", "Qté Lct", "Qté Produite"] },
      { label: "Où", columns: ["Type NC", "Lieu", "Détection"] },
      { label: "Qui", columns: ["Pilote QSE", "Ilot Générateur"] },
      {
        label: "Comment",
        columns: [
          "Analyse",
          "Plan d'action",
          "Mesure efficacité",
          "Commentaires",
        ],
      },
    ],
  },

  client: {
    title: "Client",
    groups: [
      {
        label: "Suivi",
        columns: ["N° FE", "Client", "NC client", "QUAND", "Statut"],
      },
      {
        label: "Quoi",
        columns: [
          "REF",
          "Désignation",
          "Lancement",
          "Commande",
          "Description",
          "Typologie défaut",
        ],
      },
      { label: "Combien", columns: ["Qté NC", "Qté Lct"] },
      { label: "Où", columns: ["Type NC", "Lieu"] },
      { label: "Qui", columns: ["Pilote NC"] },
      {
        label: "Traitement",
        columns: [
          "D2R",
          "Sécurisation",
          "Actions conservatoires",
          "Causes",
          "Actions correctives",
          "Actions préventives",
          "Mesure efficacité",
          "Clôture",
        ],
      },
    ],
  },

  fournisseur: {
    title: "Fournisseur",
    groups: [
      { label: "Suivi", columns: ["N° FE", "QUAND", "Statut"] },
      {
        label: "Quoi",
        columns: ["REF", "Désignation", "Lct", "Commande", "Description"],
      },
      { label: "Combien", columns: ["Qté NC", "Qté reçu"] },
      { label: "Où", columns: ["Lieu", "Fournisseur"] },
      { label: "Qui", columns: ["Pilote NC"] },
      {
        label: "Réclamation",
        columns: [
          "Date réclamation",
          "Contact",
          "Date envoi réclamation",
          "8D / Analyse réception",
          "Moyen",
          "Clôture",
        ],
      },
    ],
  },
};
