// utils/heuresOuvrees.js
// Calcule une date en ajoutant N heures ouvrées
// Heures ouvrées : lun-ven 8h-18h, hors jours fériés français

function getJoursFeries(year) {
  const feries = [];
  feries.push(`${year}-01-01`);
  feries.push(`${year}-05-01`);
  feries.push(`${year}-05-08`);
  feries.push(`${year}-07-14`);
  feries.push(`${year}-08-15`);
  feries.push(`${year}-11-01`);
  feries.push(`${year}-11-11`);
  feries.push(`${year}-12-25`);

  // Pâques
  const a = year % 19, b = Math.floor(year/100), c = year%100;
  const d = Math.floor(b/4), e = b%4, f = Math.floor((b+8)/25);
  const g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15)%30;
  const i = Math.floor(c/4), k = c%4, l = (32+2*e+2*i-h-k)%7;
  const m = Math.floor((a+11*h+22*l)/451);
  const month = Math.floor((h+l-7*m+114)/31);
  const day   = ((h+l-7*m+114)%31)+1;
  const paques = new Date(year, month-1, day);

  const lundi = new Date(paques); lundi.setDate(paques.getDate()+1);
  feries.push(fmt(lundi));
  const ascension = new Date(paques); ascension.setDate(paques.getDate()+39);
  feries.push(fmt(ascension));
  const pentecote = new Date(paques); pentecote.setDate(paques.getDate()+50);
  feries.push(fmt(pentecote));

  return new Set(feries);
}

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

const HEURE_DEBUT = 8;  // 8h00
const HEURE_FIN   = 18; // 18h00
const HEURES_PAR_JOUR = HEURE_FIN - HEURE_DEBUT; // 10h ouvrées/jour

function isJourOuvre(date, feries) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // week-end
  return !feries.has(fmt(date));
}

/**
 * Ajoute N heures ouvrées à une date de départ
 * @param {Date|string} startDate
 * @param {number} heures — heures ouvrées à ajouter (ex: 48)
 * @returns {Date}
 */
export function addHeuresOuvrees(startDate, heures = 48) {
  const start = new Date(startDate);

  // Pré-charger les fériés (start + ~15 jours max pour 48h)
  const yearStart = start.getFullYear();
  const yearEnd   = new Date(start.getTime() + 20 * 86400000).getFullYear();
  const feries    = new Set([
    ...getJoursFeries(yearStart),
    ...(yearEnd !== yearStart ? getJoursFeries(yearEnd) : []),
  ]);

  let restant = heures;
  let current = new Date(start);

  // Si on démarre hors heures ouvrées, avancer au prochain créneau ouvré
  current = prochainCreneauOuvre(current, feries);

  while (restant > 0) {
    // Heures disponibles aujourd'hui depuis l'heure courante
    const heureActuelle = current.getHours() + current.getMinutes() / 60;
    const dispoDuJour   = Math.max(0, HEURE_FIN - heureActuelle);

    if (restant <= dispoDuJour) {
      // On finit dans la même journée
      current = new Date(current.getTime() + restant * 3600000);
      restant = 0;
    } else {
      // On consomme le reste de la journée et on passe au lendemain
      restant -= dispoDuJour;
      // Aller au début du prochain jour ouvré
      current.setDate(current.getDate() + 1);
      current.setHours(HEURE_DEBUT, 0, 0, 0);
      // Sauter les jours non ouvrés
      while (!isJourOuvre(current, feries)) {
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return current;
}

function prochainCreneauOuvre(date, feries) {
  const d = new Date(date);
  // Si week-end ou férié → lundi (ou prochain jour ouvré) à 8h
  while (!isJourOuvre(d, feries)) {
    d.setDate(d.getDate() + 1);
    d.setHours(HEURE_DEBUT, 0, 0, 0);
  }
  const h = d.getHours();
  // Avant 8h → 8h ce jour
  if (h < HEURE_DEBUT) { d.setHours(HEURE_DEBUT, 0, 0, 0); return d; }
  // Après 18h → 8h jour ouvré suivant
  if (h >= HEURE_FIN) {
    d.setDate(d.getDate() + 1);
    d.setHours(HEURE_DEBUT, 0, 0, 0);
    while (!isJourOuvre(d, feries)) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

/**
 * Retourne les heures ouvrées restantes jusqu'à une date limite
 * (négatif si dépassé)
 */
export function heuresOuvreesRestantes(delaiDate) {
  const now    = new Date();
  const limite = new Date(delaiDate);

  if (limite <= now) {
    return -heuresOuvreesEntre(limite, now);
  }
  return heuresOuvreesEntre(now, limite);
}

function heuresOuvreesEntre(from, to) {
  const yearA = from.getFullYear();
  const yearB = to.getFullYear();
  const feries = new Set([
    ...getJoursFeries(yearA),
    ...(yearB !== yearA ? getJoursFeries(yearB) : []),
  ]);

  let total   = 0;
  let current = new Date(from);

  // Avancer au prochain créneau ouvré si nécessaire
  current = prochainCreneauOuvre(current, feries);

  while (current < to) {
    if (!isJourOuvre(current, feries)) {
      current.setDate(current.getDate() + 1);
      current.setHours(HEURE_DEBUT, 0, 0, 0);
      continue;
    }
    const heureActuelle = current.getHours() + current.getMinutes() / 60;
    const finJournee    = new Date(current);
    finJournee.setHours(HEURE_FIN, 0, 0, 0);

    const finComptage = finJournee < to ? finJournee : to;
    const heuresFin   = finComptage.getHours() + finComptage.getMinutes() / 60;
    const debut       = Math.max(heureActuelle, HEURE_DEBUT);
    const fin         = Math.min(heuresFin, HEURE_FIN);
    if (fin > debut) total += fin - debut;

    // Passer au jour suivant
    current.setDate(current.getDate() + 1);
    current.setHours(HEURE_DEBUT, 0, 0, 0);
  }

  return Math.round(total * 10) / 10;
}