<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employe extends Model
{
    use HasFactory;

    protected $table = 'employe';
    protected $primaryKey = 'Id_utilisateur';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_utilisateur',
        'poste',
        'date_embauche',
        'Id_restaurant',
        'Id_createur',
        'date_creation_compte',
    ];

    protected $casts = [
        'date_embauche' => 'date',
        'date_creation_compte' => 'datetime',
    ];

    public function utilisateur(){
        return $this->belongsTo(Utilisateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function restaurant(){
        return $this->belongsTo(Restaurant::class, 'Id_restaurant', 'Id_restaurant');
    }
}
