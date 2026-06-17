<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;

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
Route::get('/pedidos/exportar', [OrderController::class, 'exportarExcel']);