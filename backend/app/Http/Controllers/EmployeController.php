<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Employe;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmployeController extends Controller
{
    /**
     * afficher la liste des employés
     * GET /api/employes (staff uniquement)
     */
    public function index(Request $request)
    {
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Réservé au personnel.'], 403);
        }

        $employes = Employe::orderBy('date_embauche')->get();

        $utilisateurs = Utilisateur::whereIn('Id_utilisateur', $employes->pluck('Id_utilisateur'))
            ->get(['Id_utilisateur', 'nom', 'prenom', 'email', 'telephone', 'statut_compte'])
            ->keyBy('Id_utilisateur');

        return $employes->map(fn ($e) => [
            'employe' => [
                'Id_utilisateur'       => $e->Id_utilisateur,
                'poste'                => $e->poste,
                'date_embauche'        => $e->date_embauche,
                'Id_restaurant'        => $e->Id_restaurant,
                'Id_createur'          => $e->Id_createur,
                'date_creation_compte' => $e->date_creation_compte,],
            'utilisateur'      => $utilisateurs[$e->Id_utilisateur] ?? null,
        ]);
    }

    /**
     * creer un compte employé par le gérant ou l'administrateur (US-031)
     * l'association Embaucher enregistre le créateur (Id_createur)
     * POST /api/employes
     */
    public function store(Request $request)
    {
        if (! in_array($request->user()->role, ['gerant', 'administrateur'], true)) {
            return response()->json(['message' => 'Seul le gérant ou un administrateur peut créer un employé.'], 403);
        }

        $data = $request->validate([
            'nom'           => 'required|string|max:100',
            'prenom'        => 'required|string|max:100',
            'email'         => 'required|email|max:255|unique:utilisateur,email',
            'telephone'     => ['required', 'regex:/^6[0-9]{8}$/'],
            // CDC : au moins 8 caractères, 1 majuscule, 1 chiffre (contrôle avant hachage)
            'mot_de_passe'  => ['required', 'string', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*[0-9])/'],
            'poste'         => 'required|string|max:100',
            'date_embauche' => 'nullable|date',
            'Id_restaurant' => 'nullable|exists:restaurant,Id_restaurant',
        ]);

        $compte = DB::transaction(function () use ($data, $request) {
            $utilisateur = Utilisateur::create([
                'Id_utilisateur' => $this->genererIdUtilisateur(),
                'nom'            => $data['nom'],
                'prenom'         => $data['prenom'],
                'email'          => $data['email'],
                'mot_de_passe'   => $data['mot_de_passe'], // haché par le cast 'hashed'
                'telephone'      => $data['telephone'],
                'statut_compte'  => 'actif',
            ]);

            Employe::create([
                'Id_utilisateur' => $utilisateur->Id_utilisateur,
                'poste'          => $data['poste'],
                'date_embauche'  => $data['date_embauche'] ?? now()->toDateString(),
                'Id_restaurant'  => $data['Id_restaurant']
                    ?? $this->restaurantDuCreateur($request),
                'Id_createur'    => $request->user()->Id_utilisateur,
            ]);

            return $utilisateur;
        });

        return response()->json([
            'message' => 'Compte employé créé.',
            'employe' => $compte->only(['Id_utilisateur', 'nom', 'prenom', 'email', 'telephone']),
        ], 201);
    }

    /**
     * modifier un employé (US-034) : poste / date d'embauche / statut du compte.
     * le gérant ne modifie que les employés de SON restaurant ; l'admin, tous.
     * PUT /api/employes/{id}
     */
    public function update(Request $request, string $id)
    {
        if (! in_array($request->user()->role, ['gerant', 'administrateur'], true)) {
            return response()->json(['message' => 'Réservé au gérant ou à un administrateur.'], 403);
        }

        $data = $request->validate([
            'poste'         => 'sometimes|string|max:100',
            'date_embauche' => 'sometimes|nullable|date',
            'statut_compte' => 'sometimes|in:actif,inactif',   // désactivation sans suppression
        ]);

        $employe = Employe::findOrFail($id);

        $restaurantCreateur = $this->restaurantDuCreateur($request);
        if ($request->user()->role === 'gerant'
            && $restaurantCreateur
            && $employe->Id_restaurant !== $restaurantCreateur) {
            return response()->json(['message' => 'Employé hors de votre restaurant.'], 403);
        }

        DB::transaction(function () use ($employe, $data) {
            if (isset($data['poste']) || array_key_exists('date_embauche', $data)) {
                $employe->update(array_filter($data, fn ($k) => in_array($k, ['poste', 'date_embauche']), ARRAY_FILTER_USE_KEY));
            }
            if (isset($data['statut_compte'])) {
                Utilisateur::where('Id_utilisateur', $employe->Id_utilisateur)
                    ->update(['statut_compte' => $data['statut_compte']]);
            }
        });

        return response()->json(['message' => 'Employé mis à jour.']);
    }

    /**
     * supprimer un employé — administrateur uniquement (US-034, CRUD complet)
     * DELETE /api/employes/{id}
     */
    public function destroy(Request $request, string $id)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Réservé à un administrateur.'], 403);
        }

        DB::transaction(function () use ($id) {
            Utilisateur::where('Id_utilisateur', $id)->delete(); // cascade -> employe
        });

        return response()->json(['message' => 'Employé supprimé.']);
    }

    /**
     * Restaurant du gérant / administrateur connecté (association Employer).
     */
    private function restaurantDuCreateur(Request $request): ?string
    {
        $utilisateur = $request->user();

        if ($utilisateur->role === 'gerant') {
            return $utilisateur->gerant?->Id_restaurant;
        }

        if ($utilisateur->role === 'administrateur') {
            return $utilisateur->administrateur?->Id_restaurant;
        }

        return null;
    }

    /**
     * Générateur AAAA123456 (domaine ID_USER, dictionnaire §10) sans collision.
     */
    private function genererIdUtilisateur(): string
    {
        do {
            $id = strtoupper(Str::random(4)) . (string) random_int(100000, 999999);
        } while (Utilisateur::where('Id_utilisateur', $id)->exists());

        return $id;
    }
}