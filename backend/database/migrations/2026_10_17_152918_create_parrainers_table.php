<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('parrainer')) {
            return;
        }

        Schema::create('parrainer', function (Blueprint $table) {
            $table->string('Id_filleul', 10)->primary();
            $table->string('Id_parrain', 10);
            $table->dateTime('date_parrainage')->useCurrent();
            $table->boolean('recompense_attribuee')->default(false);

            $table->foreign('Id_filleul', 'fk_parr_filleul')
                ->references('Id_utilisateur')
                ->on('etudiant');

            $table->foreign('Id_parrain', 'fk_parr_parrain')
                ->references('Id_utilisateur')
                ->on('etudiant');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `parrainer`
                ADD CONSTRAINT `chk_parr_distinct`
                CHECK (`Id_parrain` <> `Id_filleul`)
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('parrainer');
    }
};