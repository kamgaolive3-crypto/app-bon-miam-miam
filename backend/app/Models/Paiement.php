<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $table = 'paiement';
    protected $primaryKey = 'Id_paiement';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'Id_paiement',
        'montant_paye',
        'mode_paiement',
        'date_paiement',
        'statut_paiement',
        'reference_transaction',
        'Id_commande',
    ];

    protected $casts = [
        'montant_paye' => 'integer',
        'date_paiement' => 'datetime',
    ];

    public function commande(){
        return $this->belongsTo(Commande::class, 'Id_commande', 'Id_commande');
    }
}