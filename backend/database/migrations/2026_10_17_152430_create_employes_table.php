<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employe')) {
            return;
        }

        Schema::create('employe', function (Blueprint $table) {
            $table->string('Id_utilisateur', 10)->primary();
            $table->string('poste', 100)->nullable();
            $table->date('date_embauche')->nullable();
            $table->string('Id_restaurant', 5);
            $table->string('Id_createur', 10)->nullable();
            $table->dateTime('date_creation_compte')->useCurrent();

            $table->foreign('Id_utilisateur', 'fk_employe_utilisateur')
                ->references('Id_utilisateur')
                ->on('utilisateur')
                ->onDelete('cascade');

            $table->foreign('Id_restaurant', 'fk_employe_restaurant')
                ->references('Id_restaurant')
                ->on('restaurant');

            $table->foreign('Id_createur', 'fk_employe_createur')
                ->references('Id_utilisateur')
                ->on('utilisateur');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employe');
    }
};