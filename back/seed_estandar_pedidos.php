<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "--- Actualizando catálogo estándar para pedidos (26 productos) ---\n";

// 1. Asegurar columna es_estandar_pedido
if (!Schema::hasColumn('productos', 'es_estandar_pedido')) {
    echo "Añadiendo columna 'es_estandar_pedido' a la tabla 'productos'...\n";
    DB::statement("ALTER TABLE `productos` ADD COLUMN `es_estandar_pedido` TINYINT(1) NOT NULL DEFAULT 0 AFTER `es_toxico`");
    echo "Columna creada correctamente.\n";
} else {
    echo "Columna 'es_estandar_pedido' ya existe.\n";
}

// 2. Marcar todos los productos como no estándar inicialmente
DB::table('productos')->update(['es_estandar_pedido' => 0]);

// 3. Lista oficial de los 26 productos estándar extraídos de la planilla
$standardProducts = [
    [
        'nombre' => 'LEJIA',
        'sku' => 'STD-LEJIA',
        'es_toxico' => 1,
        'precio_unidad' => 1.95,
        'stock_actual' => 150.00,
        'imagen' => 'lejia.png',
    ],
    [
        'nombre' => 'AMONIACO',
        'sku' => 'STD-AMONIACO',
        'es_toxico' => 1,
        'precio_unidad' => 2.10,
        'stock_actual' => 100.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'FREGASUELOS',
        'sku' => 'STD-FREGASUELOS',
        'es_toxico' => 0,
        'precio_unidad' => 3.50,
        'stock_actual' => 180.00,
        'imagen' => 'ambientador.png',
    ],
    [
        'nombre' => 'LEJIA DETERGENTE',
        'sku' => 'STD-LEJIA-DET',
        'es_toxico' => 1,
        'precio_unidad' => 2.45,
        'stock_actual' => 120.00,
        'imagen' => 'lejia.png',
    ],
    [
        'nombre' => 'AMBIENTADOR',
        'sku' => 'STD-AMBIENTADOR',
        'es_toxico' => 0,
        'precio_unidad' => 4.20,
        'stock_actual' => 140.00,
        'imagen' => 'ambientador.png',
    ],
    [
        'nombre' => 'BAYETAS',
        'sku' => 'STD-BAYETAS',
        'es_toxico' => 0,
        'precio_unidad' => 1.80,
        'stock_actual' => 250.00,
        'imagen' => 'cristales.png',
    ],
    [
        'nombre' => 'FREGONAS',
        'sku' => 'STD-FREGONAS',
        'es_toxico' => 0,
        'precio_unidad' => 2.90,
        'stock_actual' => 200.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'F. MICROFIBRA',
        'sku' => 'STD-FMICROFIBRA',
        'es_toxico' => 0,
        'precio_unidad' => 3.80,
        'stock_actual' => 160.00,
        'imagen' => 'cristales.png',
    ],
    [
        'nombre' => 'SACOS',
        'sku' => 'STD-SACOS',
        'es_toxico' => 0,
        'precio_unidad' => 4.50,
        'stock_actual' => 300.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'BOLSAS',
        'sku' => 'STD-BOLSAS',
        'es_toxico' => 0,
        'precio_unidad' => 2.20,
        'stock_actual' => 350.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'CEPILLOS',
        'sku' => 'STD-CEPILLOS',
        'es_toxico' => 0,
        'precio_unidad' => 4.90,
        'stock_actual' => 90.00,
        'imagen' => 'desengrasante.png',
    ],
    [
        'nombre' => 'PALOS',
        'sku' => 'STD-PALOS',
        'es_toxico' => 0,
        'precio_unidad' => 2.75,
        'stock_actual' => 110.00,
        'imagen' => 'desengrasante.png',
    ],
    [
        'nombre' => 'RECOGEDOR',
        'sku' => 'STD-RECOGEDOR',
        'es_toxico' => 0,
        'precio_unidad' => 5.20,
        'stock_actual' => 85.00,
        'imagen' => 'desengrasante.png',
    ],
    [
        'nombre' => 'FLOTA',
        'sku' => 'STD-FLOTA',
        'es_toxico' => 0,
        'precio_unidad' => 3.95,
        'stock_actual' => 95.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'ARRIXACA',
        'sku' => 'STD-ARRIXACA',
        'es_toxico' => 0,
        'precio_unidad' => 4.95,
        'stock_actual' => 115.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'PAPEL WC',
        'sku' => 'STD-PAPELWC',
        'es_toxico' => 0,
        'precio_unidad' => 6.50,
        'stock_actual' => 220.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'CRISTASOL',
        'sku' => 'STD-CRISTASOL',
        'es_toxico' => 0,
        'precio_unidad' => 3.20,
        'stock_actual' => 130.00,
        'imagen' => 'cristales.png',
    ],
    [
        'nombre' => 'CENTELLA',
        'sku' => 'STD-CENTELLA',
        'es_toxico' => 0,
        'precio_unidad' => 4.40,
        'stock_actual' => 80.00,
        'imagen' => 'ambientador.png',
    ],
    [
        'nombre' => 'SUPERBRILLO',
        'sku' => 'STD-SUPERBRILLO',
        'es_toxico' => 0,
        'precio_unidad' => 5.80,
        'stock_actual' => 75.00,
        'imagen' => 'cristales.png',
    ],
    [
        'nombre' => 'LQ MADERA',
        'sku' => 'STD-LQ-MADERA',
        'es_toxico' => 0,
        'precio_unidad' => 4.70,
        'stock_actual' => 70.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'GAMUZA',
        'sku' => 'STD-GAMUZA',
        'es_toxico' => 0,
        'precio_unidad' => 1.90,
        'stock_actual' => 190.00,
        'imagen' => 'cristales.png',
    ],
    [
        'nombre' => 'PLUMERO',
        'sku' => 'STD-PLUMERO',
        'es_toxico' => 0,
        'precio_unidad' => 3.60,
        'stock_actual' => 65.00,
        'imagen' => 'ambientador.png',
    ],
    [
        'nombre' => 'SUPER FLAX',
        'sku' => 'STD-SUPER-FLAX',
        'es_toxico' => 0,
        'precio_unidad' => 5.10,
        'stock_actual' => 80.00,
        'imagen' => 'detergente.png',
    ],
    [
        'nombre' => 'CUBO',
        'sku' => 'STD-CUBO',
        'es_toxico' => 0,
        'precio_unidad' => 6.20,
        'stock_actual' => 70.00,
        'imagen' => 'desengrasante.png',
    ],
    [
        'nombre' => 'ESTROPAJO',
        'sku' => 'STD-ESTROPAJO',
        'es_toxico' => 0,
        'precio_unidad' => 1.25,
        'stock_actual' => 280.00,
        'imagen' => 'cristales.png',
    ],
    [
        'nombre' => 'SPRAY MOPA',
        'sku' => 'STD-SPRAY-MOPA',
        'es_toxico' => 0,
        'precio_unidad' => 4.85,
        'stock_actual' => 85.00,
        'imagen' => 'ambientador.png',
    ],
];

foreach ($standardProducts as $p) {
    // Buscar si ya existe por nombre o SKU
    $existing = DB::table('productos')
        ->where('nombre', $p['nombre'])
        ->orWhere('sku', $p['sku'])
        ->first();

    if ($existing) {
        DB::table('productos')->where('id_producto', $existing->id_producto)->update([
            'nombre' => $p['nombre'],
            'sku' => $p['sku'],
            'es_estandar_pedido' => 1,
            'es_toxico' => $p['es_toxico'],
            'precio_unidad' => $p['precio_unidad'],
            'stock_actual' => $p['stock_actual'],
            'imagen' => $p['imagen'],
        ]);
        echo "Actualizado producto estándar [{$existing->id_producto}]: {$p['nombre']}\n";
    } else {
        $id = DB::table('productos')->insertGetId([
            'nombre' => $p['nombre'],
            'sku' => $p['sku'],
            'es_estandar_pedido' => 1,
            'es_toxico' => $p['es_toxico'],
            'precio_unidad' => $p['precio_unidad'],
            'stock_actual' => $p['stock_actual'],
            'imagen' => $p['imagen'],
            'fecha_registro' => now(),
        ]);
        echo "Insertado producto estándar [{$id}]: {$p['nombre']}\n";
    }
}

$count = DB::table('productos')->where('es_estandar_pedido', 1)->count();
echo "\nTotal de productos estándar para pedidos registrados: {$count}\n";
