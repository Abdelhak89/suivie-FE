// src/hooks/useAnalyses8D.js
// Charge les analyses 8D depuis TOUS les sites accessibles au user
// et retourne une map { numero_fe: data_json_string }

import { useState, useEffect } from "react";
import { getAllSitesFromJWT } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useAnalyses8D() {
  const [map,     setMap]     = useState({});
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("kep_token");
  const sites = getAllSitesFromJWT(); // ["soucy"] | ["soucy","sens"] | ["soucy","sens","laxou","kmtm"]

  const load = async () => {
    if (!token || !sites.length) return;
    setLoading(true);
    try {
      // Fetch en parallèle sur tous les sites
      const results = await Promise.allSettled(
        sites.map(site =>
          fetch(`${API}/api/8d/${site}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => d.data || [])
            .catch(() => [])
        )
      );

      // Merger tous les résultats en une seule map
      const merged = {};
      results.forEach(result => {
        if (result.status === "fulfilled") {
          result.value.forEach(row => {
            merged[row.numero_fe] = typeof row.data_json === "string"
              ? row.data_json
              : JSON.stringify(row.data_json);
          });
        }
      });
      setMap(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Permet de mettre à jour localement après un save
  const update = (numero_fe, data_json) => {
    setMap(prev => ({ ...prev, [numero_fe]: data_json }));
  };

  return { map, loading, reload: load, update };
}