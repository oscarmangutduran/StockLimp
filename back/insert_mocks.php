<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

// Insert mock centers
$centers = [
    [1, "Almacén Central Cáceres", "Polígono Industrial Las Capellanías, Nave 5", "N/A", 1, "2026-06-17"],
    [2, "Sede Administrativa", "Avenida de la Montaña 12, 10004 Cáceres", "N/A", 2, "2026-06-17"],
    [3, "Centro Logístico Norte", "Calle de la Industria 45, Plasencia", "N/A", 3, "2026-06-17"],
    [4, "Casa", "Torrente Ballester", "Moraleja", 4, "2026-06-17"]
];
$stmtCenter = $prodPdo->prepare("INSERT IGNORE INTO centros_trabajo (id_centro, nombre_centro, direccion, ciudad, numero_ruta, fecha_registro) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($centers as $c) {
    $stmtCenter->execute($c);
}

// Insert mock products
$products = [
    [1, "Detergente Industrial", "DET-IND-001", 1, 1.29, 100, "2026-05-18"],
    [2, "Lejía Concentrada", "LEJ-CON-002", 1, 24.95, 50, "2026-05-18"],
    [3, "Detergente Textil Profesional", "DET-TEX-003", 0, 18.20, 85, "2026-05-18"],
    [4, "Limpia Cristales Concentrado", "CRI-CON-004", 0, 8.45, 120, "2026-06-17"],
    [5, "Desengrasante Fuerte", "DEG-ACID-005", 1, 32.10, 15, "2026-06-17"],
    [6, "Ambientador Bosque 1L", "AMB-BOS-006", 0, 5.75, 200, "2026-06-17"]
];
$stmtProd = $prodPdo->prepare("INSERT IGNORE INTO productos (id_producto, nombre, sku, es_toxico, precio_unidad, stock_actual, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?)");
foreach ($products as $p) {
    $stmtProd->execute($p);
}

echo "Inserted mock centers and products successfully\n";
