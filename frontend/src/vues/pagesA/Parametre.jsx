import Interrupteur from "../../composantA/Interrupteur";
import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth";

const ONGLETS = [
  { cle: "infos", label: "Informations et heures" },
  { cle: "services", label: "Service de livraison et fidélités" },
];

const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const RESTAURANT_INITIAL = {
  nom: "ZeDuc@Space",
  adresse: "Résidence « La Terrasse »",
  contacts: "658425185 / 698254584",
  email: "zeducspace@gmail.com",
};

const HORAIRES_INITIAUX = JOURS.map((jour) => ({
  jour,
  ouvert: true,
  debut: "08:00",
  fin: "22:00",
}));

const OPTIONS_SERVICE = [
  { cle: "surPlace", label: "Commande sur place" },
  { cle: "livraison", label: "Livraison" },
  { cle: "commentaire", label: "Commentaire après livraison" },
];

const SERVICES_INITIAUX = {
  surPlace: true,
  livraison: true,
  commentaire: true,
};

const OPTIONS_PAIEMENT = [
  { cle: "mobileMoney", label: "Mobile Money" },
  { cle: "orangeMoney", label: "Orange Money" },
  { cle: "cash", label: "Cash" },
  { cle: "points", label: "Point de fidélité" },
];

const PAIEMENTS_INITIAUX = {
  mobileMoney: true,
  orangeMoney: true,
  cash: true,
  points: true,
};

const FIDELITE_INITIALE = {
  depensePourPoint: 1000,
  valeurQuinzePoints: 1000,
  validiteMois: 12,
  pointsFilleul: 1,
};

const STYLE_HEURE =
  "rounded border border-primary/60 bg-white px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-40";

function Carte({ titre, children }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="mb-3 text-lg">{titre}</p>
      {children}
    </div>
  );
}

function Champ({ label, suffixe, className = "", ...reste }) {
  return (
    <label className={`flex flex-col gap-1 text-xs ${className}`}>
      {label}
      <span className="flex items-center rounded border border-primary/60 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary">
        <input
          {...reste}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
        {suffixe && (
          <span className="ml-2 text-xs text-secondary/50">{suffixe}</span>
        )}
      </span>
    </label>
  );
}

function ListeInterrupteurs({ options, valeurs, onBasculer }) {
  return (
    <ul className="divide-y divide-grey-300 rounded-lg bg-grey px-4">
      {options.map((opt) => (
        <li
          key={opt.cle}
          className="flex items-center justify-between py-2.5 text-sm"
        >
          {opt.label}
          <Interrupteur
            actif={valeurs[opt.cle]}
            onChange={() => onBasculer(opt.cle)}
            label={opt.label}
          />
        </li>
      ))}
    </ul>
  );
}

// Génère un identifiant accepté par le backend : PA suivi de trois chiffres.
function prochainIdParametre(lignes) {
  const idsUtilises = new Set(lignes.map((p) => p.Id_parametre));

  for (let n = 1; n <= 999; n++) {
    const id = `PA${String(n).padStart(3, "0")}`;
    if (!idsUtilises.has(id)) return id;
  }

  throw new Error("Aucun identifiant de paramètre disponible.");
}

export default function Parametre() {
  const { user } = useAuth();

  const [onglet, setOnglet] = useState("infos");
  const [restaurant, setRestaurant] = useState(RESTAURANT_INITIAL);
  const [horaires, setHoraires] = useState(HORAIRES_INITIAUX);
  const [services, setServices] = useState(SERVICES_INITIAUX);
  const [paiements, setPaiements] = useState(PAIEMENTS_INITIAUX);
  const [fidelite, setFidelite] = useState(FIDELITE_INITIALE);

  const [parametres, setParametres] = useState([]);
  const [erreur, setErreur] = useState("");
  const [enregistre, setEnregistre] = useState(false);
  const [chargement, setChargement] = useState(true);

  // Charge les paramètres existants et remplit l'interface.
  useEffect(() => {
    api.get("/parametre")
      .then((resultat) => {
        const liste = Array.isArray(resultat)
          ? resultat
          : resultat.data || [];

        setParametres(liste);

        const lire = (cle) =>
          liste.find((p) => p.cle === cle)?.valeur;

        const lireBooleen = (cle, valeurParDefaut) => {
          const valeur = lire(cle);
          if (valeur == null) return valeurParDefaut;

          return ["1", "true"].includes(String(valeur).toLowerCase());
        };

        setRestaurant((ancien) => ({
          ...ancien,
          nom: lire("restaurant_nom") ?? ancien.nom,
          adresse: lire("restaurant_adresse") ?? ancien.adresse,
          contacts: lire("restaurant_contacts") ?? ancien.contacts,
          email: lire("restaurant_email") ?? ancien.email,
        }));

        const horairesEnregistres = lire("horaires_ouverture");

        if (horairesEnregistres) {
          const horairesObjet = JSON.parse(horairesEnregistres);

          setHoraires(
            JOURS.map((jour) => {
              const h = horairesObjet[jour.toLowerCase()] ?? {};

              return {
                jour,
                ouvert: h.actif ?? h.ouvert ?? true,
                debut: h.debut ?? "08:00",
                fin: h.fin ?? "22:00",
              };
            })
          );
        }

        setServices({
          surPlace: lireBooleen("service_sur_place", true),
          livraison: lireBooleen("service_livraison", true),
          commentaire: lireBooleen("service_commentaire", true),
        });

        setPaiements({
          mobileMoney: lireBooleen("paiement_mobile_money", true),
          orangeMoney: lireBooleen("paiement_orange_money", true),
          cash: lireBooleen("paiement_cash", true),
          points: lireBooleen("paiement_points", true),
        });

        setFidelite({
          depensePourPoint: Number(lire("depense_pour_1_point") ?? 1000),
          valeurQuinzePoints: Number(lire("valeur_15_points") ?? 1000),
          validiteMois: Number(lire("duree_expiration_points") ?? 12),
          pointsFilleul: Number(lire("points_commande_filleul") ?? 1),
        });
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  function changerRestaurant(e) {
    const { name, value } = e.target;
    setRestaurant({ ...restaurant, [name]: value });
  }

  function changerHoraire(jour, champ, valeur) {
    setHoraires(
      horaires.map((h) =>
        h.jour === jour ? { ...h, [champ]: valeur } : h
      )
    );
  }

  function basculerService(cle) {
    setServices({ ...services, [cle]: !services[cle] });
  }

  function basculerPaiement(cle) {
    setPaiements({ ...paiements, [cle]: !paiements[cle] });
  }

  function changerFidelite(e) {
    const { name, value } = e.target;
    setFidelite({ ...fidelite, [name]: value });
  }

  // Met à jour chaque ligne existante par sa clé, ou crée la ligne si elle manque.
  async function enregistrer(e) {
    e.preventDefault();
    setErreur("");
    setEnregistre(false);

    try {
      if (!user?.Id_utilisateur) {
        throw new Error("Utilisateur connecté introuvable. Reconnecte-toi.");
      }

      const horairesObjet = Object.fromEntries(
        horaires.map((h) => [
          h.jour.toLowerCase(),
          {
            actif: h.ouvert,
            debut: h.debut,
            fin: h.fin,
          },
        ])
      );

      const valeurs = {
        restaurant_nom: restaurant.nom,
        restaurant_adresse: restaurant.adresse,
        restaurant_contacts: restaurant.contacts,
        restaurant_email: restaurant.email,

        horaires_ouverture: JSON.stringify(horairesObjet),

        service_sur_place: services.surPlace ? "1" : "0",
        service_livraison: services.livraison ? "1" : "0",
        service_commentaire: services.commentaire ? "1" : "0",

        paiement_mobile_money: paiements.mobileMoney ? "1" : "0",
        paiement_orange_money: paiements.orangeMoney ? "1" : "0",
        paiement_cash: paiements.cash ? "1" : "0",
        paiement_points: paiements.points ? "1" : "0",

        depense_pour_1_point: String(fidelite.depensePourPoint),
        valeur_15_points: String(fidelite.valeurQuinzePoints),
        duree_expiration_points: String(fidelite.validiteMois),
        points_commande_filleul: String(fidelite.pointsFilleul),
      };

      const lignes = [...parametres];

      for (const [cle, valeur] of Object.entries(valeurs)) {
        const ligneExistante = lignes.find((p) => p.cle === cle);
        const id = ligneExistante?.Id_parametre ?? prochainIdParametre(lignes);

        const donnees = {
          Id_parametre: id,
          cle,
          valeur,
          Id_utilisateur: user.Id_utilisateur,
        };

        if (ligneExistante) {
          await api.put(
            `/parametre/${encodeURIComponent(ligneExistante.Id_parametre)}`,
            donnees
          );

          const index = lignes.findIndex(
            (p) => p.Id_parametre === ligneExistante.Id_parametre
          );

          lignes[index] = { ...ligneExistante, valeur };
        } else {
          const cree = await api.post("/parametre", donnees);
          lignes.push(cree);
        }

        // Garde l'état local à jour au fur et à mesure des réponses réussies.
        setParametres([...lignes]);
      }

      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 3000);
    } catch (e) {
      const detail = e.champs
        ? Object.values(e.champs).flat().join(" - ")
        : null;

      setErreur(detail || e.message);
    }
  }

  return (
    <section className="bg-grey px-6 py-10 text-secondary">
      <div className="mx-auto max-w-5xl">
        <p className="text-3xl">Paramètre de l'application</p>
        <p className="mt-1 text-sm">Configurez les réglages du restaurant</p>

        {erreur && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {erreur}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              type="button"
              onClick={() => setOnglet(o.cle)}
              aria-pressed={onglet === o.cle}
              className={`rounded-full border border-primary-700 px-5 py-1 text-xs ${
                onglet === o.cle
                  ? "bg-primary-700 font-medium"
                  : "bg-white hover:bg-primary/20"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <form onSubmit={enregistrer} className="mt-6 max-w-3xl space-y-4">
          {onglet === "infos" && (
            <>
              <Carte titre="Informations du restaurant">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Champ
                    label="Nom du restaurant"
                    name="nom"
                    value={restaurant.nom}
                    onChange={changerRestaurant}
                    required
                  />
                  <Champ
                    label="Adresse"
                    name="adresse"
                    value={restaurant.adresse}
                    onChange={changerRestaurant}
                    required
                  />
                  <Champ
                    label="Contacts"
                    name="contacts"
                    value={restaurant.contacts}
                    onChange={changerRestaurant}
                    required
                  />
                  <Champ
                    label="Email"
                    name="email"
                    type="email"
                    value={restaurant.email}
                    onChange={changerRestaurant}
                    required
                  />
                </div>
              </Carte>

              <Carte titre="Heures d'ouverture">
                <ul className="space-y-2 rounded-lg bg-grey p-4">
                  {horaires.map((h) => (
                    <li
                      key={h.jour}
                      className="flex flex-wrap items-center gap-3 text-xs"
                    >
                      <Interrupteur
                        actif={h.ouvert}
                        onChange={() =>
                          changerHoraire(h.jour, "ouvert", !h.ouvert)
                        }
                        label={`${h.jour} : ouvert`}
                      />
                      <span
                        className={`w-20 font-medium ${
                          h.ouvert ? "" : "text-secondary/40"
                        }`}
                      >
                        {h.jour}
                      </span>
                      <input
                        type="time"
                        value={h.debut}
                        onChange={(e) =>
                          changerHoraire(h.jour, "debut", e.target.value)
                        }
                        disabled={!h.ouvert}
                        aria-label={`${h.jour} : heure d'ouverture`}
                        className={STYLE_HEURE}
                      />
                      <span>à</span>
                      <input
                        type="time"
                        value={h.fin}
                        onChange={(e) =>
                          changerHoraire(h.jour, "fin", e.target.value)
                        }
                        disabled={!h.ouvert}
                        aria-label={`${h.jour} : heure de fermeture`}
                        className={STYLE_HEURE}
                      />
                    </li>
                  ))}
                </ul>
              </Carte>
            </>
          )}

          {onglet === "services" && (
            <>
              <Carte titre="Service de livraison">
                <ListeInterrupteurs
                  options={OPTIONS_SERVICE}
                  valeurs={services}
                  onBasculer={basculerService}
                />

                <p className="mb-3 mt-5 text-lg">Mode de paiement</p>

                <ListeInterrupteurs
                  options={OPTIONS_PAIEMENT}
                  valeurs={paiements}
                  onBasculer={basculerPaiement}
                />
              </Carte>

              <Carte titre="Fidélité et parrainage">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ
                    label="Dépense pour 1 point"
                    name="depensePourPoint"
                    type="number"
                    min="0"
                    suffixe="Fcfa"
                    value={fidelite.depensePourPoint}
                    onChange={changerFidelite}
                  />
                  <Champ
                    label="Valeur de 15 points"
                    name="valeurQuinzePoints"
                    type="number"
                    min="0"
                    suffixe="Fcfa"
                    value={fidelite.valeurQuinzePoints}
                    onChange={changerFidelite}
                  />
                  <Champ
                    label="Validité des points"
                    name="validiteMois"
                    type="number"
                    min="1"
                    suffixe="mois"
                    value={fidelite.validiteMois}
                    onChange={changerFidelite}
                  />
                  <Champ
                    label="Points par commande filleul"
                    name="pointsFilleul"
                    type="number"
                    min="0"
                    suffixe="pts"
                    value={fidelite.pointsFilleul}
                    onChange={changerFidelite}
                  />
                </div>
              </Carte>
            </>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={chargement}
              className="rounded-full bg-primary-700 px-6 py-1.5 text-sm hover:bg-primary-800 hover:text-white disabled:opacity-50"
            >
              {chargement ? "Chargement..." : "Enregistrer les modifications"}
            </button>

            {enregistre && (
              <p role="status" className="text-sm">
                Paramètres enregistrés.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}