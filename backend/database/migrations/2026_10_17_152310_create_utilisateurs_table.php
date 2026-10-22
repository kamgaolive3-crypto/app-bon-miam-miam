<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('utilisateur')) {
            return;
        }

        Schema::create('utilisateur', function (Blueprint $table) {
            $table->string('Id_utilisateur', 10)->primary();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 255)->unique();
            $table->string('mot_de_passe', 255);
            $table->dateTime('date_inscription')->useCurrent();
            $table->string('statut_compte', 20)->default('actif');
            $table->char('telephone', 9);
            $table->rememberToken();
            $table->timestamps();
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `utilisateur`
                ADD CONSTRAINT `chk_user_id`
                CHECK (REGEXP_LIKE(`Id_utilisateur`, '^[A-Z]{4}[0-9]{6}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `utilisateur`
                ADD CONSTRAINT `chk_user_email`
                CHECK (`email` REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$')
            ");

            DB::statement("
                ALTER TABLE `utilisateur`
                ADD CONSTRAINT `chk_user_statut`
                CHECK (`statut_compte` IN ('actif','inactif'))
            ");

            DB::statement("
                ALTER TABLE `utilisateur`
                ADD CONSTRAINT `chk_user_tel`
                CHECK (`telephone` REGEXP '^6[0-9]{8}$')
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur');
    }
};