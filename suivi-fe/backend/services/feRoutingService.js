import { query } from "../db-sqlserver.js";

const DVI_COLUMN = 'VarAlphaUtil10';

/**
 * Déterminer la page de destination d'une FE (synchrone).
 */
export function getFePageRoute(fe) {
  if (!fe) return null;

  const origine = fe.origine ? fe.origine.trim().toUpperCase() : '';
  const lieuDetectionCateg = fe.lieu_detection || '';

  // 1. FAI — Basé sur le flag enrichi
  if (fe.is_dvi === true) {
    return 'fai';
  }

  if (origine === 'DFOU') return 'fournisseur';
  if (lieuDetectionCateg === 'Client') return 'client';
  return 'interne';
}

/**
 * Enrichir une liste de FE avec le contenu de VarAlphaUtil10 (DVI / FAB SUP).
 */
export async function enrichFeListWithDVI(feList) {
  if (!Array.isArray(feList) || feList.length === 0) return feList;

  const lancements = [...new Set(feList.map(fe => fe.code_lancement).filter(Boolean))];

  if (lancements.length === 0) {
    return feList.map(fe => ({ ...fe, is_dvi: false, dvi_label: '' }));
  }

  const placeholders = lancements.map((_, i) => `@lct${i}`).join(', ');
  const params = {};
  lancements.forEach((lct, i) => { params[`lct${i}`] = lct; });

  const sql = `
    SELECT CodeLancement, ${DVI_COLUMN} as dvi_val
    FROM dbo.LCTE
    WHERE CodeLancement IN (${placeholders})
  `;

  const result = await query(sql, params);
  const dviMap = new Map(result.recordset.map(r => [r.CodeLancement, r.dvi_val]));

  return feList.map(fe => {
    const rawValue = dviMap.get(fe.code_lancement) || '';
    return {
      ...fe,
      is_dvi: rawValue.includes('DVI') || rawValue.includes('FAB SUP'),
      dvi_label: rawValue // On stocke la valeur brute ici
    };
  });
}

/**
 * Vérifier un seul lancement (pour getFEByNumero)
 */
export async function isLancementDVI(codeLancement) {
  if (!codeLancement) return { is_dvi: false, dvi_label: '' };

  const sql = `
    SELECT ${DVI_COLUMN} as dvi_val
    FROM dbo.LCTE
    WHERE CodeLancement = @codeLancement
  `;

  const result = await query(sql, { codeLancement });
  if (result.recordset.length === 0) return { is_dvi: false, dvi_label: '' };

  const val = result.recordset[0].dvi_val || '';
  return {
    is_dvi: val.includes('DVI') || val.includes('FAB SUP'),
    dvi_label: val
  };
}

export default {
  getFePageRoute,
  enrichFeListWithDVI,
  isLancementDVI
};