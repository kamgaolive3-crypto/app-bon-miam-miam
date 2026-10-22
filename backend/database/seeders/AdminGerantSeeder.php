<?php

namespace Database\Seeders;

use App\Models\Administrateur;
use App\Models\Gerant;
use App\Models\Restaurant;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminGerantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::where('Id_restaurant', 'RS001')->first();

        if (! $restaurant) {
            throw new RuntimeException(
                'Le restaurant RS001 doit exister avant de créer le gérant.'
            );
        }

        DB::transaction(function () use ($restaurant) {
            Utilisateur::updateOrCreate(
                ['Id_utilisateur' => 'ADMI000000'],
                [
                    'nom'            => 'Admin',
                    'prenom'         => 'Principal',
                    'email'          => 'admin@monmiammiam.cm',
                    'mot_de_passe'   => Hash::make('123456789O'),
                    'telephone'      => '600000006',
                    'statut_compte'  => 'actif',
                ]
            );

            Administrateur::updateOrCreate(
                ['Id_utilisateur' => 'ADMI000000'],
                ['Id_restaurant' => $restaurant->Id_restaurant]
            );

            Utilisateur::updateOrCreate(
                ['Id_utilisateur' => 'GERA000000'],
                [
                    'nom'            => 'Gérant',
                    'prenom'         => 'Principal',
                    'email'          => 'gerant@monmiammiam.cm',
                    'mot_de_passe'   => Hash::make('123456789O'),
                    'telephone'      => '600000007',
                    'statut_compte'  => 'actif',
                ]
            );

            Gerant::updateOrCreate(
                ['Id_utilisateur' => 'GERA000000'],
                [
                    'Id_restaurant'  => $restaurant->Id_restaurant,
                    'date_nomination' => now()->toDateString(),
                ]
            );
        });
    }
}