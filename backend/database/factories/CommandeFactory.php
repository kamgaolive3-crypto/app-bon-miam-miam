<?php

namespace Database\Factories;

use App\Models\Commande;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommandeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'Id_commande' => '#COM' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'date_commande' => now(),
            'montant_total' => random_int(1000, 50000),
            'mode_service' => fake()->randomElement(['sur_place', 'livraison']),
            'statut_commande' => 'en_attente',
            'points_utilises' => 0,
            'reduction_points' => 0,
            'commentaire' => null,
            'heure_recup' => null,
            'Id_utilisateur' => \App\Models\Etudiant::factory(),
            'Id_restaurant' => \App\Models\Restaurant::factory(),
            'Id_valideur' => null,
            'date_validation' => null,
            'Id_admin_valideur' => null,
            'date_validation_admin' => null,
        ];
    }
}