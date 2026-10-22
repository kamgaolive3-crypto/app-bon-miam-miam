<?php

namespace App\Services;

use App\Models\Parrainer;
use Illuminate\Support\Facades\DB;

class ParrainageService
{
    public function __construct(private FideliteService $fidelite) {}

    // À appeler après le premier paiement du filleul.
    // Sans effet si la récompense a déjà été versée (aucun doublon possible).
    public function verserRecompense(string $idFilleul): bool
    {
        return DB::transaction(function () use ($idFilleul) {
            $lien = Parrainer::where('Id_filleul', $idFilleul)->lockForUpdate()->first();

            if (!$lien || $lien->recompense_attribuee) {
                return false;
            }

            $pointsParrain = (int) config('fidelite.points_parrain');
            $pointsFilleul = (int) config('fidelite.points_filleul');

            if ($pointsParrain > 0) {
                $this->fidelite->attribuer($lien->Id_parrain, $pointsParrain, 'parrainage');
            }
            if ($pointsFilleul > 0) {
                $this->fidelite->attribuer($idFilleul, $pointsFilleul, 'parrainage');
            }

            Parrainer::where('Id_filleul', $idFilleul)->update(['recompense_attribuee' => true]);

            return true;
        });
    }
}
