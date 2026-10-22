// Page Menu reproduisant la maquette (rafinee) :
// titres editoriaux (eyebrow + Instrument Serif) ;
// chips de categories COLLANTES au scroll avec compteur d'articles ;
// grille de cartes (photo ratio 3/2, nom Inria, prix or, pill "Ajouter",
// puce "Du jour" quand Menu_du_jour = 1)
import { useState, useEffect } from "react"
import usePanier from "../../composantE/usePanier"
import TitreSection from "../../composantE/TitreSection"
import { api } from "../../services/api"
import platMaquette from "../../../public/maq/maq_plat.jpg";

//les catégories affichées en haut (boutons de filtre)
//a gauche : libellé affiché, a droite : valeur en base (table article_menu)
const categories = [
    { label: "Plats", valeur: "plat" },
    { label: "Boissons", valeur: "boisson" },
    { label: "Accompagnements", valeur: "accompagnement" },
    { label: "Desserts", valeur: "dessert" },
]

export default function Menu() {
    //récupère la fonction "ajouter" de l'outil panier
    const { ajouter } = usePanier()

    //---------------- DONNEES DU BACKEND ----------------
    //le menu complet vient de GET /api/article_menu (créé/modifié par le staff)
    const [plats, setPlats] = useState([])
    //true pendant le premier chargement de la liste
    const [chargement, setChargement] = useState(true)
    //message d'erreur s'il y a eu un problème de chargement
    const [erreur, setErreur] = useState("")

    //au premier affichage de la page, on va chercher le menu
    useEffect(() => {
        api.get("/article_menu-du-jour")
            .then((liste) => {
                //on transforme les champs de la base (Id_article, nom_article...)
                //en champs utilisés par la page (id, nom, prix, categorie, image)
                setPlats(liste.map((a) => ({
                    id: a.Id_article,
                    nom: a.nom_article,
                    prix: a.prix_article,
                    categorie: a.categories_article,
                    image: a.image_article || platMaquette,
                    description: a.description || "",
                    disponible: a.disponibilite_article,
                    menuDuJour: !!a.Menu_du_jour,
                    restaurant: a.Id_restaurant, // le panier exige un seul restaurant
                })))
            })
            .catch((e) => setErreur(e.message))
            .finally(() => setChargement(false))
    }, [])

    //---------------- ETATS DE LA PAGE ----------------
    //la catégorie choisie (au départ : Plats)
    const [categorie, setCategorie] = useState("plat")
    //l'id du plat qui vient d'être ajouté (pour afficher "Ajouté ✓" un instant)
    const [ajouteId, setAjouteId] = useState(null)
    //toast de confirmation
    const [toast, setToast] = useState("")

    //garde seulement les plats de la catégorie choisie
    const platsAffiches = plats.filter((p) => p.categorie === categorie)

    //nombre d'articles par categorie : sert au compteur des chips
    const comptes = {}
    categories.forEach((c) => {
        comptes[c.valeur] = plats.filter((p) => p.categorie === c.valeur).length
    })

    //fonction appellée quand on clique sur "Ajouter"
    const ajouterAuPanier = (plat) => {
        if (!plat.disponible) return // un article indisponible ne peut pas être ajouté
        ajouter(plat) // met le plat dans le panier
        setAjouteId(plat.id)
        setToast(plat.nom + " ajouté au panier")
        setTimeout(() => setAjouteId(null), 1500) // "Ajouté ✓" disparait après 1,5 seconde
        setTimeout(() => setToast(""), 2400)       // toast disparait après ~2,4 secondes
    }

    return (
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-8 md:px-8">
            {/* toast de confirmation */}
            {toast && (
                <p
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-5 py-2.5 font-sans text-[13px] text-white shadow-hover"
                    style={{ animation: "toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                    {toast}
                </p>
            )}

            {/* ---------- TITRE ---------- */}
            <TitreSection
                eyebrow="À la carte"
                titre="Notre menu"
                note="Chaque tranche de 1 000 F = 1 point de fidélité"
            />

            {/* message d'erreur du chargement */}
            {erreur && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-[13px] text-red-700">
                    {erreur}
                </p>
            )}

            {/* ---------- CHIPS DE FILTRE (collantes + compteur) ---------- */}
            <div className="sticky top-0 z-20 -mx-4 mt-4 bg-creme/85 px-4 py-2.5 backdrop-blur-md md:-mx-8 md:px-8">
                <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                        <button
                            key={c.valeur}
                            type="button"
                            onClick={() => setCategorie(c.valeur)}
                            className={
                                "flex cursor-pointer select-none items-center gap-1.5 rounded-full py-1.5 pl-4 pr-2.5 font-inria text-[14px] transition-all duration-150 active:scale-[0.96] " +
                                (c.valeur === categorie
                                    ? "bg-or text-black shadow-card"
                                    : "bg-white text-encre shadow-card hover:-translate-y-px hover:text-or-deep")
                            }
                        >
                            {c.label}
                            {/* compteur du nombre d'articles de la categorie */}
                            <span
                                className={
                                    "rounded-full px-1.5 py-0.5 font-sans text-[10.5px] font-semibold " +
                                    (c.valeur === categorie
                                        ? "bg-black/10 text-black"
                                        : "bg-creme text-gris-pa")
                                }
                            >
                                {comptes[c.valeur]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ---------- LISTE DES PLATS ---------- */}
            {chargement ? (
                <p className="mt-8 font-inria text-[14px] text-encre">Chargement du menu...</p>
            ) : platsAffiches.length === 0 ? (
                <p className="mt-8 font-inria text-[14px] text-encre">
                    Aucun article dans cette catégorie pour le moment.
                </p>
            ) : (
                /* 1 colonne sur téléphone, 2 colonnes sur grand écran (maquette 2 col) */
                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* .map() fabrique une carte pour chaque plat */}
                    {platsAffiches.map((plat, i) => (
                        <article
                            key={categorie + plat.id}
                            className="miam-carte group flex overflow-hidden p-3.5"
                            style={{ animation: "fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both", animationDelay: Math.min(i * 60, 360) + "ms" }}
                        >
                            {/* image a gauche (ratio fixe 4/5, zoom au survol) */}
                            <div className="relative w-[42%] shrink-0 overflow-hidden rounded-lg">
                                <img
                                    src={plat.image}
                                    alt={plat.nom}
                                    className="h-full min-h-40 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                                />
                                {/* puce "Du jour" (liaison Menu_du_jour en base) */}
                                {plat.menuDuJour && (
                                    <span className="miam-badge-jour absolute left-2 top-2">
                                        Du jour
                                    </span>
                                )}
                            </div>

                            {/* contenu a droite : nom, desc, prix, ligne, pill */}
                            <div className="flex min-w-0 flex-1 flex-col pl-3.5">
                                <h3 className="font-inria text-[16px] leading-snug text-black">
                                    {plat.nom}
                                </h3>
                                {plat.description && (
                                    <p className="mt-0.5 line-clamp-2 font-sans text-[12px] leading-snug text-encre">
                                        {plat.description}
                                    </p>
                                )}
                                {/* prix pousse en bas de la carte */}
                                <p className="mt-auto pt-2 font-inria text-[15px] font-bold tabular-nums tracking-tight text-or-deep">
                                    {plat.prix}Fcfa
                                </p>

                                <span className="miam-filet mt-2.5" />

                                {/* pill "Ajouter" : or pleine (maquette) */}
                                <button
                                    type="button"
                                    onClick={() => ajouterAuPanier(plat)}
                                    disabled={!plat.disponible}
                                    className="miam-pill mt-2.5 h-9 justify-center"
                                >
                                    {ajouteId === plat.id
                                        ? "Ajouté ✓"
                                        : plat.disponible
                                            ? <span className="flex items-center gap-1.5"><span className="text-base leading-none">+</span> Ajouter</span>
                                            : "Épuisé"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
