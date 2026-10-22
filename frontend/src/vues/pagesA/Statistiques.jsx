import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

// page STATISTIQUES GENERALES (maquette /page-11) : ventes, commandes, fidelite et parrainage
// donnees : GET /api/stats/ventes-semaine (tout le personnel) + GET /api/stats/dashboard (gerant/admin)

// ecrit un montant avec des espaces : 1425000 devient "1 425 000 Fcfa"
const fcfa = (n) => (n ?? 0).toLocaleString("fr-FR") + " Fcfa"

export default function Statistiques() {
    const { user } = useAuth()
    const [ventes, setVentes] = useState(null)       // ventes de la semaine (tous roles staff)
    const [dashboard, setDashboard] = useState(null) // detail fidelite / parrainage (gerant + admin)
    const [periode, setPeriode] = useState("semaine") // filtre du bandeau (semaine / mois)
    const [erreur, setErreur] = useState("")

    useEffect(() => {
        api.get("/stats/ventes-semaine")
            .then(setVentes)
            .catch((e) => setErreur(e.message))
        // les points emis et les parrainages viennent du dashboard general
        if (user && user.role !== "employe") {
            api.get("/stats/dashboard").then(setDashboard).catch(() => setDashboard(null))
        }
    }, [])

    if (erreur) {
        return <p className="p-4 md:p-6 text-red-600">{erreur}</p>;
    }
    if (!ventes) {
        return <p className="p-4 md:p-6 text-gray-500">Chargement des statistiques...</p>;
    }

    // somme de tous les mouvements de points (gain + utilisation) : points emis au total
    const pointsEmis = dashboard
        ? Object.values(dashboard.points || {}).reduce((s, v) => s + Number(v || 0), 0)
        : null;

    // la carte Ventes suit le filtre : semaine (API) ou mois (dashboard)
    const caAffiche = periode === "mois"
        ? (dashboard?.mois?.ca ?? ventes.ca_total)
        : ventes.ca_total;

    // graphique : la plus grande journee sert de reference (100 %)
    const caMax = Math.max(1, ...ventes.par_jour.map((j) => j.chiffre_affaires));

    // libelle court du jour : 2026-10-14 -> "mer."
    const libelleJour = (date) => {
        try {
            return new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" });
        } catch { return date; }
    };

    // le plat le plus vendu sert de reference pour les petites barres
    const vendusMax = Math.max(1, ...ventes.top_articles.map((a) => a.vendus));

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            {/* ---------- TITRE + FILTRE PERIODE ---------- */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-serif text-2xl font-bold">Statistiques générales</h1>
                    <p className="text-xs text-gray-600">Ventes, commandes, fidélité et parrainage</p>
                </div>
                <select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    className="rounded-full border border-[#CFBD97] bg-white px-4 py-1.5 text-xs text-gray-700"
                >
                    <option value="semaine">Cette semaine</option>
                    <option value="mois">Ce mois</option>
                </select>
            </div>

            {/* ---------- 4 CARTES INDICATEURS ---------- */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-500">Ventes ({periode === "mois" ? "30 jours" : "7 jours"})</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">{fcfa(caAffiche)}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-500">Commandes</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">{ventes.total_commandes.toLocaleString("fr-FR")}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-500">Points de fidélité émis</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">
                        {pointsEmis === null ? <span className="text-sm text-gray-400">Gérant / admin</span> : pointsEmis.toLocaleString("fr-FR")}
                    </p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs text-gray-500">Parrainages validés</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">
                        {dashboard ? (dashboard.parrainages_recompenses ?? 0).toLocaleString("fr-FR") : <span className="text-sm text-gray-400">Gérant / admin</span>}
                    </p>
                </div>
            </div>

            {/* ---------- GRAPHIQUE VENTES PAR JOUR ---------- */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-serif text-sm font-semibold">Ventes par jour</h2>
                {ventes.par_jour.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune vente cette semaine.</p>
                ) : (
                    <div className="flex h-44 items-end gap-3 md:gap-5">
                        {ventes.par_jour.map((j) => (
                            <div key={j.jour} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-[10px] text-gray-500">{fcfa(j.chiffre_affaires)}</span>
                                <div
                                    className="w-full max-w-14 rounded-t-md bg-[#CFBD97] transition-all hover:bg-[#b8862d]"
                                    style={{ height: Math.max(6, Math.round((j.chiffre_affaires / caMax) * 120)) + "px" }}
                                    title={j.nb_commandes + " commandes"}
                                />
                                <span className="text-xs text-gray-600">{libelleJour(j.jour)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ---------- PLATS LES PLUS COMMANDES ---------- */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-serif text-sm font-semibold">Plats les plus commandés</h2>
                {ventes.top_articles.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune vente enregistrée.</p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {ventes.top_articles.map((a, i) => (
                            <li key={a.nom_article} className="flex items-center gap-3 text-sm">
                                <span className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " + (i === 0 ? "bg-[#CFBD97] text-white" : "bg-[#f5f1e6] text-[#b8862d]")}>
                                    {i + 1}
                                </span>
                                <span className="w-40 truncate md:w-56">{a.nom_article}</span>
                                <div className="h-2 flex-1 rounded-full bg-[#efe6d0]">
                                    <div className="h-2 rounded-full bg-[#CFBD97]" style={{ width: Math.round((a.vendus / vendusMax) * 100) + "%" }} />
                                </div>
                                <b className="w-20 text-right text-[#b8862d]">{a.vendus} vendus</b>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}
