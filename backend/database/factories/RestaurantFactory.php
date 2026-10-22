<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RestaurantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'Id_restaurant' => strtoupper(Str::random(2)) . random_int(100, 999),
            'nom_restaurant' => fake()->company(),
            'adresse_restaurant' => fake()->address(),
            'telephone_restaurant' => fake()->phoneNumber(),
            'email_restaurant' => fake()->companyEmail(),
            'heure_ouverture' => '08:00:00',
            'heure_fermeture' => '22:00:00',
            'livraison_active' => true,
            'statut_restaurant' => 'actif',
            'date_creation' => now(),
        ];
    }
}