<?php

namespace App\Http\Controllers;

use App\Models\Etudiant;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/inscription
     * Crée un compte étudiant : d'abord l'utilisateur, puis le sous-type etudiant
     * (localisation + code de parrainage généré automatiquement).
     */
    public function inscription(Request $request)
    {
        $data = $request->validate([
            'nom'           => 'required|string|max:100',
            'prenom'        => 'required|string|max:100',
            'email'         => 'required|email|max:255|unique:utilisateur,email',
            'telephone'     => ['required', 'regex:/^6[0-9]{8}$/'],
            'mot_de_passe'  => ['required', 'string', 'min:8', 'confirmed',
                'regex:/^(?=.*[A-Z])(?=.*[0-9]).+$/'], // au moins 1 majuscule + 1 chiffre (cahier des charges)
            'localisation'      => 'nullable|string',
            'code_parrainage'   => ['nullable', 'regex:/^[A-Z]{4}[0-9]{4}$/'],
        ]);

        $lettres = '';
            for ($i = 0; $i < 4; $i++) {
                $lettres .= chr(random_int(65, 90)); // A à Z
            }
        $idUtilisateur = $lettres . random_int(100000, 999999);
        $utilisateur = Utilisateur::create([
            // ID au format AAAA123456 : 4 lettres majuscules + 6 chiffres (schéma §10)
            
            'Id_utilisateur' => $idUtilisateur,
            'nom'            => $data['nom'],
            'prenom'         => $data['prenom'],
            'email'          => $data['email'],
            'mot_de_passe'   => $data['mot_de_passe'], // haché par le cast 'hashed'
            'telephone'      => $data['telephone'],
            'statut_compte'  => 'actif',
        ]);

        $code = $lettres . random_int(1000, 9999);
        Etudiant::create([
            'Id_utilisateur'  => $utilisateur->Id_utilisateur,
            'localisation'    => $data['localisation'] ?? null,
            'code_parrainage' => $code,
            'solde_point'     => 0,
        ]);

        // US-018 : utiliser un code de parrainage à l'inscription (optionnel)
        if (! empty($data['code_parrainage'])) {
            $parrain = Etudiant::where('code_parrainage', $data['code_parrainage'])->first();
            if ($parrain && $parrain->Id_utilisateur !== $utilisateur->Id_utilisateur) {
                \App\Models\Parrainer::create([
                    'Id_filleul'           => $utilisateur->Id_utilisateur,
                    'Id_parrain'           => $parrain->Id_utilisateur,
                    'recompense_attribuee' => false,
                ]);
            }
        }

        $token = $utilisateur->createToken('api')->plainTextToken;

        return response()->json([
            'utilisateur' => $utilisateur->only(['Id_utilisateur', 'nom', 'prenom', 'email', 'telephone']),
            'token'       => $token,
        ], 201);
    }

    /**
     * POST /api/auth/connexion
     * Vérifie email + mot de passe et renvoie un jeton Sanctum.
     */
    public function connexion(Request $request)
    {
        $data = $request->validate([
            'email'        => 'required|email',
            'mot_de_passe' => 'required|string',
        ]);

        $utilisateur = Utilisateur::where('email', $data['email'])->first();

        if (! $utilisateur || ! Hash::check($data['mot_de_passe'], $utilisateur->mot_de_passe)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if ($utilisateur->statut_compte !== 'actif') {
            throw ValidationException::withMessages([
                'email' => ['Ce compte est inactif.'],
            ]);
        }

        $token = $utilisateur->createToken('api')->plainTextToken;

        return response()->json([
            'utilisateur' => $utilisateur->only(['Id_utilisateur', 'nom', 'prenom', 'email']),
            'role'        => $utilisateur->role,
            'token'       => $token,
        ]);
    }

    /**
     * POST /api/auth/deconnexion  (protégée : auth:sanctum)
     * Révoque le jeton utilisé par la requête courante.
     */
    public function deconnexion(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /**
     * GET /api/auth/me  (protégée : auth:sanctum)
     * Renvoie le profil de l'utilisateur connecté + son rôle.
     */
    public function me(Request $request)
    {
        return response()->json([
            'utilisateur' => $request->user()->only(['Id_utilisateur', 'nom', 'prenom', 'email', 'telephone', 'statut_compte']),
            'role'        => $request->user()->role,
        ]);
    }
}