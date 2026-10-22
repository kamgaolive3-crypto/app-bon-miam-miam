import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

const libelles = {
    en_attente: "En attente d'un livreur",
    assignee: "Assignée",
    en_cours: "En cours de livraison",
    livree: "Livrée",
    echouee: "Échouée",
};

export default function Livraisons() {
    const [livraisons, setLivraisons] = useState([])
    const [livreurs, setLivreurs] = useState([])   // les employés : possibles livreurs
    const [erreur, setErreur] = useState("")
    const [message, setMessage] = useState("")

    // formulaire : créer une livraison pour une commande passée en living
    const [idCommande, setIdCommande] = useState("")
    const [adresse, setAdresse] = useState("")
    const [frais, setFrais] = useState(1000)

    const { user } = useAuth()

    // chargement
    const charger = () => {
        api.get("/livraison")
            .then((liste) => setLivraisons(Array.isArray(liste) ? liste : liste.data || []))
            .catch((e) => setErreur(e.message))
        api.get("/employes")
            .then((liste) => {
                const brut = Array.isArray(liste) ? liste : liste.data || [];
                // normalisation : l'API enveloppe employe/utilisateur ; aplatir pour le select
                setLivreurs(brut.map((l) => ({
                    Id_utilisateur: l.employe?.Id_utilisateur ?? l.Id_utilisateur,
                    utilisateur: l.utilisateur ?? l,
                })));
            })
            .catch(() => setLivreurs([]))
    }
    useEffect(charger, [])

    // POST /api/livraison : création
    const creer = async () => {
        setMessage(""); setErreur("")
        try {
            await api.post("/livraison", {
                Id_commande: idCommande.trim(),
                adresse_livraison: adresse.trim() || null,
                frais_livraison: Number(frais) || 0,
            })
            setMessage("Livraison créée pour la commande " + idCommande + ".")
            setIdCommande(""); setAdresse("")
            charger()
        } catch (e) {
            const detail = e.champs ? Object.values(e.champs).flat().join(" - ") : null
            setErreur(detail || e.message)
        }
    }

    // POST /api/livraison/{id}/assigner
    const assigner = async (id, employe) => {
        setMessage(""); setErreur("")
        try {
            await api.post("/livraison/" + encodeURIComponent(id) + "/assigner", { Id_utilisateur: employe })
            setMessage("Livreur assigné.")
            charger()
        } catch (e) { setErreur(e.message) }
    }
    // POST .../demarrer | .../livrer | .../echouer
    const action = async (id, actionLivraison) => {
        setMessage(""); setErreur("")
        try {
            await api.post("/livraison/" + encodeURIComponent(id) + "/" + actionLivraison, {})
            setMessage("Livraison mise à jour (" + actionLivraison + ").")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div>
                <h1 className="font-serif text-xl font-bold">Livraisons</h1>
                <p className="text-xs text-gray-600">Créer, assigner et suivre les livraisons (US-008 / US-026)</p>
            </div>

            {message && <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p>}
            {erreur && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{erreur}</p>}

            {/* ---------- CREATION ---------- */}
            <section className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-1 text-xs">
                    <label>ID commande (ex : #COM0001)</label>
                    <input value={idCommande} onChange={(e) => setIdCommande(e.target.value)}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Adresse (facultatif)</label>
                    <input value={adresse} onChange={(e) => setAdresse(e.target.value)}
                        className="w-52 rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Frais (Fcfa)</label>
                    <input type="number" min="0" value={frais} onChange={(e) => setFrais(e.target.value)}
                        className="w-24 rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <button onClick={creer} className="rounded-full bg-[#CFBD97] px-4 py-1.5 text-xs text-white">
                    Créer la livraison
                </button>
            </section>

            {/* ---------- LISTE ---------- */}
            {livraisons.length === 0 ? (
                <p className="text-sm text-gray-600">Aucune livraison enregistrée.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {livraisons.map((l) => (
                        <div key={l.Id_livraison} className="rounded-xl bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="font-semibold">Livraison {l.Id_livraison}
                                        <span className="ml-2 rounded-full bg-[#f5f1e6] px-2 py-0.5 text-xs">{libelles[l.statut_livraison] || l.statut_livraison}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Commande : {l.Id_commande} · Livreur : {l.livreur ? (l.livreur.nom + " " + l.livreur.prenom) : "non assigné"}
                                        {l.adresse_livraison ? " · " + l.adresse_livraison : ""}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-600">{(l.frais_livraison ?? 0).toLocaleString("fr-FR")} Fcfa</p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {/* choisir un livreur parmi les employés du restaurant */}
                                {l.statut_livraison === "en_attente" && livreurs.length > 0 && (
                                    <select
                                        defaultValue=""
                                        onChange={(e) => e.target.value && assigner(l.Id_livraison, e.target.value)}
                                        className="rounded-full border border-[#CFBD97] px-2 py-1 text-xs"
                                    >
                                        <option value="" disabled>Assigner un livreur…</option>
                                        {livreurs.map((le) => (
                                            <option key={le.Id_utilisateur} value={le.Id_utilisateur}>
                                                {le.utilisateur?.nom ?? le.nom} {le.utilisateur?.prenom ?? le.prenom ?? ""}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {l.statut_livraison === "assignee" && (
                                    <button onClick={() => action(l.Id_livraison, "demarrer")}
                                        className="rounded-full bg-[#CFBD97] px-3 py-1 text-xs text-white">Démarrer</button>
                                )}
                                {l.statut_livraison === "en_cours" && (
                                    <>
                                        <button onClick={() => action(l.Id_livraison, "livrer")}
                                            className="rounded-full bg-green-600 px-3 py-1 text-xs text-white">Livrée</button>
                                        <button onClick={() => action(l.Id_livraison, "echouer")}
                                            className="rounded-full bg-red-600 px-3 py-1 text-xs text-white">Échec</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
