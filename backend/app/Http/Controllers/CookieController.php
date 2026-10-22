<?php

namespace App\Http\Controllers;

use App\Models\Cookies;
use Illuminate\Http\Request;

class CookieController extends Controller
{
    // POST /api/cookies
    // Appelé quand le visiteur clique sur "Tout accepter" ou "Tout refuser"
    public function store(Request $request)
    {
        //  Vérifie les données envoyées par React
        $data = $request->validate([
            // le choix est obligatoire et limité aux valeurs du CHECK de ta table
            // (le design n'utilise que "accepte" et "refuse")
            'choix_cookies'     => 'required|in:accepte,refuse,personnalise',

            // version du texte de la politique de cookies (obligatoire dans la table)
            'version_politique' => 'required|string|max:30',

            // nullable : un visiteur non connecté n'a pas d'identifiant (NULL en base)
            // exists : si un identifiant est envoyé, il doit exister dans la table utilisateur
            'Id_utilisateur'    => 'nullable|exists:utilisateur,Id_utilisateur',
        ]);

        //  Génère l'identifiant (format COK + 5 chiffres) : le frontend ne le fournit jamais.
        //    On lit le plus grand identifiant existant (ex. COK00007), ou null si la table est vide
        $dernier = Cookies::orderByDesc('Id_cookies')->value('Id_cookies');

        //    substr($dernier, 3) retire "COK" : il reste "00007", converti en nombre 7, puis +1.
        //    Si la table est vide, on commence à 1
        $numero = $dernier ? (int) substr($dernier, 3) + 1 : 1;

        //    str_pad complète avec des zéros à gauche pour avoir 5 chiffres : 8 devient "00008"
        $data['Id_cookies'] = 'COK' . str_pad($numero, 5, '0', STR_PAD_LEFT);

        //  Enregistre la ligne (date_cookies est remplie par MySQL avec la date du jour),
        //    puis renvoie-la avec le code 201 ("créé")
        return response()->json(Cookies::create($data), 201);
    }

    // GET /api/cookies/dernier/{idUtilisateur}
    // Renvoie le dernier choix d'un utilisateur connecté
    public function dernier($idUtilisateur)
    {
        // Cherche ses lignes, les trie de la plus récente à la plus ancienne,
        // prend la première (404 s'il n'a jamais répondu)
        return Cookies::where('Id_utilisateur', $idUtilisateur)
                     ->orderByDesc('date_cookies')
                     ->firstOrFail();
    }
}
