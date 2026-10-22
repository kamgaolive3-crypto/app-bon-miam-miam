# Image de base avec PHP 8.3
FROM php:8.3-cli

# Dossier de travail
WORKDIR /var/www/html

# Installe les outils système et les extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring bcmath pcntl zip \
    && rm -rf /var/lib/apt/lists/*

# Récupère Composer depuis son image officielle
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copie le projet dans le conteneur
COPY . .

# Installe les dépendances Laravel
RUN composer install --no-interaction --prefer-dist --no-progress

EXPOSE 8000

# Lance le serveur Laravel
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]