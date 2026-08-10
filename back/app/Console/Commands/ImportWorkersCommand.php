<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\WorkCenter;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ImportWorkersCommand extends Command
{
    protected $signature = 'import:workers';
    protected $description = 'Importa los trabajadores y centros desde los archivos Excel';

    public function handle()
    {
        ini_set('memory_limit', '-1');
        
        $path = storage_path('app/imports');
        
        if (!File::isDirectory($path)) {
            $this->error("El directorio {$path} no existe.");
            return;
        }

        $files = File::files($path);
        $this->info("Encontrados " . count($files) . " archivos en la carpeta.");

        foreach ($files as $file) {
            $extension = strtolower($file->getExtension());
            if (!in_array($extension, ['xls', 'xlsx', 'csv'])) {
                $this->warn("Saltando archivo no válido: " . $file->getFilename());
                continue;
            }

            $this->line("Procesando: " . $file->getFilename());

            try {
                $data = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
                    public function array(array $array) {}
                }, $file->getPathname());

                if (!isset($data[0])) {
                    continue;
                }

                $sheet = $data[0];
                $nombreTrabajador = trim($sheet[1][1] ?? '');
                
                if (empty($nombreTrabajador)) {
                    $this->warn("No se pudo encontrar el nombre en: " . $file->getFilename());
                    continue;
                }

                $partes = explode(' ', $nombreTrabajador, 2);
                $nombre = $partes[0];
                $apellidos = $partes[1] ?? '';
                $email = strtolower($nombre) . '.' . strtolower(str_replace(' ', '', $apellidos)) . '@ejemplo.com';

                $user = User::firstOrCreate(
                    ['nombre' => $nombre, 'apellido' => $apellidos],
                    [
                        'email' => $email,
                        'password_hash' => bcrypt('password123'),
                        'estado' => 'activo'
                    ]
                );

                $centrosIds = [];

                for ($i = 6; $i < count($sheet); $i++) {
                    $fila = $sheet[$i];
                    $nombreCentro = trim($fila[3] ?? '');

                    if (!empty($nombreCentro) && $nombreCentro != 'Centro') {
                        $centro = WorkCenter::firstOrCreate(
                            ['nombre_centro' => $nombreCentro],
                            ['direccion' => '']
                        );
                        $centrosIds[] = $centro->id_centro;
                    }
                }

                if (count($centrosIds) > 0) {
                    $centrosIds = array_unique($centrosIds);
                    $user->centros()->syncWithoutDetaching($centrosIds);
                }

            } catch (\Exception $e) {
                $this->error("Error procesando {$file->getFilename()}: " . $e->getMessage());
            }
        }

        $this->info("¡Importación completada!");
    }
}
