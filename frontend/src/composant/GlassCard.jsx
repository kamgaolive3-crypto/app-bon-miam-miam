// children est tout ce qu'on place entre <glassCard> et </glassCard>
export default function GlassCard({ 
    children, 
    largeurMax ="722px",
    hauteurMax ="1000px",
    className = "", 
}) {
  return (
    <div
      className={`
        w-full
        p-5 sm:p-8 
        rounded-[25px] sm:rounded-[40px]
        bg-white/30 
        backdrop-blur-xl 
        border border-white/40 
        shadow-lg
        flex flex-col gap-3 ${className}`}
        // style : applique tes valeurs personnalisées
        style={{ maxWidth: largeurMax, maxHeight: hauteurMax }}
    >
      {children}
    </div>
  );
}