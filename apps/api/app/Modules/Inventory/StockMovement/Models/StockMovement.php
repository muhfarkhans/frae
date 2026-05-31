<?php

namespace App\Modules\Inventory\StockMovement\Models;

use App\Models\User;
use App\Modules\Inventory\Item\Models\Item;
use App\Modules\Inventory\Warehouse\Models\Warehouse;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'item_id',
        'warehouse_id',
        'created_by',
        'movement_date',
        'movement_type',
        'direction',
        'quantity',
        'reference_no',
        'notes',
    ];

    protected $casts = [
        'movement_date' => 'date',
        'quantity' => 'decimal:4',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function signedQuantity(): float
    {
        $quantity = (float) $this->quantity;

        return $this->direction === 'out' ? -$quantity : $quantity;
    }
}
