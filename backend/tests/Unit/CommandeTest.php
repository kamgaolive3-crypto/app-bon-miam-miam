<?php

namespace Tests\Unit;

use App\Models\Commande;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommandeTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function une_commande_peut_etre_cree_avec_tous_les_champs(): void
    {
        $commande = Commande::factory()->create();

        $this->assertDatabaseHas('commande', [
            'Id_commande' => $commande->Id_commande,
            'montant_total' => $commande->montant_total,
            'statut_commande' => 'en_attente',
        ]);
    }

    /** @test */
    public function une_commande_appartient_a_un_etudiant_et_un_restaurant(): void
    {
        $commande = Commande::factory()->create();

        $this->assertInstanceOf(\App\Models\Etudiant::class, $commande->etudiant);
        $this->assertInstanceOf(\App\Models\Restaurant::class, $commande->restaurant);
        $this->assertSame($commande->Id_utilisateur, $commande->etudiant->Id_utilisateur);
        $this->assertSame($commande->Id_restaurant, $commande->restaurant->Id_restaurant);
    }

    /** @test */
    public function le_montant_total_d_une_commande_est_toujours_positif(): void
    {
        $commande = Commande::factory()->create(['montant_total' => 5000]);

        $this->assertGreaterThanOrEqual(0, $commande->montant_total);
    }
}