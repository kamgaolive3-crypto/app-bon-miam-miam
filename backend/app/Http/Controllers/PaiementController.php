<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Paiement;
use Illuminate\Http\Request;

/**
 * Paiements des commandes.
 * L'étudiant enregistre son paiement (Mobile Money, Orange Money ou carte) ;
 * le personnel le vérifie. L'agrégateur de paiement en ligne est un bonus du cahier des charges :
 * ici, le paiement est enregistré puis validé à la main.
 */
class PaiementController extends Controller
{
    /**
     * GET /api/paiement : l'étudiant voit les siens ; le personnel voit tout (filtre ?statut=).
     */
    public function index(Request $request)
    {
        $query = Paiement::with('commande')->orderByDesc('date_paiement');

        if ($request->user()->role === 'etudiant') {
            $query->whereHas('commande', function ($q) use ($request) {
                $q->where('Id_utilisateur', $request->user()->Id_utilisateur);
            });
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut_paiement', $statut);
        }

        return $query->get();
    }

    /**
     * GET /api/paiement/{id}
     */
    public function show(Request $request, string $id)
    {
        $paiement = Paiement::with('commande')->findOrFail($id);

        if ($request->user()->role === 'etudiant'
            && $paiement->commande->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return $paiement;
    }

    /**
     * L'étudiant enregistre le paiement de SA commande.
     * POST /api/commande/{id}/paiement { mode_paiement: MOMO|OM|CARTE, reference_transaction? }
     * Le montant n'est jamais envoyé par le client : c'est le total de la commande.
     */
    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'mode_paiement'         => 'required|in:MOMO,OM,CARTE',
            'reference_transaction' => 'nullable|string|max:150|unique:paiement,reference_transaction',
        ]);

        $commande = Commande::findOrFail($id);

        if ($commande->Id_utilisateur !== $request->user()->Id_utilisateur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($commande->statut_commande === 'annulee') {
            return response()->json(['message' => 'Impossible de payer une commande annulée.'], 422);
        }
        if ($commande->paiements()->whereIn('statut_paiement', ['paye', 'en_cours_validation'])->exists()) {
            return response()->json(['message' => 'Cette commande est déjà payée ou en cours de validation.'], 422);
        }

        $paiement = Paiement::create([
            'Id_paiement'           => $this->genererIdPaiement(),
            'montant_paye'          => $commande->montant_total,
            'mode_paiement'         => $data['mode_paiement'],
            'statut_paiement'       => 'en_cours_validation',
            'reference_transaction' => $data['reference_transaction'] ?? null,
            'Id_commande'           => $commande->Id_commande,
        ]);

        return response()->json($paiement, 201);
    }

    /**
     * Le personnel vérifie un paiement : validé (paye) ou refusé (echoue).
     * POST /api/paiement/{id}/verifier { statut_paiement: paye|echoue }
     */
    public function verifier(Request $request, string $id)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Seul le personnel peut vérifier un paiement.'], 403);
        }

        $data = $request->validate([
            'statut_paiement' => 'required|in:paye,echoue',
        ]);

        $paiement = Paiement::findOrFail($id);
        if ($paiement->statut_paiement !== 'en_cours_validation') {
            return response()->json(['message' => 'Ce paiement a déjà été vérifié.'], 422);
        }

        $paiement->update(['statut_paiement' => $data['statut_paiement']]);

        return $paiement;
    }

    /** Identifiant du type PA0042 (6 caractères, comme la colonne Id_paiement), sans collision. */
    private function genererIdPaiement(): string
    {
        do {
            $id = 'PA' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (Paiement::where('Id_paiement', $id)->exists());

        return $id;
    }
}
