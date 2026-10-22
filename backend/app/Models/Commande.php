<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    use HasFactory;
    protected $table = 'commande';
    protected $primaryKey = 'Id_commande';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_commande',
        'date_commande',
        'montant_total',
        'mode_service',
        'statut_commande',
        'points_utilises',
        'reduction_points',
        'commentaire',
        'heure_recup',
        'Id_utilisateur',
        'Id_restaurant',
        'Id_valideur',
        'date_validation',
        'Id_admin_valideur',
        'date_validation_admin',
    ];

    protected $casts = [
        'date_commande' => 'datetime',
        'montant_total' => 'integer',
        'points_utilises' => 'integer',
        'reduction_points' => 'integer',
    ];

    public function etudiant(){
        return $this->belongsTo(Etudiant::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function restaurant(){
        return $this->belongsTo(Restaurant::class, 'Id_restaurant', 'Id_restaurant');
    }

    public function valideur(){
        return $this->belongsTo(Employe::class, 'Id_valideur', 'Id_utilisateur');
    }

    public function adminValideur(){
        return $this->belongsTo(Administrateur::class, 'Id_admin_valideur', 'Id_utilisateur');
    }

    public function articles(){
        return $this->belongsToMany(ArticleMenu::class, 'contenir', 'Id_commande', 'Id_article')
                    ->withPivot('quantite', 'prix_unitaire');
    }

    public function paiements(){
        return $this->hasMany(Paiement::class, 'Id_commande', 'Id_commande');
    }

    public function historiqueStatuts(){
        return $this->hasMany(HistoriqueStatut::class, 'Id_commande', 'Id_commande');
    }

    public function livraison(){
        return $this->hasOne(Livraison::class, 'Id_commande', 'Id_commande');
    }
}