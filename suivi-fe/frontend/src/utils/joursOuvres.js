// utils/joursOuvres.js
// Calcule une date en ajoutant N jours ouvrés (hors week-ends + jours fériés français)

/**
 * Retourne les jours fériés français pour une année donnée
 * @param {number} year
 * @returns {Set<string>} ensemble de dates "YYYY-MM-DD"
 */
function getJoursFeries(year) {
  const feries = [];

  // Fixes
  feries.push(`${year}-01-01`); // Jour de l'an
  feries.push(`${year}-05-01`); // Fête du Travail
  feries.push(`${year}-05-08`); // Victoire 1945
  feries.push(`${year}-07-14`); // Fête Nationale
  feries.push(`${year}-08-15`); // Assomption
  feries.push(`${year}-11-01`); // Toussaint
  feries.push(`${year}-11-11`); // Armistice
  feries.push(`${year}-12-25`); // Noël

  // Pâques (algorithme de Meeus/Jones/Butcher)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  const paques = new Date(year, month - 1, day);

  // Lundi de Pâques
  const lundiPaques = new Date(paques);
  lundiPaques.setDate(paques.getDate() + 1);
  feries.push(fmt(lundiPaques));

  // Ascension (39 jours après Pâques)
  const ascension = new Date(paques);
  ascension.setDate(paques.getDate() + 39);
  feries.push(fmt(ascension));

  // Lundi de Pentecôte (50 jours après Pâques)
  const pentecote = new Date(paques);
  pentecote.setDate(paques.getDate() + 50);
  feries.push(fmt(pentecote));

  return new Set(feries);
}

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Dimanche ou Samedi
}

/**
 * Ajoute N jours ouvrés à une date de départ
 * @param {Date|string} startDate  — date de départ
 * @param {number}      joursOuvres — nombre de jours ouvrés à ajouter
 * @returns {Date} date résultat
 */
export function addJoursOuvres(startDate, joursOuvres = 48) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // Pré-charger les fériés pour les années concernées (start + ~70 jours max)
  const yearStart = start.getFullYear();
  const yearEnd   = new Date(start.getTime() + joursOuvres * 2 * 86400000).getFullYear();
  const feries    = new Set([
    ...getJoursFeries(yearStart),
    ...(yearEnd !== yearStart ? getJoursFeries(yearEnd) : []),
  ]);

  let count   = 0;
  let current = new Date(start);

  while (count < joursOuvres) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current) && !feries.has(fmt(current))) {
      count++;
    }
  }

  return current;
}

/**
 * Retourne le nombre de jours ouvrés restants jusqu'à une date limite
 * (négatif si dépassé)
 * @param {Date|string} delaiDate
 * @returns {number}
 */
export function joursOuvresRestants(delaiDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limite = new Date(delaiDate);
  limite.setHours(0, 0, 0, 0);

  if (limite <= today) {
    // Compter les jours ouvrés de dépassement (négatif)
    return -joursOuvresEntre(limite, today);
  }
  return joursOuvresEntre(today, limite);
}

function joursOuvresEntre(from, to) {
  const yearA = from.getFullYear();
  const yearB = to.getFullYear();
  const feries = new Set([
    ...getJoursFeries(yearA),
    ...(yearB !== yearA ? getJoursFeries(yearB) : []),
  ]);

  let count   = 0;
  let current = new Date(from);
  while (current < to) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current) && !feries.has(fmt(current))) count++;
  }
  return count;
}