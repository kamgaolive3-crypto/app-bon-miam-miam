import { useState, useEffect } from "react";
import { api } from "../../services/api";

// GESTION DES COMMANDES (maquette /page-13) : suivi en temps réel des commandes des étudiants
// données : GET /api/commande (le personnel voit tout)
// actions : POST /api/commande/{id}/valider + POST /api/commande/{id}/statut

// libellés lisibles pour les statuts de la base
const libelles = {
    en_attente: "En attente",
    validee: "Validée",
    en_preparation: "En préparation",
    prete: "Prête",
    en_livraison: "En livraison",
    servie: "Servie",
    annulee: "Annulée",
};

// couleurs des pilules de statut (même style que la maquette)
const pilules = {
    en_attente: "bg-[#f3e3c3] text-[#8a6a1f]",
    validee: "bg-blue-100 text-blue-700",
    en_preparation: "bg-blue-100 text-blue-700",
    prete: "bg-green-100 text-green-700",
    en_livraison: "bg-indigo-100 text-indigo-700",
    servie: "bg-green-100 text-green-700",
    annulee: "bg-red-100 text-red-700",
};

// transitions possibles : les mêmes règles que le backend (changerStatut)
const transitions = {
    en_attente: ["validee", "annulee"],
    validee: ["en_preparation", "annulee"],
    en_preparation: ["prete"],
    prete: ["en_livraison", "servie"],
    en_livraison: ["servie"],
};

export default function Commandes() {
    const [commandes, setCommandes] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("");
    const [filtreType, setFiltreType] = useState("");
    const [detailOuvert, setDetailOuvert] = useState(null); // Id de la commande dépliée
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");

    // chargement des commandes (le personnel voit TOUTES les commandes)
    const charger = () => {
        api.get("/commande")
            .then((liste) => setCommandes(Array.isArray(liste) ? liste : liste.data || []))
            .catch((e) => setErreur(e.message));
    };
    useEffect(charger, []);

    // valider une commande en attente : POST /api/commande/{id}/valider
    const valider = async (id) => {
        setMessage("");
        setErreur("");
        try {
            await api.post("/commande/" + encodeURIComponent(id) + "/valider", {});
            setMessage("Commande " + id + " validée.");
            charger();
        } catch (e) {
            setErreur(e.message);
        }
    };

    // changer le statut : POST /api/commande/{id}/statut
    const changerStatut = async (id, statut) => {
        setMessage("");
        setErreur("");
        try {
            await api.post("/commande/" + encodeURIComponent(id) + "/statut", {
                statut_commande: statut,
            });
            setMessage(
                "Commande " +
                    id +
                    " : statut mis à " +
                    (libelles[statut] || statut).toLowerCase() +
                    "."
            );
            charger();
        } catch (e) {
            setErreur(e.message);
        }
    };

    // ---------- indicateurs des 3 cartes ----------
    const compte = (s) =>
        commandes.filter((c) => c.statut_commande === s).length;
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const nbAujourdhui = commandes.filter(
        (c) => (c.date_commande || "").slice(0, 10) === aujourdhui
    ).length;

    // ---------- filtres : recherche libre + statut + type ----------
    const texte = recherche.trim().toLowerCase();
    const commandesAffichees = commandes.filter((c) => {
        if (filtreStatut && c.statut_commande !== filtreStatut) return false;
        if (filtreType && c.mode_service !== filtreType) return false;
        if (!texte) return true;

        const articles = (c.articles || [])
            .map((a) => a.nom_article)
            .join(" ")
            .toLowerCase();

        return (
            (c.Id_commande || "").toLowerCase().includes(texte) ||
            (c.Id_utilisateur || "").toLowerCase().includes(texte) ||
            articles.includes(texte)
        );
    });

    return (
        <div className="flex flex-col gap-5 p-4 md:p-6">
            {/* ---------- TITRE ---------- */}
            <div>
                <h1 className="font-serif text-2xl font-bold">
                    Gestion des commandes
                </h1>
                <p className="text-xs text-gray-600">
                    Suivi en temps réel des commandes des étudiants
                </p>
            </div>

            {message && (
                <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">
                    {message}
                </p>
            )}
            {erreur && (
                <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
                    {erreur}
                </p>
            )}

            {/* ---------- 3 CARTES INDICATEURS ---------- */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                        En préparation
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">
                        {compte("en_preparation")}
                    </p>
                    <p className="text-xs text-gray-500">En cuisine</p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                        Prêtes
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">
                        {compte("prete")}
                    </p>
                    <p className="text-xs text-gray-500">À livrer / servir</p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                        Commandes du jour
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">
                        {nbAujourdhui}
                    </p>
                    <p className="text-xs text-gray-500">Total cumulé</p>
                </div>
            </div>

            {/* ---------- RECHERCHE + FILTRES ---------- */}
            <div className="flex flex-wrap items-center gap-2">
                <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher une commande..."
                    className="min-w-48 flex-1 rounded-full border border-[#CFBD97] bg-white px-4 py-1.5 text-xs"
                />

                <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="rounded-full border border-[#CFBD97] bg-white px-3 py-1.5 text-xs"
                >
                    <option value="">Type : Tous</option>
                    <option value="sur_place">Sur place</option>
                    <option value="livraison">Livraison</option>
                </select>

                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="rounded-full border border-[#CFBD97] bg-white px-3 py-1.5 text-xs"
                >
                    <option value="">Statut : Tous</option>
                    {Object.keys(libelles).map((s) => (
                        <option key={s} value={s}>
                            {libelles[s]}
                        </option>
                    ))}
                </select>
            </div>

            {/* ---------- TABLEAU ---------- */}
            {commandesAffichees.length === 0 ? (
                <p className="text-sm text-gray-600">
                    Aucune commande pour cette recherche.
                </p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#efe6d0] text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Heure</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Plat(s)</th>
                                <th className="px-4 py-3">Montant (Fcfa)</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {commandesAffichees.map((c) => (
                                <tr
                                    key={c.Id_commande}
                                    className="border-b border-[#efe6d0] last:border-0"
                                >
                                    <td className="px-4 py-3 font-semibold">
                                        {c.heure_recup ||
                                            (c.date_commande || "").slice(
                                                11,
                                                16
                                            ) ||
                                            "—"}
                                    </td>

                                    <td className="px-4 py-3">
                                        {c.mode_service === "livraison"
                                            ? "Livraison"
                                            : "Sur place"}
                                    </td>

                                    <td className="max-w-52 truncate px-4 py-3">
                                        {(c.articles || [])
                                            .map(
                                                (a) =>
                                                    (a.pivot?.quantite ??
                                                        a.quantite ??
                                                        1) +
                                                    "x " +
                                                    a.nom_article
                                            )
                                            .join(", ") || "—"}
                                    </td>

                                    <td className="px-4 py-3 font-bold text-[#b8862d]">
                                        {(c.montant_total ?? 0).toLocaleString(
                                            "fr-FR"
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                "rounded-full px-3 py-1 text-xs " +
                                                (pilules[c.statut_commande] ||
                                                    "bg-gray-100 text-gray-600")
                                            }
                                        >
                                            {libelles[c.statut_commande] ||
                                                c.statut_commande}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {/* VOIR : déplie les détails de la commande */}
                                            <button
                                                onClick={() =>
                                                    setDetailOuvert(
                                                        detailOuvert ===
                                                            c.Id_commande
                                                            ? null
                                                            : c.Id_commande
                                                    )
                                                }
                                                className="rounded-full border border-[#CFBD97] px-3 py-1 text-xs hover:bg-[#f5f1e6]"
                                            >
                                                Voir
                                            </button>

                                            {/* VALIDER (or) : commande en attente seulement */}
                                            {c.statut_commande ===
                                                "en_attente" && (
                                                <button
                                                    onClick={() =>
                                                        valider(c.Id_commande)
                                                    }
                                                    className="rounded-full bg-[#CFBD97] px-3 py-1 text-xs text-white hover:brightness-95"
                                                >
                                                    Valider
                                                </button>
                                            )}

                                            {/* transitions suivantes (même règle que le backend) */}
                                            {(transitions[c.statut_commande] ||
                                                [])
                                                .filter(
                                                    (s) => s !== "annulee"
                                                )
                                                .map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() =>
                                                            changerStatut(
                                                                c.Id_commande,
                                                                s
                                                            )
                                                        }
                                                        className="rounded-full bg-[#f5f1e6] px-3 py-1 text-xs text-[#8a6a1f] hover:bg-[#efe6d0]"
                                                    >
                                                        {libelles[s] || s}
                                                    </button>
                                                ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ---------- LIGNE DE DÉTAIL (commande dépliée) ---------- */}
                    {commandesAffichees
                        .filter((c) => detailOuvert === c.Id_commande)
                        .map((c) => (
                            <div
                                key={"detail-" + c.Id_commande}
                                className="border-t border-[#efe6d0] bg-[#f5f1e6] px-4 py-3 text-xs"
                            >
                                <p>
                                    <b>Commande :</b> {c.Id_commande} ·{" "}
                                    {(c.date_commande || "")
                                        .slice(0, 16)
                                        .replace("T", " ")}
                                </p>
                                <p>
                                    <b>Étudiant :</b>{" "}
                                    {c.etudiant
                                        ? (c.etudiant.prenom ?? "") +
                                          " " +
                                          (c.etudiant.nom ?? "")
                                        : c.Id_utilisateur ?? "—"}
                                </p>
                                <p>
                                    <b>Articles :</b>{" "}
                                    {(c.articles || [])
                                        .map(
                                            (a) =>
                                                (a.pivot?.quantite ??
                                                    a.quantite ??
                                                    1) +
                                                "x " +
                                                a.nom_article
                                        )
                                        .join(", ") || "Aucun article."}
                                </p>
                                {c.heure_recup && (
                                    <p>
                                        <b>Heure de récupération :</b>{" "}
                                        {c.heure_recup}
                                    </p>
                                )}
                                {c.point_reduction > 0 && (
                                    <p>
                                        <b>Points utilisés :</b>{" "}
                                        {c.point_reduction} (réduction
                                        appliquée)
                                    </p>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}