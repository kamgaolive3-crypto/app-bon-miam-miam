import { useState, useEffect } from "react"

//nom sous lequel les commandes sont gardées dans le navigateur
const CLE = "commandes"
//signal envoyé à toutes les pages quand les commandes changent
const SIGNAL = "commandes-modifiees"

//lit les commandes enregistrées (liste vide s'il n'y a rien)
function lireCommandes() {
    try {
        return JSON.parse(localStorage.getItem(CLE)) || []
    } catch {
        return []
    }
}

//outil à utiliser dans les pages qui touchent aux commandes (Panier, Historique)
export default function useCommandes() {
    const [commandes, setCommandes] = useState(lireCommandes)

    //quand une commande est ajoutée, on relit la nouvelle liste
    useEffect(() => {
        const relire = () => setCommandes(lireCommandes())
        window.addEventListener(SIGNAL, relire)
        return () => window.removeEventListener(SIGNAL, relire)
    }, [])

    //ajoute une commande en tête de liste (la plus récente en premier)
    const ajouterCommande = ({ articles, total, mode, heure }) => {
        const ancien = lireCommandes()
        const nouvelle = {
            //CMD001000, CMD001001... (valeur de test : plus tard l'id viendra du serveur)
            id: "CMD" + String(1000 + ancien.length).padStart(6, "0"),
            date: new Date().toLocaleString("fr-FR"),
            articles,
            total,
            mode,
            heure,
            statut: "En cours",
        }
        localStorage.setItem(CLE, JSON.stringify([nouvelle, ...ancien]))
        window.dispatchEvent(new Event(SIGNAL))
    }

    return { commandes, ajouterCommande }
}