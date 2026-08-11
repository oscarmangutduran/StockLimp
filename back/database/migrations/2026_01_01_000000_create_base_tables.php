<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. centros_trabajo
        Schema::create('centros_trabajo', function (Blueprint $table) {
            $table->id('id_centro');
            $table->string('nombre_centro');
            $table->integer('numero_ruta')->nullable();
            $table->string('direccion')->nullable();
            $table->string('ciudad')->nullable();
        });

        // 2. users
        Schema::create('users', function (Blueprint $table) {
            $table->id('id_user');
            $table->string('nombre', 100);
            $table->string('apellido', 255)->nullable();
            $table->string('email', 100)->unique();
            $table->string('telefono', 255)->nullable();
            $table->string('direccion', 255)->nullable();
            $table->string('foto_perfil', 255)->nullable();
            $table->string('password_hash', 255);
            $table->string('rol', 20)->default('usuario');
            $table->unsignedBigInteger('id_centro')->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->string('estado', 20)->default('activo');
            $table->boolean('solicita_restablecimiento')->default(0)->nullable();
            
            $table->foreign('id_centro')->references('id_centro')->on('centros_trabajo')->onDelete('set null');
        });

        // 3. centro_user (Pivot Table)
        Schema::create('centro_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_centro');

            $table->foreign('id_user')->references('id_user')->on('users')->onDelete('cascade');
            $table->foreign('id_centro')->references('id_centro')->on('centros_trabajo')->onDelete('cascade');
            
            $table->unique(['id_user', 'id_centro']);
        });

        // 4. productos
        Schema::create('productos', function (Blueprint $table) {
            $table->id('id_producto');
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('sku', 50)->unique()->nullable();
            $table->boolean('es_toxico')->default(0)->nullable();
            $table->decimal('precio_unidad', 10, 2)->default(0);
            $table->decimal('stock_actual', 10, 2)->default(0)->nullable();
            $table->timestamp('fecha_registro')->useCurrent();
            $table->string('imagen')->nullable();
        });

        // 5. pedidos
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id('id_pedido');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_centro');
            $table->string('estado', 50)->default('pendiente');
            $table->timestamp('fecha')->useCurrent();
            $table->text('observaciones')->nullable();

            $table->foreign('id_user')->references('id_user')->on('users')->onDelete('cascade');
            $table->foreign('id_centro')->references('id_centro')->on('centros_trabajo')->onDelete('cascade');
        });

        // 6. detalle_pedido (Pivot for Pedidos - Productos)
        Schema::create('detalle_pedido', function (Blueprint $table) {
            $table->unsignedBigInteger('id_pedido');
            $table->unsignedBigInteger('id_producto');
            $table->integer('cantidad')->default(1);

            $table->foreign('id_pedido')->references('id_pedido')->on('pedidos')->onDelete('cascade');
            $table->foreign('id_producto')->references('id_producto')->on('productos')->onDelete('cascade');
            
            $table->primary(['id_pedido', 'id_producto']);
        });

        // 7. fichajes
        Schema::create('fichajes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_user');
            $table->string('estado', 50);
            $table->timestamp('hora_entrada')->nullable();
            $table->timestamp('hora_salida')->nullable();
            $table->text('comentarios')->nullable();
            $table->string('documento_path')->nullable();
            $table->timestamps();

            $table->foreign('id_user')->references('id_user')->on('users')->onDelete('cascade');
        });

        // 8. vacaciones
        Schema::create('vacaciones', function (Blueprint $table) {
            $table->id('id_vacacion');
            $table->unsignedBigInteger('id_user');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('estado', 50)->default('pendiente');
            $table->text('comentarios')->nullable();
            $table->timestamps();

            $table->foreign('id_user')->references('id_user')->on('users')->onDelete('cascade');
        });

        // Laravel Default Tables (cache, jobs, etc)
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('vacaciones');
        Schema::dropIfExists('fichajes');
        Schema::dropIfExists('detalle_pedido');
        Schema::dropIfExists('pedidos');
        Schema::dropIfExists('productos');
        Schema::dropIfExists('centro_user');
        Schema::dropIfExists('users');
        Schema::dropIfExists('centros_trabajo');
    }
};
