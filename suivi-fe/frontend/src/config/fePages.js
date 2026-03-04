// ===============================
// CONFIG "tableau à remplir" (VERSION MODIFIÉE)
// ===============================
export const PAGES = {
  "interne-serie": {
    title: "Interne série",
    filters: { origine: "CINT" },
    groups: [
      { label: "Suivi", columns: ["N° FE", "QUAND", "Statut"] },
      {
        label: "Quoi",
        columns: ["REF", "Désignation", "Lancement", "Description"],
      },
      { label: "Combien", columns: ["Qté NC", "Qté Produite"] },
      { label: "Où", columns: ["Type NC", "Détection"] },
      {
        label: "Responsabilités",
        columns: [
          "Animateur",        // ✅ AJOUTÉ : Menu déroulant Animateur Qualité
          "Support",          // ✅ AJOUTÉ : Menu déroulant Personne Support
        ],
      },
      {
        label: "Comment",
        columns: [
          "D2R",
          "Analyse",
          "Ilot Générateur",
          "Plan d'action",
          "Mesure Eff.",      // ✅ MODIFIÉ : Checkbox (au lieu de "Mesure efficacité")
        ],
      },
    ],
  },
  
  "interne-fai": {
    title: "Interne FAI",
    filters: { origine: "CINT" },
    groups: [
      { label: "Suivi", columns: ["N° FE", "QUAND", "Statut"] },
      {
        label: "Quoi",
        columns: ["REF", "Désignation", "Lancement", "Description"],
      },
      { label: "Combien", columns: ["Qté NC", "Qté Lct", "Qté Produite"] },
      { label: "Où", columns: ["Type NC", "Lieu", "Détection"] },
      {
        label: "Responsabilités",
        columns: [
          "Animateur",        // ✅ AJOUTÉ
          "Support",          // ✅ AJOUTÉ
          "Ilot Générateur"
        ],
      },
      {
        label: "Comment",
        columns: [
          "Analyse",
          "Plan d'action",
          "Mesure Eff.",      // ✅ MODIFIÉ : Checkbox
          "Commentaires",
        ],
      },
    ],
  },

  client: {
    title: "Client",
    filters: { origine: "RCLI" },
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
      {
        label: "Responsabilités",
        columns: [
          "Pilote NC",
          "Animateur",        // ✅ AJOUTÉ
          "Support",          // ✅ AJOUTÉ
        ],
      },
      {
        label: "Traitement",
        columns: [
          "D2R",
          "Sécurisation",
          "Actions conservatoires",
          "Causes",
          "Actions correctives",
          "Actions préventives",
          "Mesure Eff.",      // ✅ MODIFIÉ : Checkbox
          "Clôture",
        ],
      },
    ],
  },

  fournisseur: {
    title: "Fournisseur",
    filters: { origine: "DFOU" },
    groups: [
      { label: "Suivi", columns: ["N° FE", "QUAND", "Statut"] },
      {
        label: "Quoi",
        columns: ["REF", "Désignation", "Lancement", "Commande", "Description"],
      },
      { label: "Combien", columns: ["Qté NC", "Qté reçu"] },
      { label: "Où", columns: ["Lieu", "Fournisseur"] },
      {
        label: "Responsabilités",
        columns: [
          "Pilote NC",
          "Animateur",        // ✅ AJOUTÉ
          "Support",          // ✅ AJOUTÉ
        ],
      },
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