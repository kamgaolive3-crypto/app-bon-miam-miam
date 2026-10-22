<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etudiant extends Model
{
    use HasFactory;
    protected $table = 'etudiant';
    protected $primaryKey = 'Id_utilisateur';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_utilisateur',
        'localisation',
        'code_parrainage',
        'solde_point',
    ];

    protected $casts = [
        'solde_point' => 'integer',
    ];

    public function utilisateur(){
        return $this->belongsTo(Utilisateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function participations(){
        return $this->hasMany(Participation_evenement::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function commandes(){
        return $this->hasMany(Commande::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function mvt_points(){
        return $this->hasMany(MvtPoint::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}