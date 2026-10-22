<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cookies extends Model
{
    protected $table = 'cookies';
    protected $primaryKey = 'Id_cookies';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_cookies',
        'date_cookies',
        'choix_cookies',
        'version_politique',
        'Id_utilisateur',
    ];

    protected $casts = [
        'date_cookies' => 'datetime',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'Id_utilisateur', 'Id_utilisateur');
    }
}
