// src/hooks/useAppFE.js
// Charge les FE de l'app (KEP_NC_*) pour TOUS les sites accessibles au user
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getAllSitesFromJWT } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TYPE_MAP = {
  "interne":      "nc_interne",
  "interne-fai":  "nc_interne",
  "fournisseur":  "nc_fournisseur",
  "client":       "nc_client",
  "incident":     "incident",
};

export function useAppFE(pageType, { q = "", statut = "Tous", annee = null } = {}) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const token = localStorage.getItem("kep_token");
  const sites = getAllSitesFromJWT(); // ["soucy"] | ["soucy","sens"] | ["soucy","sens","laxou","kmtm"]

  useEffect(() => {
    if (!token || !sites.length) return;
    setLoading(true);
    setError(null);

    const type = TYPE_MAP[pageType] || pageType;

    // Fetch en parallèle sur tous les sites accessibles
    Promise.allSettled(
      sites.map(site =>
        axios.get(`${API}/api/nc-fe/${site}?type_evenement=${type}&limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(r => (r.data.items || []).map(fe => ({ ...fe, site: site.toUpperCase() })))
        .catch(() => [])
      )
    )
    .then(results => {
      const all = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value);
      // Tri par date décroissante
      all.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      setItems(all);
    })
    .finally(() => setLoading(false));

  }, [pageType, token, sites.join(",")]);

  // Filtres locaux
  const filtered = useMemo(() => {
    let list = items;
    if (statut && statut !== "Tous")
      list = list.filter(fe => fe.statut?.toLowerCase() === statut.toLowerCase());
    if (annee)
      list = list.filter(fe => fe.date_creation && new Date(fe.date_creation).getFullYear() === parseInt(annee));
    if (q?.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(fe =>
        [fe.numero_fe, fe.code_article, fe.designation, fe.declarant_nom, fe.description]
          .some(f => (f || "").toLowerCase().includes(ql))
      );
    }
    return list;
  }, [items, statut, annee, q]);

  return { items: filtered, total: filtered.length, loading, error };
}