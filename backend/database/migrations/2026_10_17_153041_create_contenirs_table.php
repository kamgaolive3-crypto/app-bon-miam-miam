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
        if (Schema::hasTable('contenir')) {
            return;
        }
        Schema::create('contenir', function (Blueprint $table) {
            $table->string('Id_commande', 8);
            $table->string('Id_article', 6);
            $table->integer('quantite');
            $table->bigInteger('prix_unitaire'); // prix au moment de la commande (historique)

            $table->primary(['Id_commande', 'Id_article']);
            $table->index('Id_article');

            $table->foreign('Id_commande')->references('Id_commande')->on('commande')->onDelete('cascade');
            $table->foreign('Id_article')->references('Id_article')->on('article_menu');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE `contenir` ADD CONSTRAINT `chk_contenir_qte` CHECK (`quantite` > 0)");
            DB::statement("ALTER TABLE `contenir` ADD CONSTRAINT `chk_contenir_prix` CHECK (`prix_unitaire` >= 0)");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contenir');
    }
};
