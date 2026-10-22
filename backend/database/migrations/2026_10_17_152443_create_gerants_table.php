<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gerant')) {
            return;
        }

        Schema::create('gerant', function (Blueprint $table) {
            $table->string('Id_utilisateur', 10)->primary();
            $table->date('date_nomination')->nullable();
            $table->string('Id_restaurant', 5);

            $table->foreign('Id_utilisateur', 'fk_gerant_utilisateur')
                ->references('Id_utilisateur')
                ->on('utilisateur')
                ->onDelete('cascade');

            $table->foreign('Id_restaurant', 'fk_gerant_restaurant')
                ->references('Id_restaurant')
                ->on('restaurant');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gerant');
    }
};