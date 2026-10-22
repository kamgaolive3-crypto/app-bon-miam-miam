// La page d accueil reproduit la maquette "Accueil" (rafinee) :
// 1. grille "Menu du jours" (cartes + puce "Du jour" + CTA beige)
// 2. hero "Plat du jour" (photo plein cadre, voile de lisibilite,
//    bandeau verre : nom Instrument Serif + badge de prix or)
// 3. bandes Evenements / Promotions (#E8E8E8)
// tout le contenu affiche vient du backend (articles, evenements)
import { useState, useEffect } from "react";
import usePanier from "../../composantE/usePanier"
import CartePlat from "../../composantE/CartePlat"
import TitreSection from "../../composantE/TitreSection"
import { api } from "../../services/api"
import { useAuth } from "../../services/auth";

// image de repli de la maquette quand un article n a pas de photo
import platMaquette from "../../../public/maq/maq_plat.jpg";
import heroMaquette from "../../../public/maq/maq_plat_du_jour.jpg";
import eventMaquette from "../../../public/maq/maq_evenement.jpg";
import promoMaquette from "../../../public/maq/maq_promo.jpg";

//transforme un article de la base en carte de plat utilisable par la page
const versPlat = (a) => ({
    id: a.Id_article,
    nom: a.nom_article,
    prix: a.prix_article,
    image: a.image_article || platMaquette,
    description: a.description || "",
    menuDuJour: !!a.Menu_du_jour,
    restaurant: a.Id_restaurant, // necessaire au panier (un seul restaurant)
});

// format "13 oct 2026" pour une date ISO renvoyee par l API
const dateCourte = (iso) => {
    const d = new Date(iso)
    if (isNaN(d)) return ""
    return d.getDate() + " " + ["jan","fev","mar","avr","mai","juin","juil","aout","sep","oct","nov","dec"][d.getMonth()]
}

export default function Accueil() {
    //le plat du jour : menu_du_jour = 1 et categorie = plat (GET /api/article_menu-du-jour/plat)
    const [platDuJour, setPlatDuJour] = useState(null)
    //les promotions et evenements : GET /api/promotions/actives
    const [promotions, setPromotions] = useState([])
    //le menu du jour complet (GET /api/article_menu-du-jour)
    const [menuDuJour, setMenuDuJour] = useState([])
    //message affiche apres un clic sur "Je participe" (toast)
    const [message, setMessage] = useState("")
    //recupere l'utilisateur connecte (pour participer aux evenements)
    const { user } = useAuth()
    //recupere la fonction "ajouter" de l'outil panier
    const { ajouter: ajouterAuPanier } = usePanier()
    //id du plat recemment ajoute (feedback "Ajoute ✓")
    const [ajouteId, setAjouteId] = useState(null)

    //au premier affichage : les 3 chargements d'un coup
    useEffect(() => {
        api.get("/article_menu-du-jour/plat") // menu du jour de la categorie plat
            .then((liste) => setPlatDuJour(liste[0] ? versPlat(liste[0]) : null))
            .catch(() => setPlatDuJour(null))

        api.get("/evenements/actifs")
            .then((liste) => setPromotions(liste.map((e) => ({
                id: e.Id_evenement,
                // un evenement de type promotion alimente la bande "Promotions",
                // le reste (mini_jeu etc.) alimente la bande "Evenements"
                bande: e.type_evenement === "promotion" ? "promo" : "event",
                etiquette: e.type_evenement === "mini_jeu" ? "Mini-jeu" : e.type_evenement === "promotion" ? "Promotions" : "Evenements",
                image: e.affiche_evenement || (e.type_evenement === "promotion" ? promoMaquette : eventMaquette),
                texte: e.description_evenement || (e.taux_reduction ? "Réduction de " + e.taux_reduction + "%" : "Points a gagner : " + e.points_evenement),
                points: e.points_evenement,
                // fenetre de dates lisible : "13 oct → 27 oct"
                dates: e.debut_evenement && e.fin_evenement ? {
                    debut: dateCourte(e.debut_evenement),
                    fin: dateCourte(e.fin_evenement),
                } : null,
            }))))
            .catch(() => setPromotions([]))

        api.get("/article_menu-du-jour") // tous les articles du menu du jour
            .then((liste) => setMenuDuJour(liste.map(versPlat)))
            .catch(() => setMenuDuJour([]))
    }, [])

    //ajouter au panier depuis l accueil avec feedback
    const ajouter = (plat) => {
        ajouterAuPanier(plat)
        setAjouteId(plat.id)
        setTimeout(() => setAjouteId(null), 1500)
    }

    //participer a un mini-jeu/evenement : POST /api/evenement/{id}/participer
    const participer = async (id) => {
        if (!user) {
            setMessage("Connectez-vous pour participer.")
            return
        }
        try {
            const reponse = await api.post("/evenement/" + id + "/participer")
            setMessage("Participation enregistree ! Points credites : " + reponse.points_gagnes)
        } catch (e) {
            setMessage(e.message)
        }
        setTimeout(() => setMessage(""), 3200)
    }

    //les bandes affichees : evenements puis promotions (ordre de la maquette)
    const bandes = [...promotions.filter((p) => p.bande === "event"), ...promotions.filter((p) => p.bande === "promo")]

    return (
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-8 md:px-8">
            {/* toast de participation / erreur */}
            {message && (
                <p
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-5 py-2.5 text-center font-sans text-[13px] text-white shadow-hover"
                    style={{ animation: "toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                    {message}
                </p>
            )}

            {/* ---------- 0. EVENEMENTS & PROMOTIONS EN COURS (avant le menu, cf demande client) ---------- */}
            <section>
                {bandes.length > 0 && (
                    <div className="mb-4"><TitreSection eyebrow="A ne pas manquer" titre="Evenements & Promotions" /></div>
                )}
                {bandes.length === 0 && (
                    <p className="font-inria text-[13px] text-encre/70">
                        Aucune promotion ni evenement en cours pour le moment.
                    </p>
                )}
                <div className="flex flex-col gap-4">
                    {bandes.map((promo) => (
                        <div
                            key={promo.id}
                            className="flex flex-col gap-4 rounded-xl bg-zone/90 p-4 transition-colors duration-200 hover:bg-[#EFEDE9] md:flex-row md:items-center md:gap-5"
                        >
                            {/* affiche a gauche (ratio fixe, masquee sur base) */}
                            <img
                                src={promo.image}
                                alt={promo.etiquette}
                                className="aspect-[4/3] w-full rounded-lg object-cover md:h-[92px] md:w-[124px]"
                            />
                            {/* textes : petite majuscule + titre Instrument + fenetre de dates */}
                            <div className="flex flex-1 flex-col gap-1">
                                <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-encre/70">
                                    {promo.etiquette}
                                </span>
                                <p className="font-instrument text-[19px] leading-snug text-black md:text-[23px]">
                                    {promo.texte}
                                </p>
                                {/* dates : l event est actif DU... AU... (lisible pour le client) */}
                                {promo.dates && (
                                    <span className="font-sans text-[11.5px] text-encre/70">
                                        Du {promo.dates.debut} au {promo.dates.fin}
                                        {promo.points ? " — " + promo.points + " points" : ""}
                                    </span>
                                )}
                            </div>
                            {/* filet vertical sur desktop */}
                            <span className="hidden h-12 w-px bg-black/10 md:block" />
                            {/* CTA "Je participe" */}
                            <button
                                type="button"
                                onClick={() => participer(promo.id)}
                                className="miam-cta self-start md:self-auto"
                            >
                                Je participe
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- 1. PLAT DU JOUR (hero photo + bandeau verre) ---------- */}
            {platDuJour && (
                <section
                    className="relative mt-5 overflow-hidden rounded-2xl shadow-soft"
                    style={{ animation: "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                    {/* photo du plat tel qu affiche dans la rubrique menu (+ repli maquette) */}
                    <img
                        src={platDuJour.image || heroMaquette}
                        alt={platDuJour.nom}
                        className="h-64 w-full object-cover md:h-[400px]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/20" />
                    {/* etiquette blanche en haut a gauche (maquette) */}
                    <span className="absolute left-5 top-5 font-sans text-[20px] font-medium tracking-tight text-white md:left-8 md:top-7 md:text-[26px]">
                        Plat du jour:
                    </span>
                    {/* bandeau verre au bas de la photo */}
                    <div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-xl bg-white/90 px-4 py-3.5 backdrop-blur md:inset-x-5 md:bottom-5 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
                        <div>
                            <p className="miam-eyebrow">Découvrez notre plat du jour</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2.5">
                                <p className="font-instrument text-[22px] leading-none text-black md:text-[27px]">
                                    {platDuJour.nom}
                                </p>
                                <span className="miam-prix-badge">
                                    {platDuJour.prix}Fcfa
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => ajouter(platDuJour)}
                            className="miam-cta-or self-start md:self-auto"
                        >
                            {platDuJour.id === ajouteId ? "Ajouté ✓" : "Ajouter au panier"}
                        </button>
                    </div>
                </section>
            )}

            {/* ---------- 2. MENU DU JOURS ---------- */}
            <section className={platDuJour ? "mt-12" : ""}>
                <TitreSection
                    eyebrow="Frais du jour"
                    titre="Menu du jours"
                    note="Chaque jour, de nouveaux plats"
                />
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {menuDuJour.length === 0 ? (
                        <p className="font-inria text-[14px] text-encre">
                            Le menu du jour n&apos;est pas encore publie — revenez bientot !
                        </p>
                    ) : (
                        menuDuJour.slice(0, 3).map((plat, i) => (
                            <CartePlat
                                key={plat.id}
                                plat={plat}
                                onAjouter={ajouter}
                                ajoute={plat.id === ajouteId}
                                delai={i * 80}
                            />
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}
