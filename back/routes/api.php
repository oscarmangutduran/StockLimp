<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CenterController;

// Endpoint de autenticación
Route::post('/usuarios/login', [UserController::class, 'login']);

// Endpoints de almacén y productos
Route::get('/productos', [ProductController::class, 'index']);
Route::post('/productos', [ProductController::class, 'store']);
Route::post('/productos/update', [ProductController::class, 'update']);
Route::post('/productos/delete', [ProductController::class, 'destroy']);
Route::get('/productos/exportar', [ProductController::class, 'exportarExcel']);

// Endpoints de logística y pedidos de material
Route::get('/pedidos', [OrderController::class, 'index']);
Route::post('/pedidos/multiple', [OrderController::class, 'storeMultiple']);
Route::post('/pedidos/update', [OrderController::class, 'updateStatus']);
Route::post('/pedidos/delete', [OrderController::class, 'destroy']);
Route::get('/pedidos/exportar', [OrderController::class, 'exportarExcel']);

// Endpoints de centros de trabajo
Route::get('/centros_trabajo', [CenterController::class, 'index']);
Route::post('/centros_trabajo', [CenterController::class, 'store']);
Route::post('/centros_trabajo/update', [CenterController::class, 'update']);
Route::post('/centros_trabajo/delete', [CenterController::class, 'destroy']);