// src/lib/portfolioStore.js
import { PORTFOLIO_BY_QUALITICIEN, QUALITICIENS } from "../data/portfolio";

const KEY = "fe_portfolio_override_v1";

/**
 * Override = { [qualiticienName]: ["141","162", ...] }
 */
export function getPortfolioOverride() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function setPortfolioOverride(next) {
  localStorage.setItem(KEY, JSON.stringify(next || {}));
}

/**
 * Retourne le portefeuille effectif : base + override (override remplace la base si présent)
 */
export function getEffectivePortfolio() {
  const ov = getPortfolioOverride();
  const out = {};
  for (const q of QUALITICIENS) {
    const base = PORTFOLIO_BY_QUALITICIEN[q] || [];
    const effective = Array.isArray(ov[q]) ? ov[q] : base;
    out[q] = normalizeCodes(effective);
  }
  return out;
}

export function getCodesFor(qName) {
  const all = getEffectivePortfolio();
  return all[qName] || [];
}

export function addCodeTo(qName, code) {
  const c = normalizeCode(code);
  if (!c) return;

  const ov = getPortfolioOverride();
  const current = Array.isArray(ov[qName]) ? ov[qName] : (PORTFOLIO_BY_QUALITICIEN[qName] || []);
  const next = normalizeCodes([...current, c]);
  ov[qName] = next;
  setPortfolioOverride(ov);
}

export function removeCodeFrom(qName, code) {
  const c = normalizeCode(code);
  const ov = getPortfolioOverride();
  const current = Array.isArray(ov[qName]) ? ov[qName] : (PORTFOLIO_BY_QUALITICIEN[qName] || []);
  ov[qName] = normalizeCodes(current.filter(x => x !== c));
  setPortfolioOverride(ov);
}

/** Utilitaires */
export function normalizeCode(code) {
  const s = String(code || "").trim();
  if (!s) return "";
  // on garde 3 premiers chiffres/lettres, mais dans ton cas c'est 3 chiffres
  return s.slice(0, 3);
}

export function normalizeCodes(list) {
  const arr = (list || []).map(normalizeCode).filter(Boolean);
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b, "fr"));
}
