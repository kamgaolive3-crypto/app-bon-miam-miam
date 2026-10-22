<?php

namespace Tests\Feature;

use App\Models\Administrateur;
use App\Models\ArticleMenu;
use App\Models\Etudiant;
use App\Models\Restaurant;
use App\Models\Utilisateur;
use Tests\TestCase;

class ArticleMenuControllerTest extends TestCase
{
    /** Crée un compte ayant réellement le rôle administrateur. */
    private function administrateurConnecte(): Utilisateur
    {
        $administrateur = Administrateur::factory()->create();

        return Utilisateur::findOrFail($administrateur->Id_utilisateur);
    }

    public function test_la_liste_des_articles_est_publique(): void
    {
        ArticleMenu::factory()->count(3)->create();

        $this->getJson('/api/article_menu')
            ->assertOk()
            ->assertJsonCount(3);
    }

    public function test_la_route_menu_du_jour_ne_retourne_que_les_articles_marques_du_jour(): void
    {
        ArticleMenu::factory()->count(2)->create(['Menu_du_jour' => true]);
        ArticleMenu::factory()->count(3)->create(['Menu_du_jour' => false]);

        $this->getJson('/api/article_menu-du-jour')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_un_administrateur_peut_creer_un_article(): void
    {
        $restaurant = Restaurant::factory()->create();

        $donnees = [
            'Id_article'            => 'PLA501',
            'nom_article'           => 'Poulet Yassa',
            'description'           => 'Poulet au citron et aux oignons',
            'prix_article'          => 3500,
            'categories_article'    => 'plat',
            'disponibilite_article' => true,
            'Menu_du_jour'          => true,
            'Id_restaurant'         => $restaurant->Id_restaurant,
        ];

        $this->actingAs($this->administrateurConnecte(), 'sanctum')
            ->postJson('/api/article_menu', $donnees)
            ->assertCreated()
            ->assertJsonPath('Id_article', 'PLA501');

        $this->assertDatabaseHas('article_menu', [
            'Id_article' => 'PLA501',
            'Menu_du_jour' => 1,
        ]);
    }

    public function test_un_etudiant_ne_peut_pas_creer_un_article(): void
    {
        $etudiant = Etudiant::factory()->create();
        $utilisateur = Utilisateur::findOrFail($etudiant->Id_utilisateur);

        $this->actingAs($utilisateur, 'sanctum')
            ->postJson('/api/article_menu', [])
            ->assertForbidden();
    }

    public function test_le_prix_negatif_est_refuse(): void
    {
        $restaurant = Restaurant::factory()->create();

        $donnees = [
            'Id_article'            => 'PLA502',
            'nom_article'           => 'Plat invalide',
            'prix_article'          => -100,
            'categories_article'    => 'plat',
            'disponibilite_article' => true,
            'Menu_du_jour'          => false,
            'Id_restaurant'         => $restaurant->Id_restaurant,
        ];

        $this->actingAs($this->administrateurConnecte(), 'sanctum')
            ->postJson('/api/article_menu', $donnees)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('prix_article');

        $this->assertDatabaseMissing('article_menu', [
            'Id_article' => 'PLA502',
        ]);
    }

    public function test_un_administrateur_peut_modifier_un_article(): void
    {
        $article = ArticleMenu::factory()->create();

        $donnees = [
            'Id_article'            => $article->Id_article,
            'nom_article'           => 'Nom modifié',
            'description'           => $article->description,
            'image_article'         => $article->image_article,
            'prix_article'          => $article->prix_article,
            'categories_article'    => $article->categories_article,
            'disponibilite_article' => $article->disponibilite_article,
            'Menu_du_jour'          => $article->Menu_du_jour,
            'Id_restaurant'         => $article->Id_restaurant,
        ];

        $this->actingAs($this->administrateurConnecte(), 'sanctum')
            ->putJson('/api/article_menu/' . $article->Id_article, $donnees)
            ->assertOk()
            ->assertJsonPath('nom_article', 'Nom modifié');

        $this->assertDatabaseHas('article_menu', [
            'Id_article' => $article->Id_article,
            'nom_article' => 'Nom modifié',
        ]);
    }

    public function test_un_administrateur_peut_supprimer_un_article(): void
    {
        $article = ArticleMenu::factory()->create();

        $this->actingAs($this->administrateurConnecte(), 'sanctum')
            ->deleteJson('/api/article_menu/' . $article->Id_article)
            ->assertOk();

        $this->assertDatabaseMissing('article_menu', [
            'Id_article' => $article->Id_article,
        ]);
    }
}