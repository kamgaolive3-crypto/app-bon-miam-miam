// Reclamations.jsx : page « Réclamations » de l'espace Employé (route /Reclamations).
// Cartes, recherche/filtres, tableau paginé.
// Données : GET /api/reclamation (le personnel voit tout).
// Traitement : POST /api/reclamation/{id}/traiter (Open -> In progress, demande une réponse)
// puis POST /api/reclamation/{id}/decision-gerant (In progress -> Resolved/Rejected).
import { useState, useEffect } from "react";
import { FaCommentDots, FaCertificate, FaComment, FaRotate, FaCircleCheck, FaChevronDown, FaMagnifyingGlass } from "react-icons/fa6";
import { api } from "../../services/api";
import Pagination from "../../composantEmp/Pagination";
import useRecherchePagination from "../../hooks/useRecherchePagination";

// Cartes de résumé ; statut = statut à compter (null = toutes)
const cartes = [
    { titre: "Total", statut: null, Icone: FaCertificate, fond: "bg-emp-commande-carre", fondIcone: "bg-emp-commande-rond", couleurIcone: "text-primary", couleurTitre: "text-primary" },
    { titre: "Ouvertes", statut: "Ouverte", Icone: FaComment, fond: "bg-emp-attente-carre", fondIcone: "bg-emp-attente-rond", couleurIcone: "text-emp-attente-emoji", couleurTitre: "text-emp-attente-emoji" },
    { titre: "En cours", statut: "En cours", Icone: FaRotate, fond: "bg-emp-bleu-carre", fondIcone: "bg-emp-bleu-rond", couleurIcone: "text-emp-bleu-emoji", couleurTitre: "text-emp-bleu-emoji" },
    { titre: "Résolues", statut: "Résolue", Icone: FaCircleCheck, fond: "bg-emp-vert-carre", fondIcone: "bg-emp-vert-rond", couleurIcone: "text-emp-vert-emoji", couleurTitre: "text-emp-vert-emoji" },
];

const colonnes = ["N°", "Sujet", "Étudiant", "Date", "Statut", "Actions"];

// statuts du backend -> libellés affichés
const libelles = {
    en_attente: "Ouverte",
    observation: "En cours",
    validee: "Résolue",
    resolue: "Résolue",
    rejetee: "Rejetée",
};

// Couleurs de la pastille de chaque statut
const stylesStatut = {
    "Ouverte": "bg-emp-attente-rond text-emp-attente-emoji",
    "En cours": "bg-emp-bleu-rond text-emp-bleu-emoji",
    "Résolue": "bg-emp-vert-rond text-emp-vert-emoji",
    "Rejetée": "bg-emp-attente-rond text-emp-attente-emoji",
};
// Parcours : texte du bouton + action backend correspondante (null = fin)
const etapes = {
    "Ouverte": { bouton: "Traiter", action: "traiter" },
    "En cours": { bouton: "Résoudre", action: "decider" },
    "Résolue": { bouton: "Voir", action: null },
    "Rejetée": { bouton: "Voir", action: null },
};
const PAR_PAGE = 6;

export default function Reclamations() {
    const [liste, setListe] = useState([]);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    // fenêtre « proposer une solution » : { numero, texte } ou null
    const [solution, setSolution] = useState(null);

    // Filtre par période appliqué AVANT la recherche/pagination.
    const [periode, setPeriode] = useState("");
    // dates LOCALES : toISOString passerait en UTC et decalerait d un jour
    const isoLocal = (d) =>
        d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const aujourdhui = isoLocal(new Date());
    const limiteSemaine = isoLocal(new Date(Date.now() - 7 * 86400000));
    const listeFiltree = liste.filter((c) => {
        if (!periode || !c.dateISO) return true;
        if (periode === "aujourdhui") return c.dateISO === aujourdhui;
        if (periode === "semaine") return c.dateISO >= limiteSemaine;
        return true;
    });

    // Hook partagé : recherche, filtres (clé = champ des données), pagination
    const { recherche, changerRecherche, filtres, changerFiltre, page, setPage, nombrePages, elementsPage: listeAffichee } =
        useRecherchePagination(listeFiltree, ["numero", "sujet", "etudiant"], PAR_PAGE);

    // charger() : GET /api/reclamation puis transformation vers les champs du tableau.
    function charger() {
        api.get("/reclamation")
            .then((brut) => {
                const fil = Array.isArray(brut) ? brut : (brut.data ?? brut.reclamations ?? []);
                setListe(fil.map((r) => ({
                    numero: r.Id_reclamation,
                    sujet: r.motif_reclamation,
                    description: r.description_reclamation,
                    etudiant: ((r.etudiant?.utilisateur?.prenom ?? "") + " " + (r.etudiant?.utilisateur?.nom ?? "")).trim() || r.Id_utilisateur,
                    date: (r.date_reclamation || "").slice(8, 10) + "/" + (r.date_reclamation || "").slice(5, 7) + " " + (r.date_reclamation || "").slice(11, 16),
                    dateISO: (r.date_reclamation || "").slice(0, 10),
                    statut: libelles[r.statut_reclamation] || r.statut_reclamation,
                    brut: r,
                })));
                setErreur("");
            })
            .catch((e) => setErreur(e.message));
    }
    useEffect(charger, []);

    // Compte sur la liste complète (null = tout)
    function compter(statut) {
        if (statut === null) return liste.length;
        return liste.filter((r) => r.statut === statut).length;
    }
    // Clic sur « Traiter » / « Résoudre » : envoie la bonne action au backend puis recharge.
    async function avancer(numero) {
        const ligne = liste.find((r) => r.numero === numero);
        const etape = etapes[ligne?.statut];
        if (!ligne || !etape?.action) return;
        setMessage(""); setErreur("");
        if (etape.action === "traiter") {
            // Open -> In progress : on ouvre la fenêtre de solution (le personnel rédige)
            setSolution({ numero, texte: "" });
            return;
        }
        // In progress -> Resolved/Rejected : décision du gérant
        const decisionValidee = window.confirm("Réclamation " + numero + " : OK, valider ? (Annuler = rejeter)");
        try {
            await api.post("/reclamation/" + encodeURIComponent(numero) + "/decision-gerant", { decision: decisionValidee ? "validee" : "rejetee" });
            setMessage("Réclamation " + numero + (decisionValidee ? " résolue." : " rejetée."));
            charger();
        } catch (e) { setErreur(e.message); }
    }

    // Envoi de la solution rédigée dans la fenêtre (POST /api/reclamation/{id}/traiter)
    async function proposerSolution() {
        if (!solution?.texte.trim()) return;
        setMessage(""); setErreur("");
        try {
            await api.post("/reclamation/" + encodeURIComponent(solution.numero) + "/traiter", { reponse: solution.texte });
            setMessage("Solution proposée pour la réclamation " + solution.numero + " — elle passe au gérant pour décision.");
            setSolution(null);
            charger();
        } catch (e) {
            setErreur(e.message);
            setSolution(null);
        }
    }
    return (
        <div className="p-4 md:p-6">
            {/* En-tête */}
            <div className="flex items-start gap-4 mb-6">
                <FaCommentDots size={28} className="text-primary mt-1" />
                <div>
                    <h2 className="font-bold">Réclamations</h2>
                    <p className="text-sm text-secondary">Consultez et traitez les réclamations des étudiants.</p>
                </div>
            </div>

            {erreur !== "" && (
                <p className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm text-red-700">{erreur}</p>
            )}
            {message !== "" && (
                <p className="mb-4 rounded-md bg-emp-vert-rond px-4 py-2 text-sm text-emp-vert-emoji">{message}</p>
            )}

            {/* Fenêtre « Proposer une solution » (remplace l ancien window.prompt) */}
            {solution && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
                        <h3 className="font-bold">Proposer une solution</h3>
                        <p className="mt-1 text-sm text-secondary">
                            Réclamation <b>{solution.numero}</b> — votre réponse est envoyée au client,
                            la réclamation passe ensuite devant le gérant.
                        </p>
                        <textarea
                            autoFocus
                            rows={4}
                            value={solution.texte}
                            onChange={(e) => setSolution({ ...solution, texte: e.target.value })}
                            placeholder="Ex : plat offert, nouveau plat préparé, réduction sur la prochaine commande…"
                            className="mt-3 w-full rounded-md border border-primary px-3 py-2 text-sm outline-none"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setSolution(null)}
                                className="cursor-pointer rounded-md bg-emp-type px-4 py-2 text-sm font-semibold text-secondary hover:bg-emp-attente-rond"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={proposerSolution}
                                className="cursor-pointer rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-secondary hover:bg-primary-800"
                            >
                                Envoyer la solution
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cartes (nombres calculés) */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {cartes.map((carte) => (
                    <div key={carte.titre} className={`flex items-center gap-3 rounded-lg p-4 ${carte.fond}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${carte.fondIcone}`}>
                            <carte.Icone size={18} className={carte.couleurIcone} />
                        </div>
                        <div className="text-sm">
                            <p className={carte.couleurTitre}>{carte.titre}</p>
                            <p className="mt-2 text-secondary">{compter(carte.statut)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recherche + filtres */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1 min-w-0">
                    <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => changerRecherche(e.target.value)}
                        placeholder="Recherche une réclamation..."
                        className="w-full rounded-md border border-primary bg-white py-3 pl-9 pr-3 text-sm outline-none"
                    />
                </div>

                {/* Filtre Statut : les value doivent être identiques aux données (accents compris) */}
                <div className="relative md:w-56 md:shrink-0">
                    <select
                        value={filtres.statut || "Tous"}
                        onChange={(e) => changerFiltre("statut", e.target.value)}
                        className="w-full appearance-none rounded-md bg-emp-type py-3 pl-4 pr-10 text-sm cursor-pointer"
                    >
                        <option value="Tous">Statut : Tous</option>
                        <option value="Ouverte">Ouverte</option>
                        <option value="En cours">En cours</option>
                        <option value="Résolue">Résolue</option>
                        <option value="Rejetée">Rejetée</option>
                    </select>
                    <FaChevronDown size={12} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />
                </div>

                {/* Filtre Date : périodes glissantes calculées côté client */}
                <div className="relative md:w-56 md:shrink-0">
                    <select
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value)}
                        className="w-full appearance-none rounded-md bg-emp-type px-3 py-3 pr-10 text-sm cursor-pointer md:w-56 md:shrink-0"
                    >
                        <option value="">Date : Toutes</option>
                        <option value="aujourdhui">Aujourd'hui</option>
                        <option value="semaine">Cette semaine</option>
                    </select>
                    <FaChevronDown size={12} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />
                </div>
            </div>
            {/* Tableau (défile horizontalement sur mobile) */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-grey-300 bg-emp-carre">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-emp-barre-carre">
                        <tr>
                            {colonnes.map((colonne) => (
                                <th key={colonne} className="px-4 py-4 font-medium">{colonne}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Message si aucun résultat */}
                        {listeAffichee.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center">Aucune réclamation trouvée.</td></tr>
                        )}
                        {listeAffichee.map((r) => (
                            <tr key={r.numero} className="border-t border-emp-type">
                                <td className="px-4 py-5">{r.numero}</td>
                                <td className="px-4 py-5">{r.sujet}</td>
                                <td className="px-4 py-5">{r.etudiant}</td>
                                <td className="px-4 py-5">{r.date}</td>
                                {/* Pastille de statut */}
                                <td className="px-4 py-5">
                                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${stylesStatut[r.statut]}`}>
                                        {r.statut}
                                    </span>
                                </td>
                                {/* Traiter (plein) ou Voir (contour) ; « Voir » : TODO non branché */}
                                <td className="px-4 py-5">
                                    <button
                                        type="button"
                                        onClick={() => avancer(r.numero)}
                                        className={`w-32 rounded-md py-2 text-xs font-semibold cursor-pointer ${
                                            etapes[r.statut].action
                                                ? "bg-primary-700 text-secondary hover:bg-primary-800"
                                                : "border border-emp-valider bg-emp-carre px-4 py-1.5 text-xs font-semibold text-emp-valider cursor-pointer hover:bg-emp-commande-rond"
                                        }`}
                                    >
                                        {etapes[r.statut].bouton}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination page={page} nombrePages={nombrePages} setPage={setPage} />
            </div>
        </div>
    );
}