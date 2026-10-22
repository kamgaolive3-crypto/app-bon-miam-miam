// Page Panier reproduisant la maquette (raffinee) :
// titre "Mon panier" + pill "Historiques des commandes >" ;
// lignes d articles fines (photo, nom Inria, description 12px, prix,
// compteur beige avec pop sur la quantite) ;
// colonne Finalisation + Recapitulatif + CTA or ; bande "Apres commande"
import { useState } from "react"
import { Link } from "react-router-dom"
import usePanier from "../../composantE/usePanier"
import { api } from "../../services/api"
import { useAuth } from "../../services/auth";

// valeur de test : le vrai montant sera donné par le gérant (API PHP)
const FRAIS_LIVRAISON = 1000

//écrit un nombre avec des espaces : 6000 devient "6 000 Fcfa"
const fcfa = (n) => n.toLocaleString("fr-FR") + " Fcfa"

//renvoie le libellé lisible d'un code de moyen de paiement de l API
const labelMoyen = (code) =>
    ({ MOMO: "MTN Mobile Money", OM: "Orange Money", CARTE: "carte bancaire" }[code] || code)

export default function Panier() {
    //récupère ce dont on a besoin dans l outil panier
    const { panier, changerQuantite, retirer, vider, total } = usePanier()
    //auth : passer une commande exige d être connecté
    const { user } = useAuth()

    //---------------- ETATS DE LA PAGE ----------------
    //mode choisi : "surPlace" ou "livraison"
    const [mode, setMode] = useState("surPlace")
    //heure d'arrivée au format "17:00"
    const [heure, setHeure] = useState("17:00")
    //points de fidélité à dépenser (multiple de 15 = 1 réduction de 1000 F)
    const [points, setPoints] = useState(0)
    //moyen de paiement choisi (valeurs attendues par l API : MOMO, OM, CARTE)
    const [paiement, setPaiement] = useState("MOMO")
    const MOYENS = [
        { valeur: "MOMO", label: "MTN Mobile Money" },
        { valeur: "OM", label: "Orange Money" },
        { valeur: "CARTE", label: "Carte bancaire" },
    ]
    //message affiché après avoir confirmé la commande
    const [message, setMessage] = useState("")
    //message d'erreur (ex : requêtes refusées ou pas connecté)
    const [erreur, setErreur] = useState("")
    //true pendant l envoi à l API (pour désactiver le bouton)
    const [envoi, setEnvoi] = useState(false)

    //---------------- CALCULS ----------------
    //0 si on mange sur place, sinon les frais de livraison
    const frais = mode === "livraison" ? FRAIS_LIVRAISON : 0
    //réduction en F : 15 points => 1000 F (calc comme le backend)
    const reduction = Math.floor(points / 15) * 1000
    const totalFinal = Math.max(total + frais - reduction, 0)

    //---------------- ACTIONS ----------------
    //fonction appellée quand on clique sur "Confirmer ma commande"
    //POST /api/commande : le backend revalide TOUT (articles, prix, solde, même restaurant)
    const confirmer = async () => {
        if (!user) {
            setErreur("Connectez-vous pour passer commande.")
            return
        }
        //tous les articles du panier doivent venir du même restaurant
        const restaurants = [...new Set(panier.map((p) => p.restaurant))]
        if (restaurants.length > 1) {
            setErreur("Votre panier contient des articles de restaurants différents. Un panier = un restaurant.")
            return
        }
        //points : multiple de 15, jamais plus que ce qu on peut réduire ni que notre solde
        const pointsUtilises = Math.max(0, Math.round(points))
        if (pointsUtilises % 15 !== 0) {
            setErreur("Les points doivent être un multiple de 15 (1 tranche = 1000 F).")
            return
        }
        setEnvoi(true)
        setErreur("")
        try {
            //1. envoi réel : POST /api/commande
            const commande = await api.post("/commande", {
                items: panier.map((p) => ({ Id_article: p.id, quantite: p.quantite })),
                Id_restaurant: restaurants[0],
                mode_service: mode === "surPlace" ? "sur_place" : "livraison",
                heure_recup: mode === "surPlace" ? heure : null,
                points_utilises: pointsUtilises,
            })
            //2. paiement : on enregistre le moyen choisi (US paiement, membre 3)
            // POST /api/commande/{id}/paiement : le statut passe en "en attente de validation"
            let libellePaiement = ""
            try {
                const pai = await api.post("/commande/" + encodeURIComponent(commande.Id_commande) + "/paiement", {
                    mode_paiement: paiement,
                })
                libellePaiement = " — paiement " + labelMoyen(pai.mode_paiement) + " enregistré (en attente de validation)"
            } catch (e) {
                // la commande reste valable : on signale juste que le paiement n a pas pris
                libellePaiement = " (attention : paiement non enregistré — " + e.message + ")"
            }
            //3. on vide le panier
            vider()
            setPoints(0)
            //4. on affiche la confirmation avec le vrai numero de commande renvoyé par l API
            setMessage("Commande " + commande.Id_commande + " enregistrée" + libellePaiement + " ! Vous avez gagné des points.")
        } catch (e) {
            // validation Laravel : { Id_restaurant: [...], items.0.quantite: [...] }
            const detail = e.champs ? Object.values(e.champs).flat().join(" - ") : null
            setErreur(detail || e.message || "Commande refusée par le serveur")
        } finally {
            setEnvoi(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-8 md:px-8">
            {/* toast de confirmation (commande envoyee) */}
            {message && (
                <p
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-5 py-2.5 text-center font-sans text-[13px] text-white shadow-hover"
                    style={{ animation: "toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                    {message}
                </p>
            )}

            {/* ---------- TITRE + BOUTON HISTORIQUE ---------- */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="font-sans text-[24px] font-bold tracking-tight text-black md:text-[30px]">
                        Mon panier
                    </h1>
                    <p className="mt-0.5 font-inria text-[13px] text-encre">
                        Vérifiez vos plats avant de passer commande
                    </p>
                </div>
                {/* pill beige vers l historique (maquette) */}
                <Link
                    to="/Historique"
                    className="miam-cta h-9 text-[13.5px]"
                >
                    Historiques des commandes &rsaquo;
                </Link>
            </div>

            {/* bandeau d erreur (rouge, en haut, au dessus du contenu) */}
            {erreur && (
                <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center font-sans text-[13px] text-red-700">
                    {erreur}
                    {/* pas connecté : lien direct vers la connexion */}
                    {!user && (
                        <Link to="/page_connexion" className="ml-2 font-semibold underline">
                            Se connecter
                        </Link>
                    )}
                </p>
            )}

            {/* ---------- PANIER VIDE OU PANIER REMPLI ---------- */}
            {panier.length === 0 ? (
                <div className="miam-carte mt-6 py-14 text-center">
                    <p className="font-inria text-[17px] text-encre">Votre panier est vide</p>
                    <p className="mt-1 font-sans text-[12.5px] text-gris-pa">
                        Choisissez un plat dans le menu du jour pour commencer.
                    </p>
                </div>
            ) : (
                //1 colonne sur téléphone, liste 2 parts + colonne 1 part à partir de lg
                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                    {/* ---------- LISTE DES ARTICLES (carte blanche) ---------- */}
                    <section className="miam-carte p-3 md:p-4 lg:col-span-2">
                        <p className="miam-eyebrow mb-2 pl-1">Vos articles</p>
                        {/* une ligne = #F4F4F4 rond doux (maquette) */}
                        <div className="flex flex-col gap-2.5">
                            {panier.map((article) => (
                                <div
                                    key={article.id}
                                    className="flex flex-wrap items-center gap-3.5 rounded-xl bg-ligne px-3 py-2.5"
                                >
                                    <img
                                        src={article.image}
                                        alt={article.nom}
                                        className="h-14 w-[72px] rounded-lg object-cover"
                                    />

                                    {/* nom Inria + description 12px */}
                                    <div className="min-w-[150px] flex-1">
                                        <p className="font-inria text-[15px] font-bold text-black">
                                            {article.nom}
                                        </p>
                                        {article.description && (
                                            <p className="mt-px font-sans text-[12px] text-encre">
                                                {article.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* prix unitaire (Inria, tabulaire) */}
                                    <p className="font-inria text-[17px] font-bold tracking-tight text-black">
                                        {article.prix}Fcfa
                                    </p>

                                    {/* compteur : chip beige (quantite qui pop) + petit +/− */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => changerQuantite(article.id, article.quantite - 1)}
                                            aria-label="Retirer un"
                                            className="h-7 w-7 cursor-pointer rounded-lg bg-band text-base text-black transition-colors duration-150 hover:bg-filet active:scale-95"
                                        >
                                            −
                                        </button>
                                        <span
                                            key={article.quantite}
                                            className="min-w-7 rounded-full bg-beige px-2.5 py-1 text-center font-sans text-[13px] font-semibold text-black"
                                            style={{ animation: "pop 0.25s ease-out both" }}
                                        >
                                            {article.quantite}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => changerQuantite(article.id, article.quantite + 1)}
                                            aria-label="Ajouter un"
                                            className="h-7 w-7 cursor-pointer rounded-lg bg-band text-base text-black transition-colors duration-150 hover:bg-filet active:scale-95"
                                        >
                                            +
                                        </button>
                                        {/* poubelle : retire l'article */}
                                        <button
                                            type="button"
                                            onClick={() => retirer(article.id)}
                                            aria-label="Retirer l'article"
                                            className="ml-1 cursor-pointer text-[13px] text-gris-pa transition-colors duration-150 hover:text-red-600"
                                        >
                                            Retirer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ---------- COLONNE DE DROITE ---------- */}
                    <aside className="flex h-fit flex-col gap-4">
                        {/* finalisation : carte blanche */}
                        <div className="miam-carte p-4 md:p-5">
                            <h2 className="font-inria text-[16px] font-bold text-black">
                                Finalisation de la commande
                            </h2>
                            <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-creme-d px-3.5 py-3">
                                {/* mode de service : radios inlines */}
                                <div className="flex gap-5 font-sans text-[13.5px] text-encre">
                                    <label className="flex cursor-pointer items-center gap-1.5">
                                        <input
                                            type="radio"
                                            checked={mode === "surPlace"}
                                            onChange={() => setMode("surPlace")}
                                            className="accent-[#C49E4C]"
                                        />
                                        Sur place
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-1.5">
                                        <input
                                            type="radio"
                                            checked={mode === "livraison"}
                                            onChange={() => setMode("livraison")}
                                            className="accent-[#C49E4C]"
                                        />
                                        Livraison
                                    </label>
                                </div>
                                {/* heure d arrivee (sur place) */}
                                <label className="flex flex-col gap-1">
                                    <span className="font-sans text-[12px] font-medium text-encre">
                                        Heure d&apos;arrivée (sur place)
                                    </span>
                                    <input
                                        type="time"
                                        value={heure}
                                        onChange={(e) => setHeure(e.target.value)}
                                        className="miam-champ bg-white ring-black/10"
                                    />
                                </label>
                                {/* points a utiliser */}
                                <label className="flex flex-col gap-1">
                                    <span className="font-sans text-[12px] font-medium text-encre">
                                        Points à utiliser (tranches de 15)
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="15"
                                        value={points}
                                        onChange={(e) => setPoints(e.target.value)}
                                        className="miam-champ bg-white ring-black/10"
                                    />
                                </label>
                                {/* moyen de paiement (US paiement — le champ qui manquait) */}
                                <label className="flex flex-col gap-1">
                                    <span className="font-sans text-[12px] font-medium text-encre">
                                        Moyen de paiement
                                    </span>
                                    <select
                                        value={paiement}
                                        onChange={(e) => setPaiement(e.target.value)}
                                        className="miam-champ bg-white ring-black/10"
                                    >
                                        {MOYENS.map((m) => (
                                            <option key={m.valeur} value={m.valeur}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        {/* recapitulatif */}
                        <div className="miam-carte p-4 md:p-5">
                            <h2 className="font-inria text-[16px] font-bold text-black">
                                Récapitulatif
                            </h2>
                            <div className="mt-3 flex flex-col gap-1.5 font-sans text-[13.5px]">
                                <div className="flex justify-between text-encre">
                                    <span>Sous-total</span>
                                    <b className="font-semibold text-black">{fcfa(total)}</b>
                                </div>
                                <div className="flex justify-between text-encre">
                                    <span>Réduction points</span>
                                    <b className="font-semibold text-black">− {fcfa(reduction)}</b>
                                </div>
                                <div className="flex justify-between text-encre">
                                    <span>Frais de livraison</span>
                                    <b className="font-semibold text-black">{fcfa(frais)}</b>
                                </div>
                                <div className="miam-filet mt-1.5" />
                                <div className="flex items-baseline justify-between pt-1.5">
                                    <span className="font-sans text-[13.5px] font-semibold text-black">Total</span>
                                    <b className="font-inria text-[20px] font-bold tracking-tight text-or-deep">
                                        {fcfa(totalFinal)}
                                    </b>
                                </div>
                            </div>
                        </div>

                        {/* CTA commande : or, proeminent (maquette) */}
                        <button
                            type="button"
                            onClick={confirmer}
                            disabled={envoi}
                            className="miam-cta-or h-12 w-full"
                        >
                            {envoi ? "Envoi en cours..." : "Confirmer ma commande"}
                        </button>
                    </aside>
                </div>
            )}

            {/* ---------- APRES COMMANDE (toujours affiché) ---------- */}
            <section className="mt-10">
                <h2 className="font-sans text-[20px] font-bold tracking-tight text-black md:text-[26px]">
                    Apres commande
                </h2>
                {/* carte creme #FFFDF8 (maquette) */}
                <div className="mt-3 rounded-xl bg-creme-d p-5 md:p-6">
                    <h3 className="font-inria text-[19px] font-bold text-black md:text-[22px]">
                        Une reclamation?
                    </h3>
                    <p className="mt-1 max-w-2xl font-sans text-[13px] font-light text-encre md:text-[14.5px]">
                        Vous avez un probleme avec votre commande (erreur, plat manquant,
                        hygiene, etc) ? Faites une reclamation en un clic.
                    </p>
                    <div className="mt-4">
                        {/* pill blanche "Faire une reclamation" (maquette) */}
                        <Link
                            to="/Reclamation"
                            className="inline-flex h-10 items-center rounded-[12px] bg-white px-5 font-sans text-sm text-or shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-soft md:text-[14.5px]"
                        >
                            Faire une reclamation &rsaquo;
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
