<?php

namespace Database\Factories;

use App\Models\Evenement;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EvenementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'Id_evenement' => 'EVT' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'affiche_evenement' => null,
            'debut_evenement' => now()->addDays(1),
            'fin_evenement' => now()->addDays(2),
            'type_evenement' => fake()->randomElement(['promotion', 'evenement', 'mini_jeu']),
            'points_evenement' => random_int(10, 100),
            'taux_reduction' => random_int(1, 100),
            'description_evenement' => fake()->sentence(),
            'Id_utilisateur' => \App\Models\Administrateur::factory(),
        ];
    }
}