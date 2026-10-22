import { useState, useEffect } from "react";
import { api } from "../../services/api";

// GESTION DES MENUS (maquette /gestion-menu) : creer, modifier, masquer les articles
// donnees : GET /api/article_menu + GET /api/restaurant (pour le select du restaurant)
// actions : POST/PUT/DELETE /api/article_menu (US-027, personnel connecte)

// les catégories possibles (mêmes valeurs que la base)
const categories = ["plat", "boisson", "dessert", "accompagnement", "autre"];

// formulaire vide (un article n existera pas encore)
const FORMULAIRE_VIDE = {
    Id_article: "",
    nom_article: "",
    description: "",
    prix_article: 1000,
    categories_article: "plat",
    disponibilite_article: true,
    Menu_du_jour: false,
    image_article: "",
    Id_restaurant: "",
};

export default function Menu() {
    const [articles, setArticles] = useState([])
    const [restaurants, setRestaurants] = useState([])
    const [erreur, setErreur] = useState("")
    const [message, setMessage] = useState("")
    // le formulaire peut être en création (aucun id déjà rempli) ou en modification
    const [form, setForm] = useState(FORMULAIRE_VIDE)
    const [modeEdition, setModeEdition] = useState(false)
    // onglet de categorie actif (Tous / plat / boisson...)
    const [onglet, setOnglet] = useState("")

    const charger = () => {
        api.get("/article_menu")
            .then((liste) => setArticles(Array.isArray(liste) ? liste : liste.data || []))
            .catch((e) => setErreur(e.message))
    }
    useEffect(() => {
        charger()
        // la liste des restaurants sert au select du formulaire
        api.get("/restaurant")
            .then((l) => {
                const brut = Array.isArray(l) ? l : (l.data || l.restaurants || []);
                setRestaurants(brut)
                // toujours ancrer le formulaire sur un vrai Id_restaurant existant
                const premier = (brut[0] || {}).Id_restaurant ?? (brut[0] || {}).id_restaurant ?? (brut[0] || {}).id;
                if (premier) setForm((f) => ({
                    ...f,
                    Id_restaurant: brut.some((r) => (r.Id_restaurant ?? r.id_restaurant ?? r.id) === f.Id_restaurant)
                        ? f.Id_restaurant
                        : premier,
                }));
            })
            .catch(() => setRestaurants([]))
    }, [])

    // POST ou PUT selon le mode
    const enregistrer = async () => {
        setMessage(""); setErreur("")
        const corps = {
            ...form,
            prix_article: Number(form.prix_article),
            disponibilite_article: !!form.disponibilite_article,
            Menu_du_jour: !!form.Menu_du_jour,
            image_article: form.image_article.trim() || null,
            description: form.description.trim() || null,
        };
        try {
            if (modeEdition) {
                await api.put("/article_menu/" + encodeURIComponent(form.Id_article), corps)
                setMessage("Article " + form.Id_article + " modifié.")
            } else {
                await api.post("/article_menu", corps)
                setMessage("Article " + form.Id_article + " créé.")
            }
            setForm({
                ...FORMULAIRE_VIDE,
                Id_restaurant: restaurants[0]?.Id_restaurant ?? "",
            });
            setModeEdition(false)
            charger()
        } catch (e) {
            const detail = e.champs ? Object.values(e.champs).flat().join(" - ") : null
            setErreur(detail || e.message)
        }
    }

    // pré-remplir le formulaire avec un article existant
    const editer = (a) => {
        setModeEdition(true)
        setMessage(""); setErreur("")
        setForm({
            Id_article: a.Id_article,
            nom_article: a.nom_article,
            description: a.description ?? a.description_article ?? "",
            prix_article: a.prix_article,
            categories_article: a.categories_article,
            disponibilite_article: !!a.disponibilite_article,
            Menu_du_jour: !!a.Menu_du_jour,
            image_article: a.image_article ?? "",
            Id_restaurant: a.Id_restaurant ?? "RS001",
        });
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    // bascule rapide : menu du jour / disponibilité (PUT partiel)
    const basculer = async (a, champ) => {
        setMessage(""); setErreur("")
        try {
            await api.put("/article_menu/" + encodeURIComponent(a.Id_article), {
                Id_article: a.Id_article,
                nom_article: a.nom_article,
                prix_article: a.prix_article,
                categories_article: a.categories_article,
                Id_restaurant: a.Id_restaurant ?? "RS001",
                [champ]: !a[champ],
            })
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // suppression
    const supprimer = async (a) => {
        setMessage(""); setErreur("")
        try {
            await api.del("/article_menu/" + encodeURIComponent(a.Id_article))
            setMessage("Article " + a.Id_article + " supprimé.")
            charger()
        } catch (e) { setErreur(e.message) }
    }

    // upload d image du formulaire (dossier plats) : envoi du fichier, le
    // serveur renvoie le chemin exact a enregistrer (plus de chemin a inventer)
    const [envoiImage, setEnvoiImage] = useState(false)
    const choisirImage = async (fichier) => {
        if (!fichier) return
        setEnvoiImage(true); setMessage(""); setErreur("")
        const fd = new FormData()
        fd.append("image", fichier)
        fd.append("dossier", "plats")
        try {
            const rep = await api.envoiFichier("/upload_image", fd)
            setForm((f) => ({ ...f, image_article: rep.chemin }))
            setMessage("Image enregistrée : " + rep.chemin)
        } catch (e) {
            setErreur(e.message || "Image refusée par le serveur")
        } finally {
            setEnvoiImage(false)
        }
    }

    // filtre par onglet de categorie
    const articlesAffiches = onglet
        ? articles.filter((a) => a.categories_article === onglet)
        : articles

    return (
        <div className="flex flex-col gap-5 p-4 md:p-6">
            {/* ---------- TITRE + AJOUT ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="font-serif text-2xl font-bold">Gestion des menus</h1>
                    <p className="text-xs text-gray-600">Créer, modifier et masquer les articles du menu (US-027)</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setModeEdition(false); 
                        setForm({
                            ...FORMULAIRE_VIDE,
                            Id_restaurant: restaurants[0]?.Id_restaurant ?? "",
                        });
                    }}
                    className="rounded-full bg-[#CFBD97] px-4 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                >
                    + Ajouter un plat
                </button>
            </div>

            {message && <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p>}
            {erreur && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{erreur}</p>}

            {/* ---------- FORMULAIRE (creation ou modification) ---------- */}
            <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2">
                <div className="flex flex-col gap-1 text-xs">
                    <label>ID article (3 majuscules + 3 chiffres, ex : PLA001)</label>
                    <input value={form.Id_article} disabled={modeEdition}
                        onChange={(e) => setForm({ ...form, Id_article: e.target.value.toUpperCase() })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1 disabled:bg-gray-100" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Nom</label>
                    <input value={form.nom_article} onChange={(e) => setForm({ ...form, nom_article: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Prix (Fcfa)</label>
                    <input type="number" min="0" value={form.prix_article}
                        onChange={(e) => setForm({ ...form, prix_article: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Catégorie</label>
                    <select value={form.categories_article}
                        onChange={(e) => setForm({ ...form, categories_article: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1">
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Restaurant</label>
                    <select value={form.Id_restaurant}
                        onChange={(e) => setForm({ ...form, Id_restaurant: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1">
                        {restaurants.map((r) => {
                            const idResto = r.Id_restaurant ?? r.id_restaurant ?? r.id;
                            // jamais le nom d'affichage comme value : l'API valide le vrai Id
                            if (idResto == null) return null;
                            return (
                                <option key={idResto} value={idResto}>
                                    {(r.nom_restaurant ?? r.nom ?? idResto)}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <label>Photo du plat (fichier jpg/png — upload direct)</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => choisirImage(e.target.files?.[0])}
                        disabled={envoiImage}
                        className="rounded-md border border-[#CFBD97] px-1 py-1 file:mr-2 file:cursor-pointer file:rounded-l-md file:border-0 file:bg-[#CFBD97] file:px-2 file:text-white" />
                    {envoiImage && <span className="text-[11px] text-gray-500">Envoi de l&apos;image...</span>}
                    {/* preview de l image choisie/uploadée */}
                    {form.image_article && (
                        <div className="flex items-center gap-2">
                            <img src={form.image_article} alt="aperçu" className="h-9 w-9 rounded object-cover" />
                            <span className="text-[11px] text-gray-500">{form.image_article}</span>
                        </div>
                    )}
                    {/* repli : saisie manuelle du chemin (URL externe par exemple) */}
                    <input value={form.image_article} onChange={(e) => setForm({ ...form, image_article: e.target.value })}
                        placeholder="ou chemin / URL, ex : /img/plats/eru.jpg"
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <div className="flex flex-col gap-1 text-xs md:col-span-2">
                    <label>Description (facultatif)</label>
                    <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="rounded-md border border-[#CFBD97] px-2 py-1" />
                </div>
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!form.disponibilite_article}
                        onChange={(e) => setForm({ ...form, disponibilite_article: e.target.checked })} />
                    Disponible à la vente
                </label>
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!form.Menu_du_jour}
                        onChange={(e) => setForm({ ...form, Menu_du_jour: e.target.checked })} />
                    Dans le menu du jour
                </label>
                <div className="flex gap-2 md:col-span-2">
                    <button onClick={enregistrer}
                        className="rounded-full bg-[#CFBD97] px-5 py-1.5 text-xs text-white">
                        {modeEdition ? "Enregistrer les modifications" : "Créer l article"}
                    </button>
                    {modeEdition && (
                        <button onClick={() => { setModeEdition(false); setForm(FORMULAIRE_VIDE) }}
                            className="rounded-full border border-[#CFBD97] px-4 py-1.5 text-xs">
                            Annuler
                        </button>
                    )}
                </div>
            </section>

            {/* ---------- ONGLETS PAR CATEGORIE ---------- */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setOnglet("")}
                    className={"rounded-full px-4 py-1 text-xs " + (onglet === "" ? "bg-[#CFBD97] text-white" : "bg-white text-gray-700 shadow-sm")}>
                    Tous
                </button>
                {categories.map((c) => (
                    <button key={c} onClick={() => setOnglet(c)}
                        className={"rounded-full px-4 py-1 text-xs capitalize " + (onglet === c ? "bg-[#CFBD97] text-white" : "bg-white text-gray-700 shadow-sm")}>
                        {c}s
                    </button>
                ))}
            </div>

            {/* ---------- TABLEAU ---------- */}
            {articlesAffiches.length === 0 ? (
                <p className="text-sm text-gray-600">Aucun article pour cette catégorie.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#efe6d0] text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Article</th>
                                <th className="px-4 py-3">Prix</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Menu du jour</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articlesAffiches.map((a) => (
                                <tr key={a.Id_article} className="border-b border-[#efe6d0] last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={a.image_article || "/plat_du_jour.jpg"} alt={a.nom_article}
                                                className="h-10 w-10 rounded-lg object-cover" />
                                            <div>
                                                <p className="font-semibold">{a.nom_article}</p>
                                                <p className="text-xs text-gray-500">{a.Id_article} · {a.categories_article}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-[#b8862d]">
                                        {(a.prix_article ?? 0).toLocaleString("fr-FR")} Fcfa
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => basculer(a, "disponibilite_article")}
                                            title="Cliquer pour basculer"
                                            className={"rounded-full px-3 py-1 text-xs " + (a.disponibilite_article ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                            {a.disponibilite_article ? "Disponible" : "Rupture"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        {/* un clic ajoute/retire le plat du menu du jour (US-025) */}
                                        <button onClick={() => basculer(a, "Menu_du_jour")}
                                            title={a.Menu_du_jour ? "Retirer du menu du jour" : "Ajouter ce plat existant au menu du jour"}
                                            className={"rounded-full px-3 py-1 text-xs " + (a.Menu_du_jour ? "bg-[#CFBD97] text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300")}>
                                            {a.Menu_du_jour ? "Du jour ✓" : "Pas du jour"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            <button onClick={() => editer(a)}
                                                className="rounded-full border border-[#CFBD97] px-3 py-1 text-xs hover:bg-[#f5f1e6]">
                                                Modifier
                                            </button>
                                            <button onClick={() => supprimer(a)}
                                                className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
