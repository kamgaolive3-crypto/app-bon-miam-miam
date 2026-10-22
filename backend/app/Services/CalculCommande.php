<?php

namespace App\Services;

use DomainException;

/**
 * Calcule le montant d'une commande selon les règles du cahier des charges.
 *
 * C'est une classe "pure" : elle ne touche ni à la base de données ni à Laravel.
 * Elle est donc facile à tester et à expliquer.
 *
 * Ordre du calcul :
 *   sous-total des articles
 *   - promotion en cours (en %)
 *   - réduction par points (tranches de 15 points = 1000 F)
 *   + frais de livraison (seulement en mode livraison)
 *   = total à payer
 */
final class CalculCommande
{
    public const POINTS_PAR_REDUCTION = 15;   // 15 points...
    public const VALEUR_REDUCTION = 1000;     // ... = 1000 F de réduction
    public const MONTANT_PAR_POINT = 1000;    // 1000 F dépensés = 1 point gagné
    public const FRAIS_LIVRAISON = 500;       // F CFA : valeur PROVISOIRE, à confirmer avec l'équipe

    private function __construct(
        public readonly int $sousTotal,
        public readonly int $promotion,        // montant de la promotion, en F
        public readonly int $pointsUtilises,
        public readonly int $reductionPoints,  // montant de la réduction par points, en F
        public readonly int $fraisLivraison,
        public readonly int $total,
        public readonly int $pointsGagnes,
    ) {
    }

    /**
     * @param int  $sousTotal       somme (prix x quantité) des articles
     * @param int  $tauxPromotion   taux de la promotion active, en % (0 s'il n'y en a pas)
     * @param int  $pointsDemandes  points que l'étudiant veut utiliser
     * @param int  $soldePoints     points que l'étudiant possède
     * @param bool $livraison       true si la commande est en livraison
     *
     * @throws DomainException si les points demandés sont invalides
     */
    public static function calculer(
        int $sousTotal,
        int $tauxPromotion,
        int $pointsDemandes,
        int $soldePoints,
        bool $livraison
    ): self {
        if ($pointsDemandes % self::POINTS_PAR_REDUCTION !== 0) {
            throw new DomainException('Les points doivent être utilisés par multiple de 15 (1 tranche = 1000 F).');
        }
        if ($pointsDemandes > $soldePoints) {
            throw new DomainException('Solde de points insuffisant.');
        }

        // 1. Promotion (en pourcentage du sous-total)
        $taux = max(0, min(100, $tauxPromotion));
        $promotion = intdiv($sousTotal * $taux, 100);
        $apresPromotion = $sousTotal - $promotion;

        // 2. Réduction par points : un multiple de 1000 F, jamais plus que le montant à payer
        $tranches = min(
            intdiv($pointsDemandes, self::POINTS_PAR_REDUCTION),
            intdiv($apresPromotion, self::VALEUR_REDUCTION)
        );
        $reductionPoints = $tranches * self::VALEUR_REDUCTION;
        $pointsUtilises = $tranches * self::POINTS_PAR_REDUCTION;

        // 3. Frais de livraison et total
        $fraisLivraison = $livraison ? self::FRAIS_LIVRAISON : 0;
        $articlesAPayer = $apresPromotion - $reductionPoints;

        return new self(
            $sousTotal,
            $promotion,
            $pointsUtilises,
            $reductionPoints,
            $fraisLivraison,
            $articlesAPayer + $fraisLivraison,
            intdiv($articlesAPayer, self::MONTANT_PAR_POINT) // les frais ne rapportent pas de points
        );
    }
}
