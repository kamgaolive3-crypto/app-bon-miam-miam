<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parametre extends Model
{
    protected $table = 'parametre';
    protected $primaryKey ='Id_parametre';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = [
        'Id_parametre',
        'cle',
        'valeur',
        'Id_utilisateur',
    ];

    public function administrateurs(){
        return $this->belongsTo(Administrateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}
