<?php

namespace Tests\Unit;

use App\Services\CalculCommande;
use DomainException;
use PHPUnit\Framework\TestCase;

/**
 * Teste les règles de calcul d'une commande, sans base de données :
 * promotion, réduction par points, frais de livraison, points gagnés.
 */
class CalculCommandeTest extends TestCase
{
    public function test_commande_simple_sans_promotion_ni_points(): void
    {
        $c = CalculCommande::calculer(7000, 0, 0, 0, false);

        $this->assertSame(7000, $c->total);
        $this->assertSame(7, $c->pointsGagnes);   // 1000 F = 1 point
    }

    public function test_promotion_de_10_pourcent(): void
    {
        $c = CalculCommande::calculer(7000, 10, 0, 0, false);

        $this->assertSame(700, $c->promotion);
        $this->assertSame(6300, $c->total);
        $this->assertSame(6, $c->pointsGagnes);   // les points se calculent sur ce qui est payé
    }

    public function test_reduction_par_points(): void
    {
        $c = CalculCommande::calculer(7000, 0, 30, 30, false);   // 30 points = 2 tranches

        $this->assertSame(2000, $c->reductionPoints);
        $this->assertSame(30, $c->pointsUtilises);
        $this->assertSame(5000, $c->total);
    }

    public function test_la_reduction_ne_depasse_jamais_le_montant_a_payer(): void
    {
        $c = CalculCommande::calculer(1500, 0, 30, 30, false);

        $this->assertSame(1000, $c->reductionPoints);
        $this->assertSame(15, $c->pointsUtilises);   // seuls les points réellement utilisés sont débités
        $this->assertSame(500, $c->total);
    }

    public function test_promotion_puis_points(): void
    {
        $c = CalculCommande::calculer(10000, 20, 15, 15, false);

        $this->assertSame(2000, $c->promotion);
        $this->assertSame(1000, $c->reductionPoints);
        $this->assertSame(7000, $c->total);
        $this->assertSame(7, $c->pointsGagnes);
    }

    public function test_frais_de_livraison_ajoutes_au_total_sans_donner_de_points(): void
    {
        $c = CalculCommande::calculer(3500, 0, 0, 0, true);

        $this->assertSame(CalculCommande::FRAIS_LIVRAISON, $c->fraisLivraison);
        $this->assertSame(3500 + CalculCommande::FRAIS_LIVRAISON, $c->total);
        $this->assertSame(3, $c->pointsGagnes);
    }

    public function test_points_non_multiples_de_15_refuses(): void
    {
        $this->expectException(DomainException::class);

        CalculCommande::calculer(7000, 0, 10, 30, false);
    }

    public function test_solde_de_points_insuffisant_refuse(): void
    {
        $this->expectException(DomainException::class);

        CalculCommande::calculer(7000, 0, 30, 15, false);
    }
}
