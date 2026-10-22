<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Définit l'URL de base de l'application pour les requêtes de test.
     */
    public function setUp(): void
    {
        parent::setUp();

        // Exécute toutes les migrations sur la base SQLite en mémoire
        $this->artisan('migrate', ['--force' => true]);
    }
}
