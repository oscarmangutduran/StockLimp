<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fichajes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_user');
            $table->enum('estado', ['trabajando', 'en_pausa', 'finalizado']);
            $table->timestamp('hora_entrada')->useCurrent();
            $table->timestamp('hora_salida')->nullable();
            $table->text('comentarios')->nullable();
            $table->string('documento_path')->nullable();
            $table->timestamps();

            // Asumiendo que el id de users es id_user y de tipo integer, lo ajustamos si es necesario.
            // En nuestra BD vimos que era "int unsigned", por lo que:
            // $table->unsignedInteger('id_user')->change(); // Wait, let's just create it properly:
        });
        
        // Ajustamos la clave foránea (sabiendo que users.id_user es int unsigned)
        Schema::table('fichajes', function (Blueprint $table) {
            $table->unsignedInteger('id_user')->change();
            $table->foreign('id_user')->references('id_user')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fichajes');
    }
};
