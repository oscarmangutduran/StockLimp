<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$usersWithCentro = App\Models\User::whereNotNull('id_centro')->count();
$usersWithoutCentro = App\Models\User::whereNull('id_centro')->count();

echo "Usuarios CON centro: $usersWithCentro\n";
echo "Usuarios SIN centro: $usersWithoutCentro\n";
