<?php

namespace Database\Factories;

use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UtilisateurFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'Id_utilisateur' => strtoupper(Str::random(4)) . random_int(100000, 999999),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'email' => fake()->unique()->safeEmail(),
            'mot_de_passe' => static::$password ??= Hash::make('password123'),
            'statut_compte' => 'actif',
            'telephone' => '6' . fake()->numerify('########'),
            'date_inscription' => now(),
        ];
    }
}