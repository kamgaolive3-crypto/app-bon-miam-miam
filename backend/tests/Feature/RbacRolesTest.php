<?php

namespace Tests\Feature;

use App\Models\Employe;
use App\Models\Evenement;
use App\Models\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Cloisonnement des roles (remarque d Olive) : chaque categorie d utilisateur
 * n accede qu aux fonctionnalites du cahier de charge. On verrouille ici les
 * actions que le frontend ne montre PAS mais qui resteraient appelables par API.
 */
class RbacRolesTest extends TestCase
{
    use RefreshDatabase;

    // le role se calcule par presence dans les tables sous-type (etudiant,
    // employe, gerant, administrateur) : on cree donc le compte PUIS la ligne
    private function etudiant()
    {
        $u = \App\Models\Utilisateur::factory()->create();
        \App\Models\Etudiant::factory()->create(['Id_utilisateur' => $u->Id_utilisateur]);
        return $u;
    }

    private function personnel(string $role)
    {
        $u = \App\Models\Utilisateur::factory()->create();
        match ($role) {
            'employe' => \App\Models\Employe::factory()->create([
                'Id_utilisateur' => $u->Id_utilisateur,
                'Id_restaurant'  => Restaurant::factory()->create()->Id_restaurant,
                'Id_createur'    => null,
            ]),
            'gerant' => \App\Models\Gerant::factory()->create([
                'Id_utilisateur' => $u->Id_utilisateur,
                'Id_restaurant'  => Restaurant::factory()->create()->Id_restaurant,
            ]),
            'administrateur' => \App\Models\Administrateur::factory()->create([
                'Id_utilisateur' => $u->Id_utilisateur,
            ]),
        };
        return $u;
    }

    /** @test */
    public function un_etudiant_ne_peut_pas_creer_un_article_menu(): void
    {
        $restaurant = Restaurant::factory()->create();
        $reponse = $this->actingAs($this->etudiant(), 'sanctum')->postJson('/api/article_menu', [
            'Id_article'            => 'PLA900',
            'nom_article'           => 'Article etudiant',
            'prix_article'          => 1000,
            'categories_article'    => 'plat',
            'Id_restaurant'         => $restaurant->Id_restaurant,
        ]);

        $reponse->assertStatus(403);
        $this->assertDatabaseMissing('article_menu', ['Id_article' => 'PLA900']);
    }

    /** @test */
    public function un_etudiant_ne_peut_pas_supprimer_un_article_menu(): void
    {
        $article = \App\Models\ArticleMenu::factory()->create();
        $reponse = $this->actingAs($this->etudiant(), 'sanctum')
            ->deleteJson('/api/article_menu/' . $article->Id_article);

        $reponse->assertStatus(403);
        $this->assertDatabaseHas('article_menu', ['Id_article' => $article->Id_article]);
    }

    /** @test */
    public function un_etudiant_ne_peut_pas_publier_ou_supprimer_un_evenement(): void
    {
        $etudiant = $this->etudiant();

        $reponse = $this->actingAs($etudiant, 'sanctum')->postJson('/api/evenement', [
            'Id_evenement'      => 'STU0001',
            'debut_evenement'   => now()->toIso8601String(),
            'fin_evenement'     => now()->addDays(2)->toIso8601String(),
            'type_evenement'    => 'promotion',
            'taux_reduction'    => 10,
            'description_evenement' => 'promo creee par un etudiant',
        ]);
        $reponse->assertStatus(403);

        // suppression aussi verrouillee
        $evenement = Evenement::factory()->create();
        $this->actingAs($etudiant, 'sanctum')
            ->deleteJson('/api/evenement/' . $evenement->Id_evenement)
            ->assertStatus(403);
        $this->assertDatabaseHas('evenement', ['Id_evenement' => $evenement->Id_evenement]);
    }

    /** @test */
    public function un_etudiant_ne_peut_pas_creer_de_restaurant(): void
    {
        $reponse = $this->actingAs($this->etudiant(), 'sanctum')->postJson('/api/restaurant', [
            'Id_restaurant'  => 'RS999',
            'nom_restaurant' => 'Restaurant clandestin',
        ]);

        $reponse->assertStatus(403);
        $this->assertDatabaseMissing('restaurant', ['Id_restaurant' => 'RS999']);
    }

    /** @test */
    public function le_personnel_peut_toujours_gerer_le_menu(): void
    {
        // sanite : le personnel reste autorise sur le menu (employe inclus,
        // c est lui qui met le menu a jour selon le CDC)
        $restaurant = Restaurant::factory()->create();
        $reponse = $this->actingAs($this->personnel('employe'), 'sanctum')->postJson('/api/article_menu', [
            'Id_article'            => 'PLA901',
            'nom_article'           => 'Plat employe',
            'prix_article'          => 2000,
            'categories_article'    => 'plat',
            'Id_restaurant'         => $restaurant->Id_restaurant,
        ]);
        $reponse->assertStatus(201);
    }

    /** @test */
    public function seuls_les_administrateurs_gerent_les_parametres(): void
    {
        $gerant = $this->personnel('gerant');
        $admin  = $this->personnel('administrateur');

        // un gerant ne peut pas creer un parametre
        $this->actingAs($gerant, 'sanctum')->postJson('/api/parametre', [
            'Id_parametre'  => 'PT000',
            'cle'           => 'heures_ouverture',
            'valeur'        => '07:00-22:00',
            'Id_utilisateur' => $admin->Id_utilisateur,
        ])->assertStatus(403);

        // l administrateur, lui, peut
        $this->actingAs($admin, 'sanctum')->postJson('/api/parametre', [
            'Id_parametre'  => 'PT001',
            'cle'           => 'heures_ouverture',
            'valeur'        => '07:00-22:00',
            'Id_utilisateur' => $admin->Id_utilisateur,
        ])->assertStatus(201);

        // et un etudiant ne peut meme pas LIRE les parametres
        $this->actingAs($this->etudiant(), 'sanctum')->getJson('/api/parametre')->assertStatus(403);
    }

    /** @test */
    public function un_etudiant_ne_peut_pas_televerser_d_image(): void
    {
        $source = public_path('img/plats/eru.jpg');
        $this->assertFileExists($source);
        $temporaire = tempnam(sys_get_temp_dir(), 'rbac_') . '.jpg';
        copy($source, $temporaire);

        $reponse = $this->actingAs($this->etudiant(), 'sanctum')
            ->post('/api/upload_image', [
                'image'   => new UploadedFile($temporaire, 'eru.jpg', 'image/jpeg', null, true),
                'dossier' => 'plats',
            ], ['Accept' => 'application/json']);

        $reponse->assertStatus(403);
        @unlink($temporaire);
    }
}
