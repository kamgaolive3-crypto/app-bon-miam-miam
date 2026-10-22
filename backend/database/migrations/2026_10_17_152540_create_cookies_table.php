<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cookies')) {
            return;
        }

        Schema::create('cookies', function (Blueprint $table) {
            $table->string('Id_cookies', 8)->primary();
            $table->dateTime('date_cookies')->useCurrent();
            $table->string('choix_cookies', 20);
            $table->string('version_politique', 30);
            $table->string('Id_utilisateur', 10)->nullable();

            $table->foreign('Id_utilisateur', 'fk_cookies_user')
                ->references('Id_utilisateur')
                ->on('utilisateur');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `cookies`
                ADD CONSTRAINT `chk_cookies_id`
                CHECK (REGEXP_LIKE(`Id_cookies`, '^[A-Z]{3}[0-9]{5}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `cookies`
                ADD CONSTRAINT `chk_cookies_choix`
                CHECK (`choix_cookies` IN ('accepte', 'refuse', 'personnalise'))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cookies');
    }
};