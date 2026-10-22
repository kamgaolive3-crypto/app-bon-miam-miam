import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header"
import Footer from "./Footer"

// layout de l espace etudiant : fond general creme #F8F7F6 (maquette) ;
// le contenu refade a chaque changement de page (micro-transition legere)
export default function Layout() {
    const location = useLocation();

    return(
        <div className="flex min-h-screen flex-col bg-creme">
            <Header />

            <main key={location.pathname} className="flex-1" style={{ animation: "fade-up 0.28s ease-out both" }}>
                <Outlet />
            </main>

            <Footer />
        </div>
    )

}
