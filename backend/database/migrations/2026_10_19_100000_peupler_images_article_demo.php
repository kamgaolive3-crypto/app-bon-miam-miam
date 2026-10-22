<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Peuple les photos de demonstration des articles du menu (demo UCAC-ICAM).
// images libres de droit (Unsplash), stockees dans frontend/public/img/plats/
// et servies par Vite a l adresse /img/plats/<fichier>.jpg
// -> le frontend affiche a.image_article quand il existe, donl ces chemins
//    le rendent visibles sur Accueil, Menu et Panier.
return new class extends Migration {
    public function up(): void
    {
        DB::table('article_menu')->where('Id_article', 'PLA001')->update([
            'image_article' => '/img/plats/poulet-dg.jpg',
        ]);
        DB::table('article_menu')->where('Id_article', 'BOI001')->update([
            'image_article' => '/img/plats/jus-gingembre.jpg',
        ]);
        DB::table('article_menu')->where('Id_article', 'DES001')->update([
            'image_article' => '/img/plats/beignets-farcis.jpg',
        ]);
    }

    public function down(): void
    {
        // la migration data se retracte proprement : on vide les chemins
        DB::table('article_menu')->whereIn('Id_article', ['PLA001', 'BOI001', 'DES001'])
            ->update(['image_article' => null]);
    }
};
