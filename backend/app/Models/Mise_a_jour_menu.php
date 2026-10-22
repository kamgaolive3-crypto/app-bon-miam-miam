<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mise_a_jour_menu extends Model
{
    protected $table = 'mise_a_jour_menu';
    public $timestamps = false;
    protected $fillable = [
        'Id_utilisateur',
        'Id_article',
        'date_modification',
        'nature_modification',
    ];

    public function employe(){
        return $this->belongsTo(Employe::class, 'Id_utilisateur','Id_utilisateur');
    }
    public function article_menu(){
        return $this->belongsTo(ArticleMenu::class, 'Id_article', 'Id_article');
    }
}
