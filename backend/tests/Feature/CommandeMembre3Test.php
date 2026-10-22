<?php

namespace Tests\Feature;

use App\Models\Administrateur;
use App\Models\ArticleMenu;
use App\Models\Commande;
use App\Models\Employe;
use App\Models\Etudiant;
use App\Models\Evenement;
use App\Models\Restaurant;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Teste la partie "commandes, livraisons et paiements" de bout en bout, via l'API :
 * promotions, livraison, points, historique des statuts, paiements.
 */
class CommandeMembre3Test extends TestCase
{
    use RefreshDatabase;

    private Utilisateur $etudiant;
    private Utilisateur $autreEtudiant;
    private Utilisateur $employe;

    public function setUp(): void
    {
        parent::setUp();

        Restaurant::create([
            'Id_restaurant'   => 'RS001',
            'nom_restaurant'  => 'ZeDuc@Space',
            'adresse_restaurant' => 'Rue de test, Douala',
            'heure_ouverture' => '10:00',
            'heure_fermeture' => '23:00',
        ]);
        ArticleMenu::create([
            'Id_article' => 'PLA001', 'nom_article' => 'Poulet DG', 'prix_article' => 3500,
            'categories_article' => 'plat', 'disponibilite_article' => true, 'Id_restaurant' => 'RS001',
        ]);
        ArticleMenu::create([
            'Id_article' => 'BOI001', 'nom_article' => 'Jus de gingembre', 'prix_article' => 500,
            'categories_article' => 'boisson', 'disponibilite_article' => true, 'Id_restaurant' => 'RS001',
        ]);

        $this->etudiant = $this->creerUtilisateur('ETUD000001', 'etu1@test.cm', '600000011');
        Etudiant::create(['Id_utilisateur' => 'ETUD000001', 'code_parrainage' => 'CODE0001', 'solde_point' => 0]);

        $this->autreEtudiant = $this->creerUtilisateur('ETUD000002', 'etu2@test.cm', '600000012');
        Etudiant::create(['Id_utilisateur' => 'ETUD000002', 'code_parrainage' => 'CODE0002', 'solde_point' => 0]);

        $this->employe = $this->creerUtilisateur('EMPL000001', 'emp@test.cm', '600000013');
        Employe::create(['Id_utilisateur' => 'EMPL000001', 'poste' => 'Cuisinier', 'Id_restaurant' => 'RS001']);

        $this->creerUtilisateur('ADMI000001', 'admin@test.cm', '600000014');
        Administrateur::create(['Id_utilisateur' => 'ADMI000001']);
    }

    // ---------------------------------------------------------------- outils de test

    private function creerUtilisateur(string $id, string $email, string $telephone): Utilisateur
    {
        return Utilisateur::create([
            'Id_utilisateur' => $id, 'nom' => 'Test', 'prenom' => $id,
            'email' => $email, 'mot_de_passe' => 'Password1', 'telephone' => $telephone,
        ]);
    }

    private function creerPromotion(string $id, int $taux, $debut, $fin): void
    {
        Evenement::create([
            'Id_evenement' => $id, 'type_evenement' => 'promotion', 'taux_reduction' => $taux,
            'debut_evenement' => $debut, 'fin_evenement' => $fin, 'points_evenement' => 0,
            'description_evenement' => 'Promotion de test', 'Id_utilisateur' => 'ADMI000001',
        ]);
    }

    /** L'étudiant 1 passe une commande (par défaut : 1 Poulet DG, sur place). */
    private function commander(array $surcharge = [])
    {
        return $this->actingAs($this->etudiant, 'sanctum')->postJson('/api/commande', array_merge([
            'items'         => [['Id_article' => 'PLA001', 'quantite' => 1]],
            'Id_restaurant' => 'RS001',
            'mode_service'  => 'sur_place',
            'heure_recup'   => '12:00',
        ], $surcharge));
    }

    // ---------------------------------------------------------------- promotions

    public function test_une_promotion_active_reduit_le_total(): void
    {
        $this->creerPromotion('EVT0001', 10, now()->subDay(), now()->addDay());

        $this->commander(['items' => [['Id_article' => 'PLA001', 'quantite' => 2]]])
            ->assertStatus(201)
            ->assertJsonPath('montant_total', 6300)
            ->assertJsonPath('reduction_promotion', 700);

        $this->assertSame(6, Etudiant::find('ETUD000001')->solde_point);   // points gagnés sur 6300 F
    }

    public function test_une_promotion_expiree_est_ignoree(): void
    {
        $this->creerPromotion('EVT0001', 50, now()->subDays(3), now()->subDay());

        $this->commander(['items' => [['Id_article' => 'PLA001', 'quantite' => 2]]])
            ->assertStatus(201)
            ->assertJsonPath('montant_total', 7000);
    }

    public function test_la_meilleure_promotion_est_appliquee(): void
    {
        $this->creerPromotion('EVT0001', 10, now()->subDay(), now()->addDay());
        $this->creerPromotion('EVT0002', 20, now()->subDay(), now()->addDay());

        $this->commander(['items' => [['Id_article' => 'PLA001', 'quantite' => 2]]])
            ->assertStatus(201)
            ->assertJsonPath('montant_total', 5600);   // 7000 - 20 %
    }

    // ---------------------------------------------------------------- livraison

    public function test_la_livraison_ajoute_les_frais_et_cree_la_livraison(): void
    {
        $reponse = $this->commander([
            'mode_service'      => 'livraison',
            'heure_recup'       => null,
            'adresse_livraison' => 'Bonamoussadi',
        ])->assertStatus(201)
          ->assertJsonPath('montant_total', 4000)        // 3500 + 500 de frais
          ->assertJsonPath('frais_livraison', 500);

        $this->assertDatabaseHas('livraison', [
            'Id_commande'       => $reponse->json('Id_commande'),
            'adresse_livraison' => 'Bonamoussadi',
            'frais_livraison'   => 500,
            'statut_livraison'  => 'en_attente',
        ]);
    }

    public function test_l_historique_est_ecrit_pendant_la_livraison(): void
    {
        $commande = $this->commander(['mode_service' => 'livraison', 'heure_recup' => null])
            ->assertStatus(201)->json();
        $id = $commande['Id_commande'];
        $idUrl = rawurlencode($id);
        $idLivraison = $commande['livraison']['Id_livraison'];

        $this->actingAs($this->employe, 'sanctum');
       $this->postJson("/api/commande/{$idUrl}/valider")->assertStatus(200);
$this->postJson("/api/commande/{$idUrl}/statut", ['statut_commande' => 'en_preparation'])->assertStatus(200);
$this->postJson("/api/commande/{$idUrl}/statut", ['statut_commande' => 'prete'])->assertStatus(200);

        $this->postJson("/api/livraison/{$idLivraison}/assigner", ['Id_utilisateur' => 'EMPL000001'])->assertStatus(200);
        $this->postJson("/api/livraison/{$idLivraison}/demarrer")->assertStatus(200);
        $this->postJson("/api/livraison/{$idLivraison}/livrer")->assertStatus(200);

        $this->assertSame('servie', Commande::find($id)->statut_commande);
        $this->assertDatabaseHas('historique_statut', ['Id_commande' => $id, 'nouveau_statut' => 'en_livraison']);
        // en_attente, validee, en_preparation, prete, en_livraison, servie
        $this->assertSame(6, Commande::find($id)->historiqueStatuts()->count());
    }

    // ---------------------------------------------------------------- points

    public function test_les_points_utilises_correspondent_a_la_reduction(): void
    {
        Etudiant::where('Id_utilisateur', 'ETUD000001')->update(['solde_point' => 30]);

        // 3 jus = 1500 F : une seule tranche de 1000 F est possible
        $reponse = $this->commander([
            'items'           => [['Id_article' => 'BOI001', 'quantite' => 3]],
            'points_utilises' => 30,
        ])->assertStatus(201);

        $this->assertDatabaseHas('commande', [
            'Id_commande'      => $reponse->json('Id_commande'),
            'points_utilises'  => 15,
            'reduction_points' => 1000,
            'montant_total'    => 500,
        ]);
        $this->assertSame(15, Etudiant::find('ETUD000001')->solde_point);   // 30 - 15 utilisés
    }

    public function test_des_points_non_multiples_de_15_sont_refuses(): void
    {
        Etudiant::where('Id_utilisateur', 'ETUD000001')->update(['solde_point' => 30]);

        $this->commander(['points_utilises' => 10])->assertStatus(422);
    }

    // ---------------------------------------------------------------- paiements

    public function test_l_etudiant_paie_sa_commande_au_montant_du_total(): void
    {
        $id = $this->commander()->assertStatus(201)->json('Id_commande');
        $id = rawurlencode($id);

        $this->actingAs($this->etudiant, 'sanctum')
            ->postJson("/api/commande/{$id}/paiement", ['mode_paiement' => 'MOMO', 'reference_transaction' => 'REF-001'])
            ->assertStatus(201)
            ->assertJsonPath('montant_paye', 3500)
            ->assertJsonPath('statut_paiement', 'en_cours_validation');
    }

    public function test_une_commande_ne_peut_pas_etre_payee_deux_fois(): void
    {
        $id = $this->commander()->assertStatus(201)->json('Id_commande');
        $id = rawurlencode($id);

        $this->actingAs($this->etudiant, 'sanctum');
        $this->postJson("/api/commande/{$id}/paiement", ['mode_paiement' => 'OM'])->assertStatus(201);
        $this->postJson("/api/commande/{$id}/paiement", ['mode_paiement' => 'OM'])->assertStatus(422);
    }

    public function test_un_autre_etudiant_ne_peut_pas_payer_cette_commande(): void
    {
        $id = $this->commander()->assertStatus(201)->json('Id_commande');
        $id = rawurlencode($id);

        $this->actingAs($this->autreEtudiant, 'sanctum')
            ->postJson("/api/commande/{$id}/paiement", ['mode_paiement' => 'MOMO'])
            ->assertStatus(403);
    }

    public function test_le_personnel_verifie_le_paiement_mais_pas_l_etudiant(): void
    {
        $id = $this->commander()->assertStatus(201)->json('Id_commande');
        $id = rawurlencode($id);
        $idPaiement = $this->actingAs($this->etudiant, 'sanctum')
            ->postJson("/api/commande/{$id}/paiement", ['mode_paiement' => 'MOMO'])
            ->json('Id_paiement');

        $this->actingAs($this->etudiant, 'sanctum')
            ->postJson("/api/paiement/{$idPaiement}/verifier", ['statut_paiement' => 'paye'])
            ->assertStatus(403);

        $this->actingAs($this->employe, 'sanctum')
            ->postJson("/api/paiement/{$idPaiement}/verifier", ['statut_paiement' => 'paye'])
            ->assertStatus(200)
            ->assertJsonPath('statut_paiement', 'paye');

        // un paiement déjà vérifié ne peut plus être modifié
        $this->postJson("/api/paiement/{$idPaiement}/verifier", ['statut_paiement' => 'echoue'])->assertStatus(422);
    }

    public function test_annuler_une_commande_payee_rembourse_le_paiement(): void
    {
        $id = $this->commander()->assertStatus(201)->json('Id_commande');
        $id = rawurlencode($id);
        $idPaiement = $this->actingAs($this->etudiant, 'sanctum')
            ->postJson("/api/commande/{$id}/paiement", ['mode_paiement' => 'CARTE'])
            ->json('Id_paiement');
        $this->actingAs($this->employe, 'sanctum')
            ->postJson("/api/paiement/{$idPaiement}/verifier", ['statut_paiement' => 'paye'])
            ->assertStatus(200);

        $this->actingAs($this->etudiant, 'sanctum')->deleteJson("/api/commande/{$id}")->assertStatus(200);

        $this->assertDatabaseHas('paiement', ['Id_paiement' => $idPaiement, 'statut_paiement' => 'rembourse']);
    }
}
