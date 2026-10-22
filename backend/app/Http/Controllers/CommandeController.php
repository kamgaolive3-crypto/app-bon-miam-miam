<?php

namespace App\Http\Controllers;

use App\Models\ArticleMenu;
use App\Models\Commande;
use App\Models\Evenement;
use App\Models\MvtPoint;
use App\Models\Parametre;
use App\Services\CalculCommande;
use App\Services\CommandeService;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeController extends Controller
{
    /**
     * Duree de validite des points gagnes (US-016).
     * Priorite a la valeur configuree par l'administrateur dans la table
     * parametre (cle "duree_expiration_points", eg. "12") ;
     * repli = 12 mois si le parametre est absent ou invalide.
     */
    private function dureeExpirationPoints(): int
    {
        $valeur = Parametre::whereIn('cle', ['duree_expiration_points', 'duree_validite_points'])
            ->value('valeur');
        $mois = (int) preg_replace('/[^0-9]/', '', (string) $valeur);

        return $mois > 0 ? $mois : 12;
    }

    public function __construct(private CommandeService $commandes)
    {
    }

    /**
     * afficher les commandes (historique)
     * GET /api/commande : l'étudiant voit les siennes ; l'employé,
     * le gérant et l'administrateur voient tout (filtre ?statut=).
     */
    public function index(Request $request)
    {
        $query = Commande::with(['articles', 'etudiant.utilisateur', 'historiqueStatuts', 'paiements', 'livraison'])
            ->orderByDesc('date_commande');

        if ($request->user()->role === 'etudiant') {
            $query->where('Id_utilisateur', $request->user()->Id_utilisateur);
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut_commande', $statut);
        }

        return $query->get();
    }

    /**
     * afficher une commande précise (détail articles + historique)
     * GET /api/commande/{id}
     */
    public function show(Request $request, string $id)
    {
        $commande = Commande::with(['articles', 'historiqueStatuts', 'paiements', 'livraison'])
            ->findOrFail($id);

        if ($request->user()->role === 'etudiant'
            && $commande->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return $commande;
    }

    /**
     * créer une commande à partir du panier du client
     * POST /api/commande { items: [{Id_article, quantite}], mode_service,
     *                       heure_recup, Id_restaurant, points_utilises, adresse_livraison }
     *
     * Tout est recalculé côté serveur (on ne fait jamais confiance au client) :
     * sous-total, promotion, réduction par points, frais de livraison, total.
     * Une seule transaction : si une étape échoue, rien n'est enregistré.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'items'                 => 'required|array|min:1',
            'items.*.Id_article'    => 'required|exists:article_menu,Id_article',
            'items.*.quantite'      => 'required|integer|min:1',
            'Id_restaurant'         => 'required|exists:restaurant,Id_restaurant',
            'mode_service'          => 'required|in:sur_place,livraison',
            'heure_recup'           => 'nullable|required_if:mode_service,sur_place|date_format:H:i',
            'points_utilises'       => 'nullable|integer|min:0',
            'commentaire'           => 'nullable|string',
            'adresse_livraison'     => 'nullable|string|max:255',
        ]);

        $utilisateur = $request->user();
        $etudiant = $utilisateur->etudiant;

        if ($utilisateur->role !== 'etudiant' || ! $etudiant) {
            return response()->json(['message' => 'Seul un étudiant peut commander.'], 403);
        }

        [$commande, $calcul] = DB::transaction(function () use ($data, $etudiant) {
            // 1. Regrouper les lignes d'un même article (2 lignes "Poulet DG" = 1 ligne de quantité totale)
            $lignes = [];
            foreach ($data['items'] as $item) {
                $lignes[$item['Id_article']] = ($lignes[$item['Id_article']] ?? 0) + (int) $item['quantite'];
            }

            // 2. Prix actuels des articles (source de vérité = le serveur) et sous-total
            $articles = ArticleMenu::whereIn('Id_article', array_keys($lignes))->get()->keyBy('Id_article');

            $sous_total = 0;
            foreach ($lignes as $idArticle => $quantite) {
                $article = $articles[$idArticle];

                if (! $article->disponibilite_article) {
                    abort(422, "L'article {$article->nom_article} est indisponible.");
                }

                // revalidation serveur : un article d'un autre restaurant est refusé
                if ($article->Id_restaurant !== $data['Id_restaurant']) {
                    abort(422, "L'article {$article->nom_article} n'appartient pas à ce restaurant.");
                }

                $sous_total += $article->prix_article * $quantite;
            }

            // 3. Calcul du montant : promotion en cours (la meilleure), points, frais de livraison
            $taux_promotion = (int) Evenement::promotionsActives()->max('taux_reduction');

            try {
                $calcul = CalculCommande::calculer(
                    $sous_total,
                    $taux_promotion,
                    (int) ($data['points_utilises'] ?? 0),
                    (int) $etudiant->solde_point,
                    $data['mode_service'] === 'livraison'
                );
            } catch (DomainException $e) {
                abort(422, $e->getMessage());
            }

            // 4. Création de la commande
            $commande = Commande::create([
                'Id_commande'     => $this->genererIdCommande(),
                'montant_total'   => $calcul->total,
                'mode_service'    => $data['mode_service'],
                'statut_commande' => 'en_attente',
                'points_utilises' => $calcul->pointsUtilises,
                'reduction_points' => $calcul->reductionPoints,
                'commentaire'     => $data['commentaire'] ?? null,
                'heure_recup'     => $data['heure_recup'] ?? null,
                'Id_utilisateur'  => $etudiant->Id_utilisateur,
                'Id_restaurant'   => $data['Id_restaurant'],
            ]);

            // 5. Lignes de commande (prix unitaire figé, association Contenir)
            foreach ($lignes as $idArticle => $quantite) {
                $commande->articles()->attach($idArticle, [
                    'quantite'      => $quantite,
                    'prix_unitaire' => $articles[$idArticle]->prix_article,
                ]);
            }

            // 6. Livraison : créée en même temps que la commande
            if ($data['mode_service'] === 'livraison') {
                $this->commandes->creerLivraison($commande, $data['adresse_livraison'] ?? null, $calcul->fraisLivraison);
            }

            // 7. Débit des points utilisés + mouvement de fidélité
            if ($calcul->pointsUtilises > 0) {
                $etudiant->decrement('solde_point', $calcul->pointsUtilises);
                MvtPoint::create([
                    'Id_mvt'         => $this->genererIdMvt(),
                    'nbres_points'   => -$calcul->pointsUtilises,   // négatif = sortie
                    'type_mvt'       => 'utilisation',
                    'Id_utilisateur' => $etudiant->Id_utilisateur,
                    'Id_commande'    => $commande->Id_commande,
                ]);
            }

            // 8. Crédit des points gagnés (expirent dans 12 mois, US-016)
            if ($calcul->pointsGagnes > 0) {
                $etudiant->increment('solde_point', $calcul->pointsGagnes);
                MvtPoint::create([
                    'Id_mvt'          => $this->genererIdMvt(),
                    'nbres_points'    => $calcul->pointsGagnes,
                    'type_mvt'        => 'gain',
                    'date_expiration' => now()->addMonths($this->dureeExpirationPoints()),
                    'Id_utilisateur'  => $etudiant->Id_utilisateur,
                    'Id_commande'     => $commande->Id_commande,
                ]);
            }

            // 9. Historique : statut initial
            $this->commandes->enregistrerHistorique($commande->Id_commande, $etudiant->Id_utilisateur, 'en_attente');

            // 10. US-019 : si 1ère commande du filleul, crédite son parrain
            ParrainageController::attribuerBonusPremiereCommande($etudiant);

            return [$commande, $calcul];
        });

        // Montants utiles au front, renvoyés dans la réponse (non enregistrés dans la table commande)
        $commande->load('articles', 'historiqueStatuts', 'livraison');
        $commande->setAttribute('reduction_promotion', $calcul->promotion);
        $commande->setAttribute('frais_livraison', $calcul->fraisLivraison);

        return response()->json($commande, 201);
    }

    /**
     * L'employé valide une commande en attente (US-026)
     * POST /api/commande/{id}/valider
     */
    public function valider(Request $request, string $id)
    {
        $utilisateur = $request->user();
        if ($utilisateur->role === 'etudiant') {
            return response()->json(['message' => 'Seul le personnel peut valider.'], 403);
        }

        $commande = Commande::findOrFail($id);
        if ($commande->statut_commande !== 'en_attente') {
            return response()->json(['message' => 'Cette commande a déjà été traitée.'], 422);
        }

        DB::transaction(function () use ($commande, $utilisateur) {
            // Id_valideur ne peut contenir qu un EMPLOYE (cle etrangere vers employe) :
            // un gerant/admin valide sans remplir cette colonne, l historique garde qui a valide.
            $maj = [
                'statut_commande' => 'validee',
                'date_validation' => now(),
            ];
            if ($utilisateur->role === 'employe') {
                $maj['Id_valideur'] = $utilisateur->Id_utilisateur;
            }
            $commande->update($maj);
            $this->commandes->enregistrerHistorique($commande->Id_commande, $utilisateur->Id_utilisateur, 'validee');
        });

        return $commande->load('historiqueStatuts');
    }

    /**
     * Changement de statut (préparation, prête, en_livraison, servie) (US-026)
     * POST /api/commande/{id}/statut { statut_commande: "..." }
     */
    public function changerStatut(Request $request, string $id)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Seul le personnel peut changer le statut.'], 403);
        }

        $data = $request->validate([
            'statut_commande' => 'required|in:validee,en_preparation,prete,en_livraison,servie,annulee',
        ]);

        $transitions = [
            'en_attente'     => ['validee', 'annulee'],
            'validee'        => ['en_preparation', 'annulee'],
            'en_preparation' => ['prete'],
            'prete'          => ['en_livraison', 'servie'],
            'en_livraison'   => ['servie'],
        ];

        $commande = Commande::findOrFail($id);
        $cible = $data['statut_commande'];

        if (! in_array($cible, $transitions[$commande->statut_commande] ?? [])) {
            return response()->json([
                'message' => "Transition impossible : {$commande->statut_commande} -> {$cible}.",
            ], 422);
        }

        DB::transaction(function () use ($commande, $cible, $request) {
            $this->commandes->changerStatut($commande, $cible, $request->user()->Id_utilisateur);

            // Annulation : restitution des points utilisés
            if ($cible === 'annulee' && $commande->points_utilises > 0) {
                $this->restituerPoints($commande);
            }
                        if ($cible === 'annulee') {
                $this->retirerPointsGagnes($commande);
            }
            
        });

        return $commande->load('historiqueStatuts');
    }

    /**
     * L'étudiant laisse un commentaire après service (US-010)
     * POST /api/commande/{id}/commentaire { commentaire: "..." }
     */
    public function commentaire(Request $request, string $id)
    {
        $data = $request->validate(['commentaire' => 'required|string|max:1000']);

        $commande = Commande::findOrFail($id);
        if ($commande->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($commande->statut_commande !== 'servie') {
            return response()->json(['message' => 'Commentaire possible seulement après service.'], 422);
        }

        $commande->update($data);

        return $commande;
    }

    /**
     * L'étudiant annule sa commande tant qu'elle est en attente
     * DELETE /api/commande/{id}
     */
    public function destroy(Request $request, string $id)
    {
        $commande = Commande::findOrFail($id);
        if ($commande->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($commande->statut_commande !== 'en_attente') {
            return response()->json(['message' => 'Impossible : la commande est déjà traitée.'], 422);
        }

               DB::transaction(function () use ($commande, $request) {
            if ($commande->points_utilises > 0) {
                $this->restituerPoints($commande);
            }
            $this->retirerPointsGagnes($commande);
            $this->commandes->changerStatut($commande, 'annulee', $request->user()->Id_utilisateur);
        });

        return response()->json(['message' => 'Commande annulée.']);
    }

    /** Rend à l'étudiant les points utilisés pour une commande annulée. */
    private function restituerPoints(Commande $commande): void
    {
        $etudiant = $commande->etudiant;
        $etudiant->increment('solde_point', $commande->points_utilises);
        MvtPoint::create([
            'Id_mvt'         => $this->genererIdMvt(),
            'nbres_points'   => $commande->points_utilises,
            'type_mvt'       => 'gain',
            'Id_utilisateur' => $etudiant->Id_utilisateur,
            'Id_commande'    => $commande->Id_commande,
        ]);
    }
        /** Commande annulée : retire à l'étudiant les points que cette commande lui avait fait gagner. */
    private function retirerPointsGagnes(Commande $commande): void
    {
        $gagnes = (int) MvtPoint::where('Id_commande', $commande->Id_commande)
            ->where('type_mvt', 'gain')
            ->whereNotNull('date_expiration')
            ->sum('nbres_points');

        $etudiant = $commande->etudiant;
        $retrait = min($gagnes, (int) $etudiant->solde_point);

        if ($retrait <= 0) {
            return;
        }

        $etudiant->decrement('solde_point', $retrait);
        MvtPoint::create([
            'Id_mvt'         => $this->genererIdMvt(),
            'nbres_points'   => -$retrait,
            'type_mvt'       => 'utilisation',
            'Id_utilisateur' => $etudiant->Id_utilisateur,
            'Id_commande'    => $commande->Id_commande,
        ]);
    }
    
    /**
     * Générateur #COM0001 (domaine ID_COM, dictionnaire §10) sans collision.
     */
    private function genererIdCommande(): string
    {
        do {
            $id = '#COM' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (Commande::where('Id_commande', $id)->exists());

        return $id;
    }

    /**
     * Générateur MV001 (domaine ID_MVT) sans collision.
     */
    private function genererIdMvt(): string
    {
        do {
            $id = 'MV' . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        } while (MvtPoint::where('Id_mvt', $id)->exists());

        return $id;
    }
}
