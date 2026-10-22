// Page de connexion (design d'origine : composants Glass + avatar, layout conservé)
// Seule l'intérieure de handleSubmit a été branchée à POST /api/auth/connexion :
// appel réel, message d'erreur éventuel et redirection selon le rôle du compte.
import avatar from "../../assets/profil.png"
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/auth";
import GlassCard from "../../composant/GlassCard";
import GlassPage from "../../composant/GlassPage";

const regleMotDePasse = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erreur, setErreur] = useState("");
    const navigate = useNavigate();
    const { connexion } = useAuth();

    //fonction appellée quand on envoie le formulaire
    const handleSubmit = async (e) => {
        e.preventDefault(); // empeche le rechargement de la page
        if (!regleMotDePasse.test(password)) {
            setErreur("Le mot de passe doit contenir 8 caractères, une majuscule et un chiffre");
            return;
        }
        setErreur("");
        try {
            const reponse = await connexion(email, password);
            // redirection selon le role : chacun arrive directement dans SON espace
            if (reponse.role === "employe") {
                navigate("/CommandesEmp");
            } else if (reponse.role === "gerant") {
                navigate("/TableauBordG");
            } else if(reponse.role === "administrateur"){
                navigate("/TableauBord");
            }else {
                navigate("/");
            }
        } catch (err) {
            const detail = err.champs ? Object.values(err.champs).flat().join(" - ") : null;
            setErreur(detail || err.message || "Connexion échouée");
        }
    }

    return (
        <GlassPage>
            <GlassCard largeurMax="722px" hauteurMax="1000px">
                <h1 className="text-3xl font-bold text-center">
                    Bienvenue sur Mon Miam Miam
                </h1>
                <div className="flex justify-center mt-0 p-0">
                    <img src={avatar} alt="Avatar" className="w-30 h-30" />
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                    {erreur && (
                        <p className="rounded-md bg-red-100 px-3 py-2 text-center text-sm text-red-700">
                            {erreur}
                        </p>
                    )}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-secondary">
                            Email:
                        </label>
                        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md bg-white/50 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-or" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-secondary">
                            Mot de passe
                        </label>
                        <input id="password" type="password" required autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md bg-white/50 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-or" />
                        <Link to="/page_reset" className="self-end text-primary cursor-pointer hover:text-primary-700">
                            Mot de passe oublié?
                        </Link>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button type="submit"
                            className="bg-primary text-secondary mx-auto w-full max-w-50 min-h-8 rounded-[10px] cursor-pointer hover:bg-primary-700">
                            Se connecter
                        </button>
                        <p className="text-secondary"> Vous n'avez pas de compte ? {" "}
                            <Link to="/page_inscription" className="text-primary cursor-pointer hover:text-primary-700">
                                Creer un nouveau compte
                            </Link>
                        </p>
                    </div>
                </form>
            </GlassCard>
        </GlassPage>
    )
}
