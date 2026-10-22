import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

// RECLAMATIONS (maquette /page-10) : valider ou rejeter les reponses proposees par les employes
// parcours en 3 etapes (US-021 / US-038) :
//   1. l employe traite           -> POST /api/reclamation/{id}/traiter        (en_attente -> observation)
//   2. le gerant decide           -> POST /api/reclamation/{id}/decision-gerant (observation -> validee/rejetee)
//   3. l admin peut retraiter     -> POST .../traiter-admin + .../decision-admin

// libelles + couleurs des statuts (meme style que la maquette)
const libelles = {
    en_attente: "En attente",
    observation: "Réponse proposée",
    validee: "Validée",
    rejetee: "Rejetée",
};
const pilules = {
    en_attente: "bg-[#f3e3c3] text-[#8a6a1f]",
    observation: "bg-blue-100 text-blue-700",
    validee: "bg-green-100 text-green-700",
    rejetee: "bg-red-100 text-red-700",
};

export default function Reclamation() {
    const { user } = useAuth()
    const [liste, setListe] = useState([])
    const [erreur, setErreur] = useState("")
    const [message, setMessage] = useState("")
    // la reponse en cours d ecriture (par reclamation)
    const [reponses, setReponses] = useState({})
    // recherche + filtre statut + detail deplie
    const [recherche, setRecherche] = useState("")
    const [filtre, setFiltre] = useState("")
    const [detailOuvert, setDetailOuvert] = useState(null)

    const charger = () => {
        api.get("/reclamation")
            .then((l) => setListe(Array.isArray(l) ? l : l.data || []))
            .catch((e) => setErreur(e.message))
    }
    useEffect(charger, [])

    const saisie = (id, valeur) => setReponses({ ...reponses, [id]: valeur })

    // PHASE 1 : l employé traite (POST .../traiter) ; l admin peut aussi retraiter
    const traiter = async (r) => {
        setMessage(""); setErreur("")
        try {
            await api.post("/reclamation/" + encodeURIComponent(r.Id_reclamation) + "/traiter",
                { reponse: reponses[r.Id_reclamation] || "" })
            setMessage("Réclamation passée en observation pour le gérant.")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // PHASE 2 : le gérant (ou l admin) décide : validee / rejetee
    const decisionGerant = async (id, decision) => {
        setMessage(""); setErreur("")
        try {
            await api.post("/reclamation/" + encodeURIComponent(id) + "/decision-gerant", { decision })
            setMessage("Décision enregistrée : " + decision + " (gérant).")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // PHASE ADMIN : retraiter la réponse (traiterAdmin)
    const traiterAdmin = async (r) => {
        setMessage(""); setErreur("")
        try {
            await api.post("/reclamation/" + encodeURIComponent(r.Id_reclamation) + "/traiter-admin",
                { reponse: reponses[r.Id_reclamation] || "" })
            setMessage("Réponse administrative enregistrée.")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // PHASE 3 : décision administrative finale (decisionAdmin)
    const decisionAdmin = async (id, decision) => {
        setMessage(""); setErreur("")
        try {
            await api.post("/reclamation/" + encodeURIComponent(id) + "/decision-admin", { decision })
            setMessage("Décision admin enregistrée : " + decision + ".")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // ---------- indicateurs des 3 cartes ----------
    const compte = (s) => liste.filter((r) => r.statut_reclamation === s).length

    // ---------- filtres : recherche + statut ----------
    const texte = recherche.trim().toLowerCase()
    const listeAffichee = liste.filter((r) => {
        if (filtre && r.statut_reclamation !== filtre) return false;
        if (!texte) return true;
        const etu = ((r.etudiant?.utilisateur?.prenom ?? r.etudiant?.prenom ?? "") + " " + (r.etudiant?.utilisateur?.nom ?? r.etudiant?.nom ?? "")).toLowerCase();
        return (r.Id_reclamation || "").toLowerCase().includes(texte)
            || (r.Id_commande || "").toLowerCase().includes(texte)
            || (r.motif_reclamation || "").toLowerCase().includes(texte)
            || etu.includes(texte);
    });

    return (
        <div className="flex flex-col gap-5 p-4 md:p-6">
            {/* ---------- TITRE ---------- */}
            <div>
                <h1 className="font-serif text-2xl font-bold">Réclamations</h1>
                <p className="text-xs text-gray-600">Valider ou rejeter les réponses proposées par les employés (US-021 / US-038)</p>
            </div>

            {message && <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p>}
            {erreur && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{erreur}</p>}

            {/* ---------- 3 CARTES INDICATEURS ---------- */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">En attente</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">{compte("en_attente")}</p>
                    <p className="text-xs text-gray-500">À traiter par l employé</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Réponses à valider</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">{compte("observation")}</p>
                    <p className="text-xs text-gray-500">Proposées par les employés</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Traitées</p>
                    <p className="mt-1 text-2xl font-bold text-[#b8862d]">{compte("validee") + compte("rejetee")}</p>
                    <p className="text-xs text-gray-500">Décisions finales rendues</p>
                </div>
            </div>

            {/* ---------- RECHERCHE + FILTRE STATUT ---------- */}
            <div className="flex flex-wrap items-center gap-2">
                <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher une réclamation..."
                    className="min-w-48 flex-1 rounded-full border border-[#CFBD97] bg-white px-4 py-1.5 text-xs"
                />
                <select value={filtre} onChange={(e) => setFiltre(e.target.value)}
                    className="rounded-full border border-[#CFBD97] bg-white px-3 py-1.5 text-xs">
                    <option value="">Statut : Tous</option>
                    {Object.keys(libelles).map((s) => (
                        <option key={s} value={s}>{libelles[s]}</option>
                    ))}
                </select>
            </div>

            {/* ---------- TABLEAU ---------- */}
            {listeAffichee.length === 0 ? (
                <p className="text-sm text-gray-600">Aucune réclamation pour cette recherche.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#efe6d0] text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">N°</th>
                                <th className="px-4 py-3">Étudiant</th>
                                <th className="px-4 py-3">Commande</th>
                                <th className="px-4 py-3">Motif</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeAffichee.map((r) => {
                                const statut = r.statut_reclamation;
                                return (
                                    <tr key={r.Id_reclamation} className="border-b border-[#efe6d0] last:border-0">
                                        <td className="px-4 py-3 font-semibold">{r.Id_reclamation}</td>
                                        <td className="px-4 py-3">
                                            {((r.etudiant?.utilisateur?.prenom ?? r.etudiant?.prenom ?? "") + " " + (r.etudiant?.utilisateur?.nom ?? r.etudiant?.nom ?? "")).trim() || "-"}
                                        </td>
                                        <td className="px-4 py-3">{r.Id_commande}</td>
                                        <td className="max-w-48 truncate px-4 py-3">{r.motif_reclamation}</td>
                                        <td className="px-4 py-3">
                                            <span className={"rounded-full px-3 py-1 text-xs " + (pilules[statut] || "bg-gray-100 text-gray-600")}>
                                                {libelles[statut] || statut}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    onClick={() => setDetailOuvert(detailOuvert === r.Id_reclamation ? null : r.Id_reclamation)}
                                                    className="rounded-full border border-[#CFBD97] px-3 py-1 text-xs hover:bg-[#f5f1e6]">
                                                    Voir
                                                </button>
                                                {/* PHASE 1 : traiter (employe) */}
                                                {statut === "en_attente" && user?.role !== "etudiant" && (
                                                    <button onClick={() => traiter(r)}
                                                        className="rounded-full bg-[#CFBD97] px-3 py-1 text-xs text-white hover:brightness-95">
                                                        Traiter
                                                    </button>
                                                )}
                                                {/* PHASE 2 : decision gerant */}
                                                {statut === "observation" && (user?.role === "gerant" || user?.role === "administrateur") && (
                                                    <>
                                                        <button onClick={() => decisionGerant(r.Id_reclamation, "validee")}
                                                            className="rounded-full bg-[#CFBD97] px-3 py-1 text-xs text-white hover:brightness-95">
                                                            Valider
                                                        </button>
                                                        <button onClick={() => decisionGerant(r.Id_reclamation, "rejetee")}
                                                            className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                                                            Rejeter
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* ---------- LIGNE DE DETAIL (reclamation depliee) ---------- */}
                    {listeAffichee
                        .filter((r) => detailOuvert === r.Id_reclamation)
                        .map((r) => (
                            <div key={"detail-" + r.Id_reclamation} className="flex flex-col gap-2 border-t border-[#efe6d0] bg-[#f5f1e6] px-4 py-3 text-xs">
                                <p><b>Étudiant :</b> {((r.etudiant?.utilisateur?.prenom ?? r.etudiant?.prenom ?? "") + " " + (r.etudiant?.utilisateur?.nom ?? r.etudiant?.nom ?? "")).trim() || "-"}</p>
                                <p><b>Date :</b> {(r.date_reclamation || "").slice(0, 16).replace("T", " ")}</p>
                                <p><b>Motif :</b> {r.motif_reclamation}</p>
                                <p><b>Description :</b> {r.description_reclamation}</p>
                                {r.reponse_reclamation && <p><b>Réponse déjà écrite :</b> {r.reponse_reclamation}</p>}

                                {/* zone de reponse partagee entre les etapes */}
                                {((r.statut_reclamation === "en_attente" && user?.role !== "etudiant")
                                    || (user?.role === "administrateur" && r.statut_reclamation !== "validee" && r.statut_reclamation !== "rejetee")) && (
                                    <textarea
                                        rows={2}
                                        placeholder="Écrire la réponse / observation"
                                        value={reponses[r.Id_reclamation] ?? ""}
                                        onChange={(e) => saisie(r.Id_reclamation, e.target.value)}
                                        className="w-full rounded-md border border-[#CFBD97] bg-white px-2 py-1 text-xs"
                                    />
                                )}

                                {/* PHASE ADMIN : reecrire la reponse puis decision finale */}
                                {user?.role === "administrateur" && (
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => traiterAdmin(r)}
                                            className="rounded-full border border-[#CFBD97] bg-white px-3 py-1 text-xs">Admin : réécrire la réponse</button>
                                        <button onClick={() => decisionAdmin(r.Id_reclamation, "validee")}
                                            className="rounded-full bg-green-700 px-3 py-1 text-xs text-white">Admin : valider</button>
                                        <button onClick={() => decisionAdmin(r.Id_reclamation, "rejetee")}
                                            className="rounded-full bg-red-700 px-3 py-1 text-xs text-white">Admin : rejeter</button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}
