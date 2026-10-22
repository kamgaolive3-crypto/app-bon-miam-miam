import { Link } from "react-router-dom";
import logoFooter from "../../public/maq/maq_logo_footer.png";

// footer maquette : bande #F3F3F3 ; logo + "Mon Miam Miam" Instrument Serif ;
// colonne contacts + colonne liens, Inter fin #535353 (rafine : textes 13px)
export default function Footer() {
    return (
        <footer className="w-full bg-band">
            <div className="mx-auto flex w-full max-w-[1320px] flex-col items-start justify-between gap-8 px-6 py-8 sm:flex-row sm:items-center md:px-10">
                {/* bloc logo */}
                <div className="flex flex-col gap-1.5">
                    <img
                        src={logoFooter}
                        alt="logo Mon Miam Miam"
                        className="w-36 self-start rounded-xl object-cover md:w-40"
                    />
                    <span className="font-instrument text-base text-black">
                        Mon Miam Miam
                    </span>
                </div>

                {/* colonne contacts */}
                <div className="flex flex-col gap-1.5 font-sans text-[13px] text-encre">
                    <a href="tel:699956789" className="transition-colors hover:text-or-deep">Contacts : 699956789 / 600089887</a>
                    <Link to="/Reclamation" className="transition-colors hover:text-or-deep">Aide</Link>
                    <a href="#" className="transition-colors hover:text-or-deep">FAQs?</a>
                </div>

                {/* colonne liens legaux */}
                <div className="flex flex-col gap-1.5 font-sans text-[13px] text-encre">
                    <a href="#" className="transition-colors hover:text-or-deep">Mentions legales</a>
                    <a href="#" className="transition-colors hover:text-or-deep">Responsabilite sociale</a>
                    <a href="#" className="transition-colors hover:text-or-deep">A propos de nous</a>
                </div>
            </div>
        </footer>
    );
}
