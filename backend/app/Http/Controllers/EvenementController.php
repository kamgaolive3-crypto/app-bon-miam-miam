<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Etudiant;
use App\Models\Evenement;
use App\Models\MvtPoint;
use App\Models\Participation_evenement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvenementController extends Controller
{
    /**
     * GET /api/evenement  ou  /api/evenement?statut=en_cours|a_venir|passes
     * Liste des événements, filtrable par statut.
     */
    public function index(Request $request)
    {
        $query = Evenement::query();

        match ($request->query('statut')) {
            'en_cours' => $query->where('debut_evenement', '<=', now())
                                ->where('fin_evenement', '>=', now()),
            'a_venir'  => $query->where('debut_evenement', '>', now()),
            'passes'   => $query->where('fin_evenement', '<', now()),
            default    => null,
        };

        return $query->orderBy('debut_evenement')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // cloisonnement (CDC) : les promotions/jeux sont publies par le personnel
        // (les offres se presentent sous forme d affiches) ; l etudiant, lui, y participe.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Publication reservee au personnel.'], 403);
        }
        $data = $request->validate([
            'Id_evenement'    => ['required', 'regex:/^[A-Z]{3}[0-9]{4}$/', 'unique:evenement,Id_evenement'],
            'debut_evenement' => 'required|date',
            'fin_evenement'   => 'required|date|after_or_equal:debut_evenement',
            'type_evenement'  => 'required|in:promotion,evenement,mini_jeu',
            'points_evenement'=> 'integer|min:0',
            'taux_reduction'  => 'required_if:type_evenement,promotion|nullable|integer|between:1,100',
            'description_evenement' => 'required|string|max:1000',
            // affiche (image) envoyee par upload : chemin "/img/evenements/xxx.jpg"
            'affiche_evenement'     => 'nullable|string',
            // fourni par le client, sinon attribue au profil administrateur connecte
            'Id_utilisateur'  => 'nullable|exists:administrateur,Id_utilisateur',
        ]);
        if (empty($data['Id_utilisateur'])) {
            // journal : priorite au profil administrateur connecte. Un gerant/employe
            // peut tout de meme publier un evenement : l'ecriture est alors attribuee
            // au compte direction global (seule valeur conforme a la FK vers administrateur).
            $profilAdmin = $request->user()?->administrateur;
            $data['Id_utilisateur'] = $profilAdmin?->Id_utilisateur
                ?? Administrateur::first()?->Id_utilisateur;
            if (! $data['Id_utilisateur']) {
                return response()->json(['message' => 'Aucun administrateur existant pour attribuer la creation.'], 403);
            }
        }
        $event = Evenement::create($data);
        return response()->json($event, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Evenement::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // cloisonnement (CDC) : l etudiant ne modifie pas les evenements.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Publication reservee au personnel.'], 403);
        }
        $event = Evenement::findOrFail($id);
        $data = $request->validate([
            // unique ignore l'enregistrement courant ($id) : sans cela, toute
            // mise à jour échouerait car l'Id_evenement existe déjà en base.
            'Id_evenement'    => ['required', 'regex:/^[A-Z]{3}[0-9]{4}$/', 'unique:evenement,Id_evenement,'.$id.',Id_evenement'],
            'debut_evenement' => 'required|date',
            'fin_evenement'   => 'required|date|after_or_equal:debut_evenement',
            'type_evenement'  => 'required|in:promotion,evenement,mini_jeu',
            'points_evenement'=> 'integer|min:0',
            'taux_reduction'  => 'required_if:type_evenement,promotion|nullable|integer|between:1,100',
            'description_evenement' => 'required|string|max:1000',
            // affiche (image) : nullable => peut rester sans affiche, ou recevoir
            // le chemin rendu par POST /api/upload_image
            'affiche_evenement'     => 'nullable|string',
            'Id_utilisateur'  => 'nullable|exists:administrateur,Id_utilisateur',
        ]);
        // sans Id_utilisateur fourni, on conserve le createur existant (journal intact)
        if (! array_key_exists('Id_utilisateur', $data) || $data['Id_utilisateur'] === null) {
            unset($data['Id_utilisateur']);
        }
        $event->update($data);
        return response()->json($event, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        // cloisonnement (CDC) : l etudiant ne supprime pas d evenement.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Publication reservee au personnel.'], 403);
        }
        Evenement::findOrFail($id)->delete();
        return response () ->json(['message'=> 'evenement supprimer']);
    }

    // POST /api/evenements/EVT0001/participer
    // $id = l'identifiant de l'événement, pris dans l'URL
    public function participer(Request $request, $id){
        // 1. Cherche l'événement dans la base (erreur 404 automatique s'il n'existe pas)
        $evenement = Evenement::findOrFail($id);

        // 2. Refuse si l'événement n'est pas en cours.
        //    lt = "less than" : maintenant est AVANT le début
        //    gt = "greater than" : maintenant est APRÈS la fin
        //    422 = requête comprise, mais refusée par une règle métier
        if (now()->lt($evenement->debut_evenement) || now()->gt($evenement->fin_evenement)) {
            return response()->json(['message' => "L'événement n'est pas en cours"], 422);
        }

        // 3. Vérifie les données envoyées par le frontend :
        //    l'étudiant est obligatoire et doit exister dans la table etudiant.
        //    $data contient seulement les champs validés.
        $utilisateur = $request->user();

        if (! $utilisateur || $utilisateur->role !== 'etudiant' || ! $utilisateur->etudiant) {
            return response()->json(['message' => 'Réservé aux étudiants connectés.'], 403);
        }

        // 4. Cherche s'il existe déjà une participation de cet étudiant à cet événement.
        //    exists() renvoie true ou false, sans charger les données.
            $dejaInscrit = Participation_evenement::where('Id_utilisateur', $utilisateur->Id_utilisateur)
                                                  ->where('Id_evenement', $id)
                                                  ->exists();

        // 5. Si oui, on refuse : sinon l'étudiant gagnerait les points plusieurs fois
        if ($dejaInscrit) {
            return response()->json(['message' => 'Vous avez déjà participé'], 422);
        }

        // 6. Transaction : les deux écritures ci-dessous réussissent ensemble, ou sont annulées ensemble.
        //    "use ($evenement, $utilisateur)" donne à la fonction interne accès à ces variables.
        $participation = DB::transaction(function () use ($evenement, $utilisateur) {
            // Journal de fidelite : trace mvt_points de type jeu (US-015/023)
            $idMvt = null;
            if ($evenement->points_evenement > 0) {
                $idMvt = $this->genererIdMvt();
                MvtPoint::create([
                    'Id_mvt'         => $idMvt,
                    'nbres_points'   => $evenement->points_evenement,
                    'type_mvt'       => 'jeu',
                    'Id_utilisateur' => $utilisateur->Id_utilisateur,
                ]);
            }

        // 6a. Enregistre la participation dans la table participation_evenement.
        //     points_gagnes copie les points de l'événement (valeur figée au moment de la participation).
        //     date_participation est remplie par MySQL (date du jour).
            $participation = Participation_evenement::create([
                'Id_utilisateur' => $utilisateur->Id_utilisateur,
                'Id_evenement'   => $evenement->Id_evenement,
                'points_gagnes'  => $evenement->points_evenement,
                'Id_mvt'         => $idMvt,
            ]);

        // 6b. Ajoute les points au solde de l'étudiant.
        //     increment() fait "solde_point = solde_point + X" directement en base,
        //     ce qui est plus sûr que de lire la valeur puis la réécrire.
             Etudiant::where('Id_utilisateur', $utilisateur->Id_utilisateur)
                     ->increment('solde_point', $evenement->points_evenement);

        // 6c. Renvoie la participation pour qu'elle sorte de la transaction
            return $participation;
        });

    // 7. Réponse au frontend : la participation créée, avec le code 201 ("créé")
    return response()->json($participation, 201);
    }
    /**
     * Générateur MV001 (domaine ID_MVT) sans collision
     * (cohérent avec CommandeController / FideliteController).
     */
    private function genererIdMvt(): string
    {
        do {
            $id = 'MV' . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        } while (MvtPoint::where('Id_mvt', $id)->exists());

        return $id;
    }

    // GET /api/promotions/actives
    public function promotionsActives(){
        return Evenement::promotionsActives()->get();
    }

    // GET /api/evenements/actifs — tout ce qui tourne en ce moment
    // (promotions en cours, mini-jeux, soirees) pour la page d'accueil
    public function evenementsActifs(){
        return Evenement::actifs()->orderBy('debut_evenement')->get();
    }

    // GET /api/evenement/EVT0001/participations
    // affiche tous les participants d'un evenement precis
    public function participations($id){
        // Cherche l'événement (404 s'il n'existe pas), puis renvoie la liste de ses participations.
        // ->participations (sans parenthèses) appelle la relation hasMany définie dans le modèle Evenement.
        return Evenement::findOrFail($id)->participations;
    }
} 

