<?php

namespace Database\Factories;

use App\Models\ArticleMenu;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArticleMenuFactory extends Factory
{
    public function definition(): array
    {
        return [
            // 3 vraies lettres (regexify) puis 3 chiffres : Str::random peut
            // tirer des chiffres dans les "lettres" et faire echouer la regex
            // de validation ^[A-Z]{3}[0-9]{3}$ dans les tests d API (flaky)
            'Id_article' => fake()->regexify('[A-Z]{3}') . random_int(100, 999),
            'nom_article' => fake()->word(),
            'description' => fake()->sentence(),
            'prix_article' => random_int(500, 5000),
            'categories_article' => fake()->randomElement(['plat', 'boisson', 'dessert', 'accompagnement', 'autre']),
            'disponibilite_article' => true,
            'Menu_du_jour' => false,
            'Id_restaurant' => Restaurant::factory(),
        ];
    }
}