<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reinitialisation_mdp')) {
            return;
        }

        Schema::create('reinitialisation_mdp', function (Blueprint $table) {
            $table->string('Id_reset', 8)->primary();
            $table->string('token_hash', 255);
            $table->dateTime('date_demande')->useCurrent();
            $table->dateTime('date_expiration');
            $table->boolean('utilise')->default(false);
            $table->string('Id_utilisateur', 10);

            $table->foreign('Id_utilisateur', 'fk_reset_user')
                ->references('Id_utilisateur')
                ->on('utilisateur')
                ->onDelete('cascade');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `reinitialisation_mdp`
                ADD CONSTRAINT `chk_reset_id`
                CHECK (REGEXP_LIKE(`Id_reset`, '^[A-Z]{3}[0-9]{5}$', 'c'))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reinitialisation_mdp');
    }
};