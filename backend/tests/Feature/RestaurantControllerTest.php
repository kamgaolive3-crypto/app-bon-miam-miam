<?php

namespace Tests\Feature;

use App\Models\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function on_peut_lister_tous_les_restaurants(): void
    {
        Restaurant::factory()->count(3)->create();

        $reponse = $this->getJson('/api/restaurant');

        $reponse->assertStatus(200);
        $reponse->assertJsonCount(3);
    }

    /** @test */
    public function on_peut_creer_un_restaurant(): void
    {
        $donnees = [
            'Id_restaurant' => 'RS001',
            'nom_restaurant' => 'Ma Cantine',
            'adresse_restaurant' => '123 Rue de la Paix',
            'telephone_restaurant' => '677123456',
            'email_restaurant' => 'cantine@example.com',
            'heure_ouverture' => '08:00:00',
            'heure_fermeture' => '20:00:00',
            'livraison_active' => true,
            'statut_restaurant' => 'actif',
        ];

        // l ecriture est protegee par auth:sanctum : un utilisateur du personnel est requis
        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->postJson('/api/restaurant', $donnees);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('restaurant', ['Id_restaurant' => 'RS001']);
    }

    /** @test */
    public function la_creation_d_un_restaurant_echoue_si_l_id_existe_deja(): void
    {
        Restaurant::factory()->create(['Id_restaurant' => 'RS001']);

        $donnees = [
            'Id_restaurant' => 'RS001',
            'nom_restaurant' => 'Doublon',
            'adresse_restaurant' => 'Rue X',
            'heure_ouverture' => '08:00:00',
            'heure_fermeture' => '20:00:00',
        ];

        // l ecriture est protegee par auth:sanctum : un utilisateur du personnel est requis
        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->postJson('/api/restaurant', $donnees);

        $reponse->assertStatus(422);
    }

    /** @test */
    public function on_peut_recuperer_un_restaurant_par_id(): void
    {
        $restaurant = Restaurant::factory()->create();

        $reponse = $this->getJson('/api/restaurant/' . $restaurant->Id_restaurant);

        $reponse->assertStatus(200)
            ->assertJsonFragment(['Id_restaurant' => $restaurant->Id_restaurant]);
    }

    /** @test */
    public function on_peut_mettre_a_jour_un_restaurant(): void
    {
        $restaurant = Restaurant::factory()->create();

        // l ecriture est protegee par auth:sanctum : un utilisateur du personnel est requis
        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->putJson('/api/restaurant/' . $restaurant->Id_restaurant, [
                'nom_restaurant' => 'Nouveau Nom',
            ]);

        $reponse->assertStatus(200);
        $this->assertDatabaseHas('restaurant', [
            'Id_restaurant' => $restaurant->Id_restaurant,
            'nom_restaurant' => 'Nouveau Nom',
        ]);
    }

    /** @test */
    public function on_peut_supprimer_un_restaurant(): void
    {
        $restaurant = Restaurant::factory()->create();

        // l ecriture est protegee par auth:sanctum : seul un administrateur peut supprimer
        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->deleteJson('/api/restaurant/' . $restaurant->Id_restaurant);

        $reponse->assertStatus(200);
        $this->assertDatabaseMissing('restaurant', ['Id_restaurant' => $restaurant->Id_restaurant]);
    }
}