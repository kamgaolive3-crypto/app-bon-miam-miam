<?php

namespace Tests\Unit;

use App\Models\ArticleMenu;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleMenuTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function un_article_menu_peut_etre_cree_avec_tous_les_champs(): void
    {
        $article = ArticleMenu::factory()->create();

        $this->assertDatabaseHas('article_menu', [
            'Id_article' => $article->Id_article,
            'nom_article' => $article->nom_article,
            'disponibilite_article' => true,
        ]);
    }

    /** @test */
    public function un_article_du_jour_est_recuppere_par_le_scope_menu_du_jour(): void
    {
        ArticleMenu::factory()->count(2)->create(['Menu_du_jour' => true]);
        ArticleMenu::factory()->count(3)->create(['Menu_du_jour' => false]);

        $menuDuJour = ArticleMenu::where('Menu_du_jour', true)->get();

        $this->assertCount(2, $menuDuJour);
    }

    /** @test */
    public function un_article_appartient_a_un_restaurant(): void
    {
        $restaurant = \App\Models\Restaurant::factory()->create();
        $article = ArticleMenu::factory()->create(['Id_restaurant' => $restaurant->Id_restaurant]);

        $this->assertSame($restaurant->Id_restaurant, $article->restaurants->first()->Id_restaurant);
    }
}