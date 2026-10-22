<?php

namespace App\Http\Controllers;

use App\Models\Cookies;
use Illuminate\Http\Request;

class CookiesController extends Controller
{
    /**
     * Enregistrer le consentement cookies (US-004, RGPD).
     * Accessible SANS connexion (visiteur) ; lié à l'utilisateur si connecté.
     * POST /api/cookies { choix_cookies: "accepte"|"refuse"|"personnalise", version_politique: "..." }
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'choix_cookies'     => 'required|in:accepte,refuse,personnalise',
            'version_politique' => 'required|string|max:30',
        ]);

        $cookies = Cookies::create([
            'Id_cookies'        => $this->genererId(),
            'choix_cookies'     => $data['choix_cookies'],
            'version_politique' => $data['version_politique'],
            'Id_utilisateur'    => $request->user()?->Id_utilisateur, // null = visiteur
        ]);

        return response()->json(['message' => 'Préférences cookies enregistrées.'], 201);
    }

    /**
     * Dernier consentement de l'utilisateur connecté (re-bannière si absent).
     * GET /api/cookies/moi (auth:sanctum)
     */
    public function moi(Request $request)
    {
        $dernier = Cookies::where('Id_utilisateur', $request->user()->Id_utilisateur)
            ->orderByDesc('date_cookies')
            ->first();

        return response()->json([
            'consentement' => $dernier?->only(['choix_cookies', 'version_politique', 'date_cookies']),
        ]);
    }

    /**
     * Générateur CKI00001 (domaine ID_COOKIE, dictionary $10) without collision.
     */
    private function genererId(): string
    {
        do {
            $id = 'CKI' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Cookies::where('Id_cookies', $id)->exists());

        return $id;
    }
}