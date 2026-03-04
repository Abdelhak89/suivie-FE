// src/data/ncData.js
// Données extraites des documents : 8D, causes NC par îlot, causes de non-détection

// ── Îlots / Process ──────────────────────────────────────────────
export const ILOTS = [
  "PRESSE",
  "MÉCANIQUE",
  "OUTILLAGE",
  "PLIAGE NUMÉRIQUE",
  "ÉMERISAGE",
  "ÉBAVURAGE",
  "DÉGRAISSAGE",
  "SABLAGE",
  "VERNISSAGE",
  "SOUDURE",
  "SERTISSAGE RIVETS",
];

// ── Actions immédiates ───────────────────────────────────────────
export const ACTIONS_IMMEDIATES = [
  "Blocage du lot",
  "Tri 100 %",
  "Retouche",
  "Mise au rebut",
  "Information client",
];

// ── Famille Ishikawa (6M) ────────────────────────────────────────
export const FAMILLES_ISHIKAWA = [
  "Méthode",
  "Machine",
  "Matière",
  "Main d'œuvre",
  "Milieu",
  "Mesure",
];

// ── Causes Ishikawa génériques par famille ───────────────────────
export const CAUSES_ISHIKAWA_GENERIQUES = {
  "Méthode": [
    "Gamme inexistante / obsolète",
    "Instruction non claire ou non respectée",
    "Paramètres process non définis / non maîtrisés",
    "Absence contrôle intermédiaire",
    "Traçabilité incomplète",
    "Séquence d'opérations inversée",
    "Tolérances mal interprétées",
    "Mode opératoire incomplet",
    "Absence AMDEC process",
    "Absence validation première pièce",
    "Absence SPC sur cotes critiques",
    "Mauvaise gestion rebuts / retouches",
    "Paramètres non figés après validation",
  ],
  "Machine": [
    "Machine mal réglée",
    "Usure / dérive machine",
    "Maintenance insuffisante",
    "Manque de répétabilité",
    "Défaut d'alignement / parallélisme",
    "Mauvaise calibration capteur",
    "Micro-arrêts non détectés",
    "Absence contrôle géométrie machine",
  ],
  "Matière": [
    "Matière hors spécification",
    "Épaisseur / dureté variable",
    "Certificat matière non conforme",
    "Mauvaise identification lot",
    "Variation intra-lot",
    "Mauvais sens fibre",
    "Oxydation surface",
    "Lubrification insuffisante / excessive",
    "Mélange lots matière",
  ],
  "Main d'œuvre": [
    "Formation insuffisante",
    "Qualification non valide",
    "Erreur humaine",
    "Non-respect standard",
    "Mauvais réglage initial",
    "Oubli verrouillage réglage",
    "Absence autocontrôle",
    "Pression production excessive",
    "Mauvaise interprétation tolérance géométrique",
  ],
  "Milieu": [
    "Température non maîtrisée",
    "Hygrométrie non conforme",
    "Propreté / FOD",
    "Organisation poste",
    "Éclairage insuffisant",
    "Poste encombré",
    "Manutention générant déformation",
    "Stockage non adapté",
    "Courants d'air",
    "Vibrations sol",
  ],
  "Mesure": [
    "Moyen non étalonné / inadapté",
    "Méthode de mesure non définie",
    "Conditions de mesure non maîtrisées",
    "Erreur lecture plan",
    "Instrument usé",
    "Logiciel contrôle mal paramétré",
    "Mauvais programme MMT",
    "Défaut gabarit / comparateur",
    "Mauvais positionnement pièce sur marbre",
  ],
};

// ── Causes Ishikawa par îlot (spécifiques) ──────────────────────
export const CAUSES_PAR_ILOT = {
  "PRESSE": {
    "Machine": [
      "Presse mal réglée (course / effort / vitesse)",
      "Variabilité effort au point mort bas",
      "Défaut de parallélisme coulisseau / table",
      "Jeu excessif colonnes / guidages",
      "Usure système amortisseur",
      "Défaut centrage bande",
      "Défaillance système alimentation automatique",
      "Mauvaise synchronisation avance bande",
      "Maintenance préventive non réalisée",
    ],
    "Méthode": [
      "Paramètres non figés après validation",
      "Fiche réglage inexistante",
      "Mauvaise gestion changements série",
      "Absence validation première pièce",
      "Absence SPC sur cotes critiques",
      "Mode opératoire incomplet",
      "Séquence d'opérations inversée",
      "Pas de maîtrise retour élastique",
    ],
    "Matière": [
      "Variation épaisseur intra-lot",
      "Variation dureté intra-lot",
      "Bande voilée",
      "Présence bavures matière brute",
      "Mauvaise planéité",
      "Lubrification insuffisante / excessive",
      "Mauvais sens fibre",
      "Mauvais certificat matière",
    ],
    "Main d'œuvre": [
      "Mauvais réglage initial",
      "Non-respect fiche réglage",
      "Oubli verrouillage réglage",
      "Mauvaise insertion bande",
      "Non-déclaration anomalie machine",
      "Absence autocontrôle",
      "Erreur sélection programme",
      "Pression production excessive",
    ],
    "Milieu": [
      "Température variable impactant dilatation",
      "Éclairage insuffisant",
      "Poste encombré",
      "Flux logistique perturbé",
      "Manutention générant déformation",
      "Stockage vertical non adapté",
      "Risque chocs inter-postes",
    ],
  },

  "MÉCANIQUE": {
    "Machine": [
      "Défaut perpendicularité axes",
      "Backlash excessif",
      "Dérive thermique broche",
      "Refroidissement machine insuffisant",
      "Pression arrosage insuffisante",
      "Bouchage buses arrosage",
      "Défaut serrage mandrin",
      "Usure mors",
      "Mauvaise calibration palpeur",
    ],
    "Méthode": [
      "Mauvaise stratégie d'usinage",
      "Mauvais ordre des opérations",
      "Absence stabilisation thermique",
      "Mauvaise gestion compensations",
      "Mauvaise prise origine",
      "Mauvaise définition tolérances dans programme",
      "Absence validation FAO",
      "Pas de verrouillage programme",
      "Mauvaise gestion outils vie série",
    ],
    "Matière": [
      "Tensions internes non libérées",
      "Mauvais traitement thermique préalable",
      "Inclusion matière",
      "Porosité",
      "Mauvais état brut sciage",
      "Mélange lots matière",
    ],
    "Main d'œuvre": [
      "Mauvais montage pièce",
      "Serrage excessif → déformation",
      "Mauvais choix outil",
      "Mauvaise saisie correcteur",
      "Oubli compensation usure",
      "Mauvaise interprétation tolérance géométrique",
      "Absence autocontrôle",
      "Validation pièce à chaud",
    ],
    "Milieu": [
      "Température atelier fluctuante",
      "Courants d'air",
      "Pollution copeaux",
      "Humidité excessive",
      "Sol non stable (vibration)",
    ],
  },

  "OUTILLAGE": {
    "Machine": [
      "Mauvaise précision usinage outil",
      "Défaut rectification",
      "Défaut traitement thermique",
      "Mauvaise maîtrise trempe",
    ],
    "Méthode": [
      "Conception non revue",
      "Mauvaise prise en compte effort presse",
      "Absence simulation",
      "Tolérances non adaptées au process",
      "Pas de plan maintenance outil",
      "Mauvaise gestion modifications outil",
    ],
    "Matière": [
      "Acier outil inadapté",
      "Dureté non conforme",
      "Fissuration post traitement",
      "Mauvaise traçabilité acier",
    ],
    "Main d'œuvre": [
      "Mauvais ajustage",
      "Mauvais montage éléments",
      "Mauvaise lecture plan ensemble",
      "Mauvaise interprétation essais",
    ],
    "Milieu": [
      "Mauvais stockage outils",
      "Corrosion",
      "Chocs lors manutention",
    ],
  },

  "PLIAGE NUMÉRIQUE": {
    "Machine": [
      "Défaut parallélisme tablier",
      "Butées arrière mal calibrées",
      "Défaut capteur angle",
      "Jeu glissières",
    ],
    "Méthode": [
      "Mauvaise compensation ressort",
      "Mauvais choix matrice",
      "Ordre pliage inadapté",
      "Absence simulation pliage",
      "Mauvaise gestion séquence pliage",
    ],
    "Matière": [
      "Variation module élastique",
      "Surface rayée avant pliage",
      "Traitement thermique préalable",
    ],
    "Main d'œuvre": [
      "Mauvaise orientation pièce",
      "Mauvaise lecture sens laminage",
      "Oubli retournement pièce",
    ],
    "Milieu": [
      "Température influençant retour élastique",
      "Stockage à plat non maîtrisé",
    ],
  },

  "ÉBAVURAGE": {
    "Machine": [
      "Vitesse rotation incorrecte",
      "Défaut centrifugeuse",
      "Minuterie défaillante",
    ],
    "Méthode": [
      "Mauvais ratio média/pièces",
      "Absence validation temps cycle",
      "Pas de standard état de surface",
      "Mauvaise classification pièces fragiles",
    ],
    "Matière": [
      "Arêtes trop vives initialement",
      "Matière fragile",
      "Dureté variable",
    ],
    "Main d'œuvre": [
      "Mauvais chargement",
      "Mauvais contrôle sortie",
      "Mélange pièces différentes",
    ],
    "Milieu": [
      "Contamination médias",
      "Mauvais stockage abrasifs",
    ],
  },

  "ÉMERISAGE": {
    "Machine": [
      "Vitesse rotation incorrecte",
      "Minuterie défaillante",
    ],
    "Méthode": [
      "Absence validation temps cycle",
      "Pas de standard état de surface",
    ],
    "Matière": ["Dureté variable", "Matière fragile"],
    "Main d'œuvre": ["Mauvais contrôle sortie", "Mélange pièces différentes"],
    "Milieu": ["Contamination médias", "Mauvais stockage abrasifs"],
  },

  "DÉGRAISSAGE": {
    "Machine": [
      "Défaut ultrason",
      "Défaut filtration",
      "Défaut thermostat",
      "Défaut agitation",
    ],
    "Méthode": [
      "Produit mal dosé",
      "Temps immersion insuffisant",
      "Absence test propreté",
      "Mauvaise séquence lavage/rinçage",
    ],
    "Matière": [
      "Contamination initiale importante",
      "Zones borgnes",
      "Géométrie complexe",
    ],
    "Main d'œuvre": [
      "Empilement excessif",
      "Mauvais positionnement paniers",
      "Non-respect fréquence renouvellement bain",
    ],
    "Milieu": [
      "Bain saturé",
      "Contamination croisée",
      "Humidité ambiante élevée",
    ],
  },

  "SABLAGE": {
    "Machine": [
      "Usure buse",
      "Pression instable",
      "Défaut régulateur",
      "Défaut extraction poussières",
    ],
    "Méthode": [
      "Distance projection incorrecte",
      "Temps insuffisant",
      "Mauvais angle projection",
      "Mauvaise séquence masquage",
    ],
    "Matière": ["Surface huileuse", "Matière trop fine", "Inclusion surface"],
    "Main d'œuvre": [
      "Mauvaise manipulation",
      "Masquage mal posé",
      "Contrôle visuel insuffisant",
    ],
    "Milieu": ["Humidité", "Pollution média", "Poussière résiduelle"],
  },

  "VERNISSAGE": {
    "Machine": ["Pression air incorrecte", "Buse obstruée", "Défaut cabine"],
    "Méthode": [
      "Mauvais mélange produit",
      "Non-respect temps entre couches",
      "Mauvaise préparation surface",
      "Épaisseur non contrôlée",
      "Absence contrôle adhérence",
    ],
    "Matière": ["Produit périmé", "Surface contaminée", "Support incompatible"],
    "Main d'œuvre": [
      "Mauvaise technique pulvérisation",
      "Distance irrégulière",
      "Mauvais dosage",
    ],
    "Milieu": [
      "Hygrométrie élevée",
      "Température non conforme",
      "Poussières",
      "Courants d'air",
    ],
  },

  "SOUDURE": {
    "Machine": [
      "Intensité instable",
      "Défaut alimentation gaz",
      "Fuite gaz",
      "Mauvais calibrage poste",
      "Défaut dévidoir",
    ],
    "Méthode": [
      "Paramètres hors WPS",
      "Mauvaise préparation joint",
      "Séquence passes incorrecte",
      "Absence préchauffage",
      "Absence contrôle visuel intermédiaire",
    ],
    "Matière": [
      "Contamination surface",
      "Mauvaise nuance métal",
      "Métal d'apport incorrect",
      "Oxydation",
    ],
    "Main d'œuvre": [
      "Qualification expirée",
      "Non-respect WPS",
      "Mauvaise position",
      "Mauvaise vitesse d'avance",
      "Mauvais angle torche",
    ],
    "Milieu": [
      "Courants d'air",
      "Humidité élevée",
      "Température basse",
      "Zone mal protégée",
    ],
  },

  "SERTISSAGE RIVETS": {
    "Machine": [
      "Absence contrôle effort sertissage",
      "Défaut gabarit d'assemblage",
      "Mauvaise calibration outil",
    ],
    "Méthode": [
      "Absence contrôle hauteur rivet",
      "Absence contrôle visuel final",
      "Absence contrôle couple serrage",
    ],
    "Matière": ["Rivet hors spécification", "Mauvaise identification lot"],
    "Main d'œuvre": [
      "Mauvais positionnement rivet",
      "Effort sertissage inadapté",
      "Absence autocontrôle",
    ],
    "Milieu": ["Poste encombré", "Éclairage insuffisant"],
  },
};

// ── Causes de non-détection ──────────────────────────────────────
export const CAUSES_NON_DETECTION_GENERIQUES = {
  "Méthode": [
    "Contrôle non prévu dans la gamme",
    "Point de contrôle mal positionné dans le flux",
    "Fréquence de contrôle insuffisante",
    "Contrôle par échantillonnage inadapté",
    "Absence de contrôle sur cote critique",
    "Tolérance mal interprétée",
    "Plan de surveillance inexistant",
    "AMDEC process incomplète",
    "Cote critique non identifiée comme telle",
    "Absence de double validation",
    "Pas de contrôle après changement série",
    "Pas de contrôle après maintenance",
    "Pas de contrôle après réglage machine",
    "Autocontrôle non formalisé",
    "Absence SPC sur caractéristique instable",
  ],
  "Main d'œuvre": [
    "Contrôle non réalisé",
    "Contrôle réalisé partiellement",
    "Mauvaise lecture du plan",
    "Mauvaise interprétation tolérance géométrique",
    "Mauvaise utilisation du moyen de mesure",
    "Erreur de lecture instrument",
    "Contrôle trop rapide",
    "Fatigue / surcharge",
    "Manque formation contrôle",
    "Manque connaissance exigences client",
    "Validation visuelle trop subjective",
    "Confiance excessive dans le process",
    "Habitude de production sans recontrôle",
  ],
  "Matière": [
    "Pièce contrôlée à chaud",
    "Pièce déformée après contrôle",
    "Surface masquant le défaut",
    "Défaut interne non visible",
    "Défaut intermittent",
  ],
  "Milieu": [
    "Température non maîtrisée",
    "Hygrométrie élevée",
    "Éclairage insuffisant",
    "Zone contrôle encombrée",
    "Bruit / distraction",
    "Mauvaise ergonomie poste contrôle",
  ],
  "Machine": [
    "Moyen non étalonné",
    "Moyen hors tolérance",
    "Moyen inadapté à la précision requise",
    "Instrument usé",
    "Palpeur mal calibré",
    "Logiciel contrôle mal paramétré",
    "Mauvais programme MMT",
    "Défaut comparateur",
    "Défaut gabarit",
    "Gabarit non conforme",
    "Mauvais positionnement pièce sur marbre",
    "Absence de vérification périodique moyens",
  ],
};

// ── Causes de non-détection spécifiques par process ─────────────
export const CAUSES_NON_DETECTION_PAR_ILOT = {
  "PRESSE": [
    "Pas de contrôle après affûtage outil",
    "Pas de contrôle après changement bande",
    "Dérive progressive non surveillée",
    "Bavure non détectée en autocontrôle",
    "Contrôle uniquement en début série",
    "Absence surveillance usure outil",
  ],
  "MÉCANIQUE": [
    "Absence contrôle après changement outil",
    "Pas de contrôle après correction CN",
    "Validation première pièce non formalisée",
    "Contrôle uniquement en fin série",
    "Oubli compensation usure outil",
    "Pièce validée à chaud",
  ],
  "PLIAGE NUMÉRIQUE": [
    "Angle mesuré sans outil adapté",
    "Pas de contrôle après ajustement angle",
    "Non-vérification retour élastique",
    "Contrôle sur une seule pièce lot",
  ],
  "ÉBAVURAGE": [
    "Absence contrôle arrêtes critiques",
    "Échantillonnage insuffisant",
    "Sur-ébavurage non détecté",
  ],
  "DÉGRAISSAGE": [
    "Absence test contamination",
    "Pas de contrôle film résiduel",
    "Contrôle visuel uniquement",
  ],
  "SABLAGE": [
    "Rugosité non mesurée",
    "Masquage non vérifié",
    "Contrôle visuel insuffisant",
  ],
  "VERNISSAGE": [
    "Absence mesure épaisseur vernis",
    "Pas de contrôle séchage complet",
    "Pas de contrôle adhérence",
    "Inspection réalisée avant polymérisation complète",
  ],
  "SOUDURE": [
    "Pas de contrôle visuel des passes intermédiaires",
    "Non-vérification paramètres soudage",
    "Absence contrôle dimension après refroidissement",
    "Absence NDT si requis",
  ],
  "SERTISSAGE RIVETS": [
    "Absence contrôle effort",
    "Absence contrôle visuel écrasement",
    "Absence gabarit validation",
    "Contrôle uniquement aléatoire",
  ],
};

// ── Méthodes de vérification d'efficacité ───────────────────────
export const VERIF_EFFICACITE = ["Audit", "SPC", "Contrôle renforcé", "Suivi statistique", "Autre"];

// ── Résultats vérification ───────────────────────────────────────
export const RESULTAT_VERIF = ["Efficace", "Partiellement efficace", "Non efficace"];

// ── Détecté par ──────────────────────────────────────────────────
export const DETECTE_PAR = ["Production", "Contrôle", "Client", "Audit", "Autre"];

// ── Type NC ──────────────────────────────────────────────────────
export const TYPE_NC = ["Client", "Interne", "Fournisseur", "FAI"];

// ── FAI sous-type ────────────────────────────────────────────────
export const FAI_TYPE = ["1er Article", "FAB SUP 24 mois", "Évolution"];

// ── Fournisseur site ─────────────────────────────────────────────
export const FOURNISSEUR_SITE = ["KMTM", "LAXOU", "SOUCY", "Autres"];

// ── Types de défaut (aspect, dimensionnel…) ──────────────────────
export const TYPES_DEFAUT = [
  "Aspect",
  "Dimensionnel",
  "Géométrique",
  "Matière",
  "Fonctionnel",
  "Assemblage",
  "Marquage / Traçabilité",
  "Documentation",
];