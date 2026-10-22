<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Livraison;
use App\Services\CalculCommande;
use App\Services\CommandeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LivraisonController extends Controller
{
    public function __construct(private CommandeService $commandes)
    {
    }

    /**
     * afficher les livraisons
     * GET /api/livraison : l'étudiant voit les siennes ; le personnel voit tout
     * (filtre ?statut=).
     */
    public function index(Request $request)
    {
        $query = Livraison::with(['commande', 'livreur.utilisateur'])->orderByDesc('created_at');

        if ($request->user()->role === 'etudiant') {
            $query->whereHas('commande', function ($q) use ($request) {
                $q->where('Id_utilisateur', $request->user()->Id_utilisateur);
            });
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut_livraison', $statut);
        }

        return $query->get();
    }

    /**
     * afficher une livraison précise
     * GET /api/livraison/{id}
     */
    public function show(Request $request, string $id)
    {
        $livraison = Livraison::with(['commande.articles', 'livreur.utilisateur'])->findOrFail($id);

        if ($request->user()->role === 'etudiant'
            && $livraison->commande->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return $livraison;
    }

    /**
     * créer la livraison d'une commande (US-008 : mode_service = livraison)
     * POST /api/livraison
     * (en général la livraison est déjà créée avec la commande : cette route sert de rattrapage)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'Id_commande'       => 'required|exists:commande,Id_commande',
            'adresse_livraison' => 'nullable|string',
            'frais_livraison'   => 'nullable|integer|min:0',
            'date_prevue'       => 'nullable|date|after_or_equal:now',
        ]);

        $utilisateur = $request->user();
        $commande = Commande::findOrFail($data['Id_commande']);

        if ($utilisateur->role === 'etudiant'
            && $commande->Id_utilisateur !== $utilisateur->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($commande->mode_service !== 'livraison') {
            return response()->json(['message' => 'Cette commande n\'est pas en mode livraison.'], 422);
        }
        if ($commande->livraison()->exists()) {
            return response()->json(['message' => 'Une livraison existe déjà pour cette commande.'], 422);
        }

        // Les frais ne sont jamais choisis par l'étudiant : seul le personnel peut les modifier.
        $frais = $utilisateur->role === 'etudiant'
            ? CalculCommande::FRAIS_LIVRAISON
            : ($data['frais_livraison'] ?? CalculCommande::FRAIS_LIVRAISON);

        $livraison = $this->commandes->creerLivraison(
            $commande,
            $data['adresse_livraison'] ?? null,
            $frais,
            $data['date_prevue'] ?? null
        );

        return response()->json($livraison, 201);
    }

    /**
     * Le staff assigne un livreur employé (US-026 / statutLivraison = assignee)
     * POST /api/livraison/{id}/assigner { Id_utilisateur: "..." }
     */
    public function assigner(Request $request, string $id)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Seul le personnel peut assigner un livreur.'], 403);
        }

        $data = $request->validate([
            'Id_utilisateur' => 'required|exists:employe,Id_utilisateur',
        ]);

        $livraison = Livraison::findOrFail($id);
        if ($livraison->statut_livraison !== 'en_attente') {
            return response()->json(['message' => 'Livraison déjà assignée ou en cours.'], 422);
        }

        $livraison->update([
            'Id_utilisateur'   => $data['Id_utilisateur'],
            'statut_livraison' => 'assignee',
        ]);

        return $livraison;
    }

    /**
     * Départ en livraison (staff ou livreur lui-même)
     * POST /api/livraison/{id}/demarrer
     */
    public function demarrer(Request $request, string $id)
    {
        $livraison = Livraison::findOrFail($id);
        $utilisateur = $request->user();

        $autorise = $utilisateur->role !== 'etudiant'
            || $livraison->Id_utilisateur === $utilisateur->Id_utilisateur;
        if (! $autorise) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($livraison->statut_livraison !== 'assignee') {
            return response()->json(['message' => 'La livraison doit être assignée d\'abord.'], 422);
        }

        // Le statut de la commande passe à en_livraison, et l'historique est écrit
        DB::transaction(function () use ($livraison, $utilisateur) {
            $livraison->update(['statut_livraison' => 'en_cours']);
            $commande = $livraison->commande;
            if ($commande->statut_commande === 'prete') {
                $this->commandes->changerStatut($commande, 'en_livraison', $utilisateur->Id_utilisateur);
            }
        });

        return $livraison;
    }

    /**
     * Validation de la livraison réussie : commande automatiquement servie (US-026)
     * POST /api/livraison/{id}/livrer
     */
    public function livrer(Request $request, string $id)
    {
        $livraison = Livraison::findOrFail($id);
        $utilisateur = $request->user();

        $autorise = $utilisateur->role !== 'etudiant'
            || $livraison->Id_utilisateur === $utilisateur->Id_utilisateur;
        if (! $autorise) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($livraison->statut_livraison !== 'en_cours') {
            return response()->json(['message' => 'La livraison doit être en cours.'], 422);
        }

        DB::transaction(function () use ($livraison, $utilisateur) {
            $livraison->update([
                'statut_livraison' => 'livree',
                'date_livraison'   => now(),
            ]);
            $commande = $livraison->commande;
            if (in_array($commande->statut_commande, ['en_livraison', 'prete', 'validee', 'en_preparation'], true)) {
                $this->commandes->changerStatut($commande, 'servie', $utilisateur->Id_utilisateur);
            }
        });

        return $livraison->load('commande');
    }

    /**
     * Échec de livraison (staff uniquement)
     * POST /api/livraison/{id}/echouer
     */
    public function echouer(Request $request, string $id)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Seul le personnel peut marquer un échec.'], 403);
        }

        $livraison = Livraison::findOrFail($id);
        if ($livraison->statut_livraison !== 'en_cours') {
            return response()->json(['message' => 'La livraison doit être en cours.'], 422);
        }

        $livraison->update(['statut_livraison' => 'echouee']);

        return $livraison;
    }
}
