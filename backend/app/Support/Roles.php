<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class Roles
{
    // Le rôle = la table dans laquelle l'utilisateur apparaît (du plus élevé au plus bas)
    public static function de($user): ?string
    {
        $id = $user->Id_utilisateur;

        foreach (['administrateur', 'gerant', 'employe', 'etudiant'] as $role) {
            if (DB::table($role)->where('Id_utilisateur', $id)->exists()) {
                return $role;
            }
        }

        return null;
    }
}
