<?php

namespace App\Http\Controllers;

use App\Models\Etudiant;
use App\Models\MvtPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FideliteController extends Controller
{
    /**
     * consulter son solde de points (US-015)
     * GET /api/fidelite/solde
     */
    public function solde(Request $request)
    {
        $etudiant = $request->user()->etudiant;

        if (! $etudiant) {
            return response()->json(['message' => 'Réservé aux étudiants.'], 403);
        }

        // Somme des gains expirant dans les 30 prochains jours (miroir US-016)
        $points_a_expirer = (int) MvtPoint::where('Id_utilisateur', $etudiant->Id_utilisateur)
            ->where('type_mvt', 'gain')
            ->whereNotNull('date_expiration')
            ->whereBetween('date_expiration', [now(), now()->addDays(30)])
            ->sum('nbres_points');

        return response()->json([
            'solde_point'      => $etudiant->solde_point,
            'gains_sous_30j'   => $points_a_expirer,
            'taux_conversion'  => '15 points = 1000 F',
        ]);
    }

    /**
     * consulter l'historique des mouvements de points (US-015)
     * GET /api/fidelite/historique
     */
    public function historique(Request $request)
    {
        $etudiant = $request->user()->etudiant;

        if (! $etudiant) {
            return response()->json(['message' => 'Réservé aux étudiants.'], 403);
        }

        return MvtPoint::where('Id_utilisateur', $etudiant->Id_utilisateur)
            ->orderByDesc('date_mvt')
            ->get();
    }

    /**
     * Expiration automatique des points (US-016) : appel manuel par le staff,
     * ou planifié via scheduler (schedule:run -> $schedule->command(...)).
     * Politique FIFO simplifiée : pour chaque étudiant,
     *   dû = somme des gains expirés - points déjà utilisés - points déjà expirés.
     * POST /api/fidelite/expiration (staff uniquement)
     */
    public function expirer(Request $request)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Réservé au personnel.'], 403);
        }

        $gainsExpirés = MvtPoint::where('type_mvt', 'gain')
            ->whereNotNull('date_expiration')
            ->where('date_expiration', '<', now())
            ->selectRaw('Id_utilisateur, SUM(nbres_points) as total_gains')
            ->groupBy('Id_utilisateur')
            ->get();

        $traites = 0;

        foreach ($gainsExpirés as $ligne) {
            DB::transaction(function () use ($ligne, &$traites) {
                $utilisé    = (int) abs(MvtPoint::where('Id_utilisateur', $ligne->Id_utilisateur)->where('type_mvt', 'utilisation')->sum('nbres_points'));
                $déjàExpiré = (int) abs(MvtPoint::where('Id_utilisateur', $ligne->Id_utilisateur)->where('type_mvt', 'expiration')->sum('nbres_points'));

                $du = (int) $ligne->total_gains - $utilisé - $déjàExpiré;

                if ($du > 0) {
                    $etudiant = Etudiant::where('Id_utilisateur', $ligne->Id_utilisateur)->first();
                    if ($etudiant && $etudiant->solde_point >= $du) {
                        $etudiant->decrement('solde_point', $du);
                        MvtPoint::create([
                            'Id_mvt'         => $this->genererIdMvt(),
                            'nbres_points'   => -$du,
                            'type_mvt'       => 'expiration',
                            'Id_utilisateur' => $etudiant->Id_utilisateur,
                        ]);
                        $traites++;
                    }
                }
            });
        }

        return response()->json(['message' => "Expiration traitée pour {$traites} étudiant(s)."]);
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