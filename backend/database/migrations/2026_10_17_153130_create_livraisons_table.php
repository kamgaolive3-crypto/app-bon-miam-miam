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
        if (Schema::hasTable('livraison')) {
            return;
        }
        Schema::create('livraison', function (Blueprint $table) {
            $table->string('Id_livraison', 7)->primary();
            $table->text('adresse_livraison');
            $table->bigInteger('frais_livraison')->default(0);
            $table->string('statut_livraison', 30)->default('en_attente');
            $table->dateTime('date_prevue')->nullable();
            $table->dateTime('date_livraison')->nullable();
            $table->string('Id_commande', 8)->unique(); // 1 livraison max par commande
            $table->string('Id_utilisateur', 10)->nullable(); // livreur (employé)
            $table->timestamps();

            $table->index('statut_livraison');

            $table->foreign('Id_commande')->references('Id_commande')->on('commande');
            $table->foreign('Id_utilisateur')->references('Id_utilisateur')->on('employe');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE `livraison` ADD CONSTRAINT `chk_liv_frais` CHECK (`frais_livraison` >= 0)");
            DB::statement("ALTER TABLE `livraison` ADD CONSTRAINT `chk_liv_statut` CHECK (`statut_livraison` IN ('en_attente','assignee','en_cours','livree','echouee'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livraison');
    }
};
