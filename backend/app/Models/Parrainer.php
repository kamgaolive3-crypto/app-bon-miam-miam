<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parrainer extends Model
{
    protected $table = 'parrainer';
    protected $primaryKey = 'Id_filleul';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_filleul',
        'Id_parrain',
        'date_parrainage',
        'recompense_attribuee',
    ];

    protected $casts = [
        'date_parrainage' => 'datetime',
        'recompense_attribuee' => 'boolean',
    ];

    public function filleul(){
        return $this->belongsTo(Etudiant::class, 'Id_filleul', 'Id_utilisateur');
    }

    public function parrain(){
        return $this->belongsTo(Etudiant::class, 'Id_parrain', 'Id_utilisateur');
    }
}