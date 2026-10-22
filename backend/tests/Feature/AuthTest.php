<?php

namespace Tests\Feature;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function un_utilisateur_peut_s_inscrire_et_recevoir_un_jeton(): void
    {
        $donnees = [
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@example.com',
            'telephone' => '677123456',
            'mot_de_passe' => 'MotDePasse123!',
            'mot_de_passe_confirmation' => 'MotDePasse123!',
            'localisation' => 'Yaoundé',
        ];

        $reponse = $this->postJson('/api/auth/inscription', $donnees);

        $reponse->assertStatus(201)
            ->assertJsonStructure([
                'utilisateur' => ['Id_utilisateur', 'nom', 'prenom', 'email', 'telephone'],
                'token',
            ]);

        $this->assertDatabaseHas('utilisateur', [
            'email' => 'jean.dupont@example.com',
            'statut_compte' => 'actif',
        ]);

        $this->assertDatabaseHas('etudiant', [
            'Id_utilisateur' => Utilisateur::where('email', 'jean.dupont@example.com')->first()->Id_utilisateur,
        ]);
    }

    /** @test */
    public function l_inscription_echoue_si_le_mot_de_passe_ne_correspond_pas(): void
    {
        $donnees = [
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@example.com',
            'telephone' => '677123456',
            'mot_de_passe' => 'MotDePasse123!',
            'mot_de_passe_confirmation' => 'AutreMotDePasse123!',
        ];

        $reponse = $this->postJson('/api/auth/inscription', $donnees);

        $reponse->assertStatus(422);
    }

    /** @test */
    public function l_inscription_echoue_si_le_telephone_ne_respecte_pas_le_format(): void
    {
        $donnees = [
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@example.com',
            'telephone' => '123456789', // ne commence pas par 6
            'mot_de_passe' => 'MotDePasse123!',
            'mot_de_passe_confirmation' => 'MotDePasse123!',
        ];

        $reponse = $this->postJson('/api/auth/inscription', $donnees);

        $reponse->assertStatus(422);
    }

    /** @test */
    public function un_utilisateur_peut_se_connecter_avec_son_email_et_mot_de_passe(): void
    {
        $utilisateur = Utilisateur::factory()->create([
            'email' => 'jean.dupont@example.com',
            'mot_de_passe' => bcrypt('MotDePasse123!'),
        ]);

        $reponse = $this->postJson('/api/auth/connexion', [
            'email' => 'jean.dupont@example.com',
            'mot_de_passe' => 'MotDePasse123!',
        ]);

        $reponse->assertStatus(200)
            ->assertJsonStructure([
                'utilisateur' => ['Id_utilisateur', 'nom', 'prenom', 'email'],
                'role',
                'token',
            ]);
    }

    /** @test */
    public function la_connexion_echoue_avec_un_mot_de_passe_incorrect(): void
    {
        Utilisateur::factory()->create([
            'email' => 'jean.dupont@example.com',
            'mot_de_passe' => bcrypt('MotDePasse123!'),
        ]);

        $reponse = $this->postJson('/api/auth/connexion', [
            'email' => 'jean.dupont@example.com',
            'mot_de_passe' => 'MauvaisMotDePasse123!',
        ]);

        $reponse->assertStatus(422);
    }

    /** @test */
    public function un_utilisateur_connecte_peut_recuperer_son_profil(): void
    {
        $utilisateur = Utilisateur::factory()->create();
        $token = $utilisateur->createToken('test')->plainTextToken;

        $reponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $reponse->assertStatus(200)
            ->assertJsonStructure([
                'utilisateur' => ['Id_utilisateur', 'nom', 'prenom', 'email', 'telephone', 'statut_compte'],
                'role',
            ]);
    }

    /** @test */
    public function un_utilisateur_connecte_peut_se_deconnecter(): void
    {
        $utilisateur = Utilisateur::factory()->create();
        $token = $utilisateur->createToken('test')->plainTextToken;

        $reponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/deconnexion');

        $reponse->assertStatus(200);
    }
}