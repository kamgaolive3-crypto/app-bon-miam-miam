import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

// TABLEAU DE BORD (maquette /page-9) : vue d ensemble de l activite du restaurant
// donnees : GET /api/stats/ventes-semaine (tout le personnel)
//           GET /api/stats/dashboard (gerant + admin)
//           GET /api/stats/top-clients (classement des meilleurs clients)

// ecrit un montant avec des espaces : 25000 devient "25 000 Fcfa"
const fcfa = (n) => (n ?? 0).toLocaleString("fr-FR") + " Fcfa"

export default function TableauBord() {
    // le role connecte decide des statistiques affichees
    const { user } = useAuth()
    const [ventes, setVentes] = useState(null)       // GET /api/stats/ventes-semaine
    const [dashboard, setDashboard] = useState(null) // GET /api/stats/dashboard (gerant + admin)
    const [clients, setClients] = useState([])       // GET /api/stats/top-clients
    const [erreur, setErreur] = useState("")

    // au premier affichage : les trois chargements
    useEffect(() => {
        api.get("/stats/ventes-semaine")
            .then(setVentes)
            .catch((e) => setErreur(e.message))
        // le detail complet est reserve au gerant et a l admin
        if (user && user.role !== "employe") {
            api.get("/stats/dashboard").then(setDashboard).catch(() => setDashboard(null))
        }
        // le classement des clients est accessible a tout le personnel
        api.get("/stats/top-clients?periode=mois")
            .then((r) => setClients((Array.isArray(r) ? r : r.classement || []).slice(0, 3)))
            .catch(() => setClients([]))
    }, [])

    if (erreur) {
        return <p className="p-4 md:p-6 text-red-600">{erreur}</p>;
    }
    if (!ventes) {
        return <p className="p-4 md:p-6 text-gray-500">Chargement du tableau de bord...</p>;
    }

    // le nombre de commandes par statut sert a la carte "volume cuisine"
    // attention : /stats/dashboard renvoie un OBJET {en_attente: 1, ...}
    // alors que /stats/ventes-semaine renvoie un TABLEAU [{statut_commande, total}]
    const brutStatuts = dashboard?.commandes_par_statut ?? ventes.par_statut ?? [];
    const listeStatuts = Array.isArray(brutStatuts)
        ? brutStatuts
        : Object.entries(brutStatuts).map(([statut_commande, total]) => ({ statut_commande, total }));
    const parStatut = {};
    listeStatuts.forEach((s) => {
        parStatut[s.statut_commande ?? Object.keys(s)[0]] = s.total ?? Object.values(s)[0];
    });
    const enCuisine = Number(parStatut.en_preparation || 0) + Number(parStatut.prete || 0);

    // la journee la plus active sert de reference (100 %) pour le graphique
    const caMax = Math.max(1, ...ventes.par_jour.map((j) => j.chiffre_affaires));
    const libelleJour = (date) => {
        try {
            return new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" });
        } catch { return date; }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            {/* ---------- TITRE ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="font-serif text-2xl font-bold">Tableau de bord</h1>
                    <p className="text-xs text-gray-600">Vue d ensemble de l activite · semaine du {ventes.periode[0]} au {ventes.periode[1]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* le rapport mensuel s imprime depuis le navigateur */}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-white"
                    >
                        + Rapport mensuel
                    </button>
                    <Link to="/Commandes" className="rounded-full border border-[#CFBD97] px-4 py-1.5 text-xs">Suivi commandes</Link>
                    <Link to="/Livraisons" className="rounded-full border border-[#CFBD97] px-4 py-1.5 text-xs">Livraisons</Link>
                </div>
            </div>

            {/* ---------- 3 GRANDES CARTES ---------- */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Commandes totales</p>
                    <p className="mt-1 text-3xl font-bold text-[#b8862d]">{ventes.total_commandes.toLocaleString("fr-FR")}</p>
                    <p className="mt-1 text-xs text-gray-500">{fcfa(ventes.ca_total)} encaissés cette semaine</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Clients actifs</p>
                    <p className="mt-1 text-3xl font-bold text-[#b8862d]">
                        {dashboard ? (dashboard.etudiants_actifs ?? 0).toLocaleString("fr-FR") : "—"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        {dashboard
                            ? (dashboard.reclamations_attente ?? 0) + " réclamation(s) en attente"
                            : "Détail réservé au gérant et à l admin"}
                    </p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Volume cuisine</p>
                    <p className="mt-1 text-3xl font-bold text-[#b8862d]">{enCuisine}</p>
                    <p className="mt-1 text-xs text-gray-500">commandes en préparation et prêtes</p>
                </div>
            </div>

            {/* ---------- DEUX COLONNES : TOP CLIENTS + PLATS VENDUS ---------- */}
            <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="mb-3 font-serif text-sm font-semibold">Top 3 meilleures clients</h2>
                    {clients.length === 0 && <p className="text-xs text-gray-500">Aucune commande ce mois.</p>}
                    <ul className="flex flex-col gap-3">
                        {clients.map((c, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                                <span className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold " + (i === 0 ? "bg-[#CFBD97] text-white" : "bg-[#f5f1e6] text-[#b8862d]")}>
                                    {c.rang ?? i + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="font-semibold">{(c.etudiant?.prenom ?? "") + " " + (c.etudiant?.nom ?? "Client")}</p>
                                    <p className="text-xs text-gray-500">{c.nb_commandes} commande(s)</p>
                                </div>
                                <b className="text-[#b8862d]">{fcfa(c.montant)}</b>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="mb-3 font-serif text-sm font-semibold">Plats les plus vendus</h2>
                    {ventes.top_articles.length === 0 && <p className="text-xs text-gray-500">Aucune vente cette semaine.</p>}
                    <ul className="flex flex-col gap-3">
                        {ventes.top_articles.map((a, i) => (
                            <li key={a.nom_article} className="flex items-center gap-3 text-sm">
                                <span className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold " + (i === 0 ? "bg-[#CFBD97] text-white" : "bg-[#f5f1e6] text-[#b8862d]")}>
                                    {i + 1}
                                </span>
                                <span className="flex-1 truncate">{a.nom_article}</span>
                                <b className="text-[#b8862d]">{a.vendus} vendus</b>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            {/* ---------- GRAPHIQUE VENTES PAR JOUR ---------- */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-serif text-sm font-semibold">Chiffre d affaires des 7 derniers jours</h2>
                {ventes.par_jour.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune commande cette semaine.</p>
                ) : (
                    <div className="flex h-40 items-end gap-3 md:gap-5">
                        {ventes.par_jour.map((j) => (
                            <div key={j.jour} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-[10px] text-gray-500">{fcfa(j.chiffre_affaires)}</span>
                                <div
                                    className="w-full max-w-14 rounded-t-md bg-[#CFBD97] transition-all hover:bg-[#b8862d]"
                                    style={{ height: Math.max(6, Math.round((j.chiffre_affaires / caMax) * 110)) + "px" }}
                                    title={j.nb_commandes + " commandes"}
                                />
                                <span className="text-xs text-gray-600">{libelleJour(j.jour)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
