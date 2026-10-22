import { createContext, useContext, useState } from "react";
import { api, setAuth, clearAuth, getUser, getToken } from "./api";

// contexte partagé : le token et l utilisateur connecté sont globaux
const ContexteAuth = createContext(null);

export function FournisseurAuth({ children }) {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());

  // POST /api/auth/connexion : { email, mot_de_passe } -> { token, utilisateur, role }
  const connexion = async (email, mot_de_passe) => {
    const reponse = await api.post("/auth/connexion", { email, mot_de_passe });
    const infos = { ...reponse.utilisateur, role: reponse.role };
    setAuth(reponse.token, infos);
    setToken(reponse.token);
    setUser(infos);
    return reponse;
  };

  // POST /api/auth/inscription : compte etudiant
  // { nom, prenom, email, telephone, mot_de_passe, mot_de_passe_confirmation, localisation, code_parrainage }
  const inscription = async (donnees) => {
    const reponse = await api.post("/auth/inscription", donnees);
    const infos = { ...reponse.utilisateur, role: reponse.role || "etudiant" };
    setAuth(reponse.token, infos);
    setToken(reponse.token);
    setUser(infos);
    return reponse;
  };

  // POST /api/auth/deconnexion : revoke le token courant
  const deconnexion = async () => {
    try {
      await api.post("/auth/deconnexion");
    } catch {
      // meme si l API est injoignable, on nettoie le navigateur
    }
    clearAuth();
    setToken(null);
    setUser(null);
  };

  // POST /api/auth/mot-de-passe-oublie : { email }
  const motDePasseOublie = (email) => api.post("/auth/mot-de-passe-oublie", { email });

  // POST /api/auth/mot-de-passe-reinitialiser : { token, mot_de_passe }
  const reinitialiserMotDePasse = (token, mot_de_passe) =>
    api.post("/auth/mot-de-passe-reinitialiser", { token, mot_de_passe });

  const estRole = (r) => user?.role === r;
  // tout le personnel : employe, gerant, administrateur
  const estStaff = !!user && user.role !== "etudiant";

  return (
    <ContexteAuth.Provider
      value={{ user, token, connexion, inscription, deconnexion, motDePasseOublie, reinitialiserMotDePasse, estRole, estStaff }}
    >
      {children}
    </ContexteAuth.Provider>
  );
}

export function useAuth() {
  return useContext(ContexteAuth);
}
