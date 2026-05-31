<?php

namespace App\Modules\Core\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Company\Models\Company;
use App\Modules\Core\Department\Models\Department;
use App\Modules\Core\Position\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'companies' => Company::query()
                ->withCount('departments')
                ->orderBy('name')
                ->get(),
            'departments' => Department::query()
                ->with(['company:id,code,name'])
                ->withCount('positions')
                ->orderBy('name')
                ->get(),
            'positions' => Position::query()
                ->with(['department:id,company_id,code,name', 'department.company:id,code,name'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeCompany(Request $request): JsonResponse
    {
        $company = Company::create($this->validateCompany($request));

        return response()->json([
            'message' => 'Company berhasil dibuat.',
            'company' => $company,
        ], 201);
    }

    public function updateCompany(Request $request, Company $company): JsonResponse
    {
        $company->update($this->validateCompany($request, $company));

        return response()->json([
            'message' => 'Company berhasil diperbarui.',
            'company' => $company->fresh(),
        ]);
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $department = Department::create($this->validateDepartment($request));

        return response()->json([
            'message' => 'Department berhasil dibuat.',
            'department' => $department->load('company:id,code,name'),
        ], 201);
    }

    public function updateDepartment(Request $request, Department $department): JsonResponse
    {
        $department->update($this->validateDepartment($request, $department));

        return response()->json([
            'message' => 'Department berhasil diperbarui.',
            'department' => $department->fresh()->load('company:id,code,name'),
        ]);
    }

    public function storePosition(Request $request): JsonResponse
    {
        $position = Position::create($this->validatePosition($request));

        return response()->json([
            'message' => 'Position berhasil dibuat.',
            'position' => $position->load('department:id,company_id,code,name'),
        ], 201);
    }

    public function updatePosition(Request $request, Position $position): JsonResponse
    {
        $position->update($this->validatePosition($request, $position));

        return response()->json([
            'message' => 'Position berhasil diperbarui.',
            'position' => $position->fresh()->load('department:id,company_id,code,name'),
        ]);
    }

    private function validateCompany(Request $request, ?Company $company = null): array
    {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('companies', 'code')->ignore($company?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validateDepartment(Request $request, ?Department $department = null): array
    {
        return $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'code')
                    ->where('company_id', $request->integer('company_id'))
                    ->ignore($department?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validatePosition(Request $request, ?Position $position = null): array
    {
        return $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('positions', 'code')
                    ->when(
                        $request->filled('department_id'),
                        fn ($rule) => $rule->where('department_id', $request->integer('department_id')),
                        fn ($rule) => $rule->whereNull('department_id')
                    )
                    ->ignore($position?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
