<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Données de référence de l'application Mon Miam Miam.
     * Comptes de démonstration : mot de passe "Password1" partout.
     */
    public function run(): void
    {
        // d abord les donnees de reference (comptes, restaurant, menu de base)
        $this->call([
            RestaurantSeeder::class,
            AdminGerantSeeder::class,
            ParametreSeeder::class,
            MenuEvenementsDemoSeeder::class,
        ]);
    }

    /**
     * Données de référence de l'application Mon Miam Miam.
     * Comptes de démonstration : mot de passe "Password1" partout.
     */
}