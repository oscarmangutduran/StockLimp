<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Iniciando actualización de productos según Fichas Técnicas...\n";

// 1. Asegurar columna ficha_tecnica
if (!Schema::hasColumn('productos', 'ficha_tecnica')) {
    echo "Agregando columna 'ficha_tecnica' a la tabla 'productos'...\n";
    DB::statement("ALTER TABLE `productos` ADD COLUMN `ficha_tecnica` VARCHAR(255) NULL AFTER `imagen`");
    echo "Columna 'ficha_tecnica' creada correctamente.\n";
} else {
    echo "Columna 'ficha_tecnica' ya existe.\n";
}

// 2. Limpiar tablas relacionadas y productos
echo "Vaciando productos antiguos y dependencias...\n";
DB::statement("SET FOREIGN_KEY_CHECKS = 0");
DB::statement("TRUNCATE TABLE `producto_componentes`");
DB::statement("TRUNCATE TABLE `detalle_pedido`");
DB::statement("TRUNCATE TABLE `productos`");
DB::statement("SET FOREIGN_KEY_CHECKS = 1");

// 3. Lista de productos extraídos de las fichas técnicas
$productos = [
    [
        'id_producto' => 1,
        'nombre' => 'Desatascador de Desagües 2CV880',
        'sku' => '2CV-880',
        'es_toxico' => 1,
        'precio_unidad' => 14.50,
        'stock_actual' => 45.00,
        'imagen' => 'desengrasante.png',
        'ficha_tecnica' => 'DESATASCADOR DESAGUES FT_2CV880.pdf',
        'componentes' => [
            ['nombre_componente' => 'Hidróxido Sódico (Sosa)', 'porcentaje' => '30%', 'descripcion_seguridad' => 'Corrosivo severo. Provoca quemaduras graves en piel y ojos.'],
            ['nombre_componente' => 'Agua desmineralizada', 'porcentaje' => '70%', 'descripcion_seguridad' => 'Disolvente base neutro.']
        ]
    ],
    [
        'id_producto' => 2,
        'nombre' => 'Desengrasante Enérgico ISA 1DT300',
        'sku' => '1DT-300',
        'es_toxico' => 1,
        'precio_unidad' => 18.90,
        'stock_actual' => 60.00,
        'imagen' => 'desengrasante.png',
        'ficha_tecnica' => 'DESENGRASANTE (ISA) FDS 1DT300 v6 CLP.PDF',
        'componentes' => [
            ['nombre_componente' => 'Hidróxido Potásico', 'porcentaje' => '15%', 'descripcion_seguridad' => 'Desengrasante alcalino de alta potencia.'],
            ['nombre_componente' => 'Tensioactivos no iónicos', 'porcentaje' => '10%', 'descripcion_seguridad' => 'Facilita la saponificación de grasas.']
        ]
    ],
    [
        'id_producto' => 3,
        'nombre' => 'Desgrafion (A) Eliminador de Graffitis',
        'sku' => 'DESGRAF-A',
        'es_toxico' => 1,
        'precio_unidad' => 22.50,
        'stock_actual' => 25.00,
        'imagen' => 'detergente.png',
        'ficha_tecnica' => 'DESGRAFION (A).pdf',
        'componentes' => [
            ['nombre_componente' => 'Solventes polares decapantes', 'porcentaje' => '40%', 'descripcion_seguridad' => 'Riesgo por inhalación prolongada. Usar en espacios ventilados.']
        ]
    ],
    [
        'id_producto' => 4,
        'nombre' => 'Splash / Glup Suelos Limón (Monodosis)',
        'sku' => 'SPLASH-LIMON',
        'es_toxico' => 0,
        'precio_unidad' => 16.75,
        'stock_actual' => 120.00,
        'imagen' => 'ambientador.png',
        'ficha_tecnica' => 'glup suelos limon.pdf',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos biodegradables', 'porcentaje' => '25%', 'descripcion_seguridad' => 'pH neutro. Seguro para todo tipo de suelos.'],
            ['nombre_componente' => 'Esencia Cítrica Limón', 'porcentaje' => '5%', 'descripcion_seguridad' => 'Perfume concentrado de larga duración.']
        ]
    ],
    [
        'id_producto' => 5,
        'nombre' => 'Splash / Glup Suelos Marino (Monodosis)',
        'sku' => 'SPLASH-MARINO',
        'es_toxico' => 0,
        'precio_unidad' => 16.75,
        'stock_actual' => 110.00,
        'imagen' => 'cristales.png',
        'ficha_tecnica' => 'glup marino.pdf',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos biodegradables', 'porcentaje' => '25%', 'descripcion_seguridad' => 'pH neutro. Concentrado hidrosoluble.'],
            ['nombre_componente' => 'Esencia Brisa Marina', 'porcentaje' => '5%', 'descripcion_seguridad' => 'Aroma fresco persistente.']
        ]
    ],
    [
        'id_producto' => 6,
        'nombre' => 'Splash / Glup Suelos Manzana (Monodosis)',
        'sku' => 'SPLASH-MANZANA',
        'es_toxico' => 0,
        'precio_unidad' => 16.75,
        'stock_actual' => 115.00,
        'imagen' => 'ambientador.png',
        'ficha_tecnica' => 'GLUP SUELOS MANZANA.PDF',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos biodegradables', 'porcentaje' => '25%', 'descripcion_seguridad' => 'No peligroso según directiva europea.'],
            ['nombre_componente' => 'Esencia Frutal Manzana', 'porcentaje' => '5%', 'descripcion_seguridad' => 'Aroma frutal relajante.']
        ]
    ],
    [
        'id_producto' => 7,
        'nombre' => 'Tergi Inox - Limpiador Abrillantador Acero Inox',
        'sku' => 'TERGI-INOX',
        'es_toxico' => 1,
        'precio_unidad' => 12.80,
        'stock_actual' => 45.00,
        'imagen' => 'cristales.png',
        'ficha_tecnica' => 'FREGASUELOS, ARRIXACA BAÑO , LIMPIA ALUMINIO.PDF',
        'componentes' => [
            ['nombre_componente' => 'Hidrocarburos alifáticos', 'porcentaje' => '>30%', 'descripcion_seguridad' => 'Aerosol extremadamente inflamable. Mantener lejos de fuentes de calor.']
        ]
    ],
    [
        'id_producto' => 8,
        'nombre' => 'Arrixaca Baño - Gel Ácido Antical Sanitarios',
        'sku' => 'ARRIXACA-BANO',
        'es_toxico' => 0,
        'precio_unidad' => 4.95,
        'stock_actual' => 80.00,
        'imagen' => 'detergente.png',
        'ficha_tecnica' => 'FREGASUELOS, ARRIXACA BAÑO , LIMPIA ALUMINIO.PDF',
        'componentes' => [
            ['nombre_componente' => 'Ácidos orgánicos suaves', 'porcentaje' => '10%', 'descripcion_seguridad' => 'Elimina sarro y restos de cal en azulejos e inodoros.']
        ]
    ],
    [
        'id_producto' => 9,
        'nombre' => 'Fregasuelos Perfumado Manzana Maypro',
        'sku' => 'FREG-MANZ-MAY',
        'es_toxico' => 0,
        'precio_unidad' => 6.20,
        'stock_actual' => 95.00,
        'imagen' => 'ambientador.png',
        'ficha_tecnica' => 'FREGASUELOS, ARRIXACA BAÑO , LIMPIA ALUMINIO.PDF',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos aniónicos', 'porcentaje' => '<5%', 'descripcion_seguridad' => 'No es un preparado peligroso para la salud.']
        ]
    ],
    [
        'id_producto' => 10,
        'nombre' => 'INTA Desengrasante Eliminador de Tintas Cidal',
        'sku' => 'INTA-CIDAL',
        'es_toxico' => 1,
        'precio_unidad' => 21.00,
        'stock_actual' => 35.00,
        'imagen' => 'desengrasante.png',
        'ficha_tecnica' => 'INTA desengrasante eliminador de tintas.pdf',
        'componentes' => [
            ['nombre_componente' => 'Hidróxido Potásico', 'porcentaje' => '12%', 'descripcion_seguridad' => 'R34: Provoca quemaduras. Usar guantes y protección ocular.'],
            ['nombre_componente' => 'D-Limoneno', 'porcentaje' => '8%', 'descripcion_seguridad' => 'Disolvente de tintas de bolígrafo y rotulador.']
        ]
    ],
    [
        'id_producto' => 11,
        'nombre' => 'Jabonoso Maderas Moblysol',
        'sku' => 'MOBLISOL-MAD',
        'es_toxico' => 0,
        'precio_unidad' => 7.40,
        'stock_actual' => 70.00,
        'imagen' => 'detergente.png',
        'ficha_tecnica' => 'JABONOSO MADERA MOBLISOL.PDF',
        'componentes' => [
            ['nombre_componente' => 'Jabones y ceras nutritivas', 'porcentaje' => '15%', 'descripcion_seguridad' => 'Nutre parquets, tarimas y puertas de madera.']
        ]
    ],
    [
        'id_producto' => 12,
        'nombre' => 'Lavavajillas Manual Tres Sietes',
        'sku' => 'LAVAV-3-SIETES',
        'es_toxico' => 0,
        'precio_unidad' => 8.50,
        'stock_actual' => 90.00,
        'imagen' => 'detergente.png',
        'ficha_tecnica' => 'LAVAVAJILLAS 3 SIETES.PDF',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos aniónicos', 'porcentaje' => '15%', 'descripcion_seguridad' => 'Alto poder desengrasante con dermoprotección.']
        ]
    ],
    [
        'id_producto' => 13,
        'nombre' => 'Lavavajillas Manual Cidasol',
        'sku' => 'CIDASOL-LAV',
        'es_toxico' => 0,
        'precio_unidad' => 9.10,
        'stock_actual' => 85.00,
        'imagen' => 'detergente.png',
        'ficha_tecnica' => 'LAVAVAJILLAS CIDAL.PDF',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos aniónicos y no iónicos', 'porcentaje' => '15%', 'descripcion_seguridad' => 'Producto no clasificado como peligroso.']
        ]
    ],
    [
        'id_producto' => 14,
        'nombre' => 'Lavavajillas Máquinas Automáticas L-303',
        'sku' => 'LAVAV-L303',
        'es_toxico' => 1,
        'precio_unidad' => 27.50,
        'stock_actual' => 30.00,
        'imagen' => 'lejia.png',
        'ficha_tecnica' => 'LAVAVAJILLAS L-303.pdf',
        'componentes' => [
            ['nombre_componente' => 'Álcalis cáusticos', 'porcentaje' => '20%', 'descripcion_seguridad' => 'Detergente industrial de lavado para túneles y máquinas.']
        ]
    ],
    [
        'id_producto' => 15,
        'nombre' => 'Activador de Color La Tuna 2L (Lejía Color)',
        'sku' => 'LATUNA-COLOR-8411494000834',
        'es_toxico' => 0,
        'precio_unidad' => 4.80,
        'stock_actual' => 100.00,
        'imagen' => 'lejia.png',
        'ficha_tecnica' => 'LEJIA COLOR LA TUNA.PDF',
        'componentes' => [
            ['nombre_componente' => 'Blanqueantes oxigenados', 'porcentaje' => '15%', 'descripcion_seguridad' => 'Protege los colores sin cloro ni vapores tóxicos.']
        ]
    ],
    [
        'id_producto' => 16,
        'nombre' => 'Limpiador Ecológico de Tintas 1DT 660',
        'sku' => '1DT-660',
        'es_toxico' => 0,
        'precio_unidad' => 19.30,
        'stock_actual' => 40.00,
        'imagen' => 'detergente.png',
        'ficha_tecnica' => 'LIMPIADOR ECOLOGICOS TINTAS 1DT 660.pdf',
        'componentes' => [
            ['nombre_componente' => 'Tensioactivos de origen vegetal', 'porcentaje' => '30%', 'descripcion_seguridad' => 'Fórmula ecológica biodegradable.']
        ]
    ],
    [
        'id_producto' => 17,
        'nombre' => 'Multi-Asepti CV Higienizante Desinfectante',
        'sku' => 'MULTI-ASEPTI-CV',
        'es_toxico' => 0,
        'precio_unidad' => 15.60,
        'stock_actual' => 150.00,
        'imagen' => 'ambientador.png',
        'ficha_tecnica' => 'MULTI ASEPTI maq nebulizadora.pdf',
        'componentes' => [
            ['nombre_componente' => 'Alcoholes hidroalcohólicos desinfectantes', 'porcentaje' => '70%', 'descripcion_seguridad' => 'Aplicación sin agua ni enjuague. Auto secado rápido.']
        ]
    ],
    [
        'id_producto' => 18,
        'nombre' => 'Desincrustante Quita Cementos',
        'sku' => 'QUITA-CEMENTOS',
        'es_toxico' => 1,
        'precio_unidad' => 14.20,
        'stock_actual' => 55.00,
        'imagen' => 'lejia.png',
        'ficha_tecnica' => 'QUITA CEMENTOS.PDF',
        'componentes' => [
            ['nombre_componente' => 'Ácido clorhídrico inhibido', 'porcentaje' => '20%', 'descripcion_seguridad' => 'Elimina restos de cemento, yeso y óxido en pavimentos.']
        ]
    ]
];

foreach ($productos as $p) {
    $componentes = $p['componentes'] ?? [];
    unset($p['componentes']);

    DB::table('productos')->insert($p);
    echo "Insertado producto [{$p['id_producto']}]: {$p['nombre']} (SKU: {$p['sku']}, Tóxico: {$p['es_toxico']})\n";

    foreach ($componentes as $comp) {
        $comp['id_producto'] = $p['id_producto'];
        DB::table('producto_componentes')->insert($comp);
    }
}

// 4. Restaurar líneas de prueba en detalle_pedido para no dejar pedidos huérfanos
$pedidos = DB::table('pedidos')->pluck('id_pedido');
foreach ($pedidos as $id_pedido) {
    // Asignar 2 productos aleatorios a cada pedido existente
    $p1 = $productos[($id_pedido * 2) % count($productos)];
    $p2 = $productos[($id_pedido * 3 + 1) % count($productos)];
    
    DB::table('detalle_pedido')->insert([
        'id_pedido' => $id_pedido,
        'id_producto' => $p1['id_producto'],
        'cantidad_solicitada' => 2.00,
        'precio_total_linea' => $p1['precio_unidad'] * 2.00
    ]);
    
    if ($p1['id_producto'] !== $p2['id_producto']) {
        DB::table('detalle_pedido')->insert([
            'id_pedido' => $id_pedido,
            'id_producto' => $p2['id_producto'],
            'cantidad_solicitada' => 1.00,
            'precio_total_linea' => $p2['precio_unidad'] * 1.00
        ]);
    }
}

echo "\n¡Proceso completado con éxito! Se han registrado " . count($productos) . " productos con sus fichas técnicas y componentes químicos.\n";
