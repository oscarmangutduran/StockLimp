FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    sqlite3 \
    libsqlite3-dev \
    libzip-dev \
    ca-certificates

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (including zip required by maatwebsite/excel)
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd pdo_sqlite zip

# Enable Apache mod_rewrite for Laravel
RUN a2enmod rewrite

# Configure Apache DocumentRoot to point to Laravel's public directory
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html

# Create a .env from .env.example so artisan post-install scripts work during build
RUN cp .env.example .env

# Set Composer memory limit to unlimited and install dependencies
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --ignore-platform-reqs

# Now set correct permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/database

# Expose default port
EXPOSE 80 10000

# Run migrations and seeder, bind Apache to $PORT (for Render), then start Apache
CMD ["bash", "-c", "PORT=${PORT:-80}; sed -ri -e \"s/Listen 80/Listen ${PORT}/g\" /etc/apache2/ports.conf; sed -ri -e \"s/:80/:${PORT}/g\" /etc/apache2/sites-available/*.conf; mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite && chown -R www-data:www-data /var/www/html/database /var/www/html/storage && chmod -R 775 /var/www/html/database /var/www/html/storage && chmod 664 /var/www/html/database/database.sqlite && php artisan migrate --force && php artisan db:seed --force; php artisan config:cache; apache2-foreground"]
