<?php

namespace Tests\Feature;

use App\Models\Etudiant;
use App\Models\Evenement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvenementControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function on_peut_lister_tous_les_evenements(): void
    {
        Evenement::factory()->count(3)->create();

        $reponse = $this->getJson('/api/evenement');

        $reponse->assertStatus(200);
        $reponse->assertJsonCount(3);
    }

    /** @test */
    public function on_peut_creer_un_evenement(): void
    {
        $etudiant = Etudiant::factory()->create();
        // L'admin est l'utilisateur de l'etudiant dans notre schéma simplifié
        // mais pour le test on force un administrateur
        $admin = \App\Models\Administrateur::factory()->create();

        $donnees = [
            'Id_evenement' => 'EVT0001',
            'debut_evenement' => now()->addDays(1)->toDateTimeString(),
            'fin_evenement' => now()->addDays(2)->toDateTimeString(),
            'type_evenement' => 'promotion',
            'points_evenement' => 50,
            'taux_reduction' => 20,
            'description_evenement' => 'Promo de rentrée',
            'Id_utilisateur' => $admin->Id_utilisateur,
        ];

        // l ecriture est protegee par auth:sanctum : un utilisateur du personnel est requis
        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->postJson('/api/evenement', $donnees);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('evenement', ['Id_evenement' => 'EVT0001']);
    }

    /** @test */
    public function on_peut_recuperer_les_promotions_actives(): void
    {
        Evenement::factory()->count(2)->create([
            'type_evenement' => 'promotion',
            'debut_evenement' => now()->subHours(1),
            'fin_evenement' => now()->addHours(1),
        ]);
        Evenement::factory()->create([
            'type_evenement' => 'promotion',
            'debut_evenement' => now()->addDays(10),
            'fin_evenement' => now()->addDays(11),
        ]);

        $reponse = $this->getJson('/api/promotions/actives');

        $reponse->assertStatus(200);
        $reponse->assertJsonCount(2);
    }

    /** @test */
    public function un_etudiant_peut_participer_a_un_evenement_en_cours(): void
    {
        // solde fixe : l'assertion verifie exactement le gain de l'evenement (30 pts)
        $etudiant = Etudiant::factory()->create(['solde_point' => 0]);
        $evenement = Evenement::factory()->create([
            'debut_evenement' => now()->subHours(1),
            'fin_evenement' => now()->addHours(1),
            'points_evenement' => 30,
            'Id_utilisateur' => \App\Models\Administrateur::factory()->create()->Id_utilisateur,
        ]);

        // le controleur identifie l'etudiant par l'utilisateur connecte (sanctum),
        // pas par le corps de la requete
        $reponse = $this->actingAs(\App\Models\Utilisateur::find($etudiant->Id_utilisateur), 'sanctum')
            ->postJson('/api/evenement/' . $evenement->Id_evenement . '/participer');

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('participation_evenement', [
            'Id_utilisateur' => $etudiant->Id_utilisateur,
            'Id_evenement' => $evenement->Id_evenement,
        ]);
        $this->assertDatabaseHas('etudiant', [
            'Id_utilisateur' => $etudiant->Id_utilisateur,
            'solde_point' => 30,
        ]);
    }

    /** @test */
    public function un_etudiant_ne_peut_pas_participer_deux_fois_a_un_evenement(): void
    {
        $etudiant = Etudiant::factory()->create();
        $admin = \App\Models\Administrateur::factory()->create();
        $evenement = Evenement::factory()->create([
            'debut_evenement' => now()->subHours(1),
            'fin_evenement' => now()->addHours(1),
            'points_evenement' => 30,
            'Id_utilisateur' => $admin->Id_utilisateur,
        ]);

        // Première participation
        $this->actingAs(\App\Models\Utilisateur::find($etudiant->Id_utilisateur), 'sanctum')
            ->postJson('/api/evenement/' . $evenement->Id_evenement . '/participer');

        // Deuxième participation
        $reponse = $this->postJson('/api/evenement/' . $evenement->Id_evenement . '/participer', [
            'Id_utilisateur' => $etudiant->Id_utilisateur,
        ]);

        $reponse->assertStatus(422);
        $this->assertDatabaseCount('participation_evenement', 1);
    }

    /** @test */
    public function on_peut_recuperer_les_participations_d_un_evenement(): void
    {
        $etudiant1 = Etudiant::factory()->create();
        $etudiant2 = Etudiant::factory()->create();
        $admin = \App\Models\Administrateur::factory()->create();
        $evenement = Evenement::factory()->create([
            'debut_evenement' => now()->subHours(1),
            'fin_evenement' => now()->addHours(1),
            'Id_utilisateur' => $admin->Id_utilisateur,
        ]);

        \App\Models\Participation_evenement::factory()->create([
            'Id_utilisateur' => $etudiant1->Id_utilisateur,
            'Id_evenement' => $evenement->Id_evenement,
        ]);
        \App\Models\Participation_evenement::factory()->create([
            'Id_utilisateur' => $etudiant2->Id_utilisateur,
            'Id_evenement' => $evenement->Id_evenement,
        ]);

        $reponse = $this->getJson('/api/evenement/' . $evenement->Id_evenement . '/participations');

        $reponse->assertStatus(200);
        $reponse->assertJsonCount(2);
    }
}