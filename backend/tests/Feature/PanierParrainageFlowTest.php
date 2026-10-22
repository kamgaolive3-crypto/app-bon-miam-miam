<?php

namespace Tests\Feature;

use App\Models\ArticleMenu;
use App\Models\Commande;
use App\Models\Etudiant;
use App\Models\Employe;
use App\Models\MvtPoint;
use App\Models\Parrainer;
use App\Models\Restaurant;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanierParrainageFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Contexte : restaurant + article + filleul déjà parrainé par A.
     */
    private function contexte(): array
    {
        $restaurant = Restaurant::create([
            'Id_restaurant'      => 'RS001',
            'nom_restaurant'     => 'ZeDuc@Space',
            'adresse_restaurant' => 'Campus UCAC-ICAM, Yaounde',
            'heure_ouverture'    => '10:00',
            'heure_fermeture'    => '23:00',
        ]);

        $article = ArticleMenu::create([
            'Id_article'            => 'PLA001',
            'nom_article'           => 'Poulet DG',
            'prix_article'          => 3500,
            'categories_article'    => 'plat',
            'disponibilite_article' => true,
            'Id_restaurant'         => 'RS001',
        ]);

        // Parrain : étudiant A
        $parrainUser = Utilisateur::create([
            'Id_utilisateur' => 'ETUD000001',
            'nom' => 'A', 'prenom' => 'Parrain',
            'email' => 'a@test.cm', 'mot_de_passe' => 'Password1',
            'telephone' => '600000004',
        ]);
        Etudiant::create([
            'Id_utilisateur' => 'ETUD000001',
            'code_parrainage' => 'PARR0001',
            'solde_point' => 0,
        ]);

        // Filleul : étudiant B, lié à A par la table parrainer
        $filleulUser = Utilisateur::create([
            'Id_utilisateur' => 'ETUD000002',
            'nom' => 'B', 'prenom' => 'Filleul',
            'email' => 'b@test.cm', 'mot_de_passe' => 'Password1',
            'telephone' => '600000005',
        ]);
        Etudiant::create([
            'Id_utilisateur' => 'ETUD000002',
            'code_parrainage' => 'PERE0001',
            'solde_point' => 0,
        ]);

        Parrainer::create([
            'Id_filleul' => 'ETUD000002',
            'Id_parrain' => 'ETUD000001',
            'recompense_attribuee' => false,
        ]);

        return [$restaurant, $article, $parrainUser, $filleulUser];
    }

    public function test_commande_filleul_declenche_bonus_parrain(): void
    {
        [$restaurant, $article, $parrainUser, $filleulUser] = $this->contexte();

        // 1. Le filleul commande 2 poulets DG = 7000 F
        $reponse = $this->actingAs($filleulUser, 'sanctum')->postJson('/api/commande', [
            'items'         => [['Id_article' => 'PLA001', 'quantite' => 2]],
            'Id_restaurant' => 'RS001',
            'mode_service'  => 'sur_place',
            'heure_recup'   => '18:30',
        ]);

        $reponse->assertStatus(201);

        // 2. Montant total et points : 7000 F payés = 7 points gagnés (US-014)
        $this->assertDatabaseHas('commande', [
            'Id_utilisateur' => 'ETUD000002',
            'montant_total'  => 7000,
            'statut_commande' => 'en_attente',
        ]);

        $filleul  = Etudiant::find('ETUD000002');
        $parrain  = Etudiant::find('ETUD000001');
        $this->assertSame(7, $filleul->solde_point);        // gain fidélité
        $this->assertSame(500, $parrain->solde_point);      // bonus parrain (US-019)

        $this->assertDatabaseHas('parrainer', [
            'Id_filleul'           => 'ETUD000002',
            'recompense_attribuee' => true,
        ]);

        $this->assertDatabaseHas('mvt_points', [
            'Id_utilisateur' => 'ETUD000001',
            'type_mvt'       => 'parrainage',
            'nbres_points'   => 500,
        ]);

        $this->assertDatabaseHas('mvt_points', [
            'Id_utilisateur' => 'ETUD000002',
            'type_mvt'       => 'gain',
        ]);
    }

    public function test_employe_valide_puis_statuts_jusqu_a_servie(): void
    {
        [$restaurant, $article,, $filleulUser] = $this->contexte();

        $commande = $this->actingAs($filleulUser, 'sanctum')->postJson('/api/commande', [
            'items'         => [['Id_article' => 'PLA001', 'quantite' => 1]],
            'Id_restaurant' => 'RS001',
            'mode_service'  => 'sur_place',
            'heure_recup'   => '12:00',
        ])->assertStatus(201)->json();

        // Staff employé (US-025)
        $employeUser = Utilisateur::create([
            'Id_utilisateur' => 'EMPL000001',
            'nom' => 'E', 'prenom' => 'ploye',
            'email' => 'emp@test.cm', 'mot_de_passe' => 'Password1',
            'telephone' => '600000003',
        ]);
        Employe::create([
            'Id_utilisateur' => 'EMPL000001',
            'poste' => 'Cuisinier',
            'Id_restaurant' => 'RS001',
        ]);

        $this->actingAs($employeUser, 'sanctum');

        // valider (US-026)
        $this->postJson("/api/commande/" . rawurlencode($commande['Id_commande']) . "/valider")
            ->assertStatus(200)
            ->assertJsonPath('statut_commande', 'validee');

        // en_preparation -> prete -> servie (transitions autorisées)
        $this->postJson("/api/commande/" . rawurlencode($commande['Id_commande']) . "/statut", ['statut_commande' => 'en_preparation'])->assertStatus(200);
        $this->postJson("/api/commande/" . rawurlencode($commande['Id_commande']) . "/statut", ['statut_commande' => 'prete'])->assertStatus(200);
        $this->postJson("/api/commande/" . rawurlencode($commande['Id_commande']) . "/statut", ['statut_commande' => 'servie'])->assertStatus(200);

        $this->assertDatabaseHas('commande', [
            'Id_commande'     => $commande['Id_commande'],
            'statut_commande' => 'servie',
            'Id_valideur'     => 'EMPL000001',
        ]);

        // historique tracé (US-011/026) : en_attente + 4 changements = 5 entrées
        $idCommande = $commande['Id_commande'];
        $this->assertSame(5, Commande::find($idCommande)->historiqueStatuts()->count());
    }

    public function test_transition_saut_indirect_rejetee(): void
    {
        [$restaurant, $article,, $filleulUser] = $this->contexte();

        $commande = $this->actingAs($filleulUser, 'sanctum')->postJson('/api/commande', [
            'items'         => [['Id_article' => 'PLA001', 'quantite' => 1]],
            'Id_restaurant' => 'RS001',
            'mode_service'  => 'sur_place',
            'heure_recup'   => '12:00',
        ])->assertStatus(201)->json();

        $employeUser = Utilisateur::create([
            'Id_utilisateur' => 'EMPL000001',
            'nom' => 'E', 'prenom' => 'ploye',
            'email' => 'emp2@test.cm', 'mot_de_passe' => 'Password1',
            'telephone' => '600000003',
        ]);
        Employe::create([
            'Id_utilisateur' => 'EMPL000001',
            'poste' => 'Cuisinier',
            'Id_restaurant' => 'RS001',
        ]);

        // de en_attente on ne peut pas aller a en_preparation directement
        $this->actingAs($employeUser, 'sanctum')
            ->postJson("/api/commande/" . rawurlencode($commande['Id_commande']) . "/statut", ['statut_commande' => 'en_preparation'])
            ->assertStatus(422);
    }

    public function test_consentement_cookies_sans_connexion(): void
    {
        // US-004 : bannière OK avant connexion (RGPD)
        $this->postJson('/api/cookies', [
            'choix_cookies'     => 'accepte',
            'version_politique' => 'v1.0',
        ])->assertStatus(201);

        $this->assertDatabaseHas('cookies', [
            'choix_cookies'     => 'accepte',
            'version_politique' => 'v1.0',
        ]);
    }

    public function test_mot_de_passe_reinitialisation_flux(): void
    {
        [, , , $filleulUser] = $this->contexte();

        // demande (US-003, token dev renvoyé - email branché en prod)
        $demande = $this->postJson('/api/auth/mot-de-passe-oublie', [
            'email' => 'b@test.cm',
        ])->assertStatus(201)->json();

        $nouveauMdp = 'Password2'; // conforme CDC (1 majuscule + 1 chiffre)
        $this->postJson('/api/auth/mot-de-passe-reinitialiser', [
            'token'        => $demande['token'],
            'mot_de_passe' => $nouveauMdp,
        ])->assertStatus(200);

        $this->assertTrue(password_verify($nouveauMdp, Utilisateur::find('ETUD000002')->mot_de_passe));
    }
}