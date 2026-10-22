import { useState, useEffect } from "react"

//nom sous lequel le panier est gardé dans le navigateur
const CLE = "panier"
//signal envoyé à toutes les pages quand le panier change
const SIGNAL = "panier-modifie"

//lit le panier enregistré (liste vide s'il n'y a rien)
function lirePanier() {
    try {
        return JSON.parse(localStorage.getItem(CLE)) || []
    } catch {
        return []
    }
}

//outil à utiliser dans TOUTES les pages et composants qui touchent au panier
export default function usePanier() {
    const [panier, setPanier] = useState(lirePanier)

    //quand quelqu'un modifie le panier, on relit la nouvelle version
    useEffect(() => {
        const relire = () => setPanier(lirePanier())
        window.addEventListener(SIGNAL, relire)
        return () => window.removeEventListener(SIGNAL, relire)
    }, [])

    //applique un changement, le sauvegarde, puis prévient tout le monde
    const modifier = (changement) => {
        localStorage.setItem(CLE, JSON.stringify(changement(lirePanier())))
        window.dispatchEvent(new Event(SIGNAL))
    }

    //ajoute un plat (ou augmente sa quantité s'il est déjà dans le panier)
    const ajouter = (plat) =>
        modifier((ancien) => {
            const existe = ancien.find((p) => p.id === plat.id)
            return existe
                ? ancien.map((p) => (p.id === plat.id ? { ...p, quantite: p.quantite + 1 } : p))
                : [...ancien, { ...plat, quantite: 1 }]
        })

    //change la quantité d'un plat (à 0, il est retiré)
    const changerQuantite = (id, quantite) =>
        modifier((ancien) =>
            quantite <= 0
                ? ancien.filter((p) => p.id !== id)
                : ancien.map((p) => (p.id === id ? { ...p, quantite } : p))
        )

    const retirer = (id) => modifier((ancien) => ancien.filter((p) => p.id !== id))
    const vider = () => modifier(() => [])

    //total en Fcfa et nombre d'articles
    const total = panier.reduce((somme, p) => somme + p.prix * p.quantite, 0)
    const nombre = panier.reduce((somme, p) => somme + p.quantite, 0)

    return { panier, ajouter, changerQuantite, retirer, vider, total, nombre }
}