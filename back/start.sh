#!/bin/bash
set -e

echo "==> Running Laravel migrations..."
php artisan migrate --force

echo "==> Caching config and routes..."
php artisan config:cache
php artisan route:cache

echo "==> Starting Apache..."
apache2-foreground
