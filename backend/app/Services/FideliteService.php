<?php

namespace App\Services;

use App\Models\MvtPoint;
use DomainException;
use Illuminate\Support\Facades\DB;

class FideliteService
{
    // Combien de points rapporte un montant (ex. 5000 FCFA => 50 points)
    public function pointsPourMontant(int $montant): int
    {
        return intdiv($montant, (int) config('fidelite.fcfa_par_point'));
    }

    // Gain : une ligne dans mvt_points + solde_point augmenté, dans UNE transaction
    public function attribuer(string $idEtudiant, int $points, string $type, ?string $idCommande = null): MvtPoint
    {
        if ($points <= 0) {
            throw new DomainException('Le nombre de points doit être positif.');
        }

        return DB::transaction(function () use ($idEtudiant, $points, $type, $idCommande) {
            $this->verrouillerEtudiant($idEtudiant);

            // Anti-doublon : une commande ne rapporte des points qu'une fois par type
            if ($idCommande && MvtPoint::where('Id_commande', $idCommande)->where('type_mvt', $type)->exists()) {
                throw new DomainException('Points déjà attribués pour cette commande.');
            }

            $mvt = MvtPoint::create([
                'Id_mvt'          => $this->nouvelId(),
                'nbres_points'    => $points,
                'type_mvt'        => $type,
                'date_expiration' => now()->addMonths((int) config('fidelite.validite_mois')),
                'Id_utilisateur'  => $idEtudiant,
                'Id_commande'     => $idCommande,
            ]);

            DB::table('etudiant')->where('Id_utilisateur', $idEtudiant)->increment('solde_point', $points);

            return $mvt;
        });
    }

    // Dépense : refusée si le solde est insuffisant
    public function utiliser(string $idEtudiant, int $points, ?string $idCommande = null): MvtPoint
    {
        if ($points <= 0) {
            throw new DomainException('Le nombre de points doit être positif.');
        }

        return DB::transaction(function () use ($idEtudiant, $points, $idCommande) {
            $solde = $this->verrouillerEtudiant($idEtudiant);

            if ($solde < $points) {
                throw new DomainException('Solde de points insuffisant.');
            }

            $mvt = MvtPoint::create([
                'Id_mvt'         => $this->nouvelId(),
                'nbres_points'   => -$points,          // convention : dépense négative (À CONFIRMER)
                'type_mvt'       => 'utilisation',
                'Id_utilisateur' => $idEtudiant,
                'Id_commande'    => $idCommande,
            ]);

            DB::table('etudiant')->where('Id_utilisateur', $idEtudiant)->decrement('solde_point', $points);

            return $mvt;
        });
    }

    // Verrouille la ligne de l'étudiant et renvoie son solde actuel
    private function verrouillerEtudiant(string $idEtudiant): int
    {
        $solde = DB::table('etudiant')
            ->where('Id_utilisateur', $idEtudiant)
            ->lockForUpdate()
            ->value('solde_point');

        if ($solde === null) {
            throw new DomainException('Étudiant introuvable.');
        }

        return (int) $solde;
    }

    // Format imposé par le CHECK : 2 lettres majuscules + 3 chiffres (ex. AB042)
    private function nouvelId(): string
    {
        do {
            $id = chr(random_int(65, 90)) . chr(random_int(65, 90))
                . str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        } while (MvtPoint::where('Id_mvt', $id)->exists());

        return $id;
    }
}
