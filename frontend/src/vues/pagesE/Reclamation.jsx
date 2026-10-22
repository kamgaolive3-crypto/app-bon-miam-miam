//importe un hook qui permet de memoriser une valeur
import { useState } from "react"
//importe link : permet de changer de page sans recharger le navigateur
import { Link } from "react-router-dom"
//cliente API : la réclamation part dans la base via le backend
import { api } from "../../services/api"
//auth : une réclamation exige d être connecté
import { useAuth } from "../../services/auth"

export default function Reclamation() {
    //---------------- ETATS DE LA PAGE ----------------
    //ce que le client tape dans chaque champ
    const [idCommande, setIdCommande] = useState("")
    const [probleme, setProbleme] = useState("")
    //message d'erreur (vide = pas d'erreur)
    const [erreur, setErreur] = useState("")
    //true quand la réclamation vient d'être envoyée
    const [envoye, setEnvoye] = useState(false)
    //true pendant l envoi (bouton désactivé)
    const [envoi, setEnvoi] = useState(false)
    //l utilisateur connecté
    const { user } = useAuth()

    //---------------- ACTIONS ----------------
    //fonction appellée quand on clique sur "Envoyer"
    const envoyer = async () => {
        //trim() enlève les espaces au début et à la fin : "   " compte comme vide
        if (idCommande.trim() === "" || probleme.trim() === "") {
            setErreur("Veuillez remplir l'ID de la commande et décrire le problème.")
            setEnvoye(false)
            return // on s arrête ici, rien n est envoyé
        }
        if (!user) {
            setErreur("Connectez-vous pour envoyer une réclamation.")
            setEnvoye(false)
            return
        }
        setEnvoi(true)
        setErreur("")
        try {
            //POST /api/reclamation : le backend attend Id_commande, motif et description
            await api.post("/reclamation", {
                Id_commande: idCommande.trim(),
                motif: probleme.trim().slice(0, 255),
                description: probleme.trim(),
            })
            setEnvoye(true)
            setIdCommande("")
            setProbleme("")
        } catch (e) {
            setEnvoye(false)
            //erreurs de validation Laravel affichées champ par champ
            const detail = e.champs ? Object.values(e.champs).flat().join(" - ") : null
            setErreur(detail || e.message || "Reclamation refusee par le serveur")
        } finally {
            setEnvoi(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* ---------- TITRE + FLECHE RETOUR ---------- */}
            <div className="flex items-center gap-2">
                {/* le chemin "/Panier" vers la page panier */}
                <Link to="/Panier" className="text-xl" aria-label="Retour au panier">
                    ←
                </Link>
                <h1 className="font-serif text-xl font-bold">⚠ Une réclamation ?</h1>
            </div>

            {/* ---------- FORMULAIRE ---------- */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#CFBD97] bg-[#fffdf5] p-4 md:p-6">
                {/* champ : ID de la commande */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="idCommande" className="text-sm">
                        ID Commande :
                    </label>
                    <input
                        id="idCommande"
                        type="text"
                        value={idCommande}
                        onChange={(e) => setIdCommande(e.target.value)}
                        placeholder="ex : #COM0001"
                        className="rounded-md border border-[#CFBD97] bg-white px-3 py-2 text-sm md:w-1/2"
                    />
                    <p className="text-xs text-gray-500">
                        (retrouvez l id de votre commande dans l historique des commandes)
                    </p>
                </div>

                {/* champ : description du problème */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="probleme" className="text-sm">
                        Problème de la commande :
                    </label>
                    <textarea
                        id="probleme"
                        rows={5}
                        value={probleme}
                        onChange={(e) => setProbleme(e.target.value)}
                        className="rounded-md border border-[#CFBD97] bg-white px-3 py-2 text-sm"
                    />
                </div>

                {/* message d'erreur (affiché seulement s'il y en a un) */}
                {erreur && (
                    <p className="text-xs text-red-600">
                        {erreur}
                        {!user && (
                            <Link to="/page_connexion" className="ml-2 font-semibold underline">
                                Se connecter
                            </Link>
                        )}
                    </p>
                )}

                {/* message de confirmation (affiché seulement après l envoi) */}
                {envoye && (
                    <p className="rounded-md bg-green-100 px-3 py-2 text-xs text-green-800">
                        Votre réclamation a bien été envoyée. Nous reviendrons vers vous rapidement.
                    </p>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={envoyer}
                        disabled={envoi}
                        className="rounded-full border border-[#CFBD97] bg-white px-6 py-1 text-sm disabled:opacity-50"
                    >
                        {envoi ? "Envoi en cours..." : "Envoyer"}
                    </button>
                </div>
            </section>
        </div>
    )
}
