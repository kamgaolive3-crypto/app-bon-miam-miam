import { useState } from "react";

// elements : la liste à afficher (commandes, réclamations, plats...)
// champsRecherche : les champs où chercher le texte, ex : ["numero", "etudiant"]
// parPage : nombre de lignes par page
export default function useRecherchePagination(elements, champsRecherche, parPage) {
    const [recherche, setRecherche] = useState("");
    // filtres : un objet, ex : { type: "Tous", statut: "Tous" }
    const [filtres, setFiltres] = useState({});
    const [page, setPage] = useState(0);

    // Appelée quand l'utilisateur tape dans la recherche.
    function changerRecherche(texte) {
        setRecherche(texte);
        setPage(0); // retour à la première page
    }

    // Appelée quand l'utilisateur choisit dans une liste.
    // nom : le champ concerné (ex : "type"), valeur : le choix (ex : "Livraison")
    function changerFiltre(nom, valeur) {
        setFiltres({ ...filtres, [nom]: valeur });
        setPage(0);
    }

    const texte = recherche.toLowerCase();

    const elementsFiltres = elements.filter((element) => {
        // La recherche : au moins un des champs doit contenir le texte.
        const okRecherche = champsRecherche.some((champ) =>
            String(element[champ]).toLowerCase().includes(texte)
        );

        // Les filtres : chacun doit valoir "Tous" (ou vide) ou correspondre.
        const okFiltres = Object.entries(filtres).every(
            ([nom, valeur]) => !valeur || valeur === "Tous" || element[nom] === valeur
        );

        return okRecherche && okFiltres;
    });

    const nombrePages = Math.ceil(elementsFiltres.length / parPage);
    const elementsPage = elementsFiltres.slice(page * parPage, (page + 1) * parPage);

    // Tout ce dont les pages ont besoin.
    return {
        recherche, changerRecherche,
        filtres, changerFiltre,
        page, setPage, nombrePages,
        elementsPage,
    };
}