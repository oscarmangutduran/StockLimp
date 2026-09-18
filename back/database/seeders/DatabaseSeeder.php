<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $dataFile = database_path('seed_data.json');
        if (!file_exists($dataFile)) {
            $this->command->info("seed_data.json not found, skipping seeder.");
            return;
        }

        // Si ya hay usuarios y centros, no duplicar
        if (DB::table('users')->count() > 0 && DB::table('centros_trabajo')->count() > 0) {
            $this->command->info("Database already seeded. Skipping.");
            return;
        }

        $this->command->info("Seeding database from seed_data.json...");
        $data = json_decode(file_get_contents($dataFile), true);

        // Desactivar temporalmente foreign keys según el driver
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } elseif ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS = 0;');
        }

        foreach ($data as $tableName => $rows) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            if (DB::table($tableName)->count() === 0 && !empty($rows)) {
                $this->command->info("Inserting " . count($rows) . " rows into '$tableName'...");
                
                // Insertar en chunks de 100
                $chunks = array_chunk($rows, 100);
                foreach ($chunks as $chunk) {
                    DB::table($tableName)->insert($chunk);
                }
            }
        }

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } elseif ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
        }

        $this->command->info("Seeding completed successfully!");
    }
}
