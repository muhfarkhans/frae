<?php

use App\Modules\Core\Auth\Controllers\AuthController;
use App\Modules\Core\Dashboard\Controllers\DashboardController;
use App\Modules\Core\Organization\Controllers\OrganizationController;
use App\Modules\Core\UserRole\Controllers\UserRoleController;
use App\Modules\Inventory\Master\Controllers\InventoryMasterController;
use App\Modules\Inventory\StockMovement\Controllers\StockMovementController;
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
    Route::get('/dashboard/summary', [DashboardController::class, 'summary'])
        ->middleware('permission:view-dashboard');

    Route::get('/core/users-roles', [UserRoleController::class, 'index'])
        ->middleware('permission:view-user');
    Route::post('/core/users', [UserRoleController::class, 'storeUser'])
        ->middleware('permission:create-user');
    Route::put('/core/users/{user}', [UserRoleController::class, 'updateUser'])
        ->middleware('permission:edit-user');
    Route::post('/core/roles', [UserRoleController::class, 'storeRole'])
        ->middleware('permission:create-role');
    Route::put('/core/roles/{role}', [UserRoleController::class, 'updateRole'])
        ->middleware('permission:edit-role');

    Route::get('/core/organization', [OrganizationController::class, 'index'])
        ->middleware('permission:view-organization');
    Route::post('/core/companies', [OrganizationController::class, 'storeCompany'])
        ->middleware('permission:create-organization');
    Route::put('/core/companies/{company}', [OrganizationController::class, 'updateCompany'])
        ->middleware('permission:edit-organization');
    Route::post('/core/departments', [OrganizationController::class, 'storeDepartment'])
        ->middleware('permission:create-organization');
    Route::put('/core/departments/{department}', [OrganizationController::class, 'updateDepartment'])
        ->middleware('permission:edit-organization');
    Route::post('/core/positions', [OrganizationController::class, 'storePosition'])
        ->middleware('permission:create-organization');
    Route::put('/core/positions/{position}', [OrganizationController::class, 'updatePosition'])
        ->middleware('permission:edit-organization');

    Route::get('/inventory/master', [InventoryMasterController::class, 'index'])
        ->middleware('permission:view-item');
    Route::post('/inventory/items', [InventoryMasterController::class, 'storeItem'])
        ->middleware('permission:create-item');
    Route::put('/inventory/items/{item}', [InventoryMasterController::class, 'updateItem'])
        ->middleware('permission:edit-item');
    Route::post('/inventory/categories', [InventoryMasterController::class, 'storeCategory'])
        ->middleware('permission:create-item');
    Route::put('/inventory/categories/{category}', [InventoryMasterController::class, 'updateCategory'])
        ->middleware('permission:edit-item');
    Route::post('/inventory/units', [InventoryMasterController::class, 'storeUnit'])
        ->middleware('permission:create-item');
    Route::put('/inventory/units/{unit}', [InventoryMasterController::class, 'updateUnit'])
        ->middleware('permission:edit-item');
    Route::post('/inventory/warehouses', [InventoryMasterController::class, 'storeWarehouse'])
        ->middleware('permission:create-item');
    Route::put('/inventory/warehouses/{warehouse}', [InventoryMasterController::class, 'updateWarehouse'])
        ->middleware('permission:edit-item');
    Route::get('/inventory/stock-movements', [StockMovementController::class, 'index'])
        ->middleware('permission:view-item');
    Route::post('/inventory/stock-movements', [StockMovementController::class, 'store'])
        ->middleware('permission:create-item');
    Route::get('/inventory/stock-card', [StockMovementController::class, 'card'])
        ->middleware('permission:view-item');
});
