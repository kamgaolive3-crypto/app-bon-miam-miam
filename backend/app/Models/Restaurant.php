<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;
    //nom de la table
    protected $table = 'restaurant';
    protected $primaryKey = 'Id_restaurant';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_restaurant',
        'nom_restaurant',
        'adresse_restaurant',
        'telephone_restaurant',
        'email_restaurant',
        'heure_ouverture',
        'heure_fermeture',
        'livraison_active',
        'statut_restaurant',
    ];

    //
    protected $casts = [
        'livraison_active' => 'boolean',
    ];

    public function employes(){
        return $this->hasMany(Employe::class, 'Id_restaurant', 'Id_restaurant');
    }
    public function gerants(){
        return $this->hasMany(Gerant::class, 'Id_restaurant', 'Id_restaurant');
    }
    public function articles(){
        return $this->hasMany(ArticleMenu::class, 'Id_restaurant', 'Id_restaurant');
    }
    public function commandes(){
        return $this->hasMany(Commande::class,'Id_restaurant', 'Id_restaurant');
    }
}
