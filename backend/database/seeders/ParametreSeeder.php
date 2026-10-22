<?php

namespace Database\Seeders;

use App\Models\Parametre;
use Illuminate\Database\Seeder;

class ParametreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // horaires par jour, enregistrés dans UN seul paramètre au format JSON
        $horaires = [];
        foreach (['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi',] as $jour) {
            $horaires[$jour] = ['actif' => true, 'debut' => '17:00', 'fin' => '22:00'];
        }
        $horaires['samedi']   = ['actif' => true,  'debut' => '10:00', 'fin' => '18:00'];   // horaires elargis
        $horaires['dimanche'] = ['actif' => false, 'debut' => '08:00', 'fin' => '22:00'];   // fermé

        // [Id_parametre, cle, valeur]
        $parametres = [
            ['PA001', 'horaires_ouverture',     json_encode($horaires)],
            ['PA002', 'service_sur_place',      '1'],
            ['PA003', 'service_livraison',      '1'],
            ['PA004', 'paiement_mobile_money',  '1'],
            ['PA005', 'paiement_orange_money',  '1'],
            ['PA006', 'paiement_cash',          '1'],
            ['PA007', 'paiement_points',        '1'],
            ['PA008', 'depense_pour_1_point',    '1000'],
            ['PA009', 'valeur_15_points',        '1000'],
            ['PA010', 'duree_expiration_points', '12'],
            ['PA011', 'points_commande_filleul', '1'],
        ];

        foreach ($parametres as [$id, $cle, $valeur]) {
            Parametre::firstOrCreate(
                ['cle' => $cle],                                   // cherche cette clé
                ['Id_parametre' => $id, 'valeur' => $valeur]       // sinon la crée avec ces valeurs
            );
        }
    }
}
