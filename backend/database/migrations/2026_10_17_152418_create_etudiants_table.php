<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('etudiant')) {
            return;
        }

        Schema::create('etudiant', function (Blueprint $table) {
            $table->string('Id_utilisateur', 10)->primary();
            $table->text('localisation')->nullable();
            $table->string('code_parrainage', 8)->unique();
            $table->integer('solde_point')->default(0);

            $table->foreign('Id_utilisateur')
                ->references('Id_utilisateur')
                ->on('utilisateur')
                ->onDelete('cascade');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `etudiant`
                ADD CONSTRAINT `chk_etu_code`
                CHECK (
                    REGEXP_LIKE(
                        `code_parrainage`,
                        '^[A-Z]{4}[0-9]{4}$',
                        'c'
                    )
                )
            ");

            DB::statement("
                ALTER TABLE `etudiant`
                ADD CONSTRAINT `chk_etu_solde`
                CHECK (`solde_point` >= 0)
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('etudiant');
    }
};