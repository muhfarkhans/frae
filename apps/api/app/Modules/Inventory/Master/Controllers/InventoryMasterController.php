<?php

namespace App\Modules\Inventory\Master\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Company\Models\Company;
use App\Modules\Inventory\Item\Models\Item;
use App\Modules\Inventory\ItemCategory\Models\ItemCategory;
use App\Modules\Inventory\StockMovement\Controllers\StockMovementController;
use App\Modules\Inventory\StockMovement\Models\StockMovement;
use App\Modules\Inventory\Unit\Models\Unit;
use App\Modules\Inventory\Warehouse\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryMasterController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'items' => Item::query()
                ->with(['category:id,code,name', 'unit:id,code,name'])
                ->orderBy('name')
                ->get(),
            'categories' => ItemCategory::query()
                ->withCount('items')
                ->orderBy('name')
                ->get(),
            'units' => Unit::query()
                ->withCount('items')
                ->orderBy('name')
                ->get(),
            'warehouses' => Warehouse::query()
                ->with('company:id,code,name')
                ->orderBy('name')
                ->get(),
            'stock_balances' => StockMovementController::balances(),
            'stock_movements' => StockMovement::query()
                ->with(['item:id,sku,name,unit_id', 'item.unit:id,code,name', 'warehouse:id,code,name'])
                ->orderByDesc('movement_date')
                ->orderByDesc('id')
                ->limit(25)
                ->get()
                ->map(fn (StockMovement $movement) => [
                    'id' => $movement->id,
                    'item_id' => $movement->item_id,
                    'warehouse_id' => $movement->warehouse_id,
                    'movement_date' => $movement->movement_date?->toDateString(),
                    'movement_type' => $movement->movement_type,
                    'direction' => $movement->direction,
                    'quantity' => (float) $movement->quantity,
                    'signed_quantity' => $movement->signedQuantity(),
                    'reference_no' => $movement->reference_no,
                    'notes' => $movement->notes,
                    'item' => $movement->item,
                    'warehouse' => $movement->warehouse,
                ]),
            'companies' => Company::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
        ]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $item = Item::create($this->validateItem($request));

        return response()->json([
            'message' => 'Item berhasil dibuat.',
            'item' => $item->load(['category:id,code,name', 'unit:id,code,name']),
        ], 201);
    }

    public function updateItem(Request $request, Item $item): JsonResponse
    {
        $item->update($this->validateItem($request, $item));

        return response()->json([
            'message' => 'Item berhasil diperbarui.',
            'item' => $item->fresh()->load(['category:id,code,name', 'unit:id,code,name']),
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $category = ItemCategory::create($this->validateCategory($request));

        return response()->json([
            'message' => 'Category berhasil dibuat.',
            'category' => $category,
        ], 201);
    }

    public function updateCategory(Request $request, ItemCategory $category): JsonResponse
    {
        $category->update($this->validateCategory($request, $category));

        return response()->json([
            'message' => 'Category berhasil diperbarui.',
            'category' => $category->fresh(),
        ]);
    }

    public function storeUnit(Request $request): JsonResponse
    {
        $unit = Unit::create($this->validateUnit($request));

        return response()->json([
            'message' => 'Unit berhasil dibuat.',
            'unit' => $unit,
        ], 201);
    }

    public function updateUnit(Request $request, Unit $unit): JsonResponse
    {
        $unit->update($this->validateUnit($request, $unit));

        return response()->json([
            'message' => 'Unit berhasil diperbarui.',
            'unit' => $unit->fresh(),
        ]);
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        $warehouse = Warehouse::create($this->validateWarehouse($request));

        return response()->json([
            'message' => 'Warehouse berhasil dibuat.',
            'warehouse' => $warehouse->load('company:id,code,name'),
        ], 201);
    }

    public function updateWarehouse(Request $request, Warehouse $warehouse): JsonResponse
    {
        $warehouse->update($this->validateWarehouse($request, $warehouse));

        return response()->json([
            'message' => 'Warehouse berhasil diperbarui.',
            'warehouse' => $warehouse->fresh()->load('company:id,code,name'),
        ]);
    }

    private function validateItem(Request $request, ?Item $item = null): array
    {
        return $request->validate([
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('items', 'sku')->ignore($item?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:item_categories,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'item_type' => ['required', Rule::in(['stock', 'non-stock', 'service'])],
            'track_stock' => ['required', 'boolean'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validateCategory(Request $request, ?ItemCategory $category = null): array
    {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('item_categories', 'code')->ignore($category?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validateUnit(Request $request, ?Unit $unit = null): array
    {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('units', 'code')->ignore($unit?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'precision' => ['required', 'integer', 'min:0', 'max:6'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function validateWarehouse(Request $request, ?Warehouse $warehouse = null): array
    {
        return $request->validate([
            'company_id' => ['nullable', 'exists:companies,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('warehouses', 'code')
                    ->when(
                        $request->filled('company_id'),
                        fn ($rule) => $rule->where('company_id', $request->integer('company_id')),
                        fn ($rule) => $rule->whereNull('company_id')
                    )
                    ->ignore($warehouse?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
