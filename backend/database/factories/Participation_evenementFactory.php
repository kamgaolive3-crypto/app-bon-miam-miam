<?php

namespace Database\Factories;

use App\Models\Etudiant;
use App\Models\Evenement;
use App\Models\Participation_evenement;
use Illuminate\Database\Eloquent\Factories\Factory;

class Participation_evenementFactory extends Factory
{
    protected $model = Participation_evenement::class;

    public function definition(): array
    {
        return [
            'Id_utilisateur' => Etudiant::factory(),
            'Id_evenement' => Evenement::factory(),
            'date_participation' => now(),
            'points_gagnes' => 0,
            'prix_gagne' => null,
            'Id_mvt' => null,
        ];
    }
}
