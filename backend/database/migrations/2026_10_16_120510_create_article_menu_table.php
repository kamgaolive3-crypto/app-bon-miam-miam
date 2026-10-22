<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('article_menu')) {
            return;
        }

        Schema::create('article_menu', function (Blueprint $table) {
            $table->string('Id_article', 6)->primary();
            $table->string('nom_article', 150);
            $table->text('description')->nullable();
            $table->string('image_article', 255)->nullable();
            $table->bigInteger('prix_article');
            $table->string('categories_article', 255);
            $table->boolean('disponibilite_article')->default(true);
            $table->boolean('Menu_du_jour')->default(false);
            $table->string('Id_restaurant', 5);

            $table->foreign('Id_restaurant', 'fk_article_restaurant')
                ->references('Id_restaurant')
                ->on('restaurant');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("
                ALTER TABLE `article_menu`
                ADD CONSTRAINT `chk_art_id`
                CHECK (REGEXP_LIKE(`Id_article`, '^[A-Z]{3}[0-9]{3}$', 'c'))
            ");

            DB::statement("
                ALTER TABLE `article_menu`
                ADD CONSTRAINT `chk_art_prix`
                CHECK (`prix_article` >= 0)
            ");

            DB::statement("
                ALTER TABLE `article_menu`
                ADD CONSTRAINT `chk_art_cat`
                CHECK (`categories_article` IN (
                    'plat',
                    'boisson',
                    'dessert',
                    'accompagnement',
                    'autre'
                ))
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('article_menu');
    }
};