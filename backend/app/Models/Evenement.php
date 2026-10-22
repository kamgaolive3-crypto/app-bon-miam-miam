<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evenement extends Model
{
    use HasFactory;
    protected $table = 'evenement';
    protected $primaryKey ='Id_evenement';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = [
        'Id_evenement',
        'affiche_evenement',
        'debut_evenement',
        'fin_evenement',
        'type_evenement',
        'points_evenement',
        'taux_reduction',
        'description_evenement',
        'Id_utilisateur',
    ];
    public function administrateurs(){
        return $this->belongsTo(Administrateur::class, 'Id_utilisateur','Id_utilisateur');
    }
    public function participation_env(){
        return $this->hasMany(Participation_evenement::class,'Id_evenement','Id_evenement');
    }

    // Alias court attendu par EvenementController::participations()
    public function participations(){
        return $this->participation_env();
    }
    public function scopePromotionsActives($query){
        return $query->where('type_evenement', 'promotion')
                     ->where('debut_evenement', '<=', now())
                     ->where('fin_evenement', '>=', now());
    }

    // Tous les evenements actifs du moment (promotion, evenement, mini_jeu):
    // sert a la page d accueil pour remplir les bandes "Evenements" et
    // "Promotions" (GET /api/evenements/actifs).
    public function scopeActifs($query){
        return $query->where('debut_evenement', '<=', now())
                     ->where('fin_evenement', '>=', now());
    }
}
