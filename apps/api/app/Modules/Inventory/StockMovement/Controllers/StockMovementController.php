<?php

namespace App\Modules\Inventory\StockMovement\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Item\Models\Item;
use App\Modules\Inventory\StockMovement\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
        ]);

        $movements = StockMovement::query()
            ->with(['item:id,sku,name,unit_id', 'item.unit:id,code,name', 'warehouse:id,code,name'])
            ->when($validated['item_id'] ?? null, fn ($query, $itemId) => $query->where('item_id', $itemId))
            ->when($validated['warehouse_id'] ?? null, fn ($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->orderByDesc('movement_date')
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        return response()->json([
            'movements' => $movements->map(fn (StockMovement $movement) => $this->serializeMovement($movement)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'movement_date' => ['required', 'date'],
            'movement_type' => ['required', Rule::in(['opening', 'in', 'out', 'adjustment'])],
            'direction' => ['required', Rule::in(['in', 'out'])],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $item = Item::query()->findOrFail($validated['item_id']);

        if (!$item->track_stock) {
            return response()->json([
                'message' => 'Item ini tidak memakai stock tracking.',
            ], 422);
        }

        $movement = StockMovement::create([
            ...$validated,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Stock movement berhasil dibuat.',
            'movement' => $this->serializeMovement(
                $movement->load(['item:id,sku,name,unit_id', 'item.unit:id,code,name', 'warehouse:id,code,name'])
            ),
        ], 201);
    }

    public function card(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
        ]);

        $item = Item::query()
            ->with(['unit:id,code,name', 'category:id,code,name'])
            ->findOrFail($validated['item_id']);

        $movements = StockMovement::query()
            ->with(['warehouse:id,code,name'])
            ->where('item_id', $item->id)
            ->when($validated['warehouse_id'] ?? null, fn ($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->orderBy('movement_date')
            ->orderBy('id')
            ->get();

        $runningBalance = 0.0;

        $card = $movements->map(function (StockMovement $movement) use (&$runningBalance) {
            $signedQuantity = $movement->signedQuantity();
            $runningBalance += $signedQuantity;

            return [
                ...$this->serializeMovement($movement),
                'qty_in' => $movement->direction === 'in' ? (float) $movement->quantity : 0,
                'qty_out' => $movement->direction === 'out' ? (float) $movement->quantity : 0,
                'balance' => round($runningBalance, 4),
            ];
        });

        return response()->json([
            'item' => [
                'id' => $item->id,
                'sku' => $item->sku,
                'name' => $item->name,
                'unit' => $item->unit,
                'category' => $item->category,
            ],
            'balance' => round($runningBalance, 4),
            'card' => $card,
        ]);
    }

    public static function balances(): Collection
    {
        return StockMovement::query()
            ->with(['item:id,sku,name,unit_id,min_stock', 'item.unit:id,code,name', 'warehouse:id,code,name'])
            ->orderBy('item_id')
            ->orderBy('warehouse_id')
            ->get()
            ->groupBy(fn (StockMovement $movement) => $movement->item_id.'-'.$movement->warehouse_id)
            ->map(function (Collection $movements) {
                $first = $movements->first();
                $balance = $movements->sum(fn (StockMovement $movement) => $movement->signedQuantity());

                return [
                    'item_id' => $first->item_id,
                    'warehouse_id' => $first->warehouse_id,
                    'item' => $first->item,
                    'warehouse' => $first->warehouse,
                    'balance' => round($balance, 4),
                    'min_stock' => (float) $first->item->min_stock,
                    'is_low_stock' => $balance <= (float) $first->item->min_stock,
                ];
            })
            ->values();
    }

    private function serializeMovement(StockMovement $movement): array
    {
        return [
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
        ];
    }
}
