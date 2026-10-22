

import { FaCartShopping, FaStopwatch, FaKitchenSet, FaCircleCheck, FaMagnifyingGlass, FaRegCalendar, FaChevronDown } from "react-icons/fa6";
// useState : mémorise la liste des commandes (pour que les statuts puissent changer).
// useEffect : recharge les commandes depuis le backend au premier rendu.
import { useState, useEffect } from "react";
// api : petit client HTTP qui ajoute le token + l'URL du backend (voir services/api.js).
import { api } from "../../services/api";
// Les deux flèches de bas de tableau (composant partagé par les 3 pages de tableau).
import Pagination from "../../composantEmp/Pagination";
// Hook partagé : gère la recherche, les filtres et la pagination (voir hooks/useRecherchePagination.js).
import useRecherchePagination from "../../hooks/useRecherchePagination";
const cartes = [
    {
        titre: "Total commandes",
        statut: null,
        detail: "En cours de traitement",
        Icone: FaCartShopping,
        fond: "bg-emp-commande-carre",     // fond de la carte
        fondIcone: "bg-emp-commande-rond", // petit carré derrière l'icône
        couleurIcone: "text-primary",      // couleur de l'icône
    },
    {
        titre: "En attente",
        statut: "En attente",
        detail: "À préparer",
        Icone: FaStopwatch,
        fond: "bg-emp-attente-carre",
        fondIcone: "bg-emp-attente-rond",
        couleurIcone: "text-emp-attente-emoji",
    },
    {
        titre: "En préparation",
        statut: "En préparation",
        detail: "En cuisine",
        Icone: FaKitchenSet,
        fond: "bg-emp-bleu-carre",
        fondIcone: "bg-emp-bleu-rond",
        couleurIcone: "text-emp-bleu-emoji",
    },
    {
        titre: "Prêtes",
        statut: "Prête", // cuisine terminée, en attente d'être servie
        detail: "À livrer / Servir",
        Icone: FaCircleCheck,
        fond: "bg-emp-vert-carre",
        fondIcone: "bg-emp-vert-rond",
        couleurIcone: "text-emp-vert-emoji",
    },
];

// Les titres de colonnes du tableau (écrits une seule fois, utilisés dans <thead>).
const colonnes = ["N° commande", "Étudiant", "Heure", "Type", "Plats", "Montant", "Statut", "Actions"];

// La liste vient du backend : GET /api/commande (le personnel voit tout).
// Chaque ligne `commande` garde les champs affichés (numero, etudiant, heure,
// type, plat, montant, statut) + la date brute pour le filtre par période.

// libellés lisibles pour les statuts de la base (memes mots que le filtre).
const libelles = {
    en_attente: "En attente",
    validee: "Validée",
    en_preparation: "En préparation",
    prete: "Prête",
    en_livraison: "En livraison",
    servie: "Servie",
    annulee: "Annulée",
};

// Couleurs de la pastille de chaque statut (fond + texte).
const stylesStatut = {
    "En attente": "bg-emp-attente-rond text-emp-attente-emoji",
    "Validée": "bg-emp-bleu-rond text-emp-bleu-emoji",
    "En préparation": "bg-emp-bleu-rond text-emp-bleu-emoji",
    "En livraison": "bg-emp-bleu-rond text-emp-bleu-emoji",
    "Prête": "bg-emp-commande-rond text-emp-valider",
    "Servie": "bg-emp-vert-rond text-emp-vert-emoji",
    "Annulée": "bg-emp-attente-rond text-emp-attente-emoji",
};

// Étapes : texte du bouton + statut suivant du backend (`code`).
// La base impose l'ordre : en_attente -> validee -> en_preparation -> prete -> servie.
const etapes = {
    "En attente": { bouton: "Valider", suivant: "Validée", code: "validee" },
    "Validée": { bouton: "Préparer", suivant: "En préparation", code: "en_preparation" },
    "En préparation": { bouton: "Terminer", suivant: "Prête", code: "prete" },
    "Prête": { bouton: "Servir", suivant: "Servie", code: "servie" },
    "En livraison": { bouton: "Servir", suivant: "Servie", code: "servie" },
    "Servie": { bouton: "Terminé", suivant: null, code: null },
    "Annulée": { bouton: "—", suivant: null, code: null },
};

// Nombre de commandes affichées par page.
const PAR_PAGE = 6;

export default function Commandes() {
    // ===== LOGIQUE =====

    // liste : les commandes du backend (aran graphées pour le tableau).
    const [liste, setListe] = useState([]);
    // periode : filtre date du select (« aujourd'hui / semaine / mois »).
    const [periode, setPeriode] = useState("");
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    // detail : numéro de commande dont le détail est déplié (null = aucun).
    const [detail, setDetail] = useState(null);

    // charger() : GET /api/commande puis transformation vers les champs du tableau.
    function charger() {
        api.get("/commande")
            .then((brut) => {
                const fil = Array.isArray(brut) ? brut : (brut.data ?? brut.commandes ?? []);
                setListe(fil.map(mapCommande));
                setErreur("");
            })
            .catch((e) => setErreur(e.message));
    }
    useEffect(charger, []);

    // mapCommande : transforme une commande du backend en ligne du tableau.
    function mapCommande(c) {
        const nom = c.etudiant?.utilisateur
            ? (c.etudiant.utilisateur.prenom + " " + c.etudiant.utilisateur.nom).trim()
            : c.Id_utilisateur;
        return {
            numero: c.Id_commande,
            etudiant: nom,
            heure: (c.date_commande || "").slice(11, 16),
            date: (c.date_commande || "").slice(0, 10),
            type: (c.mode_service === "livraison" || c.livraison) ? "Livraison" : "Sur place",
            plat: (c.articles || []).map((a) => (a.pivot?.quantite ?? a.quantite ?? 1) + "x " + a.nom_article).join(", "),
            montant: (c.montant_total ?? 0).toLocaleString("fr-FR") + " Fcfa",
            statut: libelles[c.statut_commande] || c.statut_commande,
        };
    }

    // filtre date appliqué AVANT la recherche/pagination (périodes glissantes).
    // dates LOCALES : toISOString passerait en UTC et decalerait d un jour
    const isoLocal = (d) =>
        d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const aujourdhui = isoLocal(new Date());
    const limiteSemaine = isoLocal(new Date(Date.now() - 7 * 86400000));
    const limiteMois = isoLocal(new Date(Date.now() - 30 * 86400000));
    const listeFiltree = liste.filter((c) => {
        if (!periode || periode === "" || !c.date) return true;
        if (periode === "aujourdhui") return c.date === aujourdhui;
        if (periode === "semaine") return c.date >= limiteSemaine;
        if (periode === "mois") return c.date >= limiteMois;
        return true;
    });

    const {
        recherche, changerRecherche,
        filtres, changerFiltre,
        page, setPage, nombrePages,
        elementsPage: listeAffichee,
    } = useRecherchePagination(listeFiltree, ["numero", "etudiant", "plat"], PAR_PAGE);

    // Appelée au clic sur le bouton d'action d'une ligne :
    // envoie le statut suivant au backend, puis recharge toute la liste.
    async function avancer(numero) {
        const ligne = liste.find((commande) => commande.numero === numero);
        const etape = etapes[ligne?.statut];
        if (!ligne || !etape?.suivant) return;
        setMessage(""); setErreur("");
        try {
            await api.post("/commande/" + encodeURIComponent(numero) + "/statut", { statut_commande: etape.code });
            setMessage("Commande " + numero + " : " + etape.suivant.toLowerCase() + ".");
            charger();
        } catch (e) { setErreur(e.message); }
    }

    function compter(statut) {
        if (statut === null) {
            return liste.length;
        }
        return liste.filter((commande) => commande.statut === statut).length;
    }

    // ===== AFFICHAGE =====
    return (
        <div className="p-4 md:p-6">

            {/* BLOC 1 : en-tête (icône + titre + phrase) */}
            <div className="flex items-start gap-4 mb-6">
                <FaCartShopping size={28} className="text-primary mt-1" />
                <div>
                    <h2 className="font-bold">Commandes</h2>
                    <p className="text-sm text-secondary">
                        Consultez, préparez et validez les commandes des étudiants.
                    </p>
                </div>
            </div>

            {erreur !== "" && (
                <p className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm text-red-700">{erreur}</p>
            )}
            {message !== "" && (
                <p className="mb-4 rounded-md bg-emp-vert-rond px-4 py-2 text-sm text-emp-vert-emoji">{message}</p>
            )}

            {/* BLOC 2 : les 4 cartes de résumé.
                grid-cols-2 : 2 colonnes sur mobile. md:grid-cols-4 : 4 sur ordinateur. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cartes.map((carte) => (
                    <div
                        key={carte.titre}
                        className={`flex items-center gap-3 rounded-lg p-4 ${carte.fond}`}
                    >
                        {/* Petit carré arrondi derrière l'icône */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${carte.fondIcone}`}>
                            <carte.Icone size={18} className={carte.couleurIcone} />
                        </div>
                        <div className="text-sm text-secondary">
                            <p>{carte.titre}</p>
                            {/* Nombre calculé à partir de la liste : il change quand un statut avance */}
                            <p>{compter(carte.statut)}</p>
                            <p className="text-xs">{carte.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bandeau de détail : s'affiche quand « Voir » est cliqué sur une ligne. */}
            {detail !== null && (
                <div className="mb-4 rounded-xl border border-emp-valider bg-emp-carre px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">Commande {detail}</p>
                        <button type="button" onClick={() => setDetail(null)} className="text-xs text-secondary cursor-pointer">
                            Fermer
                        </button>
                    </div>
                    {(() => {
                        const ligne = liste.find((c) => c.numero === detail);
                        if (!ligne) return null;
                        return (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-secondary md:grid-cols-3">
                                <p><span className="font-medium">Étudiant :</span> {ligne.etudiant}</p>
                                <p><span className="font-medium">Heure :</span> {ligne.heure}</p>
                                <p><span className="font-medium">Type :</span> {ligne.type}</p>
                                <p><span className="font-medium">Montant :</span> {ligne.montant}</p>
                                <p className="col-span-2 md:col-span-3"><span className="font-medium">Plats :</span> {ligne.plat || "—"}</p>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* BLOC 3 : recherche + filtres.
                flex-col : empilés sur mobile. md:flex-row : côte à côte sur ordinateur. */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">

                {/* Champ de recherche : relative sert de repère pour placer la loupe.
                    La recherche porte sur le numéro, l'étudiant et le plat. */}
                <div className="relative flex-1 min-w-0">
                    <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => changerRecherche(e.target.value)}
                        placeholder="Recherche une commande..."
                        className="w-full rounded-md border border-primary bg-white py-3 pl-9 pr-3 text-sm outline-none"
                    />
                </div>

                {/* Filtre Type.
                    Les `value` des options doivent être IDENTIQUES aux données
                    (accents compris), sinon le filtre ne trouve rien.
                    changerFiltre("type", ...) : "type" est le nom du champ dans `commandes`. */}
                <div className="relative md:w-56 md:shrink-0">
                    <select
                        value={filtres.type || "Tous"}
                        onChange={(e) => changerFiltre("type", e.target.value)}
                        className="w-full appearance-none rounded-md bg-emp-type py-3 pl-4 pr-10 text-sm cursor-pointer"
                    >
                        <option value="Tous">Type : Tous</option>
                        <option value="Sur place">Sur place</option>
                        <option value="Livraison">Livraison</option>
                    </select>
                    {/* appearance-none retire la flèche du navigateur : on pose la nôtre par-dessus */}
                    <FaChevronDown
                        size={12}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
                    />
                </div>

                {/* Filtre Statut : mêmes règles que le filtre Type. */}
                <div className="relative md:w-56 md:shrink-0">
                    <select
                        value={filtres.statut || "Tous"}
                        onChange={(e) => changerFiltre("statut", e.target.value)}
                        className="w-full appearance-none rounded-md bg-emp-type py-3 pl-4 pr-10 text-sm cursor-pointer"
                    >
                        <option value="Tous">Statut : Tous</option>
                        <option value="En attente">En attente</option>
                        <option value="Validée">Validée</option>
                        <option value="En préparation">En préparation</option>
                        <option value="Prête">Prête</option>
                        <option value="Servie">Servie</option>
                        <option value="Annulée">Annulée</option>
                    </select>
                    <FaChevronDown
                        size={12}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
                    />
                </div>

                {/* Filtre Date : périodes glissantes calculées côté client
                    (aujourd'hui = mêmes jour ; semaine = 7 derniers jours ; mois = 30). */}
                <div className="relative md:w-56 md:shrink-0">
                    <FaRegCalendar
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                    />
                    <select
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value)}
                        className="w-full appearance-none rounded-md bg-emp-type py-3 pl-9 pr-4 text-sm cursor-pointer"
                    >
                        <option value="">Toutes les dates</option>
                        <option value="aujourdhui">Aujourd'hui</option>
                        <option value="semaine">Cette semaine</option>
                        <option value="mois">Ce mois</option>
                    </select>
                    <FaChevronDown
                        size={12}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
                    />
                </div>
            </div>
            {/* BLOC 4 : le tableau.
                overflow-x-auto : sur mobile, le tableau défile horizontalement dans son cadre. */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-grey-300 bg-emp-carre">

                {/* min-w-[800px] : le tableau garde au moins 800 px de large pour que les 8 colonnes restent lisibles */}
                <table className="w-full min-w-[800px] text-left text-sm">

                    {/* En-tête : une cellule par titre de la liste `colonnes` */}
                    <thead className="bg-emp-barre-carre">
                        <tr>
                            {colonnes.map((colonne) => (
                                <th key={colonne} className="px-4 py-4 font-medium">
                                    {colonne}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Corps : une ligne par commande de la page courante */}
                    <tbody>
                        {/* Message affiché quand la recherche / les filtres ne donnent aucun résultat.
                            colSpan={8} : la cellule s'étend sur les 8 colonnes. */}
                        {listeAffichee.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center">
                                    Aucune commande trouvée.
                                </td>
                            </tr>
                        )}

                        {listeAffichee.map((commande) => (
                            <tr key={commande.numero} className="border-t border-emp-type">
                                <td className="px-4 py-5">{commande.numero}</td>
                                <td className="px-4 py-5">{commande.etudiant}</td>
                                <td className="px-4 py-5">{commande.heure}</td>
                                <td className="px-4 py-5">{commande.type}</td>
                                <td className="px-4 py-5">{commande.plat}</td>
                                <td className="px-4 py-5">{commande.montant}</td>

                                {/* Cellule du statut : pastille colorée selon `stylesStatut` */}
                                <td className="px-4 py-5">
                                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${stylesStatut[commande.statut]}`}>
                                        {commande.statut}
                                    </span>
                                </td>

                                {/* Cellule des actions : Voir + bouton d'avancement */}
                                <td className="px-4 py-5">
                                    <div className="flex items-center gap-8">
                                        {/* « Voir » déplie le détail de la commande (plats, montants...). */}
                                        <button
                                            type="button"
                                            onClick={() => setDetail(detail === commande.numero ? null : commande.numero)}
                                            className="rounded-md border border-emp-valider bg-emp-carre px-4 py-1.5 text-xs font-semibold text-emp-valider cursor-pointer hover:bg-emp-commande-rond"
                                        >
                                            Voir
                                        </button>

                                        {/* Bouton d'action : Préparer / Terminer / Valider.
                                            Son texte vient de `etapes`. Désactivé (pâle) quand la commande
                                            est « Servie », car il n'y a plus d'étape suivante. */}
                                        <button
                                            type="button"
                                            onClick={() => avancer(commande.numero)}
                                            disabled={!etapes[commande.statut].suivant}
                                            className="w-36 rounded-md bg-emp-valider px-4 py-2 text-xs font-semibold text-secondary cursor-pointer hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary"
                                        >
                                            {etapes[commande.statut].bouton}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Flèches de bas de tableau (page précédente / suivante) */}
                <Pagination page={page} nombrePages={nombrePages} setPage={setPage} />
            </div>
        </div>
    );
}