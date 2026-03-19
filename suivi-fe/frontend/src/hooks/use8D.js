// src/hooks/use8D.js
// Charge et sauvegarde le 8D d'une FE dans KEP_NC_{site}
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function use8D(numeroFE, site) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const token = localStorage.getItem("kep_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Détermine le site depuis le JWT si pas fourni
  const resolvedSite = site || (() => {
    try {
      const u = JSON.parse(localStorage.getItem("kep_user"));
      if (u?.sites === "ALL") return "soucy"; // default
      return u?.sites?.split(",")[0]?.trim().toLowerCase() || "soucy";
    } catch { return "soucy"; }
  })();

  // Charge le 8D existant
  useEffect(() => {
    if (!numeroFE || !resolvedSite) return;
    setLoading(true);
    axios.get(`${API}/api/8d/${resolvedSite}/${encodeURIComponent(numeroFE)}`, { headers })
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [numeroFE, resolvedSite]);

  // Sauvegarde le 8D
  const save = useCallback(async (jsonData, source = "SILOG", statut_fe = "en_cours") => {
    if (!numeroFE || !resolvedSite) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/8d/${resolvedSite}/${encodeURIComponent(numeroFE)}`,
        { data_json: jsonData, source, statut_fe },
        { headers }
      );
      setData({ numero_fe: numeroFE, data_json: jsonData, statut_fe });
      return true;
    } catch (err) {
      console.error("Erreur save 8D:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [numeroFE, resolvedSite]);

  // Demande de clôture
  const demanderCloture = useCallback(async () => {
    if (!numeroFE || !resolvedSite) return;
    await axios.patch(
      `${API}/api/8d/${resolvedSite}/${encodeURIComponent(numeroFE)}/statut`,
      { statut_fe: "cloture_demandee" },
      { headers }
    );
    setData(d => d ? { ...d, statut_fe: "cloture_demandee" } : d);
  }, [numeroFE, resolvedSite]);

  return {
    data,
    loading,
    saving,
    save,
    demanderCloture,
    statut: data?.statut_fe || null,
    existe: !!data,
  };
}