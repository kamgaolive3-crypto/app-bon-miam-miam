// Interrupteur (on/off) réutilisable.
// Props : actif (true/false), onChange (fonction appelée au clic), label (texte pour les lecteurs d'écran)
export default function Interrupteur({ actif, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        actif ? "bg-primary" : "bg-grey-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          actif ? "left-5.5" : "left-0.5"
        }`}
      />
    </button>
  );
}
