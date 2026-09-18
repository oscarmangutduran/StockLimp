<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ejemploUsers = App\Models\User::where('email', 'LIKE', '%@ejemplo.com')->get(['id_user', 'nombre', 'email']);
echo "Total usuarios con @ejemplo.com: " . count($ejemploUsers) . "\n";
foreach ($ejemploUsers->take(10) as $u) {
    echo "  #{$u->id_user} {$u->nombre} ({$u->email})\n";
}
