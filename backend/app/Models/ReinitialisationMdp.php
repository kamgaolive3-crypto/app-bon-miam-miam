<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReinitialisationMdp extends Model
{
    protected $table = 'reinitialisation_mdp';
    protected $primaryKey = 'Id_reset';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_reset',
        'token_hash',
        'date_demande',
        'date_expiration',
        'utilise',
        'Id_utilisateur',
    ];

    protected $casts = [
        'date_demande' => 'datetime',
        'date_expiration' => 'datetime',
        'utilise' => 'boolean',
    ];

    public function utilisateur(){
        return $this->belongsTo(Utilisateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}