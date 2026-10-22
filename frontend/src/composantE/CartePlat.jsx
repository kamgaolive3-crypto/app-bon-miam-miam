// Carte de plat (grille "Menu du jours" de l accueil) — style maquette
// raffine : coins souples, ombre ambiante, photo au ratio 4/3 qui zoome
// legerement au survol, apparition en cascade (delai passe par le parent),
// puce flottante "Du jour" quand l article est marque Menu_du_jour = 1
export default function CartePlat({ plat, onAjouter, ajoute, delai = 0 }) {
    return (
        <article
            className="miam-carte group flex flex-col overflow-hidden p-3"
            style={{ animation: "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both", animationDelay: delai + "ms" }}
        >
            <div className="relative overflow-hidden rounded-xl">
                <img
                    src={plat.image}
                    alt={plat.nom}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
                {/* puce "Du jour" (liaison avec la case Menu_du_jour en base) */}
                {plat.menuDuJour && (
                    <span className="miam-badge-jour absolute left-2.5 top-2.5">
                        Du jour
                    </span>
                )}
            </div>

            <div className="flex flex-col items-center px-1 pb-1 pt-3.5">
                <p className="font-inria text-[15px] text-black">{plat.nom}</p>
                <p className="mt-0.5 font-inria text-[17px] font-bold tabular-nums tracking-tight text-or-deep">
                    {plat.prix}Fcfa
                </p>

                <span className="miam-filet mt-3" />

                <button
                    type="button"
                    onClick={() => onAjouter(plat)}
                    className="miam-cta mt-3 w-full max-w-[260px] active:scale-[0.97]"
                >
                    {ajoute ? "Ajouté ✓" : "Ajouter au panier"}
                </button>
            </div>
        </article>
    )
}
