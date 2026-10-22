<?php

namespace Tests\Feature;

use App\Models\Paiement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Filtre de periode du/au sur les statistiques (prop. d'Ash integree au
 * dashboard et aux ventes) + verrouillage des roles deja appliqués ailleurs.
 */
class StatistiquesFiltresTest extends TestCase
{
    use RefreshDatabase;

    private function gerant()
    {
        $u = \App\Models\Utilisateur::factory()->create();
        \App\Models\Gerant::factory()->create([
            'Id_utilisateur' => $u->Id_utilisateur,
            'Id_restaurant'  => \App\Models\Restaurant::factory()->create()->Id_restaurant,
        ]);
        return $u;
    }

    /** @test */
    public function sans_filtre_le_dashboard_renvoie_les_ca_fixes(): void
    {
        $reponse = $this->actingAs($this->gerant(), 'sanctum')
            ->getJson('/api/stats/dashboard');

        $reponse->assertOk()
            ->assertJsonStructure(['jour' => ['ca'], 'semaine' => ['ca'], 'mois' => ['ca']])
            ->assertJsonPath('personnalise', null)
            ->assertJsonPath('ca_encaisse', 0);
    }

    /** @test */
    public function le_filtre_du_au_limites_le_calcul_du_ca(): void
    {
        // une commande DANS la fenetre et une commande DEHORS (le mois dernier)
        \App\Models\Commande::factory()->create(['Id_commande' => '#C10001', 'montant_total' => 3000, 'date_commande' => now()]);
        \App\Models\Commande::factory()->create(['Id_commande' => '#C10002', 'montant_total' => 9000, 'date_commande' => now()->subDays(40)]);

        // un paiement paye dans la fenetre, un hors-fenetre, un non paye dedans
        // (on pointe vers les commandes existantes : la factory de Paiement
        // cree sinon sa propre commande, qui tomberait dans la fenetre)
        Paiement::factory()->create(['montant_paye' => 3000, 'statut_paiement' => 'paye', 'date_paiement' => now(), 'Id_commande' => '#C10001']);
        Paiement::factory()->create(['montant_paye' => 9000, 'statut_paiement' => 'paye', 'date_paiement' => now()->subDays(40), 'Id_commande' => '#C10002']);
        Paiement::factory()->create(['montant_paye' => 5000, 'statut_paiement' => 'en_cours_validation', 'date_paiement' => now(), 'Id_commande' => '#C10001']);

        $reponse = $this->actingAs($this->gerant(), 'sanctum')
            ->getJson('/api/stats/dashboard?' . http_build_query([
                'du' => now()->toDateString(),
                'au' => now()->toDateString(),
            ]));

        $reponse->assertOk()
            // les CA fixes n ont plus de sens, seul le CA personnalise compte
            ->assertJsonPath('jour', null)
            ->assertJsonPath('personnalise.ca', 3000)
            // seuls les paiements au statut « paye » de la periode sont encaisses
            ->assertJsonPath('ca_encaisse', 3000);
    }

    /** @test */
    public function une_periode_inversee_au_avant_du_est_rejetee(): void
    {
        $this->actingAs($this->gerant(), 'sanctum')
            ->getJson('/api/stats/dashboard?' . http_build_query([
                'du' => '2026-10-20',
                'au' => '2026-10-01',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('au');
    }

    /** @test */
    public function ventes_semaine_accepte_une_fenetre_personnalisee(): void
    {
        \App\Models\Commande::factory()->create(['montant_total' => 4000, 'date_commande' => now()->subDays(30)]);

        $reponse = $this->actingAs($this->gerant(), 'sanctum')
            ->getJson('/api/stats/ventes-semaine?du=' . now()->subDays(31)->toDateString()
                . '&au=' . now()->subDays(29)->toDateString());

        $reponse->assertOk()
            ->assertJsonPath('periode.0', now()->subDays(31)->toDateString())
            ->assertJsonPath('periode.1', now()->subDays(29)->toDateString())
            ->assertJsonPath('total_commandes', 1); // la commande de jour -30 est dans la fenetre
    }
}
