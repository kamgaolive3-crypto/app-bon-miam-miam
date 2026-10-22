<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('commande')) {
            return;
        }
        Schema::create('commande', function (Blueprint $table) {
            $table->string('Id_commande', 8)->primary();
            $table->dateTime('date_commande')->useCurrent();
            $table->bigInteger('montant_total')->default(0);
            $table->string('mode_service', 20); // sur_place, livraison
            $table->string('statut_commande', 30)->default('en_attente');
            $table->integer('points_utilises')->default(0);
            $table->bigInteger('reduction_points')->default(0);
            $table->text('commentaire')->nullable();
            $table->time('heure_recup')->nullable();
            $table->string('Id_utilisateur', 10); // étudiant (Passer)
            $table->string('Id_restaurant', 5);  // Recevoir
            $table->string('Id_valideur', 10)->nullable();       // employé (Valider)
            $table->dateTime('date_validation')->nullable();
            $table->string('Id_admin_valideur', 10)->nullable(); // administrateur (Valider_admin)
            $table->dateTime('date_validation_admin')->nullable();
            $table->timestamps();

            $table->index('Id_utilisateur');
            $table->index('Id_restaurant');
            $table->index('date_commande');
            $table->index('statut_commande');

            $table->foreign('Id_utilisateur')->references('Id_utilisateur')->on('etudiant');
            $table->foreign('Id_restaurant')->references('Id_restaurant')->on('restaurant');
            $table->foreign('Id_valideur')->references('Id_utilisateur')->on('employe');
            $table->foreign('Id_admin_valideur')->references('Id_utilisateur')->on('administrateur');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE `commande` ADD CONSTRAINT `chk_cmd_montant` CHECK (`montant_total` >= 0)");
            DB::statement("ALTER TABLE `commande` ADD CONSTRAINT `chk_cmd_mode` CHECK (`mode_service` IN ('sur_place','livraison'))");
            DB::statement("ALTER TABLE `commande` ADD CONSTRAINT `chk_cmd_statut` CHECK (`statut_commande` IN ('en_attente','validee','en_preparation','prete','en_livraison','servie','annulee'))");
            DB::statement("ALTER TABLE `commande` ADD CONSTRAINT `chk_cmd_points` CHECK (`points_utilises` >= 0)");
            DB::statement("ALTER TABLE `commande` ADD CONSTRAINT `chk_cmd_reduc` CHECK (`reduction_points` >= 0)");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commande');
    }
};
