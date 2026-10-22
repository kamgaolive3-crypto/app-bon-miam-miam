<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('restaurant')) {
            return;
        }

        Schema::create('restaurant', function (Blueprint $table) {
            $table->string('Id_restaurant', 5)->primary();
            $table->string('nom_restaurant', 150);
            $table->text('adresse_restaurant')->nullable();
            $table->string('telephone_restaurant', 30)->nullable();
            $table->string('email_restaurant', 255)->nullable();
            $table->time('heure_ouverture');
            $table->time('heure_fermeture');
            $table->boolean('livraison_active')->default(true);
            $table->dateTime('date_creation')->useCurrent();
            $table->string('statut_restaurant', 20)->default('actif');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `restaurant`
                ADD CONSTRAINT `chk_rest_id`
                CHECK (REGEXP_LIKE(`Id_restaurant`, '^[A-Z]{2}[0-9]{3}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `restaurant`
                ADD CONSTRAINT `chk_rest_statut`
                CHECK (`statut_restaurant` IN ('actif', 'inactif'))
            ");

            DB::statement("
                ALTER TABLE `restaurant`
                ADD CONSTRAINT `chk_rest_horaire`
                CHECK (`heure_fermeture` > `heure_ouverture`)
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant');
    }
};