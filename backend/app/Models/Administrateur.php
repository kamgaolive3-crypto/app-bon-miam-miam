<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Administrateur extends Model
{
    use HasFactory;
    protected $table = 'administrateur';
    protected $primaryKey = 'Id_utilisateur';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_utilisateur',
        'date_nomination',
        'Id_restaurant',
    ];

    protected $casts = [
        'date_nomination' => 'date',
    ];

    public function utilisateur(){
        return $this->belongsTo(Utilisateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }

    public function restaurant(){
        return $this->belongsTo(Restaurant::class, 'Id_restaurant', 'Id_restaurant');
    }

    public function evenements(){
        return $this->hasMany(Evenement::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}