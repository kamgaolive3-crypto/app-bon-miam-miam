<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reclamation')) {
            return;
        }

        Schema::create('reclamation', function (Blueprint $table) {
            $table->string('Id_reclamation', 10)->primary();
            $table->dateTime('date_reclamation')->useCurrent();
            $table->string('motif_reclamation', 255);
            $table->text('description_reclamation')->nullable();
            $table->string('statut_reclamation', 20)->default('en_attente');
            $table->text('reponse_reclamation')->nullable();
            $table->string('Id_utilisateur', 10);
            $table->string('Id_commande', 8);
            $table->string('Id_traitant', 10)->nullable();
            $table->dateTime('date_traitement')->nullable();
            $table->string('Id_gerant', 10)->nullable();
            $table->dateTime('date_decision')->nullable();
            $table->string('decision', 50)->nullable();
            $table->string('Id_admin_traitant', 10)->nullable();
            $table->dateTime('date_traitement_admin')->nullable();
            $table->string('Id_admin_decideur', 10)->nullable();
            $table->dateTime('date_decision_admin')->nullable();
            $table->string('decision_admin', 50)->nullable();

            $table->foreign('Id_utilisateur', 'fk_recl_etudiant')
                ->references('Id_utilisateur')
                ->on('etudiant');

            $table->foreign('Id_commande', 'fk_recl_commande')
                ->references('Id_commande')
                ->on('commande');

            $table->foreign('Id_traitant', 'fk_recl_traitant')
                ->references('Id_utilisateur')
                ->on('employe');

            $table->foreign('Id_gerant', 'fk_recl_gerant')
                ->references('Id_utilisateur')
                ->on('gerant');

            $table->foreign('Id_admin_traitant', 'fk_recl_adm_trait')
                ->references('Id_utilisateur')
                ->on('administrateur');

            $table->foreign('Id_admin_decideur', 'fk_recl_adm_decid')
                ->references('Id_utilisateur')
                ->on('administrateur');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `reclamation`
                ADD CONSTRAINT `chk_recl_id`
                CHECK (REGEXP_LIKE(`Id_reclamation`, '^#RECLA[0-9]{4}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `reclamation`
                ADD CONSTRAINT `chk_recl_statut`
                CHECK (`statut_reclamation` IN (
                    'en_attente',
                    'observation',
                    'validee',
                    'rejetee'
                ))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reclamation');
    }
};