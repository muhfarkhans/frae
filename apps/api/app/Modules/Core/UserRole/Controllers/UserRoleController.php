<?php

namespace App\Modules\Core\UserRole\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Core\Company\Models\Company;
use App\Modules\Core\Department\Models\Department;
use App\Modules\Core\Permission\Models\Permission;
use App\Modules\Core\Role\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserRoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'users' => User::query()
                ->with(['company:id,code,name', 'department:id,code,name', 'roles:id,key,name'])
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'company_id' => $user->company_id,
                    'department_id' => $user->department_id,
                    'company' => $user->company ? [
                        'id' => $user->company->id,
                        'code' => $user->company->code,
                        'name' => $user->company->name,
                    ] : null,
                    'department' => $user->department ? [
                        'id' => $user->department->id,
                        'code' => $user->department->code,
                        'name' => $user->department->name,
                    ] : null,
                    'roles' => $user->roles->map(fn (Role $role) => [
                        'id' => $role->id,
                        'key' => $role->key,
                        'name' => $role->name,
                    ])->values(),
                ]),
            'roles' => Role::query()
                ->with('permissions:id,key,name,module')
                ->orderBy('name')
                ->get()
                ->map(fn (Role $role) => [
                    'id' => $role->id,
                    'key' => $role->key,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_active' => $role->is_active,
                    'permissions' => $role->permissions
                        ->sortBy(['module', 'name'])
                        ->map(fn (Permission $permission) => [
                            'id' => $permission->id,
                            'key' => $permission->key,
                            'name' => $permission->name,
                            'module' => $permission->module,
                        ])
                        ->values(),
                ]),
            'permissions' => Permission::query()
                ->orderBy('module')
                ->orderBy('name')
                ->get(['id', 'key', 'name', 'module']),
            'companies' => Company::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'departments' => Department::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'company_id', 'code', 'name']),
        ]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'is_active' => ['required', 'boolean'],
            'role_ids' => ['array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        $user = User::create($validated);
        $user->roles()->sync($validated['role_ids'] ?? []);

        return response()->json([
            'message' => 'User berhasil dibuat.',
            'user' => $user->load('roles'),
        ], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'is_active' => ['required', 'boolean'],
            'role_ids' => ['array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        if (blank($validated['password'] ?? null)) {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->roles()->sync($validated['role_ids'] ?? []);

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'user' => $user->fresh()->load('roles'),
        ]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:roles,key'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::create($validated);
        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return response()->json([
            'message' => 'Role berhasil dibuat.',
            'role' => $role->load('permissions'),
        ], 201);
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'key' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'key')->ignore($role->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role->update($validated);
        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return response()->json([
            'message' => 'Role berhasil diperbarui.',
            'role' => $role->fresh()->load('permissions'),
        ]);
    }
}
