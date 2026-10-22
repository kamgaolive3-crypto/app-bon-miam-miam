// Page Fidelite reproduisant la maquette (raffinee) :
// titres Inria Serif ; bande creme #FFFDF8 (reduction + mes points + barre
// de progression animee) ; cartes blanches : points par commande / parrainage ;
// grande carte top 10 avec survol de ligne
import { useState, useEffect } from "react"
import { api } from "../../services/api"
import { useAuth } from "../../services/auth"

//---------------- REGLES DU PROGRAMME ----------------
//On les écrit une seule fois ici : elles servent au texte ET aux calculs
const FCFA_PAR_POINT = 1000      // 1 000 F dépensés = 1 point
const POINTS_PAR_REDUCTION = 15  // 15 points = 1 réduction
const VALEUR_REDUCTION = 1000    // une réduction vaut 1 000 F

//écrit un nombre avec des espaces : 1850 devient "1 850 F"
const fcfa = (n) => n.toLocaleString("fr-FR") + " F"

export default function Fidelite() {
    //auth pour utiliser mes points (se passe dans le panier)
    const { user } = useAuth()
    //message d erreur (pas connecté, serveur en panne...)
    const [erreur, setErreur] = useState("")

    //---------------- DONNEES VENANT DU BACKEND ----------------
    //le solde de points : GET /api/fidelite/solde
    const [solde, setSolde] = useState(0)
    //true quand le solde a ete charge (pour animer la barre une seule fois)
    const [soldeCharge, setSoldeCharge] = useState(false)
    //les points gagnés par commande : GET /api/fidelite/historique
    const [commandes, setCommandes] = useState([])
    //mon code de parrainage : GET /api/parrainage/code
    const [codeParrain, setCodeParrain] = useState("")
    //mes filleuls : GET /api/parrainage/filleuls
    const [filleuls, setFilleuls] = useState([])
    //top 10 : GET /api/stats/top-clients?periode=jour|semaine|mois (CDC : filtres)
    const [classement, setClassement] = useState([])
    //periode choisie pour le top 10 (mois par defaut, comme l API)
    const [periode, setPeriode] = useState("mois")

    //au premier affichage : les 5 chargements
    useEffect(() => {
        if (!user) {
            setErreur("Connectez-vous pour voir votre programme de fidélité.")
            return
        }
        api.get("/fidelite/solde")
            .then((s) => {
                setSolde(s.solde_point ?? s.points ?? 0)
                setSoldeCharge(true)
            })
            .catch((e) => setErreur(e.message))

        // l historique ne contient pas le montant : on le recupere sur les commandes
        // liees (m.Id_commande) pour remplir la colonne « Montant » de la maquette
        Promise.all([api.get("/fidelite/historique"), api.get("/commande")])
            .then(([liste, cmds]) => {
                const filCmds = Array.isArray(cmds) ? cmds : (cmds.data || []);
                const montants = new Map(filCmds.map((c) => [c.Id_commande, c.montant_total]));
                setCommandes((Array.isArray(liste) ? liste : liste.data || []).map((m, i) => ({
                    id: m.Id_mvt ?? i,
                    date: (m.date_mvt || "").slice(0, 10),
                    montant: m.montant ?? montants.get(m.Id_commande) ?? null,
                    points: Math.abs(m.nbres_points ?? m.points ?? 0),
                })))
            })
            .catch(() => setCommandes([]))

        api.get("/parrainage/code")
            .then((r) => setCodeParrain(r.code_parrainage ?? r.code ?? ""))
            .catch(() => setCodeParrain(""))

        api.get("/parrainage/filleuls")
            .then((liste) => {
                setFilleuls((Array.isArray(liste) ? liste : liste.data || []).map((f, i) => ({
                    id: f.Id_utilisateur ?? i,
                    nom: f.nom ?? f.prenom ?? "Filleul",
                    statut: f.recompense_attribuee ? "inscrite" : "en attente",
                    points: f.recompense_attribuee ? 3 : 0,
                })))
            })
            .catch(() => setFilleuls([]))

        api.get("/stats/top-clients?periode=" + periode)
            .then((rep) => {
                // l API renvoie { periode, classement: [{rang, etudiant, nb_commandes, montant}] }
                const liste = Array.isArray(rep) ? rep : (rep.classement || rep.data || [])
                setClassement(liste.map((c, i) => ({
                    id: c.Id_utilisateur ?? i,
                    nom: (c.etudiant?.nom ?? c.nom ?? "Client") + (c.etudiant?.prenom ? " " + c.etudiant.prenom : ""),
                    commandes: c.nb_commandes ?? 0,
                    montant: c.montant ?? 0,
                    moi: c.Id_utilisateur === user.Id_utilisateur,
                })))
            })
            .catch(() => setClassement([]))
    }, [periode])

    //---------------- ETATS DE LA PAGE ----------------
    //true = on affiche toutes les lignes, false = seulement les premières
    const [commandesToutes, setCommandesToutes] = useState(false)
    const [filleulsTous, setFilleulsTous] = useState(false)
    //true pendant 2 secondes après un clic sur "Copier"
    const [copie, setCopie] = useState(false)
    //toast affiché apres "Utiliser mes points"
    const [message, setMessage] = useState("")

    //---------------- CALCULS ----------------
    //le reste vers la prochaine réduction
    const pointsVersReduction = solde % POINTS_PAR_REDUCTION
    //largeur de la barre de progression
    const pourcentage = (pointsVersReduction / POINTS_PAR_REDUCTION) * 100
    //la réduction disponible : 15 points valent 1000 F (meme règle que le panier)
    const reduction = Math.floor(solde / POINTS_PAR_REDUCTION) * VALEUR_REDUCTION
    //slice(0, 3) garde seulement les 3 premiers éléments de la liste
    const commandesAffichees = commandesToutes ? commandes : commandes.slice(0, 3)
    const filleulsAffiches = filleulsTous ? filleuls : filleuls.slice(0, 2)

    //---------------- ACTIONS ----------------
    //fonction appellée quand on clique sur "Copier"
    const copierCode = () => {
        navigator.clipboard.writeText(codeParrain) // copie le code
        setCopie(true)
        setTimeout(() => setCopie(false), 2000) // "Copie !" disparait après 2 secondes
    }

    //fonction appellée quand on clique sur "Utiliser mes points"
    const utiliserPoints = () => {
        if (reduction <= 0) {
            setMessage("Vous n'avez pas encore de réduction disponible.")
        } else {
            setMessage("Dépensez vos points au moment de confirmer votre commande (page Panier).")
        }
        setTimeout(() => setMessage(""), 3000)
    }

    return (
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-8 md:px-8">
            {/* toast "Utiliser mes points" */}
            {message && (
                <p
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-5 py-2.5 font-sans text-[13px] text-white shadow-hover"
                    style={{ animation: "toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
                >
                    {message}
                </p>
            )}

            {/* ---------- TITRE ---------- */}
            <h1 className="miam-titre">Programme de fidélité</h1>
            <p className="mt-1 font-inria text-[13px] text-encre">
                {fcfa(FCFA_PAR_POINT)} dépensés = 1 point &nbsp;·&nbsp; {POINTS_PAR_REDUCTION} points = {fcfa(VALEUR_REDUCTION)} de réduction
            </p>

            {/* pas connecté : message + lien connexion */}
            {erreur && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
                    {erreur}{" "}
                    {!user && (
                        <a href="/page_connexion" className="font-semibold underline">
                            Se connecter
                        </a>
                    )}
                </p>
            )}

            {/* ---------- BANDE REDUCTION + MES POINTS (creme) ---------- */}
            <section
                className="mt-5 flex flex-col gap-5 rounded-2xl bg-creme-d p-5 md:flex-row md:items-center md:p-7"
                style={{ animation: "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
            >
                {/* gauche : la reduction */}
                <div className="flex-1">
                    <p className="miam-eyebrow">Réduction disponible</p>
                    <p className="mt-1.5 font-inria text-[26px] font-bold tracking-tight text-black md:text-[32px]">
                        {fcfa(reduction)}
                    </p>
                    <button
                        type="button"
                        onClick={utiliserPoints}
                        className="miam-pill h-9 mt-3 text-[13.5px]"
                    >
                        Utiliser mes points
                    </button>
                </div>

                {/* filet vertical sur desktop (maquette) */}
                <span className="hidden h-24 w-px bg-bmie md:block" />

                {/* droite : mes points + barre de progression animee */}
                <div className="flex-1">
                    <p className="miam-eyebrow">Mes points</p>
                    <p className="mt-1.5 font-inria text-[26px] font-bold tracking-tight text-black md:text-[32px]">
                        {solde} pts
                    </p>
                    {/* piste #F5F0E9 + remplissage or qui se remplit au chargement */}
                    <div className="mt-2.5 h-2 w-full max-w-[420px] overflow-hidden rounded-full bg-piste">
                        <div
                            className="h-full rounded-full bg-or transition-[width] duration-700 ease-out"
                            style={{ width: (soldeCharge ? pourcentage : 0) + "%" }}
                        />
                    </div>
                    <p className="mt-1.5 font-sans text-[12.5px] font-medium text-encre">
                        {pointsVersReduction}/{POINTS_PAR_REDUCTION} points vers la prochaine réduction
                    </p>
                </div>
            </section>

            {/* ---------- POINTS PAR COMMANDE + PARRAINAGE ---------- */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {/* Points gagnés par commande : carte blanche */}
                <section className="miam-carte p-4 md:p-5">
                    <h2 className="font-inria text-[16px] font-bold text-black">
                        Points gagnés par commande
                    </h2>
                    <table className="mt-2.5 w-full font-inria text-[13.5px] text-black">
                        <thead>
                            <tr className="text-left text-gris-pa">
                                <th className="py-1 pr-2 font-medium">Date · Montant</th>
                                <th className="text-right font-medium">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* .map() fabrique une ligne pour chaque mouvement de points */}
                            {commandesAffichees.map((c) => (
                                <tr key={c.id} className="border-t border-creme-d transition-colors hover:bg-creme-d/60">
                                    <td className="py-2">
                                        {c.date ? c.date.slice(8, 10) + "/" + c.date.slice(5, 7) : "—"} · {c.montant === null ? "—" : fcfa(c.montant)}
                                    </td>
                                    <td className="text-right font-bold text-or-deep">+{c.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {commandes.length === 0 && (
                        <p className="mt-2.5 font-sans text-[12.5px] text-encre">
                            Aucun mouvement de points pour le moment.
                        </p>
                    )}
                    {/* le bouton existe seulement s'il y a plus de 3 commandes */}
                    {commandes.length > 3 && (
                        <div className="mt-2.5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setCommandesToutes(!commandesToutes)}
                                className="miam-pill h-7 px-3.5 text-[12px]"
                            >
                                {commandesToutes ? "Voir moins" : "Voir plus"}
                            </button>
                        </div>
                    )}
                </section>

                {/* Parrainage : carte blanche */}
                <section className="miam-carte p-4 md:p-5">
                    <h2 className="font-inria text-[16px] font-bold text-black">
                        Parrainage
                    </h2>

                    {/* le code de parrainage dans sa chip beige */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-full bg-bmie px-4 py-1.5">
                        <span className="font-inria text-[13.5px] text-black">
                            Votre code :&nbsp;&nbsp;<b className="tracking-wide">{codeParrain || "non disponible"}</b>
                        </span>
                        <button
                            type="button"
                            onClick={copierCode}
                            className="miam-pill h-7 px-3.5 text-[12px]"
                        >
                            {copie ? "Copié ✓" : "Copier"}
                        </button>
                    </div>

                    <table className="mt-2.5 w-full font-inria text-[13.5px] text-black">
                        <thead>
                            <tr className="text-left text-gris-pa">
                                <th className="py-1 pr-2 font-medium">Filleul · Statut</th>
                                <th className="text-right font-medium">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filleulsAffiches.map((f) => (
                                <tr key={f.id} className="border-t border-creme-d transition-colors hover:bg-creme-d/60">
                                    <td className="py-2">{f.nom} · {f.statut}</td>
                                    <td className="text-right font-bold text-or-deep">
                                        {f.points > 0 ? "+" + f.points : "0"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filleuls.length === 0 && (
                        <p className="mt-2.5 font-sans text-[12.5px] text-encre">
                            Aucun filleul pour le moment.
                        </p>
                    )}
                    {filleuls.length > 2 && (
                        <div className="mt-2.5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setFilleulsTous(!filleulsTous)}
                                className="miam-pill h-7 px-3.5 text-[12px]"
                            >
                                {filleulsTous ? "Voir moins" : "Voir plus"}
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* ---------- TOP 10 (filtres jour/semaine/mois, cf cahier de charge) ---------- */}
            <section className="miam-carte mt-5 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-inria text-[16px] font-bold text-black">
                        Top 10 des meilleurs clients
                    </h2>
                    {/* filtres de periode : le clic recharge le classement */}
                    <div className="flex gap-1.5">
                        {[["jour", "Jour"], ["semaine", "Semaine"], ["mois", "Mois"]].map(([valeur, label]) => (
                            <button
                                key={valeur}
                                type="button"
                                onClick={() => setPeriode(valeur)}
                                className={
                                    "miam-pill h-7 px-3 text-[12px] " +
                                    (periode === valeur ? "" : "opacity-55")
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* ordinateur : 2 colonnes de 5 ; téléphone : 1 colonne */}
                <ol className="mt-1 grid gap-x-10 md:grid-flow-col md:grid-rows-5">
                    {/* i = la position dans la liste (0, 1, 2...), donc le rang est i + 1 */}
                    {classement.map((c, i) => (
                        <li
                            key={c.id}
                            className={
                                "flex justify-between border-b border-creme-d px-1 py-2 font-inria text-[14.5px] transition-colors hover:bg-creme-d/60 md:text-[15.5px] " +
                                (c.moi ? "font-bold text-or-deep" : "text-black")
                            }
                        >
                            <span title={fcfa(c.montant)}>
                                {i + 1} {c.moi ? "Vous" : c.nom}
                                <span className="font-sans text-[11.5px] text-encre">
                                    {" "}· {c.commandes} commande{c.commandes > 1 ? "s" : ""}
                                </span>
                            </span>
                            <span className="font-sans text-[11.5px] text-encre">{fcfa(c.montant)}</span>
                        </li>
                    ))}
                </ol>
                {classement.length === 0 && (
                    <p className="mt-1.5 font-sans text-[12.5px] text-encre">
                        Classement indisponible pour le moment.
                    </p>
                )}
            </section>
        </div>
    )
}
