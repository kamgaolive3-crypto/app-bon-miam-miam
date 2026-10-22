<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        Restaurant::updateOrCreate(
            ['Id_restaurant' => 'RS001'],
            [
                'nom_restaurant'        => 'ZeDuc@Space',
                'adresse_restaurant'    => 'Sommet de la terrasse, Résidence la Terrasse, DOUALA',
                'telephone_restaurant'  => '677123456',
                'email_restaurant'      => 'zeduc@monmiammiam.cm',
                'heure_ouverture'       => '10:00:00',
                'heure_fermeture'      => '23:00:00',
                'livraison_active'      => true,
                'statut_restaurant'     => 'actif',
            ]
        );
    }
}