<?php

namespace Tests\Unit;

use App\Models\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function un_restaurant_peut_etre_cree_avec_tous_les_champs(): void
    {
        $restaurant = Restaurant::factory()->create();

        $this->assertDatabaseHas('restaurant', [
            'Id_restaurant' => $restaurant->Id_restaurant,
            'nom_restaurant' => $restaurant->nom_restaurant,
            'statut_restaurant' => 'actif',
            'livraison_active' => true,
        ]);

        $this->assertTrue($restaurant->heure_fermeture > $restaurant->heure_ouverture);
    }

    /** @test */
    public function un_restaurant_peut_avoir_plusieurs_articles(): void
    {
        $restaurant = Restaurant::factory()->has(\App\Models\ArticleMenu::factory()->count(3), 'articles')->create();

        $this->assertCount(3, $restaurant->articles);
    }

    /** @test */
    public function un_restaurant_peut_etre_desactive(): void
    {
        $restaurant = Restaurant::factory()->create(['statut_restaurant' => 'inactif']);

        $this->assertSame('inactif', $restaurant->statut_restaurant);
    }
}