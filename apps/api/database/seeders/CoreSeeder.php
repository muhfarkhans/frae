<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Core\Company\Models\Company;
use App\Modules\Core\Department\Models\Department;
use App\Modules\Core\Permission\Models\Permission;
use App\Modules\Core\Role\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CoreSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::firstOrCreate(
            ['code' => 'MAIN'],
            [
                'name' => 'Main Company',
                'address' => 'Indonesia',
                'is_active' => true,
            ]
        );

        $department = Department::firstOrCreate(
            [
                'company_id' => $company->id,
                'code' => 'IT',
            ],
            [
                'name' => 'Information Technology',
                'is_active' => true,
            ]
        );

        $permissions = [
            ['key' => 'view-dashboard', 'name' => 'View Dashboard', 'module' => 'core'],

            ['key' => 'view-user', 'name' => 'View User', 'module' => 'core'],
            ['key' => 'create-user', 'name' => 'Create User', 'module' => 'core'],
            ['key' => 'edit-user', 'name' => 'Edit User', 'module' => 'core'],
            ['key' => 'delete-user', 'name' => 'Delete User', 'module' => 'core'],

            ['key' => 'view-item', 'name' => 'View Item', 'module' => 'inventory'],
            ['key' => 'create-item', 'name' => 'Create Item', 'module' => 'inventory'],
            ['key' => 'edit-item', 'name' => 'Edit Item', 'module' => 'inventory'],
            ['key' => 'delete-item', 'name' => 'Delete Item', 'module' => 'inventory'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['key' => $permission['key']],
                $permission
            );
        }

        $adminRole = Role::firstOrCreate(
            ['key' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full access',
                'is_active' => true,
            ]
        );

        $adminRole->permissions()->sync(Permission::pluck('id')->toArray());

        $admin = User::firstOrCreate(
            ['email' => 'admin@frae.test'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'department_id' => $department->id,
                'is_active' => true,
            ]
        );

        $admin->roles()->sync([$adminRole->id]);
    }
}