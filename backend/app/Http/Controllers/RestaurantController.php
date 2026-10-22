<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    /**
     * afficher tous les restaurants
     * GET/API/restaurant : liste
     */
    public function index()
    {
        return Restaurant::all();
    }

    /**
     * Store a newly created resource in storage.
     * //POST/api/restaurant: creer
     */
    public function store(Request $request)
    {
        // cloisonnement (CDC) : la structure des restaurants est geree par le personnel.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Gestion des restaurants reservee au personnel.'], 403);
        }
        $data = $request->validate([
            'Id_restaurant'        => ['required', 'regex:/^[A-Z]{2}[0-9]{3}$/', 'unique:restaurant,Id_restaurant'],
            'nom_restaurant'       => 'required|string|max:150',
            'adresse_restaurant'   => 'nullable|string',
            'telephone_restaurant' => 'nullable|string|max:30',
            'email_restaurant'     => 'nullable|email|max:255',
            'heure_ouverture'      => 'required',
            'heure_fermeture'      => 'required|after:heure_ouverture',
            'livraison_active'     => 'boolean',
            'statut_restaurant'    => 'in:actif,inactif',
        ]);

        $restaurant = Restaurant::create($data);
        return response()->json($restaurant, 201);
    }

    /**
     * afficher un restaurant precis
     * GET/API/restaurant : un seul
     */
    public function show(string $id)
    {
        return Restaurant::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     * PUT/api/restaurant : modifier
     */
    public function update(Request $request, string $id)
    {
        // cloisonnement (CDC) : l etudiant ne modifie pas les restaurants.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Gestion des restaurants reservee au personnel.'], 403);
        }
        $restaurant = Restaurant::findOrFail($id);

        $data = $request->validate([
            'nom_restaurant'       => 'sometimes|string|max:150',
            'adresse_restaurant'   => 'nullable|string',
            'telephone_restaurant' => 'nullable|string|max:30',
            'email_restaurant'     => 'nullable|email|max:255',
            'heure_ouverture'      => 'sometimes',
            'heure_fermeture'      => 'sometimes',
            'livraison_active'     => 'boolean',
            'statut_restaurant'    => 'in:actif,inactif',
        ]);

        $restaurant->update($data);
        return $restaurant;
    }

    /**
     * Remove the specified resource from storage.
     * DELETE/api/restaurants : supprimer 
     */
    public function destroy(Request $request, string $id)
    {
        // cloisonnement (CDC) : l etudiant ne supprime pas de restaurant.
        if ($request->user()->role === 'etudiant') {
            return response()->json(['message' => 'Gestion des restaurants reservee au personnel.'], 403);
        }
        Restaurant::findOrFail($id)->delete();
        return response()->json(['message' => 'Restaurant supprimé']);
    }
}
