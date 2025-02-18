FROM php:8.2-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libcurl4-openssl-dev \
    libpq-dev \
    net-tools \
    iputils-ping \
    curl \
    && docker-php-ext-install zip pdo_mysql curl pdo

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Instalar extensiones de PHP
RUN docker-php-ext-install opcache

# Configurar PHP
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Establecer directorio de trabajo
WORKDIR /var/www/backend

# Copiar archivos del proyecto
COPY . .

# Instalar Symfony CLI
RUN curl -sS https://get.symfony.com/cli/installer | bash \
    && mv /root/.symfony5/bin/symfony /usr/local/bin/symfony

# Instalar dependencias de Composer
RUN composer install --no-interaction

# Instalar OpenAI PHP
RUN composer require openai-php/client

# Configurar permisos
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 755 /var/www/backend

# Exponer puerto
EXPOSE 9000

# Comando por defecto
CMD ["php-fpm"]
