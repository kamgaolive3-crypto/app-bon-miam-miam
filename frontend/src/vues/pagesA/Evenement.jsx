import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

// libellés des types (mêmes valeurs que la base)
const types = ["promotion", "evenement", "mini_jeu"];

// formulaire vide
const FORMULAIRE_VIDE = {
    Id_evenement: "",
    type_evenement: "promotion",
    debut_evenement: "",
    fin_evenement: "",
    points_evenement: 0,
    taux_reduction: "",
    description_evenement: "",
    affiche_evenement: "",
};

export default function Evenement() {
    const { user } = useAuth()
    const [evenements, setEvenements] = useState([])
    const [erreur, setErreur] = useState("")
    const [message, setMessage] = useState("")
    const [form, setForm] = useState(FORMULAIRE_VIDE)
    const [modeEdition, setModeEdition] = useState(false)
    // participations affichées d un événement (bouton "Voir")
    const [participations, setParticipations] = useState(null)

    const charger = () => {
        api.get("/evenement")
            .then((liste) => setEvenements(Array.isArray(liste) ? liste : liste.data || []))
            .catch((e) => setErreur(e.message))
    }
    useEffect(charger, [])

    // POST (création) ou PUT (modification)
    const enregistrer = async () => {
        setMessage(""); setErreur("")
        const corps = {
            ...form,
            points_evenement: Number(form.points_evenement) || 0,
            taux_reduction: form.taux_reduction === "" ? null : Number(form.taux_reduction),
        };
        try {
            if (modeEdition) {
                await api.put("/evenement/" + encodeURIComponent(form.Id_evenement), corps)
                setMessage("Événement " + form.Id_evenement + " modifié.")
            } else {
                await api.post("/evenement", corps)
                setMessage("Événement " + form.Id_evenement + " créé.")
            }
            setForm(FORMULAIRE_VIDE)
            setModeEdition(false)
            charger()
        } catch (e) {
            const detail = e.champs ? Object.values(e.champs).flat().join(" - ") : null
            setErreur(detail || e.message)
        }
    }

    const editer = (e) => {
        setModeEdition(true)
        setMessage(""); setErreur("")
        setForm({
            Id_evenement: e.Id_evenement,
            type_evenement: e.type_evenement,
            debut_evenement: (e.debut_evenement || "").slice(0, 16),
            fin_evenement: (e.fin_evenement || "").slice(0, 16),
            points_evenement: e.points_evenement ?? 0,
            taux_reduction: e.taux_reduction ?? "",
            description_evenement: e.description_evenement ?? "",
            affiche_evenement: e.affiche_evenement ?? "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const supprimer = async (e) => {
        setMessage(""); setErreur("")
        try {
            await api.del("/evenement/" + encodeURIComponent(e.Id_evenement))
            setMessage("Événement " + e.Id_evenement + " supprimé.")
            charger()
        } catch (err) { setErreur(err.message) }
    }

    // GET /api/evenement/{id}/participations
    const voirParticipations = async (id) => {
        setParticipations({ id, liste: null })
        try {
            const liste = await api.get("/evenement/" + encodeURIComponent(id) + "/participations")
            setParticipations({ id, liste: Array.isArray(liste) ? liste : liste.data || [] })
        } catch (e) {
            setErreur(e.message)
            setParticipations(null)
        }
    }

    // upload de l affiche (dossier evenements) : le serveur renvoie le chemin exact
    const [envoiAffiche, setEnvoiAffiche] = useState(false)
    const choisirAffiche = async (fichier) => {
        if (!fichier) return
        setEnvoiAffiche(true); setMessage(""); setErreur("")
        const fd = new FormData()
        fd.append("image", fichier)
        fd.append("dossier", "evenements")
        try {
            const rep = await api.envoiFichier("/upload_image", fd)
            setForm((f) => ({ ...f, affiche_evenement: rep.chemin }))
            setMessage("Affiche enregistrée : " + rep.chemin)
        } catch (e) {
            setErreur(e.message || "Image refusée par le serveur")
        } finally {
            setEnvoiAffiche(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div>
                <h1 className="font-serif text-xl font-bold">Gestion des événements</h1>
                <p className="text-xs text-gray-600">Promotions, mini-jeux et événements spéciaux (US-033)</p>
            </div>

            {message && <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p>}
            {erreur && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{erreur}</p>}

            {/* ---------- FORMULAIRE ---------- */}
            <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2">
                <div className="flex flex-col gap-1 text-xs">
                    <label>ID (3 majuscules + 4 chiffres, ex : PRM0001)</label>
                    <input value={form.Id_evenement} disabled={modeEdition}
                        onChange={(e) => setForm({ ...form, Id_evenement: e.target.value.toUpperCase() })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1 disabled:bg-gray-100" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Type</label>
                    <select value={form.type_evenement}
                        onChange={(e) => setForm({ ...form, type_evenement: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1">
                        {types.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 text-xs md:col-span-2">
                    <label>Description (obligatoire, affichee aux etudiants)</label>
                    <textarea rows="2" value={form.description_evenement}
                        onChange={(e) => setForm({ ...form, description_evenement: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs md:col-span-2">
                    <label>Affiche de l&apos;événement (fichier jpg/png — affichée sur l&apos;accueil étudiants)</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => choisirAffiche(e.target.files?.[0])}
                        disabled={envoiAffiche}
                        className="rounded-md border border-[#CFBD97] px-1 py-1 file:mr-2 file:cursor-pointer file:rounded-l-md file:border-0 file:bg-[#CFBD97] file:px-2 file:text-white" />
                    {envoiAffiche && <span className="text-[11px] text-gray-500">Envoi de l&apos;affiche...</span>}
                    {form.affiche_evenement && (
                        <div className="flex items-center gap-2">
                            <img src={form.affiche_evenement} alt="affiche" className="h-9 w-14 rounded object-cover" />
                            <span className="text-[11px] text-gray-500">{form.affiche_evenement}</span>
                        </div>
                    )}
                    <input value={form.affiche_evenement} onChange={(e) => setForm({ ...form, affiche_evenement: e.target.value })}
                        placeholder="ou chemin / URL, ex : /img/evenements/soiree.jpg"
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Début</label>
                    <input type="datetime-local" value={form.debut_evenement}
                        onChange={(e) => setForm({ ...form, debut_evenement: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Fin (après le début)</label>
                    <input type="datetime-local" value={form.fin_evenement}
                        onChange={(e) => setForm({ ...form, fin_evenement: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Points à gagner (mini-jeu / événement)</label>
                    <input type="number" min="0" value={form.points_evenement}
                        onChange={(e) => setForm({ ...form, points_evenement: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                {form.type_evenement === "promotion" && (
                    <div className="flex flex-col gap-1 text-xs">
                        <label>Taux de réduction (%, 1 à 100)</label>
                        <input type="number" min="1" max="100" value={form.taux_reduction}
                            onChange={(e) => setForm({ ...form, taux_reduction: e.target.value })}
                            className="rounded-md border border-[#CFBD97] px-2 py-1" />
                    </div>
                )}
                <p className="text-xs text-gray-500 md:col-span-2">
                    L événement sera rattaché au compte connecté : {user?.Id_utilisateur} ({user?.role}).
                    {user?.role !== "administrateur" && " Nécessaire d etre admin pour créer un événement."}
                </p>
                <div className="flex gap-2 md:col-span-2">
                    <button onClick={enregistrer}
                        className="rounded-full bg-[#CFBD97] px-5 py-1.5 text-xs text-white">
                        {modeEdition ? "Enregistrer" : "Créer l événement"}
                    </button>
                    {modeEdition && (
                        <button onClick={() => { setModeEdition(false); setForm(FORMULAIRE_VIDE) }}
                            className="rounded-full border border-[#CFBD97] px-4 py-1.5 text-xs">Annuler</button>
                    )}
                </div>
            </section>

            {/* ---------- LISTE ---------- */}
            <div className="flex flex-col gap-2">
                {evenements.map((e) => (
                    <div key={e.Id_evenement} className="rounded-xl bg-white p-3 text-xs shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            {e.affiche_evenement && (
                                <img src={e.affiche_evenement} alt={e.Id_evenement}
                                    className="h-10 w-14 rounded object-cover" />
                            )}
                            <div className="flex-1">
                                <p className="font-semibold">
                                    {e.Id_evenement} · {e.type_evenement} · {e.points_evenement} pts{e.taux_reduction ? " · -" + e.taux_reduction + "%" : ""}
                                </p>
                                <p className="text-gray-500">du {(e.debut_evenement || "").slice(0, 16).replace("T", " ")} au {(e.fin_evenement || "").slice(0, 16).replace("T", " ")}</p>
                            </div>
                            <button onClick={() => voirParticipations(e.Id_evenement)}
                                className="rounded-full border border-[#CFBD97] px-3 py-1">Participations</button>
                            <button onClick={() => editer(e)}
                                className="rounded-full border border-[#CFBD97] px-3 py-1">Modifier</button>
                            <button onClick={() => supprimer(e)}
                                className="rounded-full border border-red-300 px-3 py-1 text-red-700">Supprimer</button>
                        </div>
                        {/* liste des participations sous l événement quand on clique */}
                        {participations && participations.id === e.Id_evenement && (
                            <div className="mt-2 rounded-md bg-[#f5f1e6] p-2">
                                {participations.liste === null && <p>Chargement...</p>}
                                {Array.isArray(participations.liste) && participations.liste.length === 0 && <p>Aucune participation.</p>}
                                {Array.isArray(participations.liste) && participations.liste.map((p, i) => (
                                    <p key={p.Id_utilisateur ?? i}>
                                        {p.etudiant?.nom ?? p.nom ?? p.Id_utilisateur} — {p.points_gagnes ?? p.points ?? "?"} pts — {(p.created_at ?? p.date ?? "").slice(0, 10)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {evenements.length === 0 && <p className="text-sm text-gray-600">Aucun événement pour le moment.</p>}
            </div>
        </div>
    )
}
