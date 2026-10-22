/// MenuEmp.jsx : page « Gestion du menu » de l'espace Employé (route /MenuEmp).
// Onglets de catégories, recherche, tableau paginé, interrupteur de disponibilité.
// Données : GET /api/article_menu (le personnel voit tout). Anti-disponibilité : PUT /api/article_menu/{id}.
import { useState, useEffect } from "react";
import { FaUtensils, FaPlus, FaMagnifyingGlass } from "react-icons/fa6";
import { api } from "../../services/api";
import eruplat from "../../assets/plats/eru.png"; // image de secours si le plat n'en a pas
import Pagination from "../../composantEmp/Pagination";
import useRecherchePagination from "../../hooks/useRecherchePagination";

const onglets = ["Tous", "Plats principaux", "Accompagnements", "Boissons"];
// Onglet (pluriel) -> catégorie écrite dans les plats (singulier)
const categorieParOnglet = {
    "Plats principaux": "Plat principal",
    "Accompagnements": "Accompagnement",
    "Boissons": "Boisson",
};
const colonnes = ["Image", "Nom du plat", "Catégorie", "Prix", "Disponibilité", "Action"];

// code du backend -> libellé affiché
const libellesCategories = {
    plat: "Plat principal",
    accompagnement: "Accompagnement",
    boisson: "Boisson",
    dessert: "Dessert",
    autre: "Autre",
};

const PAR_PAGE = 6;

export default function MenuEmp() {
    const [ongletActif, setOngletActif] = useState("Tous");
    const [liste, setListe] = useState([]);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");

    // charger() : GET /api/article_menu puis transformation vers les champs du tableau.
    function charger() {
        api.get("/article_menu")
            .then((brut) => {
                const fil = Array.isArray(brut) ? brut : (brut.data ?? brut.plats ?? []);
                setListe(fil.map((a) => ({
                    id: a.Id_article,
                    nom: a.nom_article,
                    categorie: libellesCategories[a.categories_article] || a.categories_article,
                    prix: a.prix_article,
                    disponible: !!a.disponibilite_article,
                    image: a.image_article || eruplat,
                    brut: a, // on garde la ligne complète pour le PUT de mis à jour
                })));
                setErreur("");
            })
            .catch((e) => setErreur(e.message));
    }
    useEffect(charger, []);

    // Hook partagé : recherche (sur "nom"), filtres et pagination.
    // Les onglets passent par changerFiltre("categorie", ...).
    const {
        recherche, changerRecherche,
        changerFiltre,
        page, setPage, nombrePages,
        elementsPage: platsPage,
    } = useRecherchePagination(liste, ["nom"], PAR_PAGE);

    // Inverse la disponibilité du plat cliqué : PUT /api/article_menu/{id}
    // (on renvoie TOUTES les colonnes : la validation du backend les exige).
    async function basculer(id) {
        const plat = liste.find((p) => p.id === id);
        if (!plat) return;
        setMessage(""); setErreur("");
        // mise à jour optimiste : l'interrupteur bouge tout de suite...
        setListe(liste.map((p) => (p.id === id ? { ...p, disponible: !p.disponible } : p)));
        try {
            const a = plat.brut;
            await api.put("/article_menu/" + encodeURIComponent(id), {
                Id_article: a.Id_article,
                nom_article: a.nom_article,
                image_article: a.image_article,
                description: a.description,
                prix_article: a.prix_article,
                categories_article: a.categories_article,
                disponibilite_article: !a.disponibilite_article,
                Menu_du_jour: a.Menu_du_jour,
                Id_restaurant: a.Id_restaurant, // requis par la validation du backend
            });
            plat.brut = { ...a, disponibilite_article: !a.disponibilite_article };
            setMessage(plat.nom + " : " + (plat.disponible ? "indisponible" : "disponible") + ".");
            setErreur("");
        } catch (e) {
            // ...repli : on remet la disponibilite d ORIGINE du plat
            setListe((il) => il.map((p) => (p.id === id ? { ...p, disponible: !!plat.brut.disponibilite_article } : p)));
            setErreur(e.message);
        }
    }

    return (
        <div className="p-4 md:p-6">

            {/* En-tête */}
            <div className="flex items-start gap-4 mb-6">
                <FaUtensils size={28} className="text-primary mt-1" />
                <div>
                    <h2 className="font-bold">Gestion du menu</h2>
                    <p className="text-sm text-secondary">
                        Modifier temporairement la disponibilité des plats et mettez à jour le menu.
                    </p>
                </div>
            </div>

            {erreur !== "" && (
                <p className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm text-red-700">{erreur}</p>
            )}
            {message !== "" && (
                <p className="mb-4 rounded-md bg-emp-vert-rond px-4 py-2 text-sm text-emp-vert-emoji">{message}</p>
            )}

            {/* Onglets : filtrent le tableau par catégorie */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {onglets.map((onglet) => (
                    <button
                        key={onglet}
                        type="button"
                        onClick={() => {
                            setOngletActif(onglet);
                            // "Tous" n'est pas une catégorie : il retire le filtre
                            changerFiltre("categorie", categorieParOnglet[onglet] || "Tous");
                        }}
                        className={`rounded-lg border py-3 text-sm font-semibold cursor-pointer ${
                            onglet === ongletActif
                                ? "border-primary-700 bg-primary-700 text-secondary"
                                : "border-emp-trace-pab bg-emp-pab text-secondary hover:bg-emp-pab"
                        }`}
                    >
                        {onglet}
                    </button>
                ))}
            </div>

            {/* Recherche + bouton Ajouter (TODO : bouton non branché) */}
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 min-w-0">
                    <FaMagnifyingGlass
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                        size={14}
                    />
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => changerRecherche(e.target.value)}
                        placeholder="Recherche un plat..."
                        className="w-full rounded-md border border-primary bg-white py-3 pl-9 pr-3 text-sm outline-none"
                    />
                </div>
            </div>

            {/* Tableau des plats (défile horizontalement sur mobile) */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-grey-300 bg-emp-carre">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-emp-barre-carre">
                        <tr>
                            {colonnes.map((colonne) => (
                                <th key={colonne} className="px-4 py-4 font-medium">
                                    {colonne}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {/* Message si aucun résultat */}
                        {platsPage.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center">
                                    Aucun plat trouvé.
                                </td>
                            </tr>
                        )}

                        {platsPage.map((plat) => (
                            <tr key={plat.id} className="border-t border-emp-type">
                                <td className="px-4 py-3">
                                    <img
                                        src={plat.image}
                                        alt={plat.nom}
                                        className="h-12 w-16 rounded-lg object-cover"
                                    />
                                </td>
                                <td className="px-4 py-3">{plat.nom}</td>
                                <td className="px-4 py-3">{plat.categorie}</td>
                                <td className="px-4 py-3">{plat.prix.toLocaleString("fr-FR")} Fcfa</td>

                                {/* Interrupteur : vert à droite si disponible, gris à gauche sinon */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-col items-start gap-1">
                                        <button
                                            type="button"
                                            onClick={() => basculer(plat.id)}
                                            aria-label="Changer la disponibilité"
                                            className={`relative h-6 w-11 rounded-full cursor-pointer transition-colors ${
                                                plat.disponible ? "bg-emp-vert-emoji" : "bg-grey-300"
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                                                    plat.disponible ? "left-5" : "left-0.5"
                                                }`}
                                            />
                                        </button>
                                        <span className="text-xs">
                                            {plat.disponible ? "Disponible" : "Indisponible"}
                                        </span>
                                    </div>
                                </td>

                                {/* « Voir » affiche la fiche du plat (message + description). */}
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMessage(
                                                plat.nom + " (" + plat.prix.toLocaleString("fr-FR") + " Fcfa) : " +
                                                (plat.brut.description || "Aucune description.")
                                            )
                                        }
                                        className="w-full max-w-40 rounded-md border border-emp-valider bg-emp-carre py-2 text-xs font-semibold text-emp-valider cursor-pointer hover:bg-emp-commande-rond"
                                    >
                                        Voir
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