<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$unlinked = App\Models\User::whereNotIn('id_user', function($q) {
    $q->select('id_user')->from('centro_user');
})->get(['id_user', 'nombre', 'apellido', 'email', 'rol']);

echo "Total usuarios no vinculados a centros: " . count($unlinked) . "\n";
foreach ($unlinked as $u) {
    echo "  #{$u->id_user} {$u->nombre} {$u->apellido} ({$u->email}) [{$u->rol}]\n";
}
