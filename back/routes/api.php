<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CenterController;
use App\Http\Controllers\OrderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí es donde puedes registrar las rutas de la API para StockLimp.
| Todas estas rutas se cargan automáticamente bajo el prefijo "/api" 
| gracias al mapeo central de Laravel, por lo que tu Front-end de Vite
| accederá a ellas mediante "http://127.0.0.1:8000/api/...".
|
*/

// ==========================================
// 1. MÓDULO DE AUTENTICACIÓN (USUARIOS)
// ==========================================
Route::post('/usuarios/login', [UserController::class, 'login']);


// ==========================================
// 2. MÓDULO DE ALMACÉN (PRODUCTOS)
// ==========================================
// Obtener todos los productos
Route::get('/productos', [ProductController::class, 'index']);

// Crear un producto nuevo
Route::post('/productos', [ProductController::class, 'store']);

// Actualizar un producto existente
Route::post('/productos/update', [ProductController::class, 'update']);

// Eliminar un producto
Route::post('/productos/delete', [ProductController::class, 'destroy']);


// ==========================================
// 3. MÓDULO DE INFRAESTRUCTURA (CENTROS)
// ==========================================
// Obtener todos los centros de trabajo
Route::get('/centros_trabajo', [CenterController::class, 'index']);

// Crear un centro nuevo
Route::post('/centros_trabajo', [CenterController::class, 'store']);

// Actualizar un centro existente
Route::post('/centros_trabajo/update', [CenterController::class, 'update']);

// Eliminar un centro
Route::post('/centros_trabajo/delete', [CenterController::class, 'destroy']);


// ==========================================
// 4. MÓDULO DE LOGÍSTICA Y SUMINISTROS (PEDIDOS)
// ==========================================
// Obtener el historial de pedidos
Route::get('/pedidos', [OrderController::class, 'index']);

// Registrar un pedido múltiple (Carrito de compras con desglose)
Route::post('/pedidos/multiple', [OrderController::class, 'storeMultiple']);

// Actualizar el estado o fecha de un pedido (Aprobar/Rechazar)
Route::post('/pedidos/update', [OrderController::class, 'updateStatus']);