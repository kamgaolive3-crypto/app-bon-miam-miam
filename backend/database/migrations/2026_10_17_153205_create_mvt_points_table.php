<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mvt_points')) {
            return;
        }

        Schema::create('mvt_points', function (Blueprint $table) {
            $table->string('Id_mvt', 5)->primary();
            $table->dateTime('date_mvt')->useCurrent();
            $table->integer('nbres_points');
            $table->string('type_mvt', 30);
            $table->dateTime('date_expiration')->nullable();
            $table->string('Id_utilisateur', 10);
            $table->string('Id_commande', 8)->nullable();

            $table->foreign('Id_utilisateur', 'fk_mvt_etudiant')
                ->references('Id_utilisateur')
                ->on('etudiant');

            $table->foreign('Id_commande', 'fk_mvt_commande')
                ->references('Id_commande')
                ->on('commande');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `mvt_points`
                ADD CONSTRAINT `chk_mvt_id`
                CHECK (REGEXP_LIKE(`Id_mvt`, '^[A-Z]{2}[0-9]{3}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `mvt_points`
                ADD CONSTRAINT `chk_mvt_type`
                CHECK (`type_mvt` IN (
                    'gain',
                    'utilisation',
                    'expiration',
                    'parrainage',
                    'jeu'
                ))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mvt_points');
    }
};