<?php

namespace Tests\Unit;

use App\Models\Utilisateur;
use App\Models\Etudiant;
use App\Models\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UtilisateurTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function un_utilisateur_peut_etre_cree_avec_tous_les_champs_obligatoires(): void
    {
        $utilisateur = Utilisateur::factory()->create();

        $this->assertDatabaseHas('utilisateur', [
            'Id_utilisateur' => $utilisateur->Id_utilisateur,
            'email' => $utilisateur->email,
            'statut_compte' => 'actif',
        ]);

        $this->assertNotNull($utilisateur->mot_de_passe);
        $this->assertNotEquals('password123', $utilisateur->mot_de_passe);
    }

    /** @test */
    public function un_utilisateur_peut_avoir_un_etudiant_lie(): void
    {
        $etudiant = Etudiant::factory()->create();

        $this->assertDatabaseHas('etudiant', [
            'Id_utilisateur' => $etudiant->Id_utilisateur,
        ]);

        $this->assertInstanceOf(Utilisateur::class, $etudiant->utilisateur);
        $this->assertEquals($etudiant->Id_utilisateur, $etudiant->utilisateur->Id_utilisateur);
    }

    /** @test */
    public function le_role_d_un_utilisateur_est_correctement_resolu(): void
    {
        $etudiant = Etudiant::factory()->create();
        $utilisateur = $etudiant->utilisateur;

        $this->assertSame('etudiant', $utilisateur->role);
    }

    /** @test */
    public function le_role_d_un_utilisateur_inconnu_retourne_inconnu(): void
    {
        $utilisateur = Utilisateur::factory()->create();

        $this->assertSame('inconnu', $utilisateur->role);
    }

    /** @test */
    public function le_mot_de_passe_est_hache_en_base_de_donnees(): void
    {
        $utilisateur = Utilisateur::factory()->create(['mot_de_passe' => 'MonSuperMotDePasse123']);

        $this->assertTrue(password_verify('MonSuperMotDePasse123', $utilisateur->mot_de_passe));
    }
}