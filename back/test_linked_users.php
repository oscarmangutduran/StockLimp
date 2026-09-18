<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$linkedUsers = Illuminate\Support\Facades\DB::table('centro_user')
    ->join('users', 'centro_user.id_user', '=', 'users.id_user')
    ->join('centros_trabajo', 'centro_user.id_centro', '=', 'centros_trabajo.id_centro')
    ->select('users.id_user', 'users.nombre', 'users.apellido', 'centros_trabajo.id_centro', 'centros_trabajo.nombre_centro')
    ->take(10)
    ->get();

echo "Ejemplos vinculados en centro_user:\n";
foreach ($linkedUsers as $lu) {
    echo "User #{$lu->id_user} {$lu->nombre} {$lu->apellido} => Centro #{$lu->id_centro}: " . substr($lu->nombre_centro, 0, 40) . "\n";
}
