<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    protected $table = 'livraison';
    protected $primaryKey = 'Id_livraison';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_livraison',
        'adresse_livraison',
        'frais_livraison',
        'statut_livraison',
        'date_prevue',
        'date_livraison',
        'Id_commande',
        'Id_utilisateur',
    ];

    protected $casts = [
        'frais_livraison' => 'integer',
        'date_prevue' => 'datetime',
        'date_livraison' => 'datetime',
    ];

    public function commande(){
        return $this->belongsTo(Commande::class, 'Id_commande', 'Id_commande');
    }

    public function livreur(){
        return $this->belongsTo(Employe::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}