<?php

namespace Database\Factories;

use App\Models\Paiement;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'Id_paiement' => 'PA' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'montant_paye' => random_int(1000, 50000),
            'mode_paiement' => fake()->randomElement(['MOMO', 'OM', 'CARTE']),
            'date_paiement' => now(),
            'statut_paiement' => 'en_cours_validation',
            'reference_transaction' => 'REF' . strtoupper(\Illuminate\Support\Str::random(10)),
            'Id_commande' => \App\Models\Commande::factory(),
        ];
    }
}