// src/hooks/useAppFE.js
// Charge les FE de l'app (KEP_NC_*) pour TOUS les sites accessibles au user
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getAllSitesFromJWT } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Mapping pageType → valeurs type_evenement stockées en DB ─
// La DB stocke exactement ce que l'utilisateur a sélectionné dans
// DeclarationFEPage : "Interne Série", "FAI", "Client", "Fournisseur"
// Même normalisation que nc-fe.js GET /all
function normaliseStatut(statut) {
  if (!statut) return "En cours";
  const s = statut.toLowerCase();
  if (s === "traite" || s === "traité") return "Traitée";
  if (s === "clos"   || s === "clot"  ) return "Clôturée";
  return "En cours"; // 'ouvert', 'en_cours' → En cours
}

const TYPE_MAP = {
  "interne":      ["Interne Série", "Interne", "nc_interne"],
  "interne-fai":  ["FAI", "Interne FAI", "nc_interne"],
  "fournisseur":  ["Fournisseur", "nc_fournisseur"],
  "client":       ["Client", "nc_client"],
  "incident":     ["incident"],
};

export function useAppFE(pageType, { q = "", statut = "Tous", annee = null } = {}) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const token = localStorage.getItem("kep_token");
  const sites = getAllSitesFromJWT();

  useEffect(() => {
    if (!token || !sites.length) return;
    setLoading(true);
    setError(null);

    // Récupère TOUT sans filtre type_evenement côté back
    // Le filtrage se fait localement pour gérer les multiples valeurs possibles
    Promise.allSettled(
      sites.map(site =>
        axios.get(`${API}/api/nc-fe/${site}?limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(r => (r.data.items || []).map(fe => ({
            ...fe,
            site: site.toUpperCase(),
            source: "app",
            // Normalise statut DB → label front (même logique que GET /all)
            statut: normaliseStatut(fe.statut),
          })))
        .catch(() => [])
      )
    )
    .then(results => {
      const all = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value);

      all.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      setItems(all);
    })
    .finally(() => setLoading(false));

  }, [pageType, token, sites.join(",")]);

  // Filtres locaux
  const filtered = useMemo(() => {
    let list = items;

    // ── Filtre par type de page ────────────────────────────
    const validTypes = TYPE_MAP[pageType];
    if (validTypes) {
      const validLower = validTypes.map(t => t.toLowerCase());
      list = list.filter(fe =>
        validLower.includes((fe.type_evenement || "").toLowerCase())
      );
    }

    // ── Filtre statut ──────────────────────────────────────
    if (statut && statut !== "Tous")
      list = list.filter(fe => (fe.statut || "").toLowerCase() === statut.toLowerCase());

    // ── Filtre année ───────────────────────────────────────
    if (annee)
      list = list.filter(fe => fe.date_creation && new Date(fe.date_creation).getFullYear() === parseInt(annee));

    // ── Filtre texte ───────────────────────────────────────
    if (q?.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(fe =>
        [fe.numero_fe, fe.code_article, fe.designation, fe.declarant_nom, fe.description]
          .some(f => (f || "").toLowerCase().includes(ql))
      );
    }

    return list;
  }, [items, pageType, statut, annee, q]);

  return { items: filtered, total: filtered.length, loading, error };
}