<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'api_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('api_token', 80)->nullable();
                $table->unique('api_token');
            });
        }

        if (Schema::hasTable('productos')) {
            if (!Schema::hasColumn('productos', 'descripcion')) {
                Schema::table('productos', function (Blueprint $table) {
                    $table->text('descripcion')->nullable();
                });
            }
            if (!Schema::hasColumn('productos', 'ficha_tecnica')) {
                Schema::table('productos', function (Blueprint $table) {
                    $table->string('ficha_tecnica')->nullable();
                });
            }
        }

        if (Schema::hasTable('pedidos') && !Schema::hasColumn('pedidos', 'fecha')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->timestamp('fecha')->nullable();
            });
        }

        if (Schema::hasTable('detalle_pedido') && !Schema::hasColumn('detalle_pedido', 'cantidad')) {
            Schema::table('detalle_pedido', function (Blueprint $table) {
                $table->integer('cantidad')->default(1)->nullable();
            });
        }

        if (!Schema::hasTable('producto_componentes')) {
            Schema::create('producto_componentes', function (Blueprint $table) {
                $table->id('id_componente');
                $table->unsignedBigInteger('id_producto');
                $table->string('nombre_componente');
                $table->string('porcentaje', 50)->nullable();
                $table->text('descripcion_seguridad')->nullable();

                $table->foreign('id_producto')->references('id_producto')->on('productos')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->integer('expiration');
            });
        }

        if (!Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->string('owner');
                $table->integer('expiration');
            });
        }

        if (!Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->id();
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        if (!Schema::hasTable('job_batches')) {
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
        }

        if (!Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->unique();
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    public function down(): void
    {
        // No-op: columns/tables belong to base schema synchronization
    }
};

