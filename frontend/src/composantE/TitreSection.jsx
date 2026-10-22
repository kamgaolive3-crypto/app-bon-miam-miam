// Composition de titre de section (identite editoriale du site) :
// petite majuscule or + grand titre Instrument Serif (comme le logo)
// + filet : courte barre d'or, trait fin, note optionnelle a droite
export default function TitreSection({ eyebrow, titre, note }) {
    return (
        <div>
            {eyebrow && <p className="miam-eyebrow">{eyebrow}</p>}
            <h2 className="font-instrument text-[26px] leading-tight text-black md:text-[34px]">
                {titre}
            </h2>
            <div className="mt-2 flex items-center gap-3">
                <span className="h-[3px] w-9 shrink-0 rounded-full bg-or" />
                <span className="h-px flex-1 bg-[#EAE3D6]" />
                {note && (
                    <span className="shrink-0 font-inria text-[13px] text-encre">
                        {note}
                    </span>
                )}
            </div>
        </div>
    );
}
