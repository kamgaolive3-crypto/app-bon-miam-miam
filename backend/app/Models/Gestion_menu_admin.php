<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gestion_menu_admin extends Model
{
    protected $table = 'gestion_menu_admin';
    public $timestamps = false;
    protected $fillable = [
        'Id_utilisateur',
        'Id_article',
        'date_modification',
        'nature_modification',
    ];

    public function article_menu(){
        return $this->belongsTo(ArticleMenu::class, 'Id_article', 'Id_article');
    }
    public function administrateurs(){
        return $this->belongsTo(Administrateur::class,'Id_utilisateur','Id_utilisateur');
    }
}
