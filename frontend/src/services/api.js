// client API unique de l application : toutes les pages passent par ici
// en dev : le proxy vite transmet /api a Laravel (http://127.0.0.1:8000)
// en production : definir VITE_API_URL (ex : https://monmiammiam.vercel.app/api)
const BASE = import.meta.env.VITE_API_URL || "/api";

const CLE_TOKEN = "miam_token";
const CLE_USER = "miam_user";

export function getToken() {
  return localStorage.getItem(CLE_TOKEN);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(CLE_USER));
  } catch {
    return null;
  }
}

export function setAuth(token, utilisateur) {
  localStorage.setItem(CLE_TOKEN, token);
  localStorage.setItem(CLE_USER, JSON.stringify(utilisateur));
}

export function clearAuth() {
  localStorage.removeItem(CLE_TOKEN);
  localStorage.removeItem(CLE_USER);
}

// fonction interne : appel HTTP + token automatique + erreur lisible
async function appel(methode, url, corps) {
  const options = { method: methode, headers: { Accept: "application/json" } };

  const token = getToken();
  if (token) options.headers.Authorization = "Bearer " + token;

  if (corps !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(corps);
  }

  const reponse = await fetch(BASE + url, options);
  const texte = await reponse.text();

  let donnees = null;
  if (texte) {
    try {
      donnees = JSON.parse(texte);
    } catch {
      donnees = texte;
    }
  }

  if (!reponse.ok) {
    const erreur = new Error(donnees?.message || "Erreur serveur (code " + reponse.status + ")");
    erreur.status = reponse.status;
    // erreurs de validation Laravel : { email: ["..."], mot_de_passe: ["..."] }
    erreur.champs = donnees?.errors || null;
    throw erreur;
  }

  return donnees;
}

export const api = {
  get: (url) => appel("GET", url),
  post: (url, corps) => appel("POST", url, corps),
  put: (url, corps) => appel("PUT", url, corps),
  del: (url) => appel("DELETE", url),
  // envoi multipart (upload de fichiers) : le corps est un FormData,
  // SANS Content-Type manuel (le navigateur doit y mettre la boundary)
  envoiFichier: async (url, formData) => {
    const options = { method: "POST", headers: { Accept: "application/json" }, body: formData };
    const token = getToken();
    if (token) options.headers.Authorization = "Bearer " + token;

    const reponse = await fetch(BASE + url, options);
    const texte = await reponse.text();
    let donnees = null;
    if (texte) {
      try { donnees = JSON.parse(texte); } catch { donnees = texte; }
    }
    if (!reponse.ok) {
      const erreur = new Error(donnees?.message || "Erreur serveur (code " + reponse.status + ")");
      erreur.status = reponse.status;
      erreur.champs = donnees?.errors || null;
      throw erreur;
    }
    return donnees;
  },
};
