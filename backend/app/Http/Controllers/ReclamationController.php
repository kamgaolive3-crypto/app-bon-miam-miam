<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Reclamation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReclamationController extends Controller
{
    /**
     * Signalamer un problème lié à une commande (US-021)
     * POST /api/reclamation
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'Id_commande'   => 'required|exists:commande,Id_commande',
            'motif'         => 'required|string|max:255',
            'description'   => 'required|string',
        ]);

        $utilisateur = $request->user();
        $commande = Commande::findOrFail($data['Id_commande']);

        if ($utilisateur->role === 'etudiant'
            && $commande->Id_utilisateur !== $utilisateur->Id_utilisateur) {
            return response()->json(['message' => 'Vous ne pouvez réclamer que sur vos commandes.'], 403);
        }

        $reclamation = Reclamation::create([
            'Id_reclamation'  => $this->genererId(),
            'motif_reclamation'        => $data['motif'],
            'description_reclamation'  => $data['description'],
            'statut_reclamation'       => 'en_attente',
            'Id_utilisateur'           => $commande->Id_utilisateur,
            'Id_commande'              => $commande->Id_commande,
        ]);

        return response()->json($reclamation, 201);
    }

    /**
     * suivre l'état de mes réclamations (US-022) / vue globale (US-038)
     * GET /api/reclamation (filtre ?statut=)
     */
    public function index(Request $request)
    {
        $query = Reclamation::with(['etudiant.utilisateur', 'commande'])->orderByDesc('date_reclamation');

        if ($request->user()->role === 'etudiant') {
            $query->where('Id_utilisateur', $request->user()->Id_utilisateur);
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut_reclamation', $statut);
        }

        return $query->get();
    }

    /**
     * détail d'une réclamation
     * GET /api/reclamation/{id}
     */
    public function show(Request $request, string $id)
    {
        $reclamation = Reclamation::with(['etudiant', 'commande'])->findOrFail($id);

        if ($request->user()->role === 'etudiant'
            && $reclamation->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return $reclamation;
    }

    /**
     * Niveau 1 : l'employé traite la réclamation (association Traiter)
     * POST /api/reclamation/{id}/traiter { reponse: "..." }
     */
    public function traiter(Request $request, string $id)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Réservé au personnel.'], 403);
        }

        $data = $request->validate([
            'reponse' => 'required|string',
        ]);

        $reclamation = Reclamation::findOrFail($id);

        if ($reclamation->statut_reclamation !== 'en_attente') {
            return response()->json(['message' => 'Réclamation déjà traitée.'], 422);
        }

        DB::transaction(function () use ($reclamation, $data, $request) {
            $reclamation->update([
                'statut_reclamation'   => 'observation',   // passée au gérant pour décision
                'reponse_reclamation'  => $data['reponse'],
                'Id_traitant'          => $request->user()->Id_utilisateur,
                'date_traitement'      => now(),
            ]);
        });

        return $reclamation;
    }

    /**
     * Niveau 2 : le gérant décide (validee / rejetee) (association Gestion_reclamation)
     * POST /api/reclamation/{id}/decision-gerant { decision: "validee"|"rejetee" }
     */
    public function decisionGerant(Request $request, string $id)
    {
        if (! in_array($request->user()->role, ['gerant', 'administrateur'], true)) {
            return response()->json(['message' => 'Réservé au gérant.'], 403);
        }

        $data = $request->validate([
            'decision' => 'required|in:validee,rejetee',
        ]);

        $reclamation = Reclamation::findOrFail($id);

        if ($reclamation->statut_reclamation !== 'observation') {
            return response()->json(['message' => 'La réclamation doit être traitée par un employé d\'abord.'], 422);
        }

        DB::transaction(function () use ($reclamation, $data, $request) {
            $reclamation->update([
                'statut_reclamation' => $data['decision'],
                'Id_gerant'          => $request->user()->Id_utilisateur,
                'date_decision'      => now(),
                'decision'           => $data['decision'],
            ]);
        });

        return $reclamation;
    }

    /**
     * Niveau 3 (escalade) : traitement administratif (association Traiter_admin)
     * POST /api/reclamation/{id}/traiter-admin { reponse: "..." }
     */
    public function traiterAdmin(Request $request, string $id)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Réservé à l\'administrateur.'], 403);
        }

        $data = $request->validate(['reponse' => 'required|string']);
        $reclamation = Reclamation::findOrFail($id);

        DB::transaction(function () use ($reclamation, $data, $request) {
            $reclamation->update([
                'reponse_reclamation'      => $data['reponse'],
                'Id_admin_traitant'        => $request->user()->Id_utilisateur,
                'date_traitement_admin'    => now(),
                'statut_reclamation'       => 'observation',
            ]);
        });

        return $reclamation;
    }

    /**
     * Niveau 3 : décision administrative finale (Gestion_reclamation_admin)
     * POST /api/reclamation/{id}/decision-admin { decision: "validee"|"rejetee" }
     */
    public function decisionAdmin(Request $request, string $id)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Réservé à l\'administrateur.'], 403);
        }

        $data = $request->validate(['decision' => 'required|in:validee,rejetee']);
        $reclamation = Reclamation::findOrFail($id);

        DB::transaction(function () use ($reclamation, $data, $request) {
            $reclamation->update([
                'statut_reclamation'      => $data['decision'],
                'Id_admin_decideur'       => $request->user()->Id_utilisateur,
                'date_decision_admin'     => now(),
                'decision_admin'          => $data['decision'],
            ]);
        });

        return $reclamation;
    }

    /**
     * Générateur #RECLA0001 (domaine ID_RECLA) sans collision.
     */
    private function genererId(): string
    {
        do {
            $id = '#RECLA' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (Reclamation::where('Id_reclamation', $id)->exists());

        return $id;
    }
}