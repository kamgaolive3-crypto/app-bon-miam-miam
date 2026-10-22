<?php

namespace App\Services;

use App\Models\Commande;
use App\Models\HistoriqueStatut;
use App\Models\Livraison;
use Illuminate\Support\Facades\DB;

/**
 * Opérations communes aux commandes, utilisées par CommandeController et LivraisonController :
 * - garder l'historique des statuts,
 * - changer le statut d'une commande,
 * - créer la livraison d'une commande,
 * - mettre à jour les paiements quand une commande est annulée.
 */
class CommandeService
{
    /** Ajoute une ligne dans historique_statut : qui a changé le statut, vers quoi, et quand. */
    public function enregistrerHistorique(string $commandeId, string $utilisateurId, string $statut): void
    {
        HistoriqueStatut::create([
            'Id_historique'  => $this->genererId(HistoriqueStatut::class, 'Id_historique', 'HST', 5, 99999),
            'nouveau_statut' => $statut,
            'Id_commande'    => $commandeId,
            'Id_utilisateur' => $utilisateurId,
        ]);
    }

    /** Change le statut d'une commande ET garde la trace dans l'historique (une seule transaction). */
    public function changerStatut(Commande $commande, string $statut, string $auteurId): void
    {
        DB::transaction(function () use ($commande, $statut, $auteurId) {
            $commande->update(['statut_commande' => $statut]);
            $this->enregistrerHistorique($commande->Id_commande, $auteurId, $statut);

            if ($statut === 'annulee') {
                $this->annulerPaiements($commande);
            }
        });
    }

    /** Crée la livraison d'une commande (une seule livraison par commande). */
    public function creerLivraison(Commande $commande, ?string $adresse, int $frais, $datePrevue = null): Livraison
    {
        return Livraison::create([
            'Id_livraison'      => $this->genererId(Livraison::class, 'Id_livraison', 'LIV', 4, 9999),
            'adresse_livraison' => $adresse
                ?: $commande->etudiant?->localisation
                ?: 'Adresse à préciser',
            'frais_livraison'   => $frais,
            'statut_livraison'  => 'en_attente',
            'date_prevue'       => $datePrevue,
            'Id_commande'       => $commande->Id_commande,
        ]);
    }

    /** Commande annulée : paiement déjà validé = remboursé ; paiement en attente = annulé. */
    private function annulerPaiements(Commande $commande): void
    {
        $commande->paiements()->where('statut_paiement', 'paye')->update(['statut_paiement' => 'rembourse']);
        $commande->paiements()->where('statut_paiement', 'en_cours_validation')->update(['statut_paiement' => 'annule']);
    }

    /** Génère un identifiant du type HST00042, sans collision avec un identifiant existant. */
    private function genererId(string $modele, string $colonne, string $prefixe, int $chiffres, int $max): string
    {
        do {
            $id = $prefixe . str_pad((string) random_int(0, $max), $chiffres, '0', STR_PAD_LEFT);
        } while ($modele::where($colonne, $id)->exists());

        return $id;
    }
}
