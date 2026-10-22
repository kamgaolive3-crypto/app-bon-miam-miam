// Les deux flèches de la pagination.
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";

// Props reçues de la page :
// page : numéro de la page affichée (0 = première)
// nombrePages : nombre total de pages
// setPage : fonction pour changer de page
export default function Pagination({ page, nombrePages, setPage }) {
    // Style commun aux deux boutons, écrit une seule fois.
    const styleBouton =
    "flex h-9 w-9 items-center justify-center rounded-md border border-grey-300 bg-emp-carre cursor-pointer hover:bg-emp-commande-rond"
    return (
        <div className="flex items-center justify-between border-t border-emp-type px-4 py-4">
            {/* Flèche du haut : page précédente. Bloquée sur la première page. */}
            <button
                type="button"
                aria-label="Page précédente"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className={styleBouton}
            >
                <FaChevronUp size={12} />
            </button>

            {/* Flèche du bas : page suivante. Bloquée sur la dernière page. */}
            <button
                type="button"
                aria-label="Page suivante"
                onClick={() => setPage(page + 1)}
                disabled={page >= nombrePages - 1}
                className={styleBouton}
            >
                <FaChevronDown size={12} />
            </button>
        </div>
    );
}