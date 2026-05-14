<?php

use App\Modules\Core\Auth\Controllers\AuthController;
use App\Modules\Core\Dashboard\Controllers\DashboardController;
use App\Modules\Core\UserRole\Controllers\UserRoleController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/core/users-roles', [UserRoleController::class, 'index']);
    Route::post('/core/users', [UserRoleController::class, 'storeUser']);
    Route::put('/core/users/{user}', [UserRoleController::class, 'updateUser']);
    Route::post('/core/roles', [UserRoleController::class, 'storeRole']);
    Route::put('/core/roles/{role}', [UserRoleController::class, 'updateRole']);
});
