<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class UploadImageTest extends TestCase
{
    use RefreshDatabase;

    // pas de GD sur ce PHP : UploadedFile::fake()->image() est indisponible,
    // on copie donc une vraie image du repo dans un temporaire pour l upload
    private function imageReelle(): string
    {
        $source = public_path('img/plats/eru.jpg');
        $this->assertFileExists($source);

        $temporaire = tempnam(sys_get_temp_dir(), 'upload_test_') . '.jpg';
        copy($source, $temporaire);

        return $temporaire;
    }

    /** @test */
    public function le_personnel_peut_uploader_une_image_de_plat(): void
    {
        $temporaire = $this->imageReelle();

        // l ecriture est protegee par auth:sanctum : un utilisateur du personnel est requis
        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->post('/api/upload_image', [
                'image'   => new UploadedFile($temporaire, 'eru.jpg', 'image/jpeg', null, true),
                'dossier' => 'plats',
            ]);

        $reponse->assertStatus(201);
        $chemin = $reponse->json('chemin');
        $this->assertMatchesRegularExpression('#^/img/plats/.+\.jpg$#', $chemin);
        // le fichier existe bien la ou le site le sert (public/img/plats)
        $this->assertFileExists(public_path($chemin));

        // on nettoie le fichier de test pour ne pas polluer l environnement
        @unlink(public_path($chemin));
        @unlink($temporaire);
    }

    /** @test */
    public function le_dossier_doit_etre_plats_ou_evenements(): void
    {
        $temporaire = $this->imageReelle();

        $reponse = $this->actingAs(\App\Models\Utilisateur::factory()->create(), 'sanctum')
            ->post('/api/upload_image', [
                'image'   => new UploadedFile($temporaire, 'eru.jpg', 'image/jpeg', null, true),
                'dossier' => 'autre',
            ], ['Accept' => 'application/json']);

        $reponse->assertStatus(422);
        @unlink($temporaire);
    }

    /** @test */
    public function un_utilisateur_non_connecte_ne_peut_pas_uploader(): void
    {
        $reponse = $this->post('/api/upload_image', ['dossier' => 'plats']);

        $reponse->assertStatus(401);
    }
}
