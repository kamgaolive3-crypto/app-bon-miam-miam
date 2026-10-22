<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'utilisateur';
    protected $primaryKey = 'Id_utilisateur';
    public $incrementing = false;
    public $timestamps = false;
    protected $keyType = 'string';
    protected $fillable = [
        'Id_utilisateur',
        'nom',
        'prenom',
        'email',
        'mot_de_passe',
        'date_inscription',
        'statut_compte',
        'telephone',
    ];
    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];
    protected $casts = [
        'date_inscription' => 'datetime',
        'mot_de_passe' => 'hashed',
    ];

    public function etudiant(){
        return $this->hasOne(Etudiant::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function employe(){
        return $this->hasOne(Employe::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function gerant(){
        return $this->hasOne(Gerant::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function administrateur(){
        return $this->hasOne(Administrateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    /**
     * Retourne le rôle principal de l'utilisateur en vérifiant dans
     * quelle table de sous-type il apparaît.
     */
    public function getRoleAttribute(): string
    {
        if ($this->administrateur()->exists()) return 'administrateur';
        if ($this->gerant()->exists())        return 'gerant';
        if ($this->employe()->exists())       return 'employe';
        if ($this->etudiant()->exists())      return 'etudiant';
        return 'inconnu';
    }
}