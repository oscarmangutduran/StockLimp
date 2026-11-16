<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'productos';
    protected $primaryKey = 'id_producto';
    
    // Como tu SQL no tiene las columnas 'created_at' y 'updated_at', desactivamos el timestamp automático de Laravel
    public $timestamps = false; 

    protected $guarded = [];

    public function componentes()
    {
        return $this->hasMany(ProductComponent::class, 'id_producto', 'id_producto');
    }

    /**
     * Normaliza la ruta de imagen y resuelve imágenes faltantes o con rutas antiguas
     * usando los archivos reales en public/uploads/productos.
     */
    public function getImagenAttribute($value)
    {
        if (!empty($value)) {
            if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                return $value;
            }
            $clean = ltrim($value, '/');
            if (!str_starts_with($clean, 'uploads/')) {
                $clean = 'uploads/productos/' . $clean;
            }
            if (file_exists(public_path($clean))) {
                return $clean;
            }
        }

        $nombre = mb_strtolower($this->attributes['nombre'] ?? '');
        $map = [
            'lejia color' => 'uploads/productos/Lejia color.webp',
            'lejia detergente' => 'uploads/productos/Lejia color.webp',
            'lejía color' => 'uploads/productos/Lejia color.webp',
            'lejia' => 'uploads/productos/lejia.webp',
            'lejía' => 'uploads/productos/lejia.webp',
            'desatascador' => 'uploads/productos/lejia.webp',
            'quita cementos' => 'uploads/productos/lejia.webp',
            'amoniaco' => 'uploads/productos/amoniaco.webp',
            'arrixaca' => 'uploads/productos/arrixaca.webp',
            'lavavajillas' => 'uploads/productos/lavavajillas.webp',
            'flota' => 'uploads/productos/lavavajillas.webp',
            'desengrasante' => 'uploads/productos/limpiacristales.webp',
            'desgrafion' => 'uploads/productos/limpiacristales.webp',
            'cristasol' => 'uploads/productos/limpiacristales.webp',
            'limpiacristales' => 'uploads/productos/limpiacristales.webp',
            'tergi inox' => 'uploads/productos/limpiacristales.webp',
            'tintas' => 'uploads/productos/limpiacristales.webp',
            'splash' => 'uploads/productos/ambientador.webp',
            'glup' => 'uploads/productos/ambientador.webp',
            'ambientador' => 'uploads/productos/ambientador.webp',
            'multi-asepti' => 'uploads/productos/ambientador.webp',
            'fregasuelos' => 'uploads/productos/ropa limpia.webp',
            'bayeta' => 'uploads/productos/bayetas multihogar.webp',
            'gamuza' => 'uploads/productos/bayetas.webp',
            'fregona' => 'uploads/productos/fregona.webp',
            'fmicrofis' => 'uploads/productos/mopa.webp',
            'mopa' => 'uploads/productos/spray_mopa.webp',
            'madera' => 'uploads/productos/spray_mopa.webp',
            'moblysol' => 'uploads/productos/spray_mopa.webp',
            'centella' => 'uploads/productos/spray_mopa.webp',
            'superbrillo' => 'uploads/productos/spray_mopa.webp',
            'saco' => 'uploads/productos/sacos.webp',
            'bolsa' => 'uploads/productos/bolsas.webp',
            'cepillo' => 'uploads/productos/cepillo.webp',
            'palo' => 'uploads/productos/palo.webp',
            'recogedor' => 'uploads/productos/recogedor.webp',
            'plumero' => 'uploads/productos/plumero.webp',
            'estropajo' => 'uploads/productos/estropajo.jpeg',
        ];

        foreach ($map as $keyword => $path) {
            if (str_contains($nombre, $keyword) && file_exists(public_path($path))) {
                return $path;
            }
        }

        return null;
    }
}