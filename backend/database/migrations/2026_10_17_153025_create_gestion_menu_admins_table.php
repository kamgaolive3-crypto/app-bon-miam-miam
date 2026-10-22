<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gestion_menu_admin')) {
            return;
        }

        Schema::create('gestion_menu_admin', function (Blueprint $table) {
            $table->string('Id_utilisateur', 10);
            $table->string('Id_article', 6);
            $table->dateTime('date_modification')->useCurrent();
            $table->string('nature_modification', 255)->nullable();

            $table->primary([
                'Id_utilisateur',
                'Id_article',
                'date_modification',
            ]);

            $table->foreign('Id_utilisateur', 'fk_gma_admin')
                ->references('Id_utilisateur')
                ->on('administrateur');

            $table->foreign('Id_article', 'fk_gma_article')
                ->references('Id_article')
                ->on('article_menu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gestion_menu_admin');
    }
};