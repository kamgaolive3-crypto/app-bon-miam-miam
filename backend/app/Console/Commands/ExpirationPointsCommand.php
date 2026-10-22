<?php

namespace App\Console\Commands;

use App\Models\Etudiant;
use App\Models\MvtPoint;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpirationPointsCommand extends Command
{
    /**
     * US-016 : les points non utilisés expirent après 12 mois.
     * Planifié quotidiennement dans routes/console.php.
     */
    protected $signature = 'fidelite:expirer';
    protected $description = 'Expirer les points de fidelite arrives a echeance (US-016)';

    public function handle(): int
    {
        $gainsExpirés = MvtPoint::where('type_mvt', 'gain')
            ->whereNotNull('date_expiration')
            ->where('date_expiration', '<', now())
            ->selectRaw('Id_utilisateur, SUM(nbres_points) as total_gains')
            ->groupBy('Id_utilisateur')
            ->get();

        $traitees = 0;

        foreach ($gainsExpirés as $ligne) {
            DB::transaction(function () use ($ligne, &$traitees) {
                $utilise    = (int) abs(MvtPoint::where('Id_utilisateur', $ligne->Id_utilisateur)->where('type_mvt', 'utilisation')->sum('nbres_points'));
                $dejaExpire = (int) abs(MvtPoint::where('Id_utilisateur', $ligne->Id_utilisateur)->where('type_mvt', 'expiration')->sum('nbres_points'));

                $du = (int) $ligne->total_gains - $utilise - $dejaExpire;

                if ($du > 0) {
                    $etudiant = Etudiant::where('Id_utilisateur', $ligne->Id_utilisateur)->first();
                    if ($etudiant && $etudiant->solde_point >= $du) {
                        $etudiant->decrement('solde_point', $du);

                        do {
                            $id = 'MV' . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
                        } while (MvtPoint::where('Id_mvt', $id)->exists());

                        MvtPoint::create([
                            'Id_mvt'         => $id,
                            'nbres_points'   => -$du,
                            'type_mvt'       => 'expiration',
                            'Id_utilisateur' => $etudiant->Id_utilisateur,
                        ]);
                        $traitees++;
                    }
                }
            });
        }

        $this->info("Expiration des points terminee : {$traitees} etudiant(s) mis a jour.");

        return self::SUCCESS;
    }
}