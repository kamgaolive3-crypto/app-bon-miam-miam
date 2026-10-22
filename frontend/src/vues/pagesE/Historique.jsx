//importe un hook qui permet de memoriser une valeur
import { useState, useEffect } from "react"
//importe link : permet de changer de page sans recharger le navigateur
import { Link } from "react-router-dom"
//cliente API : les commandes viennent du backend (plus de données fictives)
import { api } from "../../services/api"
//auth : l historique ne concerne que l utilisateur connecté
import { useAuth } from "../../services/auth"

//écrit un nombre avec des espaces : 6000 devient "6 000 Fcfa"
const fcfa = (n) => n.toLocaleString("fr-FR") + " Fcfa"

//traduit le statut de la base (en_attente, livree...) en texte affiché
const libelleStatut = {
    en_attente: "En cours",
    validee: "En cours",
    en_preparation: "En cours",
    prete: "En cours",
    en_livraison: "En cours",
    servie: "Livrée",
    livree: "Livrée",
    annulee: "Annulée",
}

//les boutons de filtre : le texte affiché, et le statut qu ils gardent (null = tout garder)
const filtres = [
    { label: "Toutes", statut: null },
    { label: "En cours", statut: "En cours" },
    { label: "Livrées", statut: "Livrée" },
    { label: "Annulées", statut: "Annulée" },
]

//la couleur de l'étiquette selon le statut
const couleurs = {
    "Livrée": "bg-green-100 text-green-800",
    "En cours": "bg-gray-200 text-gray-700",
    "Annulée": "bg-red-100 text-red-700",
}

export default function Historique() {
    //les commandes viennent de GET /api/commande (les Plus récentes en premier)
    const [commandes, setCommandes] = useState([])
    //message d erreur (pas connecté, serveur en panne...)
    const [erreur, setErreur] = useState("")
    //l utilisateur connecté
    const { user } = useAuth()
    //statut choisi dans les filtres (null = toutes les commandes)
    const [statutFiltre, setStatutFiltre] = useState(null)
    //US-010 : commentaires en cours d écriture, par commande
    const [commentaires, setCommentaires] = useState({})
    //petit message de confirmation
    const [messageOk, setMessageOk] = useState("")

    //au premier affichage : on charge les commandes de l utilisateur connecté
    useEffect(() => {
        if (!user) {
            setErreur("Connectez-vous pour voir votre historique.")
            return
        }
        api.get("/commande")
            .then((liste) => {
                //mise en forme : on ne garde que les champs affichés par la page
                setCommandes((Array.isArray(liste) ? liste : liste.data || []).map((c) => ({
                    id: c.Id_commande,
                    date: (c.date_commande || "").slice(0, 10),
                    total: c.montant_total,
                    statut: libelleStatut[c.statut_commande] || c.statut_commande,
                    articles: (c.articles || []).map((art) => ({
                        nom: art.nom_article,
                        image: art.image_article || "/plat_du_jour.jpg",
                        quantite: art.pivot?.quantite ?? art.quantite ?? 1,
                    })),
                })))
            })
            .catch((e) => setErreur(e.message))
    }, [])

    //US-010 : envoyer le commentaire d une commande servie
    const envoyerCommentaire = async (id) => {
        setErreur(""); setMessageOk("")
        try {
            await api.post("/commande/" + encodeURIComponent(id) + "/commentaire",
                { commentaire: commentaires[id] || "" })
            setMessageOk("Merci ! Votre commentaire sur " + id + " a été enregistré.")
        } catch (e) {
            setErreur(e.message)
        }
    }

    //si aucun filtre, on garde tout, sinon seulement les commandes du bon statut
    const commandesAffichees = statutFiltre
        ? commandes.filter((c) => c.statut === statutFiltre)
        : commandes

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* ---------- TITRE + FLECHE RETOUR ---------- */}
            <div className="flex items-center gap-2">
                <Link to="/Panier" className="text-xl" aria-label="Retour au panier">
                    ←
                </Link>
                <div>
                    <h1 className="font-serif text-xl font-bold">Historique des commandes</h1>
                    <p className="text-xs text-gray-600">Retrouvez toutes vos commandes passées</p>
                </div>
            </div>

            {/* pas connecté ou erreur de chargement : message clair */}
            {erreur && (
                <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
                    {erreur}
                    {!user && (
                        <Link to="/page_connexion" className="ml-2 font-semibold underline">
                            Se connecter
                        </Link>
                    )}
                </p>
            )}

            {messageOk && (
                <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{messageOk}</p>
            )}

            {/* ---------- BOUTONS DE FILTRE ---------- */}
            <div className="flex flex-wrap gap-2">
                {filtres.map((f) => (
                    <button
                        key={f.label}
                        onClick={() => setStatutFiltre(f.statut)}
                        className={
                            "rounded-full border border-[#CFBD97] px-4 py-1 text-xs transition-colors " +
                            (f.statut === statutFiltre ? "bg-[#CFBD97] text-white" : "bg-white text-gray-800 hover:bg-[#efe6d0]")
                        }
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ---------- LISTE DES COMMANDES ---------- */}
            {commandesAffichees.length === 0 ? (
                <p className="text-sm text-gray-600">Aucune commande pour le moment.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {commandesAffichees.map((c) => (
                        <div key={c.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                            {/* photo du premier plat de la commande */}
                            <img
                                src={c.articles[0]?.image}
                                alt={c.articles[0]?.nom}
                                className="h-16 w-16 rounded-lg object-cover md:h-20 md:w-20"
                            />

                            <div className="flex-1 text-sm">
                                <p className="text-xs text-gray-500">{c.id}</p>
                                {/* "2x Poulet pané, 1x Okok" : on assemble les plats avec join() */}
                                <p className="font-serif font-semibold">
                                    {c.articles.map((a) => a.quantite + "x " + a.nom).join(", ")}
                                </p>
                                <p className="text-xs text-gray-500">{c.date}</p>
                                <p className="font-bold">{fcfa(c.total)}</p>
                            </div>

                            <span className={"rounded-full px-3 py-1 text-xs " + couleurs[c.statut]}>
                                {c.statut}
                            </span>
                        </div>
                        {/* US-010 : apres le service (libelle « Livree »), l etudiant
                            peut laisser un commentaire sur SA commande */}
                        {c.statut === "Livrée" && (
                            <div className="mt-2 flex flex-col gap-1 rounded-lg bg-[#f5f1e6] p-2 text-xs">
                                <label>Votre commentaire sur cette commande :</label>
                                <textarea rows={2} value={commentaires[c.id] ?? ""}
                                    onChange={(e) => setCommentaires({ ...commentaires, [c.id]: e.target.value })}
                                    className="rounded-md border border-[#CFBD97] px-2 py-1" />
                                <button onClick={() => envoyerCommentaire(c.id)}
                                    className="self-start rounded-full bg-[#CFBD97] px-3 py-1 text-xs text-white">
                                    Envoyer le commentaire
                                </button>
                            </div>
                        )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
