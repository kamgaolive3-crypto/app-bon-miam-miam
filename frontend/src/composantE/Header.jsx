import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo.png";
import { useAuth } from "../services/auth";

// lien de nav : Inter fin ; au survol la couleur monte en or avec un
// soulignement discret ; la page active conserve sa pill beige (maquette)
export function LienNav({ to, fin, children }) {
    return (
        <NavLink
            to={to}
            end={fin}
            className={({ isActive }) =>
                isActive
                    ? "rounded-full bg-or-clair/80 px-5 py-2 font-sans text-[15px] text-or-deep transition-colors duration-150 hover:bg-or-clair"
                    : "rounded-full px-5 py-2 font-sans text-[15px] text-black transition-all duration-150 hover:-translate-y-px hover:text-or-deep hover:underline hover:underline-offset-4 hover:decoration-or-clair"
            }
        >
            {children}
        </NavLink>
    );
}

export default function Header() {
    // le header affiche Deconnexion (nom) ou connexion selon l utilisateur
    const { user, deconnexion } = useAuth();
    const [menuOuvert, setMenuOuvert] = useState(false);
    const location = useLocation();

    // nom de la page courante : affiche au centre sur mobile (maquette)
    const pages = {
        "/": "Accueil",
        "/Menu": "Menu",
        "/Panier": "Panier",
        "/Fideliter": "Fidélité",
        "/Reclamation": "Réclamation",
        "/Historique": "Historiques",
    };
    const pageActive = pages[location.pathname] || "Mon Miam Miam";

    const fermerMenu = () => setMenuOuvert(false);

    return (
        <header className="relative z-40 w-full border-b border-black/[0.04] bg-band">
            <nav className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-2 px-4 py-2.5 md:px-8">
                {/* logo image + nom Instrument Serif (maquette) */}
                <Link to="/" className="flex items-center gap-2.5">
                    <img
                        src={logo}
                        alt="logo Mon Miam Miam"
                        className="h-10 w-10 rounded-xl object-cover md:h-11 md:w-11"
                    />
                    <span className="hidden whitespace-nowrap font-instrument text-[15px] text-black sm:block">
                        Mon Miam Miam
                    </span>
                </Link>

                {/* titre de page centrale — visible sur mobile uniquement */}
                <span className="absolute left-1/2 -translate-x-1/2 font-inria text-[15px] text-black md:hidden">
                    {pageActive}
                </span>

                {/* navigation desktop : pills Inter (maquette) */}
                <div className="hidden items-center gap-0.5 md:flex">
                    <LienNav to="/" fin>Accueil</LienNav>
                    <LienNav to="/Menu">Menu</LienNav>
                    <LienNav to="/Panier">Panier</LienNav>
                    <LienNav to="/Fideliter">Fidélité</LienNav>
                </div>

                {/* droite : connexion / deconnexion + nom */}
                {user ? (
                    <div className="hidden items-center gap-4 md:flex">
                        <button
                            type="button"
                            onClick={async () => {
                                await deconnexion();
                                window.location.href = "/";
                            }}
                            className="cursor-pointer font-sans text-[14px] text-encre transition-colors duration-150 hover:text-or-deep"
                        >
                            Deconnexion
                        </button>
                        <span className="font-inria text-[14px] font-bold text-or-deep">
                            {user.prenom} {user.nom}
                        </span>
                    </div>
                ) : (
                    <Link
                        to="/page_connexion"
                        className="hidden rounded-full bg-or-clair px-5 py-2 font-sans text-[14px] text-or-deep transition-all duration-150 hover:bg-or hover:shadow-soft md:inline-flex"
                    >
                        connexion
                    </Link>
                )}

                {/* burger mobile — 3 lignes simples (maquette) */}
                <button
                    type="button"
                    onClick={() => setMenuOuvert(!menuOuvert)}
                    className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-[5px] md:hidden"
                    aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={menuOuvert}
                    aria-controls="menu-mobile"
                >
                    {menuOuvert ? (
                        <span className="text-xl leading-none text-black">×</span>
                    ) : (
                        <>
                            <span className="h-[2px] w-5 bg-black" />
                            <span className="h-[2px] w-5 bg-black" />
                        </>
                    )}
                </button>
            </nav>

            {/* tiroir mobile : glisse depuis le haut (animation) */}
            {menuOuvert && (
                <div
                    id="menu-mobile"
                    className="absolute top-full left-0 z-50 w-full origin-top border-b border-black/[0.06] bg-band/95 backdrop-blur shadow-hover md:hidden"
                    style={{ animation: "fade-up 0.18s ease-out both" }}
                >
                    <ul className="flex flex-col p-3">
                        <li onClick={fermerMenu}><LienNav to="/" fin>Accueil</LienNav></li>
                        <li onClick={fermerMenu}><LienNav to="/Menu">Menu</LienNav></li>
                        <li onClick={fermerMenu}><LienNav to="/Panier">Panier</LienNav></li>
                        <li onClick={fermerMenu}><LienNav to="/Fideliter">Fidélité</LienNav></li>
                        <li className="mt-2 border-t border-black/[0.06] pt-2">
                            {user ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await deconnexion();
                                        window.location.href = "/";
                                    }}
                                    className="block w-full cursor-pointer rounded-xl bg-or-clair py-2.5 text-center font-sans text-sm text-black"
                                >
                                    Deconnexion ({user.prenom} {user.nom})
                                </button>
                            ) : (
                                <Link
                                    to="/page_connexion"
                                    onClick={fermerMenu}
                                    className="block w-full rounded-xl bg-or-clair py-2.5 text-center font-sans text-sm text-or-deep"
                                >
                                    connexion
                                </Link>
                            )}
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}
