<?php

namespace Database\Seeders;

use App\Models\ArticleMenu;
use App\Models\Evenement;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

// Contenu de demonstration supplementaire (menu complet + evenements actifs).
// Idempotent : updateOrCreate partout, re-executable sans doublons.
// Appele par DatabaseSeeder ; lanceable seul :
//   php artisan db:seed --class=MenuEvenementsDemoSeeder
class MenuEvenementsDemoSeeder extends Seeder
{
    public function run(): void
    {
        // --- Articles supplementaires (photos du dossier projet 1 X2\images) ---
        $articles = [
            // plats
            ['Id_article' => 'PLA003', 'nom_article' => 'Poisson braisé', 'description' => 'Carpe grillée, sauce piment doux', 'prix_article' => 4000, 'categories_article' => 'plat', 'Menu_du_jour' => true, 'image_article' => '/img/plats/poisson-braise.jpg'],
            ['Id_article' => 'PLA004', 'nom_article' => 'Eru', 'description' => 'Feuilles eru fondues, viande, huile de palme', 'prix_article' => 2500, 'categories_article' => 'plat', 'Menu_du_jour' => false, 'image_article' => '/img/plats/eru.jpg'],
            ['Id_article' => 'PLA005', 'nom_article' => 'Okok sucré', 'description' => 'Feuilles d\'okok, arachide, huile de palme', 'prix_article' => 1500, 'categories_article' => 'plat', 'Menu_du_jour' => false, 'image_article' => '/img/plats/okok-sucre.jpg'],
            // boissons
            ['Id_article' => 'BOI003', 'nom_article' => 'Foléré', 'description' => 'Jus d\'hibiscus épicé, gingembre et ananas', 'prix_article' => 500, 'categories_article' => 'boisson', 'Menu_du_jour' => false, 'image_article' => '/img/plats/folere.jpg'],
            // accompagnements (tarif unique)
            ['Id_article' => 'ACC001', 'nom_article' => 'Frites de plantains', 'description' => 'Plantains mûrs dorés, sauce piment', 'prix_article' => 500, 'categories_article' => 'accompagnement', 'Menu_du_jour' => false, 'image_article' => '/img/plats/frites-plantains.jpg'],
            ['Id_article' => 'ACC002', 'nom_article' => 'Frites de pommes', 'description' => 'Pommes frites croustillantes maison', 'prix_article' => 500, 'categories_article' => 'accompagnement', 'Menu_du_jour' => false, 'image_article' => '/img/plats/frites-pommes.jpg'],
            ['Id_article' => 'ACC003', 'nom_article' => 'Bâton de manioc', 'description' => 'Bobolo mika, manioc fermenté emballé', 'prix_article' => 500, 'categories_article' => 'accompagnement', 'Menu_du_jour' => false, 'image_article' => '/img/plats/baton-manioc.jpg'],
            // desserts
            ['Id_article' => 'DES002', 'nom_article' => 'Crème de mangue', 'description' => 'Mangue mûre vanillée, servi frais', 'prix_article' => 800, 'categories_article' => 'dessert', 'Menu_du_jour' => false, 'image_article' => '/img/plats/creme-mangue.jpg'],
        ];
        // suppression du Kondré et du Jus de bissap, sortis du catalogue (idempotent)
        ArticleMenu::where('Id_article', 'PLA002')->delete();
        ArticleMenu::where('Id_article', 'BOI002')->delete();

        foreach ($articles as $a) {
            ArticleMenu::updateOrCreate(
                ['Id_article' => $a['Id_article']],
                [
                    'nom_article'           => $a['nom_article'],
                    'description'           => $a['description'],
                    'prix_article'          => $a['prix_article'],
                    'categories_article'    => $a['categories_article'],
                    'disponibilite_article' => true,
                    'Menu_du_jour'          => $a['Menu_du_jour'],
                    'image_article'         => $a['image_article'],
                    'Id_restaurant'         => 'RS001',
                ]
            );
        }

        // petit filet de sécurité : les 3 articles de base gardent leurs photos
        foreach ([
            'PLA001' => '/img/plats/poulet-dg.jpg',
            'BOI001' => '/img/plats/jus-gingembre.jpg',
            'DES001' => '/img/plats/beignets-farcis.jpg',
        ] as $id => $image) {
            ArticleMenu::where('Id_article', $id)->update(['image_article' => $image]);
        }

        // --- Evenements de demonstration (affiches = maquettes du site) ---
        $maintenant = Carbon::now();

        // promotion ACTIVE des maintenant (bande "Promotions" de l'accueil)
        Evenement::updateOrCreate(
            ['Id_evenement' => 'PRM0001'],
            [
                'type_evenement'        => 'promotion',
                'debut_evenement'       => $maintenant->copy()->subDays(2),
                'fin_evenement'         => $maintenant->copy()->addDays(7),
                'taux_reduction'        => 15,
                'points_evenement'      => 0,
                'description_evenement' => '-15 % sur toute commande servie sur place cette semaine',
                'affiche_evenement'     => '/maq/maq_promo.jpg',
                'Id_utilisateur'        => 'ADMI000000',
            ]
        );

        // mini-jeu ACTIVE des maintenant (bande "Evenements" de l accueil, "Je participe")
        Evenement::updateOrCreate(
            ['Id_evenement' => 'MIN0001'],
            [
                'type_evenement'        => 'mini_jeu',
                'debut_evenement'       => $maintenant->copy()->subDays(1),
                'fin_evenement'         => $maintenant->copy()->addDays(3),
                'points_evenement'      => 50,
                'description_evenement' => 'Mini-jeu client : 50 points a remporter chaque soir',
                'affiche_evenement'     => '/maq/maq_evenement.jpg',
                'Id_utilisateur'        => 'ADMI000000',
            ]
        );

        // evenement a venir (visible pour le gerant, pas encore dans les bandes)
        Evenement::updateOrCreate(
            ['Id_evenement' => 'EVE0001'],
            [
                'type_evenement'        => 'evenement',
                'debut_evenement' => $maintenant->copy()->addDays(5)->setTime(18, 0),
                'fin_evenement'   => $maintenant->copy()->addDays(5)->setTime(22, 0),
                'points_evenement'      => 20,
                'description_evenement' => 'Soirée tasting : menu découverte du chef',
                'affiche_evenement'     => '/maq/maq_evenement.jpg',
                'Id_utilisateur'        => 'ADMI000000',
            ]
        );
    }
}
