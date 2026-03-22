// src/hooks/useContestees.js
// Lit les FE contestées depuis localStorage (géré par ClientPage)
// Retourne un Set des ids/numero_fe contestés + une fonction de filtre

import { useMemo } from "react";

export function useContestees() {
  const contestees = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("kep_fe_contestees") || "{}");
    } catch { return {}; }
  }, []);

  const contestedSet = useMemo(() => new Set(Object.keys(contestees)), [contestees]);

  /**
   * Filtre un tableau de FE en excluant les contestées
   * Fonctionne sur numero_fe et id (string ou number)
   */
  function excludeContestees(items = []) {
    if (!contestedSet.size) return items;
    return items.filter(fe => {
      const key1 = fe.numero_fe ? String(fe.numero_fe) : null;
      const key2 = fe.id        ? String(fe.id)        : null;
      return !contestedSet.has(key1) && !contestedSet.has(key2);
    });
  }

  return { contestedSet, contestees, excludeContestees, count: contestedSet.size };
}