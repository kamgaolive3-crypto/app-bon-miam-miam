<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('paiement')) {
            return;
        }

        Schema::create('paiement', function (Blueprint $table) {
            $table->string('Id_paiement', 6)->primary();
            $table->bigInteger('montant_paye');
            $table->string('mode_paiement', 10);
            $table->dateTime('date_paiement')->useCurrent();
            $table->string('statut_paiement', 30)->default('en_cours_validation');
            $table->string('reference_transaction', 150)->nullable()->unique();
            $table->string('Id_commande', 8);

            $table->foreign('Id_commande', 'fk_paiement_commande')
                ->references('Id_commande')
                ->on('commande');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `paiement`
                ADD CONSTRAINT `chk_pai_id`
                CHECK (REGEXP_LIKE(`Id_paiement`, '^[A-Z]{2}[0-9]{4}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `paiement`
                ADD CONSTRAINT `chk_pai_montant`
                CHECK (`montant_paye` >= 0)
            ");

            DB::statement("
                ALTER TABLE `paiement`
                ADD CONSTRAINT `chk_pai_mode`
                CHECK (`mode_paiement` IN ('MOMO', 'OM', 'CARTE'))
            ");

            DB::statement("
                ALTER TABLE `paiement`
                ADD CONSTRAINT `chk_pai_statut`
                CHECK (`statut_paiement` IN (
                    'paye',
                    'en_cours_validation',
                    'annule',
                    'echoue',
                    'rembourse'
                ))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('paiement');
    }
};