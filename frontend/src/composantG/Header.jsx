import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import logo from "../assets/logo.png";
import { useAuth } from "../services/auth";

// EN-TETE DE L ESPACE STAFF (maquettes /page-9 a /page-13) :
// liens principaux (Tableau de bord, Commandes, Employes, Reclamations, Statistiques)
// + liens de gestion (Livraisons, Menu, Evenements, Parametres)
// + pastille utilisateur et bouton Deconnexion dore.

// la page active sert au bandeau du menu mobile
const pages = {
    "/TableauBordG": "Tableau de bord",
    "/CommandesG" : "Commandes",
    "/EmployesG": "Employés",
    "/ReclamationG": "Réclamations",
    "/StatistiquesG": "Statistiques",
};

// liens du menu : les 5 premiers correspondent a la maquette, les suivants
// sont les fonctions de gestion exigees par le cahier des charges
const liens = [
    ["/TableauBordG", "Tableau de bord", true],
    ["/CommandesG", "Commandes", true],
    ["/EmployesG", "Employés", true],
    ["/ReclamationG", "Réclamations", true],
    ["/StatistiquesG", "Statistiques", true],
];

export default function Header() {
    // le header doit connaitre l utilisateur pour la vraie deconnexion
    const { user, deconnexion } = useAuth();
    // menuOuvert indique si le menu déroulant est ouvert.
    const [menuOuvert, setMenuOuvert] = useState(false);
    // useLocation récupère les informations sur l'URL actuelle.
    const location = useLocation();

    const pageActive = pages[location.pathname] || "Mon MiamMiam";

    // style du lien : pilule doree quand la page est active (comme la maquette)
    const lienStyle = ({ isActive }) =>
        "rounded-full px-3 py-1 text-xs transition-colors duration-200 " +
        (isActive
            ? "bg-[#CFBD97] font-semibold text-white"
            : "text-secondary hover:bg-[#f5f1e6]");

    // Fonction qui ferme le menu mobile.
    const fermerMenu = () => setMenuOuvert(false);

    // initiale de l utilisateur pour la pastille ronde
    const initiale = (user?.prenom || user?.nom || "S").charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-grey-300 bg-grey">
            <nav className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-2">
                {/* logo + nom */}
                <Link to="/TableauBordG" className="flex flex-col gap-1">
                    <img src={logo} alt="logo mon miam miam" className="m-3 mb-0 w-15 rounded-[10px]" />
                    <p className="px-1 text-sm text-secondary">Mon MiamMiam</p>
                </Link>

                {/* liens principaux (bureau) */}
                <ul className="hidden items-center gap-1 lg:flex">
                    {liens.map(([chemin, libelle]) => (
                        <li key={chemin}>
                            <NavLink to={chemin} end={chemin === "/TableauBordG"} className={lienStyle}>
                                {libelle}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* pastille utilisateur + deconnexion (bureau) */}
                <div className="hidden items-center gap-2 lg:flex">
                    {user && (
                        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f1e6] text-xs font-bold text-[#b8862d]">
                                {initiale}
                            </span>
                            <span className="text-xs">
                                {user.prenom || user.nom || user.email}
                                <span className="ml-1 text-gray-500">· {user.role}</span>
                            </span>
                        </span>
                    )}
                    <button
                        type="button" 
                        onClick={async () => {
                            // vraie déconnexion : revoke du token côté API puis nettoyage local
                            await deconnexion();
                            window.location.href = "/";
                        }}
                        className="cursor-pointer rounded-[10px] bg-primary px-5 py-2 text-secondary hover:bg-primary-700"
                    >
                        Deconnexion
                    </button>
                </div>

                {/* bandeau mobile : page active + burger */}
                <span className="text-sm font-semibold text-primary lg:hidden">{pageActive}</span>
                <button
                    type="button"
                    onClick={() => setMenuOuvert(!menuOuvert)}
                    className="p-2 text-secondary lg:hidden"
                    aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={menuOuvert}
                    aria-controls="menu-mobile"
                >
                    {menuOuvert ? <FaXmark size={24} /> : <FaBars size={24} />}
                </button>
            </nav>

            {/* MENU MOBILE */}
            {menuOuvert && (
                <div
                    id="menu-mobile"
                    className="absolute left-0 top-full z-50 w-full border-b border-grey-300 bg-grey shadow-lg lg:hidden"
                >
                    <ul className="flex flex-col gap-3 p-5">
                        {liens.map(([chemin, libelle]) => (
                            <li key={chemin}>
                                <NavLink
                                    to={chemin}
                                    end={chemin === "/TableauBordG"}
                                    className={lienStyle}
                                    onClick={fermerMenu}
                                >
                                    {libelle}
                                </NavLink>
                            </li>
                        ))}

                        {/* pastille utilisateur + deconnexion (mobile) */}
                        <li className="border-t border-grey-300 pt-4">
                            {user && (
                                <p className="mb-2 text-xs text-gray-600">
                                    Connecté : {user.prenom || user.nom || user.email} · {user.role}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={async () => {
                                    // vraie déconnexion puis retour a l accueil
                                    await deconnexion();
                                    window.location.href = "/";
                                }}
                                className="block w-full rounded-[10px] bg-primary py-2 text-center text-secondary hover:bg-primary-700"
                            >
                                Deconnexion
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}
