import Login from "./vues/pages/page_connexion";
import Accueil from "./vues/pagesE/Accueil"
import Menu from "./vues/pagesE/Menu"
import Panier from "./vues/pagesE/Panier"
import Fideliter from "./vues/pagesE/Fideliter"
import LayoutE from "./composantE/Layout";
import LayoutA from "./composantA/Layout";
import TableauBord from "./vues/pagesA/TableauBord";
import Statistiques from "./vues/pagesA/Statistiques";
import LayoutG from "./composantG/Layout";
import TableauBordG from "./vues/pagesG/TableauBordG";
import CommandesG from "./vues/pagesA/Commandes";
import Livraisons from "./vues/pagesA/Livraisons";
import Employes from "./vues/pagesA/Employes";
import MenuA from "./vues/pagesA/Menu";
import Evenement from "./vues/pagesA/Evenement";
import Parametre from "./vues/pagesA/Parametre";
import ReclamationA from "./vues/pagesA/Reclamation";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Signin from './vues/pages/page_inscription';
import PageReset from "./vues/pages/page_reset";
// espace employe (pages pagesEmp, integrees depuis main — aliasees car les
// noms Commandes/Statistiques existent deja dans l'espace gestion pagesA)
import LayoutEmp from "./composantEmp/LayoutEmp";
import CommandesEmp from "./vues/pagesEmp/Commandes";
import MenuEmp from "./vues/pagesEmp/MenuEmp";
import ReclamationsEmp from "./vues/pagesEmp/Reclamations";
import StatistiquesEmp from "./vues/pagesEmp/Statistiques";
import Reclamation from "./vues/pagesE/Reclamation"
import Historique from "./vues/pagesE/Historique"
import { FournisseurAuth, useAuth } from "./services/auth";
import BanniereCookies from "./composant/BanniereCookies";

// garde de l espace personnel : une connexion est exigee avec un role du staff
// (employe, gerant, administrateur) ; l etudiant reste sur son espace public
function RouteStaff({ roles = ["employe", "gerant", "administrateur"] }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // non connecte : on renvoie a la connexion en gardant la page demandee
        return <Navigate to="/page_connexion" state={{ de: location.pathname }} replace />;
    }
    if (!roles.includes(user.role)) {
        // role insuffisant : retour a la page d accueil de SON role (cloisonnement)
        return <Navigate to={ACCUEIL_PAR_ROLE[user.role] || "/"} replace />;
    }
    return <Outlet />;
}

// page d accueil naturelle de chaque role apres connexion
const ACCUEIL_PAR_ROLE = {
    employe: "/CommandesEmp",
    gerant: "/TableauBordG",
    administrateur: "/TableauBord",
};

// garde des pages etudiantes transactionnelles : un compte du personnel qui
// essayerait d y acceder par URL est ramene a son propre espace
function RouteEtudiant() {
    const { user } = useAuth();
    if (user && ACCUEIL_PAR_ROLE[user.role]) {
        return <Navigate to={ACCUEIL_PAR_ROLE[user.role]} replace />;
    }
    return <Outlet />;
}

export default function App() {
  return (
    <FournisseurAuth>
      <BrowserRouter>
        <BanniereCookies />
        <Routes>
          {/* 1. Espace de visite (etudiant + visiteur) */}
          <Route element={<LayoutE />}>
            <Route path="/" element={<Accueil />} />
            <Route path="/Menu" element={<Menu />}/>
            {/* pages transactionnelles reservees a l etudiant (le personnel
                est renvoye vers SON espace) */}
            <Route element={<RouteEtudiant />}>
              <Route path="/Panier" element={<Panier />}/>
              <Route path="/Fideliter" element={<Fideliter />}/>
              <Route path="/Reclamation" element={<Reclamation />}/>
              <Route path="/Historique" element={<Historique />}/>
            </Route>
          </Route>

          {/* 2. Espace personnel protege (auth exigee) */}
          <Route element={<RouteStaff />}>
            {/* pages administrateur (CDC : la direction et le gerant ;
                l employe possede SES 4 pages ci-dessous uniquement) */}
              <Route element={<LayoutA/>}>
                <Route path="/TableauBord" element={<TableauBord />}/>
                <Route path="/Statistiques" element={<Statistiques />}/>
                <Route path="/Employes" element={<Employes />}/>
                <Route path="/MenuA" element={<MenuA />}/>
                <Route path="/Evenement" element={<Evenement />}/>
                <Route path="/Parametre" element={<Parametre />}/>
                <Route path="/ReclamationA" element={<ReclamationA />}/>
              </Route>

            {/** espace gerant*/}
            <Route element={<LayoutG />}>
              <Route path="/TableauBordG" element={<TableauBordG />}/>
              <Route path="/CommandesG" element={<CommandesG />}/>
              <Route path="/EmployesG" element={<Employes />}/>
              <Route path="/ReclamationG" element={<ReclamationA />}/>
              <Route path="/StatistiquesG" element={<Statistiques />}/>
            </Route>

            {/* espace employe (integre depuis main, chemins renomes pour ne pas
                entrer en collision avec /Commandes et /Statistiques du gerant) */}
            <Route element={<LayoutEmp />}>
              <Route path="/CommandesEmp" element={<CommandesEmp />}/>
              <Route path="/MenuEmp" element={<MenuEmp />}/>
              <Route path="/ReclamationsEmp" element={<ReclamationsEmp />}/>
              <Route path="/StatistiquesEmp" element={<StatistiquesEmp />}/>
            </Route>
          </Route>

          {/* 3. Authentification */}
          <Route path="/page_connexion" element={<Login />} />
          <Route path="/page_inscription" element={<Signin />} />
          <Route path="/page_reset" element={<PageReset />} />
        </Routes>
      </BrowserRouter>
    </FournisseurAuth>

  );
}
