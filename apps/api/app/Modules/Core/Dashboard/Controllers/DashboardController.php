<?php

namespace App\Modules\Core\Dashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Core\Company\Models\Company;
use App\Modules\Core\Department\Models\Department;
use App\Modules\Core\Permission\Models\Permission;
use App\Modules\Core\Role\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(fn (Role $role) => [
                    'id' => $role->id,
                    'key' => $role->key,
                    'name' => $role->name,
                ])->values(),
            ],
            'metrics' => [
                [
                    'key' => 'inventory',
                    'title' => 'Inventory',
                    'value' => 0,
                    'unit' => 'Items',
                    'description' => 'Master item dan stok barang',
                    'href' => '/dashboard/inventory',
                ],
                [
                    'key' => 'purchasing',
                    'title' => 'Purchasing',
                    'value' => 0,
                    'unit' => 'PO',
                    'description' => 'Purchase request dan purchase order',
                    'href' => '/dashboard/purchasing',
                ],
                [
                    'key' => 'sales',
                    'title' => 'Sales',
                    'value' => 0,
                    'unit' => 'SO',
                    'description' => 'Sales order dan invoice',
                    'href' => '/dashboard/sales',
                ],
                [
                    'key' => 'manufacturing',
                    'title' => 'Manufacturing',
                    'value' => 0,
                    'unit' => 'WO',
                    'description' => 'Work order dan produksi',
                    'href' => '/dashboard/manufacturing',
                ],
            ],
            'core_stats' => [
                'companies' => Company::count(),
                'departments' => Department::count(),
                'users' => User::count(),
                'roles' => Role::count(),
                'permissions' => Permission::count(),
            ],
            'roadmap' => [
                [
                    'module' => 'Core System',
                    'owner' => 'Platform',
                    'status' => 'Active',
                    'scope' => 'Company, department, roles, permission',
                ],
                [
                    'module' => 'Inventory',
                    'owner' => 'Operations',
                    'status' => 'Planned',
                    'scope' => 'Item master, stock movement, warehouse',
                ],
                [
                    'module' => 'Purchasing',
                    'owner' => 'Procurement',
                    'status' => 'Planned',
                    'scope' => 'Purchase request, PO, receiving',
                ],
                [
                    'module' => 'Finance',
                    'owner' => 'Finance',
                    'status' => 'Planned',
                    'scope' => 'Invoice, payment, journal, reporting',
                ],
            ],
        ]);
    }
}
