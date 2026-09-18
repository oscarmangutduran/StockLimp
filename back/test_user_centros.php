<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::with(['centro', 'centros'])->whereHas('centros')->first();
if ($u) {
    echo "Usuario: {$u->nombre} {$u->apellido}\n";
    echo "Centro directo: " . ($u->centro ? $u->centro->nombre : 'null') . "\n";
    echo "Centros pivot (total " . count($u->centros) . "):\n";
    foreach ($u->centros as $c) {
        echo "  - ID {$c->id_centro}: {$c->nombre}\n";
    }
}
