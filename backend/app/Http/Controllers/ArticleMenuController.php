<?php

namespace App\Http\Controllers;

use App\Models\ArticleMenu;
use Illuminate\Http\Request;

class ArticleMenuController extends Controller
{
    /**
     * affiche tous les article 
     * GET/api/articlemenu: liste
     */
    public function index()
    {
        return ArticleMenu::all();
    }

    /**
     * affiche tous les article au menu du jours
     */
    public function menu_du_jour(){
        $menu = ArticleMenu::where('Menu_du_jour',1)->get();
        return $menu;
    }

    /**
     * affiche tous les plats , boissons, dessert ou accompagnement au menu du jours
     */
    public function plat_du_jour($categorie){
        $menu = ArticleMenu::where('Menu_du_jour',1)
                           ->where('categories_article',$categorie) // categorie doir etre soit plat soir boisson soit dessert soit accompagnement
                           ->get();
        return $menu;
    }

    /**
     * Store a newly created resource in storage.
     * POST/api/articlemenu: creer 
     */
    public function store(Request $request)
    {
        // cloisonnement (CDC) : le menu se gere du cote personnel uniquement ;
        // un etudiant ne peut ni creer, ni modifier, ni supprimer un article.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Gestion du menu reservee au personnel.'], 403);
        }
        $data = $request->validate([
            'Id_article'            => ['required', 'regex:/^[A-Z]{3}[0-9]{3}$/', 'unique:article_menu,Id_article'],
            'nom_article'           => 'required|string|max:150',
            'image_article'         => 'nullable|string',
            'description'           => 'nullable|string',
            'prix_article'          => 'required|integer|min:0',
            'categories_article'    => 'required|in:plat,boisson,dessert,accompagnement,autre',
            'disponibilite_article' => 'boolean',
            'Menu_du_jour'          => 'boolean',
            'Id_restaurant'         => 'required|exists:restaurant,Id_restaurant',
        ]);
        $article = ArticleMenu::create($data);
        return response() ->json($article, 201);
    }

    /**
     * afficher un article precis
     * GET/api/article: n seul
     */
    public function show(string $id)
    {
        return ArticleMenu::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     * PUT/api/article: modifier
     */
    public function update(Request $request, string $id)
    {
        // cloisonnement (CDC) : l etudiant ne modifie pas le menu (il commande).
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Gestion du menu reservee au personnel.'], 403);
        }
        $article = ArticleMenu::findOrFail($id);
        $data = $request->validate([
            // On ignore l'enregistrement courant ($id) dans le contrôle d'unicité,
            // sinon toute mise à jour échouerait car l'Id_article existe déjà.
            // Ignore l'enregistrement courant ($id) + nom explicite de la colonne PK
            // (string) : sans cela, le verificateur cherche une colonne "id" inexistante
            'Id_article'            => ['required', 'regex:/^[A-Z]{3}[0-9]{3}$/', 'unique:article_menu,Id_article,'.$id.',Id_article'],
            'nom_article'           => 'required|string|max:150',
            'image_article'         => 'nullable|string',
            'description'           => 'nullable|string',
            'prix_article'          => 'required|integer|min:0',
            'categories_article'    => 'required|in:plat,boisson,dessert,accompagnement,autre',
            'disponibilite_article' => 'boolean',
            'Menu_du_jour'          => 'boolean',
            'Id_restaurant'         => 'required|exists:restaurant,Id_restaurant',
        ]);

        $article->update($data);
        return response()->json($article, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        // cloisonnement (CDC) : l etudiant ne supprime pas d article du menu.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Gestion du menu reservee au personnel.'], 403);
        }
        ArticleMenu::findOrFail( $id )->delete();
        return response () ->json(['message'=> 'article supprimer']);
    }
}
