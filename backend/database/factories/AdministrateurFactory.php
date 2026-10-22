<?php

namespace Database\Factories;

use App\Models\Administrateur;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Factories\Factory;

class AdministrateurFactory extends Factory
{
    public function definition(): array
    {
        // un administrateur DOIT exister dans la table utilisateur (cle
        // etrangere et role calcule par sous-type) : on cree d'abord son compte
        $utilisateur = Utilisateur::factory()->create();

        return [
            'Id_utilisateur' => $utilisateur->Id_utilisateur,
            'date_nomination' => now(),
            'Id_restaurant' => null,
        ];
    }
}
