<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

class DummyImport implements \Maatwebsite\Excel\Concerns\ToArray {
    public function array(array $array) {}
}

$data = \Maatwebsite\Excel\Facades\Excel::toArray(new DummyImport(), 'imports/ALBORNOZ YOLI.XLS');
echo json_encode(array_slice($data[0], 0, 15));
