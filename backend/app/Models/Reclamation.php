<?php

namespace App\Models;

use App\Models\Administrateur;
use Illuminate\Database\Eloquent\Model;

class Reclamation extends Model
{
    protected $table = 'reclamation';
    protected $primaryKey = 'Id_reclamation';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_reclamation',
        'date_reclamation',
        'motif_reclamation',
        'description_reclamation',
        'statut_reclamation',
        'reponse_reclamation',
        'Id_utilisateur',
        'Id_commande',
        'Id_traitant',
        'date_traitement',
        'Id_gerant',
        'date_decision',
        'decision',
        'Id_admin_traitant',
        'date_traitement_admin',
        'Id_admin_decideur',
        'date_decision_admin',
        'decision_admin',
    ];

    protected $casts = [
        'date_reclamation' => 'datetime',
        'date_traitement' => 'datetime',
        'date_decision' => 'datetime',
        'date_traitement_admin' => 'datetime',
        'date_decision_admin' => 'datetime',
    ];

    public function etudiant(){
        return $this->belongsTo(Etudiant::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function commande(){
        return $this->belongsTo(Commande::class, 'Id_commande', 'Id_commande');
    }

    public function traitant(){
        return $this->belongsTo(Employe::class, 'Id_traitant', 'Id_utilisateur');
    }

    public function gerant(){
        return $this->belongsTo(Gerant::class, 'Id_gerant', 'Id_utilisateur');
    }

    // Circuit administrateur (integre depuis la branche de Ash) :
    // l'admin peut aussi traiter puis decider une reclamation escaladee
    public function adminTraitant(){
        return $this->belongsTo(Administrateur::class, 'Id_admin_traitant', 'Id_utilisateur');
    }

    public function adminDecideur(){
        return $this->belongsTo(Administrateur::class, 'Id_admin_decideur', 'Id_utilisateur');
    }
}