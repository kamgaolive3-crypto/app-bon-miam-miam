<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoriqueStatut extends Model
{
    protected $table = 'historique_statut';
    protected $primaryKey = 'Id_historique';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_historique',
        'nouveau_statut',
        'date_changement',
        'Id_commande',
        'Id_utilisateur',
    ];

    protected $casts = [
        'date_changement' => 'datetime',
    ];

    public function commande(){
        return $this->belongsTo(Commande::class, 'Id_commande', 'Id_commande');
    }

    public function auteur(){
        return $this->belongsTo(Utilisateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}