<?php

namespace Database\Factories;

use App\Models\Etudiant;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EtudiantFactory extends Factory
{
    public function definition(): array
    {
        // un etudiant DOIT exister dans la table utilisateur (cle etrangere
        // et role calcule par sous-type) : on cree d'abord son compte
        $utilisateur = Utilisateur::factory()->create();

        return [
            'Id_utilisateur' => $utilisateur->Id_utilisateur,
            'localisation' => fake()->city(),
            'code_parrainage' => strtoupper(Str::random(4)) . random_int(1000, 9999),
            'solde_point' => random_int(0, 1000),
        ];
    }
}
