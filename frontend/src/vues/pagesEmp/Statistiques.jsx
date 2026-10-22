// Statistiques.jsx : page « Statistiques » de l'espace Employé (route /Statistiques).
// Filtres, 3 cartes, graphique en barres, donut, meilleur jour.
// Données : GET /api/stats/ventes-semaine (7 derniers jours, réservé au personnel)
// + GET /api/commande pour la répartition par catégorie du donut.
import { useState, useEffect } from "react";
import { FaChartColumn, FaCartShopping, FaGlobe, FaBagShopping, FaArrowUp, FaClipboardList, FaChevronDown, FaArrowRight, FaTrophy } from "react-icons/fa6";
import { api } from "../../services/api";

// libellé des jours (fr) indexé par getDay() (0 = dimanche)
const NOMS_JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// code categorie du backend -> libellé affiché + couleur du donut
const LIBELLES_CATEGORIES = {
    plat: "Plat principal",
    accompagnement: "Accompagnement",
    boisson: "Boisson",
    dessert: "Dessert",
    autre: "Autre",
};
const COULEURS_CATEGORIES = {
    "Plat principal": "var(--color-emp-donut-principal)",
    "Dessert": "var(--color-emp-donut-dessert)",
    "Boisson": "var(--color-emp-donut-boisson)",
    "Accompagnement": "var(--color-emp-pab)",
    "Autre": "var(--color-emp-beige-barre)",
};

// Graduations de l'axe (haut vers bas) : servent à calculer les hauteurs en %
const graduations = [50, 40, 30, 20, 10, 0];

export default function Statistiques() {
    // Donnée affichée dans le graphique : "tout", "ventes" ou "commandes"
    const [donnee, setDonnee] = useState("ventes");
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    // 7 jours réels de la semaine depuis le backend (0 ventes si jour sans commande)
    const [jours, setJours] = useState([]);
    // les 3 cartes de chiffres
    const [cartes, setCartes] = useState([]);
    // répartition des ventes par catégorie (pour le donut)
    const [categories, setCategories] = useState([]);
    // période renvoyée par le backend (pour le sélecteur de dates)
    const [periode, setPeriode] = useState(null);
    // top 3 plats de la semaine (bouton « Voir le détail »)
    const [topArticles, setTopArticles] = useState([]);

    // charger() : stats de la semaine + commandes (pour le donut par catégorie)
    function charger() {
        Promise.all([api.get("/stats/ventes-semaine"), api.get("/commande")])
            .then(([stats, commandesBrut]) => {
                const lignesCommandes = Array.isArray(commandesBrut) ? commandesBrut : (commandesBrut.data ?? []);

                const [debut, fin] = stats.periode ?? [];
                const parJour = stats.par_jour ?? [];
                const parStatuts = new Map((stats.par_statut ?? []).map((s) => [s.statut_commande, s.total]));

                // 7 jours contigus (periode[0]..periode[1]), 0 par défaut
                // NB : formatage manuel — toISOString passerait en UTC et decalerait d un jour
                const isoLocal = (d) =>
                    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
                const joursSemaine = [];
                if (debut) {
                    for (let i = 0; i < 7; i++) {
                        const d = new Date(debut + "T00:00:00");
                        d.setDate(d.getDate() + i);
                        const iso = isoLocal(d);
                        const sql = parJour.find((j) => (j.jour || "").slice(0, 10) === iso);
                        joursSemaine.push({
                            jour: NOMS_JOURS[d.getDay()],
                            date: iso.slice(8, 10) + "/" + iso.slice(5, 7),
                            commandes: sql ? Number(sql.nb_commandes) : 0,
                            ventes: sql ? Math.round(Number(sql.chiffre_affaires) / 1000) : 0,
                        });
                    }
                }
                setJours(joursSemaine);
                setPeriode([debut, fin]);

                // les 3 cartes (variation comparée aux ventes -> pas d'historique : cachée si 0)
                const totalCommandes = Number(stats.total_commandes ?? 0);
                const ca = Number(stats.ca_total ?? 0);
                const panier = totalCommandes ? Math.round(ca / totalCommandes) : 0;
                setCartes([
                    { titre: "Total commandes", valeur: totalCommandes.toLocaleString("fr-FR"), variation: null, Icone: FaCartShopping },
                    { titre: "Ventes (x1000)", valeur: Math.round(ca / 1000).toLocaleString("fr-FR") + " 000", variation: null, Icone: FaGlobe },
                    { titre: "Panier moyen", valeur: panier.toLocaleString("fr-FR") + " Fcfa", variation: null, Icone: FaBagShopping },
                ]);

                // ---- donut : ca par catégorie, calculé sur les commandes de la période ----
                const caParCategorie = {};
                lignesCommandes
                    .filter((c) => (c.statut_commande || "") !== "annulee"
                        && (!debut || ((c.date_commande || "").slice(0, 10) >= debut && (c.date_commande || "").slice(0, 10) <= fin)))
                    .forEach((c) => (c.articles ?? []).forEach((a) => {
                        const cle = LIBELLES_CATEGORIES[a.categories_article] || a.categories_article || "Autre";
                        const montant = (a.pivot?.quantite ?? a.quantite ?? 1) * (a.pivot?.prix_unitaire ?? a.prix_article ?? 0);
                        caParCategorie[cle] = (caParCategorie[cle] || 0) + montant;
                    }));
                const caTotalCat = Object.values(caParCategorie).reduce((s, v) => s + v, 0);
                const cats = Object.entries(caParCategorie)
                    .map(([nom, montant]) => ({
                        nom,
                        pourcent: caTotalCat ? Math.round((montant / caTotalCat) * 100) : 0,
                        couleur: COULEURS_CATEGORIES[nom] || "var(--color-emp-beige-barre)",
                    }))
                    .sort((x, y) => y.pourcent - x.pourcent);
                // arrondi : report de la différence sur la plus grosse part pour faire 100
                if (cats.length && caTotalCat) {
                    const reste = 100 - cats.reduce((s, c) => s + c.pourcent, 0);
                    cats[0].pourcent += reste;
                }
                setCategories(cats);
                setTopArticles(stats.top_articles ?? []);
                setErreur("");
            })
            .catch((e) => setErreur(e.message));
    }
    useEffect(charger, []);

    // Graduations adaptées aux vraies valeurs (Multiple de 10, minimum 50)
    const MAX_VENTES = Math.max(50, ...jours.map((j) => j.ventes), ...jours.map((j) => j.commandes));
    const MAX = Math.ceil(MAX_VENTES / 10) * 10;
    const graduationsAffichees = graduations.map(() => 0).map((_, i) => MAX - i * (MAX / (graduations.length - 1)));

    // Dégradé du donut : chaque part commence où la précédente finit
    const degrade = categories
        .map((c, i) => {
            const debut2 = categories.slice(0, i).reduce((somme, autre) => somme + autre.pourcent, 0);
            return `${c.couleur} ${debut2}% ${debut2 + c.pourcent}%`;
        })
        .join(", ");
    // Jour qui a le plus de ventes
    const meilleurJour = jours.length ? jours.reduce((meilleur, j) => (j.ventes > meilleur.ventes ? j : meilleur)) : { jour: "-", date: "", ventes: 0 };
    // Ordre d'affichage de la légende (les parts triées par taille)
    const ordreLegende = categories.map((c) => c.nom);

    return (
        <div className="p-4 md:p-6">
            {/* En-tête */}
            <div className="flex items-start gap-4 mb-6">
                <FaChartColumn size={28} className="text-primary mt-1" />
                <div>
                    <h2 className="font-bold">Statistiques</h2>
                    <p className="text-sm text-secondary">Consultez les performances de la semaine.</p>
                </div>
            </div>

            {/* Filtres : période (semaine en cours renvoyée par le backend) + donnée du graphique */}
            <div className="mb-6 flex flex-wrap gap-3 md:justify-end">
                <div className="relative md:w-64">
                    <FaClipboardList size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <select className="w-full appearance-none rounded-md bg-emp-barre-carre py-3 pl-9 pr-10 text-sm cursor-pointer">
                        {periode && periode[0] && periode[1] && (
                            <option>
                                {periode[0].slice(8, 10) + "/" + periode[0].slice(5, 7)} -{" "}
                                {periode[1].slice(8, 10) + "/" + periode[1].slice(5, 7) + " (semaine en cours)"}
                            </option>
                        )}
                    </select>
                    <FaChevronDown size={12} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />
                </div>
                <div className="relative md:w-48">
                    <select value={donnee} onChange={(e) => setDonnee(e.target.value)} className="w-full appearance-none rounded-md bg-emp-barre-carre py-3 pl-4 pr-10 text-sm cursor-pointer">
                        <option value="tout">Toutes</option>
                        <option value="ventes">Ventes</option>
                        <option value="commandes">Commandes</option>
                    </select>
                    <FaChevronDown size={12} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />
                </div>
            </div>

            {erreur !== "" && (
                <p className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm text-red-700">{erreur}</p>
            )}
            {message !== "" && (
                <p className="mb-4 rounded-md bg-emp-vert-rond px-4 py-2 text-sm text-emp-vert-emoji">{message}</p>
            )}

            {/* 3 cartes de chiffres */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {cartes.map((carte) => (
                    <div key={carte.titre} className="flex items-center gap-4 rounded-lg border border-emp-trace-pab bg-emp-pab p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emp-or-disque">
                            <carte.Icone size={18} className="text-primary-700" />
                        </div>
                        <div>
                            <p className="text-xs text-secondary">{carte.titre}</p>
                            <p className="text-lg font-semibold text-secondary">{carte.valeur}</p>
                            {carte.variation && (
                                <p className="flex items-center gap-1 text-xs font-semibold text-emp-vert-emoji">
                                    <FaArrowUp size={10} />
                                    {carte.variation}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Graphique (2/3) + donut (1/3) côte à côte sur grand écran */}
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {/* Graphique en barres */}
                <div className="rounded-lg border border-grey-300 bg-emp-fond-carte p-3 lg:col-span-2">
                    <div className="flex justify-end gap-4 text-[11px]">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-4 rounded-full bg-emp-beige-barre" /> commandes</span>
                        <span className="flex items-center gap-2"><span className="h-2.5 w-4 rounded-full bg-black" /> Ventes (x1000)</span>
                    </div>
                    <h3 className="text-xs font-bold">Évolution des ventes</h3>
                    <div className="overflow-x-auto">
                        <div className="min-w-[320px]">
                            {/* relative : repère pour les lignes ; ml-8 : place pour les nombres de l'axe */}
                            <div className="relative ml-8 mt-4 h-36">
                                {/* Une ligne par graduation, placée en % depuis le haut */}
                                {graduationsAffichees.map((g) => (
                                    <div key={g} className="absolute left-0 right-0" style={{ top: `${((MAX - g) / MAX) * 100}%` }}>
                                        <span className="absolute -left-8 top-0 w-6 -translate-y-1/2 text-right text-[11px] font-semibold">{g}</span>
                                        <div className="border-t border-grey-300" />
                                    </div>
                                ))}
                                {/* Barres par-dessus les lignes : hauteur = valeur / MAX en % */}
                                <div className="absolute inset-0 grid grid-cols-7">
                                    {jours.map((j) => (
                                        <div key={j.jour} className="flex h-full items-end justify-center gap-1">
                                            {donnee !== "ventes" && <div className="w-3 bg-emp-beige-barre" style={{ height: `${(j.commandes / MAX) * 100}%` }} />}
                                            {donnee !== "commandes" && <div className="w-3 bg-black" style={{ height: `${(j.ventes / MAX) * 100}%` }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Libellés : mêmes 7 colonnes que les barres */}
                            <div className="ml-8 mt-2 grid grid-cols-7 text-center text-[11px]">
                                {jours.map((j) => (
                                    <div key={j.jour}><p>{j.jour}</p><p>{j.date}</p></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donut */}
                <div className="flex flex-col rounded-lg border border-grey-300 bg-emp-fond-carte p-3">
                    <h3 className="text-xs font-bold">Répartition des ventes par catégorie</h3>
                    <div className="flex flex-1 items-center justify-center gap-6">
                        {/* Disque en conic-gradient ; le trou est un cercle de la couleur du fond */}
                        <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(${degrade})` }}>
                            <div className="absolute inset-7 rounded-full bg-emp-fond-carte" />
                        </div>
                        {/* Légende dans l'ordre de ordreLegende */}
                        <ul className="flex flex-col gap-2 text-[11px]">
                            {ordreLegende.map((nom) => categories.find((c) => c.nom === nom)).map((c) => (
                                <li key={c.nom} className="flex items-center gap-2">
                                    <span className="h-3 w-3 shrink-0 rounded-full border border-grey-300" style={{ background: c.couleur }} />
                                    <span>{c.nom}</span>
                                    <span className="ml-auto pl-2">{c.pourcent}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Meilleur jour (calculé) ; « Voir le détail » : top plats de la semaine */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-emp-beige-barre p-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emp-or-icone">
                        <FaTrophy size={20} className="text-primary-700" />
                    </div>
                    <div className="text-xs">
                        <p className="font-bold">Meilleur jour de la semaine</p>
                        <p>{meilleurJour.jour} ( {meilleurJour.date} )</p>
                        <p>Ventes : {meilleurJour.ventes * 1000} FCFA</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() =>
                        setMessage(
                            "Top plats de la semaine : " + (
                                topArticles.length
                                    ? topArticles.map((t) => t.nom_article + " (" + t.vendus + " vendus)").join(" • ")
                                    : "aucune vente enregistrée."
                            )
                        )
                    }
                    className="flex items-center gap-3 rounded-lg bg-black px-5 py-3 text-xs font-semibold text-white cursor-pointer hover:bg-emp-noir-survol"
                >
                    Voir le détail
                    <FaArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}