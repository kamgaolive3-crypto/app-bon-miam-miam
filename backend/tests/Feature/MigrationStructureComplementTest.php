<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MigrationStructureComplementTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function la_table_historique_statut_existe_avec_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_historique', 'nouveau_statut', 'date_changement', 'Id_commande', 'Id_utilisateur'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('historique_statut', $colonne),
                "La colonne {$colonne} manque dans la table historique_statut"
            );
        }
    }

    /** @test */
    public function la_table_parrainer_existe_avec_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_filleul', 'Id_parrain', 'date_parrainage', 'recompense_attribuee'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('parrainer', $colonne),
                "La colonne {$colonne} manque dans la table parrainer"
            );
        }
    }

    /** @test */
    public function la_table_reclamation_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_reclamation', 'date_reclamation', 'motif_reclamation', 'statut_reclamation', 'Id_utilisateur', 'Id_commande'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('reclamation', $colonne),
                "La colonne {$colonne} manque dans la table reclamation"
            );
        }
    }

    /** @test */
    public function la_table_mvt_points_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_mvt', 'date_mvt', 'nbres_points', 'type_mvt', 'Id_utilisateur'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('mvt_points', $colonne),
                "La colonne {$colonne} manque dans la table mvt_points"
            );
        }
    }

    /** @test */
    public function la_table_livraison_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_livraison', 'adresse_livraison', 'frais_livraison', 'statut_livraison', 'Id_commande'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('livraison', $colonne),
                "La colonne {$colonne} manque dans la table livraison"
            );
        }
    }

    /** @test */
    public function la_table_contenir_existe_avec_cles_etrangeres(): void
    {
        $this->assertTrue($this->hasColumn('contenir', 'Id_commande'));
        $this->assertTrue($this->hasColumn('contenir', 'Id_article'));
        $this->assertTrue($this->hasColumn('contenir', 'quantite'));
        $this->assertTrue($this->hasColumn('contenir', 'prix_unitaire'));
    }

    /** @test */
    public function la_table_reinitialisation_mdp_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_reset', 'token_hash', 'date_demande', 'date_expiration', 'utilise', 'Id_utilisateur'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('reinitialisation_mdp', $colonne),
                "La colonne {$colonne} manque dans la table reinitialisation_mdp"
            );
        }
    }

    /** @test */
    public function la_table_parametre_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_parametre', 'cle', 'valeur', 'Id_utilisateur'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('parametre', $colonne),
                "La colonne {$colonne} manque dans la table parametre"
            );
        }
    }

    /** @test */
    public function la_table_mise_a_jour_menu_existe_avec_cles_etrangeres(): void
    {
        $this->assertTrue($this->hasColumn('mise_a_jour_menu', 'Id_utilisateur'));
        $this->assertTrue($this->hasColumn('mise_a_jour_menu', 'Id_article'));
        $this->assertTrue($this->hasColumn('mise_a_jour_menu', 'date_modification'));
    }

    /** @test */
    public function la_table_gestion_menu_admin_existe_avec_cles_etrangeres(): void
    {
        $this->assertTrue($this->hasColumn('gestion_menu_admin', 'Id_utilisateur'));
        $this->assertTrue($this->hasColumn('gestion_menu_admin', 'Id_article'));
        $this->assertTrue($this->hasColumn('gestion_menu_admin', 'date_modification'));
    }

    /** @test */
    public function la_table_cookies_existe_avec_toutes_les_colonnes_essentielles(): void
    {
        $colonnes = ['Id_cookies', 'date_cookies', 'choix_cookies', 'version_politique'];

        foreach ($colonnes as $colonne) {
            $this->assertTrue(
                $this->hasColumn('cookies', $colonne),
                "La colonne {$colonne} manque dans la table cookies"
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