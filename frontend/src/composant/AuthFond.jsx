// mise en page des vues connexion/inscription selon la maquette :
// fond beige plein #E0CCA2 ; enveloppe "verre" translucide ; carte
// interieure claire qui porte les formulaires (largeur resserree 440px
// pour un rendu plus qualitatif)
export default function AuthFond({ children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-beige p-4 md:p-8">
            {/* enveloppe verre (coefficients de la maquette) */}
            <div className="w-full max-w-[480px] rounded-[36px] bg-[#d9d9d9]/10 p-5 backdrop-blur-sm md:p-9">
                {children}
            </div>
        </div>
    );
}

// carte claire interieure : coins souples, voile blanc discret ;
// erreur = vibration laterale (micro-feedback a la validation echouee)
export function AuthCarte({ children, className = "", erreur = false }) {
    return (
        <div
            className={
                "rounded-2xl bg-white/25 p-5 backdrop-blur-md md:p-7 " + className
            }
            style={erreur ? { animation: "shake 0.4s ease-in-out both" } : undefined}
        >
            {children}
        </div>
    );
}
