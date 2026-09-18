<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ids = App\Models\User::where('email', 'LIKE', '%@ejemplo.com')->pluck('id_user');
$pedidos = App\Models\Order::whereIn('id_user', $ids)->count();
$fichajes = App\Models\Fichaje::whereIn('id_user', $ids)->count();
$centrosUser = Illuminate\Support\Facades\DB::table('centro_user')->whereIn('id_user', $ids)->count();

echo "Pedidos de usuarios @ejemplo.com: $pedidos\n";
echo "Fichajes de usuarios @ejemplo.com: $fichajes\n";
echo "Centros asignados a @ejemplo.com: $centrosUser\n";
