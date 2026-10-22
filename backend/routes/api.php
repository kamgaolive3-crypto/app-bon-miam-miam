<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\ArticleMenuController;
use App\Http\Controllers\EvenementController;
use App\Http\Controllers\ParametreController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\LivraisonController;
use App\Http\Controllers\FideliteController;
use App\Http\Controllers\ParrainageController;
use App\Http\Controllers\ReclamationController;
use App\Http\Controllers\CookiesController;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\StatistiqueController;
use App\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Route;

// Repli d'authentification : un appel API sans jeton et sans header
// "Accept: application/json" passe ici au lieux de lever une erreur 500
// (Laravel cherche la route nommee [login] pour rediriger les invités).
Route::get('login', fn () => response()->json(['message' => 'Non authentifie.'], 401))
    ->name('login');

// --- Authentification (Sanctum) ---
Route::post('auth/inscription', [AuthController::class, 'inscription']);
Route::post('auth/connexion', [AuthController::class, 'connexion']);
Route::post('auth/mot-de-passe-oublie', [PasswordResetController::class, 'demander']);
Route::post('auth/mot-de-passe-reinitialiser', [PasswordResetController::class, 'reinitialiser']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/deconnexion', [AuthController::class, 'deconnexion']);
    Route::get('auth/me', [AuthController::class, 'me']);
});

// --- Ressources CRUD ---
// Lecture publique (consultation par tous), ecriture reservee au personnel
// connecte (US-027/033/035/036).
Route::get('restaurant', [RestaurantController::class, 'index']);
Route::get('restaurant/{restaurant}', [RestaurantController::class, 'show']);
Route::get('article_menu', [ArticleMenuController::class, 'index']);
Route::get('evenement', [EvenementController::class, 'index']);
Route::get('evenement/{evenement}', [EvenementController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('restaurant', RestaurantController::class)->except(['index', 'show']);
    Route::apiResource('article_menu', ArticleMenuController::class)->except(['index', 'show']);
    Route::apiResource('evenement', EvenementController::class)->except(['index', 'show']);
    Route::apiResource('parametre', ParametreController::class);
});

// --- Routes spécifiques article_menu (doivent être définies AVANT apiResource
//     pour éviter le conflit avec GET /article_menu/{article_menu}) ---
Route::get('article_menu-du-jour', [ArticleMenuController::class, 'menu_du_jour']);
Route::get('article_menu-du-jour/{categorie}', [ArticleMenuController::class, 'plat_du_jour']);

// --- Routes spécifiques evenement ---
Route::get('promotions/actives', [EvenementController::class, 'promotionsActives']);
Route::get('evenements/actifs', [EvenementController::class, 'evenementsActifs']);
Route::post('evenement/{id}/participer', [EvenementController::class, 'participer']);
Route::get('evenement/{id}/participations', [EvenementController::class, 'participations']);

// --- Commandes (le panier est géré côté client ; le serveur revalide tout) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('commande', CommandeController::class)->except(['update']);

    // staff : validation et changement de statut (US-026)
    Route::post('commande/{commande}/valider', [CommandeController::class, 'valider']);
    Route::post('commande/{commande}/statut', [CommandeController::class, 'changerStatut']);

    // étudiant : commentaire après service (US-010)
    Route::post('commande/{commande}/commentaire', [CommandeController::class, 'commentaire']);
});

// --- Livraisons (US-008 / US-026) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('livraison', LivraisonController::class)->except(['update', 'destroy']);

    // cycle de vie : assignée -> en cours -> livrée / échouée
    Route::post('livraison/{livraison}/assigner', [LivraisonController::class, 'assigner']);
    Route::post('livraison/{livraison}/demarrer', [LivraisonController::class, 'demarrer']);
    Route::post('livraison/{livraison}/livrer', [LivraisonController::class, 'livrer']);
    Route::post('livraison/{livraison}/echouer', [LivraisonController::class, 'echouer']);
});
// --- Fidélité (US-014/015/016) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('fidelite/solde', [FideliteController::class, 'solde']);
    Route::get('fidelite/historique', [FideliteController::class, 'historique']);
    Route::post('fidelite/expiration', [FideliteController::class, 'expirer']); // staff / cron
});

// --- Parrainage (US-017/018/020) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('parrainage/code', [ParrainageController::class, 'code']);
    Route::post('parrainage/utiliser', [ParrainageController::class, 'utiliser']);
    Route::get('parrainage/filleuls', [ParrainageController::class, 'filleuls']);
});
// --- Réclamations (US-021/022/038 : dépose étudiant, 3 niveaux staff) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('reclamation', [ReclamationController::class, 'store']);
    Route::get('reclamation', [ReclamationController::class, 'index']);
    Route::get('reclamation/{reclamation}', [ReclamationController::class, 'show']);
    Route::post('reclamation/{reclamation}/traiter', [ReclamationController::class, 'traiter']);
    Route::post('reclamation/{reclamation}/decision-gerant', [ReclamationController::class, 'decisionGerant']);
    Route::post('reclamation/{reclamation}/traiter-admin', [ReclamationController::class, 'traiterAdmin']);
    Route::post('reclamation/{reclamation}/decision-admin', [ReclamationController::class, 'decisionAdmin']);
});

// --- Consentement cookies RGPD (US-004) : bannière possible sans connexion ---
Route::post('cookies', [CookiesController::class, 'store']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('cookies/moi', [CookiesController::class, 'moi']);
});
// --- Comptes employés (US-031/034) : gérant crée & modifie, admin CRUD complet ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('employes', [EmployeController::class, 'index']);
    Route::post('employes', [EmployeController::class, 'store']);
    Route::put('employes/{employe}', [EmployeController::class, 'update']);
    Route::delete('employes/{employe}', [EmployeController::class, 'destroy']);
});
// --- Statistiques (US-029/032/036) + Top 10 clients (US-023, AJAX) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('stats/ventes-semaine', [StatistiqueController::class, 'ventesSemaine']); // staff
    Route::get('stats/dashboard', [StatistiqueController::class, 'dashboard']);          // gérant + admin
    Route::get('stats/top-clients', [StatistiqueController::class, 'topClients']);       // tous (leaderboard)
});

use App\Http\Controllers\PaiementController;
use App\Http\Controllers\UploadImageController;

// --- Paiements (Membre 3) : l'étudiant enregistre, le personnel vérifie ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('paiement', [PaiementController::class, 'index']);
    Route::get('paiement/{paiement}', [PaiementController::class, 'show']);
    Route::post('commande/{commande}/paiement', [PaiementController::class, 'store']);
    Route::post('paiement/{paiement}/verifier', [PaiementController::class, 'verifier']);

    // Upload d'images plats/evenements (personnel) : renvoie le chemin pret a
    // enregistrer dans image_article / affiche_evenement
    Route::post('upload_image', [UploadImageController::class, 'store']);
});
