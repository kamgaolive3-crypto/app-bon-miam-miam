<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Upload d'images pour le personnel (menu/admin) — US 027/033.
 * POST /api/upload_image (multipart) :
 *   image   : fichier jpg/png/webp (2 Mo max)
 *   dossier : "plats" ou "evenements"
 * Renvoie { chemin: "/img/plats/xxx.jpg" } — le chemin exact a enregistrer
 * dans image_article / affiche_evenement. Fini les chemins a saisir a la main :
 * l'interface envoie le fichier, le serveur renvoie le chemin pret a utiliser.
 */
class UploadImageController extends Controller
{
    public function store(Request $request)
    {
        // cloisonnement : le personnel gere les images des plats et affiches ;
        // un etudiant connecte ne peut pas televerser de fichiers.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Reserve au personnel.'], 403);
        }
        $data = $request->validate([
            'image'   => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
            'dossier' => 'required|in:plats,evenements',
        ]);

        // nom de fichier sur : ASCII + unique (les name des uploads ne le sont pas)
        $extension = strtolower($request->file('image')->getClientOriginalExtension() ?: 'jpg');
        $nom = Str::slug(pathinfo($request->file('image')->getClientOriginalName(), PATHINFO_FILENAME), '-')
            . '-' . date('ymd') . '-' . substr((string) Str::uuid(), 0, 6) . '.' . $extension;

        // ecriture DIRECTE dans public/img/... (comme les images du seeder) :
        // pas de storage:link a lancer, le chemin marche sur toute machine
        $repertoire = public_path('img/' . $data['dossier']);
        if (! is_dir($repertoire)) {
            mkdir($repertoire, 0775, true);
        }
        $request->file('image')->move($repertoire, $nom);

        return response()->json([
            'message' => 'image enregistrée',
            'chemin'  => '/img/' . $data['dossier'] . '/' . $nom,
        ], 201);
    }
}
