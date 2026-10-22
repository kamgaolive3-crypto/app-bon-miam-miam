<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Participation_evenement extends Model
{
    use HasFactory;
    protected $table = 'participation_evenement';
    public $timestamps = false;
    protected $fillable = [
        'Id_utilisateur',
        'Id_evenement',
        'date_participation',
        'points_gagnes',
        'prix_gagne',
        'Id_mvt',
    ];

    public function mouvement_pts(){
        return $this->belongsTo(MvtPoint::class,'Id_mvt','Id_mvt');
    }
    public function etudiants(){
        return $this->belongsTo(Etudiant::class,'Id_utilisateur','Id_utilisateur');
    }
    public function evenements(){
        return $this->belongsTo(Evenement::class,'Id_evenement','Id_evenement');
    }
}
