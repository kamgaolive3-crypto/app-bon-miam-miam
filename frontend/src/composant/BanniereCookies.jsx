import { useState } from "react";
import { api } from "../services/api";

// la banniere RGPD reproduit la maquette /cookies :
// assombrissement plein ecran + carte centree ; texte Inter fin ;
// boutons "Tout accepter" / "Personnaliser" / "Tout refuser"
// un seul consentement par visiteur, memorise dans le navigateur
// apparition animee : l ecran s assombrit, la carte monte et se depose
const CLE = "cookie-consentement";

export default function BanniereCookies() {
  // si une réponse existe déjà, on n'affiche rien
  const [cache, setCache] = useState(() => !!localStorage.getItem(CLE));

  if (cache) return null;

  // choisie = accepte | refuse | personnalise (mêmes valeurs que la CHECK SQL)
  const enregistrer = async (choix) => {
    localStorage.setItem(CLE, choix);
    setCache(true);
    try {
      // le visiteur non connecté fonctionne aussi : l API accepte Id_utilisateur null
      await api.post("/cookies", { choix_cookies: choix, version_politique: "v1" });
    } catch {
      // le consentement local reste enregistré meme si l API est en panne
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      style={{ animation: "fade-black 0.25s ease-out both" }}
    >
      {/* carte centrale (maquette : #F4F4F4, coins tres ronds) */}
      <div
        className="w-full max-w-[560px] rounded-[26px] bg-ligne p-6 shadow-hover md:p-8"
        style={{ animation: "toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.1s" }}
      >
        <p className="font-inria text-[17px] font-bold text-black md:text-[19px]">
          Cookies
        </p>
        <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-encre">
          Ce site utilise des cookies afin d&apos;offrir une expérience optimale à ses
          visiteurs. Veuillez accepter les cookies pour une expérience optimale.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 md:justify-end">
          {/* boutons maquette : pill beige + pills blanches */}
          <button
            type="button"
            onClick={() => enregistrer("accepte")}
            className="miam-cta"
          >
            Tout accepter
          </button>
          <button
            type="button"
            onClick={() => enregistrer("personnalise")}
            className="inline-flex h-10 cursor-pointer select-none items-center justify-center rounded-[12px] bg-white px-5 font-sans text-sm text-black shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-soft active:scale-[0.97]"
          >
            Personnaliser
          </button>
          <button
            type="button"
            onClick={() => enregistrer("refuse")}
            className="inline-flex h-10 cursor-pointer select-none items-center justify-center rounded-[12px] bg-white px-5 font-sans text-sm text-encre shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-soft active:scale-[0.97]"
          >
            Tout refuser
          </button>
        </div>
      </div>
    </div>
  );
}
