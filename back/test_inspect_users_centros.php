<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::where('id_user', '>=', 72)->first();
echo "User #{$u->id_user}: {$u->nombre} {$u->apellido}\n";
echo "id_centro: " . var_export($u->id_centro, true) . "\n";
echo "centro relation: " . ($u->centro ? $u->centro->nombre : 'NULL') . "\n";
echo "centros relation: " . $u->centros->pluck('nombre')->join(', ') . "\n";
