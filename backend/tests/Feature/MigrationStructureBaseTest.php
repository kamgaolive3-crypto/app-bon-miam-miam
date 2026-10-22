<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MigrationStructureBaseTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function la_table_utilisateur_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_utilisateur', 'nom', 'prenom', 'email', 'mot_de_passe', 'telephone', 'statut_compte'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('utilisateur', $colonne),
                "La colonne {$colonne} manque dans la table utilisateur"
            );
        }
    }

    /** @test */
    public function la_table_etudiant_existe_avec_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_utilisateur', 'localisation', 'code_parrainage', 'solde_point'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('etudiant', $colonne),
                "La colonne {$colonne} manque dans la table etudiant"
            );
        }
    }

    /** @test */
    public function la_table_restaurant_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_restaurant', 'nom_restaurant', 'adresse_restaurant', 'heure_ouverture', 'heure_fermeture', 'livraison_active', 'statut_restaurant'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('restaurant', $colonne),
                "La colonne {$colonne} manque dans la table restaurant"
            );
        }
    }

    /** @test */
    public function la_table_commande_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_commande', 'date_commande', 'montant_total', 'mode_service', 'statut_commande', 'Id_utilisateur', 'Id_restaurant'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('commande', $colonne),
                "La colonne {$colonne} manque dans la table commande"
            );
        }
    }

    /** @test */
    public function la_table_article_menu_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_article', 'nom_article', 'prix_article', 'categories_article', 'disponibilite_article', 'Id_restaurant'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('article_menu', $colonne),
                "La colonne {$colonne} manque dans la table article_menu"
            );
        }
    }

    /** @test */
    public function la_table_paiement_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_paiement', 'montant_paye', 'mode_paiement', 'statut_paiement', 'Id_commande'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('paiement', $colonne),
                "La colonne {$colonne} manque dans la table paiement"
            );
        }
    }

    /** @test */
    public function la_table_evenement_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_evenement', 'debut_evenement', 'fin_evenement', 'type_evenement', 'Id_utilisateur'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('evenement', $colonne),
                "La colonne {$colonne} manque dans la table evenement"
            );
        }
    }

    /**
     * Vérifie qu'une colonne existe dans une table donnée.
     */
    protected function hasColumn(string $table, string $column): bool
    {
        return collect(\Illuminate\Support\Facades\Schema::getColumnListing($table))
            ->contains(fn ($col) => $col === $column);
    }
}