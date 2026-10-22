<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('parametre')) {
            return;
        }

        Schema::create('parametre', function (Blueprint $table) {
            $table->string('Id_parametre', 5)->primary();
            $table->string('cle', 100)->unique();
            $table->text('valeur');
            $table->string('Id_utilisateur', 10)->nullable();

            $table->foreign('Id_utilisateur', 'fk_param_admin')
                ->references('Id_utilisateur')
                ->on('administrateur');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `parametre`
                ADD CONSTRAINT `chk_param_id`
                CHECK (REGEXP_LIKE(`Id_parametre`, '^[A-Z]{2}[0-9]{3}$', 'c'))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('parametre');
    }
};