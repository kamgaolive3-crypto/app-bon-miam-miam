import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

// GESTION DES EMPLOYES (maquette /page-12) : creer, modifier et desactiver les comptes de l equipe
// donnees : GET /api/employes
// actions : POST /api/employes (gerant) · PUT /api/employes/{id} (poste / statut) · DELETE (admin)

export default function Employes() {
    const { user } = useAuth()
    const [liste, setListe] = useState([])
    const [erreur, setErreur] = useState("")
    const [message, setMessage] = useState("")
    const [restaurants, setRestaurants] = useState([]);
    // formulaire de creation (POST /api/employes), ouvert par le bouton dore
    const [formOuvert, setFormOuvert] = useState(false)
    const [form, setForm] = useState({
        nom: "", prenom: "", email: "", telephone: "",
        mot_de_passe: "", poste: "", date_embauche: "",
        Id_restaurant: "",
    })
    // filtre par poste : "Rôle : Tous"
    const [filtreRole, setFiltreRole] = useState("")
    // edition en ligne du poste : { id : valeur }
    const [edition, setEdition] = useState({})

    const charger = () => {
        api.get("/employes")
            // le backend renvoie { employe: {...}, utilisateur: {...} } ;
            // on aplati pour que la page lise poste, telephone, statut... a plat
            .then((l) => {
                const brut = Array.isArray(l) ? l : l.data || [];
                setListe(brut.map((e) => ({ ...(e.employe || {}), ...(e.utilisateur || {}) })));
            })
            .catch((e) => setErreur(e.message))
    }
    useEffect(charger, [])

    useEffect(() => {
    api.get("/restaurant")
        .then((liste) => {
            const donnees = Array.isArray(liste) ? liste : liste.data || [];
            setRestaurants(donnees);

            if (donnees.length > 0) {
                setForm((ancien) => ({
                    ...ancien,
                    Id_restaurant:
                        ancien.Id_restaurant || donnees[0].Id_restaurant,
                }));
            }
        })
        .catch((e) => setErreur(e.message));
    }, []);

    const creer = async () => {
        setMessage(""); setErreur("")
        try {
            await api.post("/employes", form)
            setMessage("Employé créé : " + form.email)
            setForm({ nom: "", prenom: "", email: "", telephone: "", mot_de_passe: "", poste: "", date_embauche: "" })
            setFormOuvert(false)
            charger()
        } catch (e) {
            const detail = e.champs ? Object.values(e.champs).flat().join(" - ") : null
            setErreur(detail || e.message)
        }
    }

    // changer le poste ou le statut du compte (PUT /api/employes/{id})
    const maj = async (id, corps) => {
        setMessage(""); setErreur("")
        try {
            await api.put("/employes/" + encodeURIComponent(id), corps)
            setMessage("Employé mis à jour.")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // supprimer un employé (réservé à l administrateur)
    const supprimer = async (id) => {
        setMessage(""); setErreur("")
        try {
            await api.del("/employes/" + encodeURIComponent(id))
            setMessage("Employé supprimé.")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // postes distincts pour le filtre "Rôle"
    const postes = [...new Set(liste.map((e) => e.poste).filter(Boolean))]
    const listeAffichee = filtreRole
        ? liste.filter((e) => e.poste === filtreRole)
        : liste

    return (
        <div className="flex flex-col gap-5 p-4 md:p-6">
            {/* ---------- TITRE + AJOUT ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="font-serif text-2xl font-bold">Gestion des employés</h1>
                    <p className="text-xs text-gray-600">Créer, modifier et désactiver les comptes de l équipe (US-031/034)</p>
                </div>
                <button
                    type="button"
                    onClick={() => setFormOuvert(!formOuvert)}
                    className="rounded-full bg-[#CFBD97] px-4 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                >
                    + Ajouter un employé
                </button>
            </div>

            {message && <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p>}
            {erreur && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{erreur}</p>}

            {/* ---------- FORMULAIRE DE CREATION (depliable) ---------- */}
            {formOuvert && (
                <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
                    {[
                        ["nom", "Nom"], ["prenom", "Prénom"], ["email", "Email"],
                        ["telephone", "Téléphone (6xxxxxxxx)"], ["poste", "Poste (ex : livreur)"], ["date_embauche", "Date d embauche (facultatif)"],
                    ].map(([champ, libelle]) => (
                        <div key={champ} className="flex flex-col gap-1 text-xs">
                            <label>{libelle}</label>
                            <input value={form[champ]} onChange={(e) => setForm({ ...form, [champ]: e.target.value })}
                                type={champ === "date_embauche" ? "date" : "text"}
                                className="rounded-md border border-[#CFBD97] px-2 py-1" />
                        </div>
                    ))}

                    <div className="flex flex-col gap-1 text-xs">
                        <label htmlFor="Id_restaurant">Restaurant</label>
                        <select
                        id="Id_restaurant"
                        required
                        value={form.Id_restaurant}
                        onChange={(e) =>
                            setForm({ ...form, Id_restaurant: e.target.value })
                        }
                        className="rounded-md border border-[#CFBD97] px-2 py-1"
                    >
                        <option value="">Choisir un restaurant</option>
                        {restaurants.map((restaurant) => (
                            <option
                              key={restaurant.Id_restaurant}
                              value={restaurant.Id_restaurant}
                            >
                                {restaurant.nom_restaurant} ({restaurant.Id_restaurant})
                            </option>
                        ))}
                    </select>
                </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <label>Mot de passe (8+ caractères, 1 majuscule, 1 chiffre)</label>
                        <input type="password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                            className="rounded-md border border-[#CFBD97] px-2 py-1" />
                    </div>
                    <div className="flex items-end gap-2">
                        <button onClick={creer} className="rounded-full bg-[#CFBD97] px-5 py-1.5 text-xs text-white">
                            Créer le compte
                        </button>
                        <button onClick={() => setFormOuvert(false)} className="rounded-full border border-[#CFBD97] px-4 py-1.5 text-xs">
                            Annuler
                        </button>
                    </div>
                </section>
            )}

            {/* ---------- FILTRE ROLE ---------- */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}
                    className="rounded-full border border-[#CFBD97] bg-white px-3 py-1.5">
                    <option value="">Rôle : Tous</option>
                    {postes.map((p) => (
                        <option key={p} value={p}>Rôle : {p}</option>
                    ))}
                </select>
                <span className="text-gray-500">{listeAffichee.length} employé(s)</span>
            </div>

            {/* ---------- TABLEAU ---------- */}
            {listeAffichee.length === 0 ? (
                <p className="text-sm text-gray-600">Aucun employé enregistré.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#efe6d0] text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Employé</th>
                                <th className="px-4 py-3">Téléphone</th>
                                <th className="px-4 py-3">Rôle</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Créé le</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeAffichee.map((e) => {
                                const id = e.Id_utilisateur
                                const nomComplet = (e.utilisateur?.prenom ?? e.prenom ?? "") + " " + (e.utilisateur?.nom ?? e.nom ?? "")
                                const email = e.utilisateur?.email ?? e.email ?? ""
                                const actif = e.statut_compte === "actif"
                                const cree = (e.date_embauche ?? e.utilisateur?.created_at ?? "").slice(0, 10) || ""
                                return (
                                    <tr key={id} className="border-b border-[#efe6d0] last:border-0">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold">{nomComplet.trim() || id}</p>
                                            <p className="text-xs text-gray-500">{email}</p>
                                        </td>
                                        <td className="px-4 py-3">{e.telephone ?? "—"}</td>
                                        {/* ROLE : texte ou champ d edition */}
                                        <td className="px-4 py-3">
                                            {edition[id] !== undefined ? (
                                                <span className="flex items-center gap-1">
                                                    <input
                                                        value={edition[id]}
                                                        onChange={(ev) => setEdition({ ...edition, [id]: ev.target.value })}
                                                        className="w-24 rounded-md border border-[#CFBD97] px-2 py-1 text-xs"
                                                    />
                                                    <button
                                                        onClick={() => { maj(id, { poste: edition[id] }); setEdition({ ...edition, [id]: undefined }); }}
                                                        className="rounded-full bg-[#CFBD97] px-2 py-1 text-[10px] text-white">
                                                        OK
                                                    </button>
                                                </span>
                                            ) : e.poste ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={"rounded-full px-3 py-1 text-xs " + (actif ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600")}>
                                                {actif ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{cree || "—"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    onClick={() => setEdition({ ...edition, [id]: e.poste ?? "" })}
                                                    className="rounded-full border border-[#CFBD97] px-3 py-1 text-xs hover:bg-[#f5f1e6]">
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => maj(id, { statut_compte: actif ? "inactif" : "actif" })}
                                                    className={"rounded-full border px-3 py-1 text-xs " + (actif ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-300 text-green-700 hover:bg-green-50")}>
                                                    {actif ? "Désactiver" : "Réactiver"}
                                                </button>
                                                {user?.role === "administrateur" && (
                                                    <button onClick={() => supprimer(id)}
                                                        className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
