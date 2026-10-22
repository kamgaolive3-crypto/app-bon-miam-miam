// Composant qui fournit le fond de la page ; children = la carte qu'on y place
import fondConnect from "../assets/fond_connect.png";
export default function GlassPage({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `url(${fondConnect})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Affiche ce qu'on met dans la page (la carte) */}
      {children}
    </div>
  );
}