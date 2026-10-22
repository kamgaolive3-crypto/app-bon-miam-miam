<?php

namespace App\Http\Controllers;

use App\Models\Etudiant;
use App\Models\MvtPoint;
use App\Models\Parrainer;
use App\Models\Utilisateur;
use App\Models\Parametre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParrainageController extends Controller
{
    /** Bonus au parrain à la 1ère commande du filleul (US-019) */
    private static function lireBonusParrain(): int
{
        $valeur = Parametre::where('cle', 'points_commande_filleul')
            ->value('valeur');

    return $valeur === null ? 500 : max(0, (int) $valeur);
} // points

    /**
     * afficher / générer mon code de parrainage (US-017)
     * GET /api/parrainage/code
     */
    public function code(Request $request)
    {
        $etudiant = $request->user()->etudiant;

        if (! $etudiant) {
            return response()->json(['message' => 'Réservé aux étudiants.'], 403);
        }

        if (! $etudiant->code_parrainage) {
            $etudiant->update(['code_parrainage' => $this->genererCode()]);
        }

        return response()->json([
            'code_parrainage' => $etudiant->code_parrainage,
            'bonus_attendu'   => self::lireBonusParrain()
                . ' points à la 1ère commande du filleul',
        ]);
    }

    /**
     * utiliser un code de parrainage (US-018) : lie l'étudiant connecté à son parrain.
     * POST /api/parrainage/utiliser { code_parrainage: "ABCD1234" }
     */
    public function utiliser(Request $request)
    {
        $data = $request->validate([
            'code_parrainage' => ['required', 'regex:/^[A-Z]{4}[0-9]{4}$/'],
        ]);

        $filleul = $request->user()->etudiant;

        if (! $filleul) {
            return response()->json(['message' => 'Réservé aux étudiants.'], 403);
        }

        if ($data['code_parrainage'] === $filleul->code_parrainage) {
            return response()->json(['message' => 'Vous ne pouvez pas vous parrainer vous-même.'], 422);
        }

        $parrain = Etudiant::where('code_parrainage', $data['code_parrainage'])->first();

        if (! $parrain) {
            return response()->json(['message' => 'Code de parrainage inconnu.'], 404);
        }

        if (Parrainer::where('Id_filleul', $filleul->Id_utilisateur)->exists()) {
            return response()->json(['message' => 'Vous avez déjà un parrain.'], 422);
        }

        DB::transaction(function () use ($filleul, $parrain) {
            Parrainer::create([
                'Id_filleul'           => $filleul->Id_utilisateur,
                'Id_parrain'           => $parrain->Id_utilisateur,
                'recompense_attribuee' => false,
            ]);
        });

        return response()->json([
            'message' => 'Parrainage enregistré.',
            'parrain' => ['prenom' => $parrain->utilisateur?->prenom ?? null],
        ], 201);
    }

    /**
     * suivre la liste de mes filleuls (US-020)
     * GET /api/parrainage/filleuls
     */
    public function filleuls(Request $request)
    {
        $etudiant = $request->user()->etudiant;

        if (! $etudiant) {
            return response()->json(['message' => 'Réservé aux étudiants.'], 403);
        }

        $parrainages = Parrainer::where('Id_parrain', $etudiant->Id_utilisateur)
            ->orderByDesc('date_parrainage')
            ->get(['Id_filleul', 'date_parrainage', 'recompense_attribuee']);

        // Infos utilisateur des filleuls (nom, prénom)
        $infos = Utilisateur::whereIn('Id_utilisateur', $parrainages->pluck('Id_filleul'))
            ->get(['Id_utilisateur', 'nom', 'prenom'])
            ->keyBy('Id_utilisateur');

        return $parrainages->map(function ($p) use ($infos) {
            return [
                'filleul'              => $infos[$p->Id_filleul]?->only(['nom', 'prenom']),
                'date_parrainage'      => $p->date_parrainage,
                'recompense_attribuee' => (bool) $p->recompense_attribuee,
            ];
        });
    }

    /**
     * US-019 : appelé par CommandeController::store à la toute première
     * commande réussie du filleul. Crédite le parrain et clôt le parrainage.
     */
    public static function attribuerBonusPremiereCommande(Etudiant $filleul): void
    {
        $parrainage = Parrainer::where('Id_filleul', $filleul->Id_utilisateur)
            ->where('recompense_attribuee', false)
            ->first();

        if (! $parrainage) {
            return; // pas de parrain (ou bonus déjà versé)
        }

        $bonus = self::lireBonusParrain();
        DB::transaction(function () use ($filleul, $parrainage, $bonus) {
            $parrain = Etudiant::where('Id_utilisateur', $parrainage->Id_parrain)->first();

            if (! $parrain) {
                return;
            }

            $parrain->increment('solde_point', $bonus);

            do {
                $id = 'MV' . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            } while (MvtPoint::where('Id_mvt', $id)->exists());

            MvtPoint::create([
                'Id_mvt'         => $id,
                'nbres_points'   => $bonus,
                'type_mvt'       => 'parrainage',
                'Id_utilisateur' => $parrain->Id_utilisateur,
            ]);

            $parrainage->update(['recompense_attribuee' => true]);
        });
    }

    /**
     * Générateur ABCD1234 (domaine CODE_PARRAINAGE) sans collision.
     */
    private function genererCode(): string
    {
        do {
            $code = strtoupper(Str::random(4)) . (string) random_int(1000, 9999);
        } while (Etudiant::where('code_parrainage', $code)->exists());

        return $code;
    }
}