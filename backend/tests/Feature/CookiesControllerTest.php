<?php

namespace Tests\Feature;

use App\Models\Cookies;
use App\Models\Utilisateur;
use Tests\TestCase;

class CookiesControllerTest extends TestCase
{
    public function test_un_visiteur_peut_enregistrer_son_consentement(): void
    {
        $this->postJson('/api/cookies', [
            'choix_cookies' => 'accepte',
            'version_politique' => 'v1',
        ])
            ->assertCreated()
            ->assertJsonPath('message', 'Préférences cookies enregistrées.');

        $this->assertDatabaseCount('cookies', 1);
        $this->assertDatabaseHas('cookies', [
            'choix_cookies' => 'accepte',
            'version_politique' => 'v1',
            'Id_utilisateur' => null,
        ]);
    }

    public function test_un_choix_de_consentement_invalide_est_refuse(): void
    {
        $this->postJson('/api/cookies', [
            'choix_cookies' => 'peut-etre',
            'version_politique' => 'v1',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('choix_cookies');

        $this->assertDatabaseCount('cookies', 0);
    }

    public function test_le_consentement_est_associe_a_l_utilisateur_connecte(): void
    {
        $utilisateur = Utilisateur::factory()->create();

        $this->actingAs($utilisateur, 'sanctum')
            ->postJson('/api/cookies', [
                'choix_cookies' => 'refuse',
                'version_politique' => 'v1',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('cookies', [
            'choix_cookies' => 'refuse',
            'version_politique' => 'v1',
            'Id_utilisateur' => $utilisateur->Id_utilisateur,
        ]);
    }

    public function test_un_utilisateur_connecte_peut_lire_son_dernier_consentement(): void
    {
        $utilisateur = Utilisateur::factory()->create();

        Cookies::create([
            'Id_cookies' => 'CKI12345',
            'choix_cookies' => 'personnalise',
            'version_politique' => 'v1',
            'Id_utilisateur' => $utilisateur->Id_utilisateur,
        ]);

        $this->actingAs($utilisateur, 'sanctum')
            ->getJson('/api/cookies/moi')
            ->assertOk()
            ->assertJsonPath('consentement.choix_cookies', 'personnalise')
            ->assertJsonPath('consentement.version_politique', 'v1');
    }
}