<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('evenement')) {
            return;
        }

        Schema::create('evenement', function (Blueprint $table) {
            $table->string('Id_evenement', 7)->primary();
            $table->text('affiche_evenement')->nullable();
            $table->dateTime('debut_evenement');
            $table->dateTime('fin_evenement');
            $table->string('type_evenement', 20);
            $table->integer('points_evenement')->default(0);
            $table->unsignedTinyInteger('taux_reduction')->nullable();
            $table->text('description_evenement')->nullable();
            $table->string('Id_utilisateur', 10);

            $table->foreign('Id_utilisateur', 'fk_evt_admin')
                ->references('Id_utilisateur')
                ->on('administrateur');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `evenement`
                ADD CONSTRAINT `chk_evt_id`
                CHECK (REGEXP_LIKE(`Id_evenement`, '^[A-Z]{3}[0-9]{4}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `evenement`
                ADD CONSTRAINT `chk_evt_periode`
                CHECK (`fin_evenement` >= `debut_evenement`)
            ");

            DB::statement("
                ALTER TABLE `evenement`
                ADD CONSTRAINT `chk_evt_type`
                CHECK (`type_evenement` IN ('promotion', 'evenement', 'mini_jeu'))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('evenement');
    }
};