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
Route::post('/pedidos/update-multiple', [OrderController::class, 'updateMultipleStatus']);
Route::post('/pedidos/update-details', [OrderController::class, 'updateDetails']);
Route::post('/pedidos/delete', [OrderController::class, 'destroy']);
Route::get('/pedidos/exportar', [OrderController::class, 'exportarExcel']);

// Endpoints de centros de trabajo
Route::get('/centros_trabajo', [CenterController::class, 'index']);
Route::post('/centros_trabajo', [CenterController::class, 'store']);
Route::post('/centros_trabajo/update', [CenterController::class, 'update']);
Route::post('/centros_trabajo/delete', [CenterController::class, 'destroy']);

// Endpoints de usuarios (Super Admin y Admin)
Route::get('/usuarios', [UserController::class, 'index']);
Route::post('/usuarios', [UserController::class, 'store']);
Route::post('/usuarios/update-role', [UserController::class, 'updateRole']);
Route::post('/usuarios/aprobar', [UserController::class, 'aprobar']);
Route::post('/usuarios/rechazar', [UserController::class, 'rechazar']);
Route::post('/usuarios/delete', [UserController::class, 'destroy']);
Route::post('/usuarios/update', [UserController::class, 'update']);
Route::post('/usuarios/update-profile', [UserController::class, 'updateProfile']);
Route::post('/usuarios/solicitar-restablecimiento', [UserController::class, 'solicitarRestablecimiento']);
Route::post('/usuarios/enviar-restablecimiento', [UserController::class, 'enviarRestablecimiento']);
Route::post('/usuarios/cambiar-password-obligatorio', [UserController::class, 'cambiarPasswordObligatorio']);

// Endpoints de Control Horario
use App\Http\Controllers\TimeTrackingController;
Route::post('/fichajes/actual', [TimeTrackingController::class, 'actual']);
Route::post('/fichajes/iniciar', [TimeTrackingController::class, 'iniciar']);
Route::post('/fichajes/pausar', [TimeTrackingController::class, 'pausar']);
Route::post('/fichajes/finalizar', [TimeTrackingController::class, 'finalizar']);

// Endpoints de Vacaciones
use App\Http\Controllers\VacacionController;
Route::get('/vacaciones/disponibles', [VacacionController::class, 'diasDisponibles']);
Route::post('/vacaciones', [VacacionController::class, 'solicitar']);
Route::get('/vacaciones/mis-vacaciones', [VacacionController::class, 'misVacaciones']);
Route::get('/vacaciones/todas', [VacacionController::class, 'todas']);
Route::put('/vacaciones/{id}/estado', [VacacionController::class, 'cambiarEstado']);
Route::put('/vacaciones/{id}/cancelar', [VacacionController::class, 'pedirCancelacion']);