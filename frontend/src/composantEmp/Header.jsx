/**
 * Header.jsx : barre de navigation de l'ESPACE EMPLOYÉ.
 *
 * Utilisé par LayoutEmp.jsx, donc affiché en haut des 4 pages :
 * Commandes, Menu, Réclamations, Statistiques.
 *
 * Deux affichages :
 * - Ordinateur (à partir de 768 px, préfixe md:) : logo, 4 liens, cloche, nom, déconnexion.
 * - Mobile : logo, nom de la page active, cloche et bouton burger.
 *   Le burger ouvre un menu déroulant avec les liens, le nom et la déconnexion.
 *
 * À savoir :
 * - « Déconnexion » et le nom « Meni Dom Reine » sont provisoires (backend à venir).
 * - Le point rouge de la cloche est toujours affiché (pas de vraie gestion des notifications).
 */

// NavLink : lien react-router qui sait s'il correspond à la page active (isActive).
// useLocation : donne l'adresse actuelle (NOUVEAU : sert à afficher le nom de la page sur mobile).
import { NavLink, useLocation } from "react-router-dom";
// useState : mémorise si le menu mobile est ouvert ou fermé (NOUVEAU).
import { useState } from "react";

import { useAuth } from "../services/auth";
// Icônes : panier, couverts, bulle, graphique, cloche, burger (3 traits) et croix (NOUVEAU).
import { FaCartShopping, FaUtensils, FaComment, FaChartColumn, FaBell, FaBars, FaXmark } from "react-icons/fa6";
// Le logo se trouve dans src/assets (un niveau au-dessus de ce dossier).
import logo from "../assets/logo.png";

// ===== DONNÉES =====
// Liste des liens écrite une seule fois, réutilisée par la version ordinateur ET mobile.
// Pour ajouter une page : ajouter une ligne ici + la route dans App.jsx.
// `chemin` doit être identique au path déclaré dans App.jsx.
const liens = [
    { chemin: "/CommandesEmp", nom: "Commandes", Icone: FaCartShopping },
    { chemin: "/MenuEmp", nom: "Menu", Icone: FaUtensils }, // /MenuEmp et non /Menu : /Menu est déjà pris par l'espace étudiant
    { chemin: "/ReclamationsEmp", nom: "Réclamations", Icone: FaComment },
    { chemin: "/StatistiquesEmp", nom: "Statistiques", Icone: FaChartColumn },
];

export default function Header() {
    // NOUVEAU : true = menu mobile ouvert, false = fermé.
    const [menuOuvert, setMenuOuvert] = useState(false);

    // NOUVEAU : adresse actuelle (ex : "/CommandesEmp").
    const location = useLocation();

    // le header doit connaitre l utilisateur pour la vraie deconnexion
        const { user, deconnexion } = useAuth();

    // initiale de l utilisateur pour la pastille ronde
    const initiale = (user?.prenom || user?.nom || "S").charAt(0).toUpperCase();

    // NOUVEAU : nom de la page active, affiché au centre sur mobile.
    // find cherche le lien dont le chemin correspond à l'adresse ; "Espace Employé" si rien trouvé.
    const pageActive =
        liens.find((lien) => lien.chemin === location.pathname)?.nom || "Espace Employé";

    // NOUVEAU : ferme le menu (appelée quand on clique sur un lien mobile).
    const fermerMenu = () => setMenuOuvert(false);

    // Style d'un lien : doré et gras si la page est active, noir sinon.
    // NavLink fournit `isActive` automatiquement selon l'adresse du navigateur.
    const lienStyle = ({ isActive }) =>
        `flex items-center gap-2 text-sm transition-colors duration-200 ${
            isActive
                ? "text-primary font-semibold"
                : "text-secondary hover:text-primary-700"
        }`;

    return (
        // relative : repère pour placer le menu mobile juste sous la barre.
        <header className="relative w-full bg-grey border-b border-grey-300">
            <nav className="flex items-center justify-between px-4 py-1 md:px-6">

                {/* ===== GAUCHE : logo + nom du projet (mobile et ordinateur) ===== */}
                <div className="flex flex-col items-center pt-4">
                    <img src={logo} alt="logo Mon Miam Miam" className="w-10 rounded-md" />
                    <p className="text-[10px] text-secondary">Mon Miam Miam</p>
                </div>

                {/* ===== MOBILE SEULEMENT : nom de la page active =====
                    md:hidden : caché à partir de la taille ordinateur. */}
                <span className="text-sm font-semibold text-primary-700 md:hidden">
                    {pageActive}
                </span>

                {/* ===== CENTRE (ordinateur seulement) : les 4 liens avec icônes =====
                    hidden md:flex : caché sur mobile, affiché sur ordinateur. */}
                <ul className="hidden items-center gap-12 md:flex">
                    {liens.map(({ chemin, nom, Icone }) => (
                        <li key={chemin}>
                            <NavLink to={chemin} className={lienStyle}>
                                <Icone size={14} />
                                {nom}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* ===== DROITE (ordinateur seulement) : cloche + nom + déconnexion ===== */}
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

                {/* ===== DROITE (mobile seulement) : cloche + bouton burger ===== */}
                <div className="flex items-center gap-3 md:hidden">
                    <div className="relative">
                        <FaBell size={20} />
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                    </div>

                    <button
                        type="button"
                        // Inverse la valeur : ouvert devient fermé, et inversement.
                        onClick={() => setMenuOuvert(!menuOuvert)}
                        className="p-2 text-secondary cursor-pointer"
                        // Texte lu par les lecteurs d'écran (le bouton n'a pas de texte visible).
                        aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
                    >
                        {/* Croix si le menu est ouvert, burger sinon */}
                        {menuOuvert ? <FaXmark size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </nav>

            {/* ===== MENU DÉROULANT MOBILE =====
                Affiché seulement si menuOuvert vaut true.
                absolute top-full : posé juste sous la barre.
                z-50 : passe au-dessus du contenu de la page. */}
            {menuOuvert && (
                <div className="absolute left-0 top-full z-50 w-full border-b border-grey-300 bg-grey shadow-lg lg:hidden">
                    <ul className="flex flex-col gap-4 p-5">
                        {liens.map(({ chemin, nom, Icone }) => (
                            <li key={chemin}>
                                {/* onClick : ferme le menu après le clic sur un lien */}
                                <NavLink to={chemin} className={lienStyle} onClick={fermerMenu}>
                                    <Icone size={14} />
                                    {nom}
                                </NavLink>
                            </li>
                        ))}

                        {/* Nom de l'employé + déconnexion, séparés par un trait */}
                        <li className="flex flex-col gap-3 border-t border-grey-300 pt-4">
                            {/* TODO : remplacer par le nom de l'employé connecté */}
                            <span className="text-sm">{user.prenom || user.nom || user.email}</span>
                            {/* TODO : brancher la déconnexion */}
                            <button
                                type="button"
                                className="w-full rounded-full bg-primary py-2 text-sm text-secondary cursor-pointer hover:bg-primary-700"
                            >
                                Déconnexion
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}