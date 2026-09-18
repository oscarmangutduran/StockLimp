<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = App\Models\User::where('id_user', '<', 72)->get(['id_user', 'nombre', 'apellido', 'email', 'rol']);
echo "Usuarios antiguos (< 72):\n";
foreach ($users as $u) {
    echo "#{$u->id_user}: {$u->nombre} {$u->apellido} ({$u->email}) [{$u->rol}]\n";
}
