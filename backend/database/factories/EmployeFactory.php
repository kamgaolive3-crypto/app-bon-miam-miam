<?php

namespace Database\Factories;

use App\Models\Employe;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EmployeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'Id_utilisateur' => strtoupper(Str::random(4)) . random_int(100000, 999999),
            'poste' => fake()->jobTitle(),
            'date_embauche' => now(),
            'Id_restaurant' => \App\Models\Restaurant::factory(),
            'Id_createur' => null,
            'date_creation_compte' => now(),
        ];
    }
}