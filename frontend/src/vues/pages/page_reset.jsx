//page de réinitialisation du mot de passe (US-003)
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import GlassCard from "../../composant/GlassCard";
import GlassPage from "../../composant/GlassPage";

//meme règle que l inscription : 8 caractères, une majuscule, un chiffre
const regleMotDePasse = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

export default function PageReset() {
    //etape 1 : demande de réinitialisation (email) / etape 2 : code + nouveau mot de passe
    const [etape, setEtape] = useState(1)
    const [email, setEmail] = useState("")
    const [token, setToken] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const [erreur, setErreur] = useState("")

    // POST /api/auth/mot-de-passe-oublie
    const demander = async (e) => {
        e.preventDefault()
        setMessage(""); setErreur("")
        try {
            const reponse = await api.post("/auth/mot-de-passe-oublie", { email: email.trim() })
            // en local (MAIL_MAILER=log) le code est aussi renvoyé pour tester ;
            // en production il ne circule QUE par email
            if (reponse.token) setToken(reponse.token)
            setMessage(reponse.message || "Demande enregistrée : consultez votre boîte mail (en local, regardez storage/logs/laravel.log).")
            setEtape(2)
        } catch (err) {
            setErreur(err.message)
        }
    }

    // POST /api/auth/mot-de-passe-reinitialiser
    const reinitialiser = async (e) => {
        e.preventDefault()
        setMessage(""); setErreur("")
        if (!regleMotDePasse.test(password)) {
            setErreur("Le mot de passe doit contenir 8 caractères, une majuscule et un chiffre.")
            return
        }
        try {
            await api.post("/auth/mot-de-passe-reinitialiser", { token: token.trim(), mot_de_passe: password })
            setMessage("Mot de passe réinitialisé ! Vous pouvez vous connecter.")
        } catch (err) {
            setErreur(err.message)
        }
    }

    return (
        <GlassPage>
            <GlassCard largeurMax="722px" hauteurMax="1000px">
                <h1 className="text-2xl font-bold text-center">Mot de passe oublié ?</h1>

                {message && <p className="mt-3 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p>}
                {erreur && <p className="mt-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{erreur}</p>}

                {/* ---------- ETAPE 1 : l email ---------- */}
                {etape === 1 && (
                    <form onSubmit={demander} className="mt-4 flex flex-col gap-3">
                        <label htmlFor="email" className="text-secondary">Votre email :</label>
                        <input id="email" type="email" required value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md bg-white/50 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-or" />
                        <button type="submit"
                            className="bg-primary text-secondary mx-auto w-full max-w-50 min-h-8 rounded-[10px] cursor-pointer hover:bg-primary-700">
                            Recevoir un code
                        </button>
                    </form>
                )}

                {/* ---------- ETAPE 2 : le code + le nouveau mot de passe ---------- */}
                {etape === 2 && (
                    <form onSubmit={reinitialiser} className="mt-4 flex flex-col gap-3">
                        <label htmlFor="token" className="text-secondary">Code reçu (valide 60 minutes) :</label>
                        <input id="token" type="text" required value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full rounded-md bg-white/50 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-or" />
                        <label htmlFor="nouveaumdp" className="text-secondary">Nouveau mot de passe :</label>
                        <input id="nouveaumdp" type="password" required value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md bg-white/50 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-or" />
                        <button type="submit"
                            className="bg-primary text-secondary mx-auto w-full max-w-50 min-h-8 rounded-[10px] cursor-pointer hover:bg-primary-700">
                            Réinitialiser
                        </button>
                    </form>
                )}

                <p className="mt-4 text-center text-secondary">
                    <Link to="/page_connexion" className="text-primary hover:text-primary-700">Retour à la connexion</Link>
                </p>
            </GlassCard>
        </GlassPage>
    )
}
