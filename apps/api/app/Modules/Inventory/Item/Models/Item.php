<?php

namespace App\Modules\Inventory\Item\Models;

use App\Modules\Inventory\ItemCategory\Models\ItemCategory;
use App\Modules\Inventory\Unit\Models\Unit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sku',
        'name',
        'category_id',
        'unit_id',
        'item_type',
        'track_stock',
        'min_stock',
        'description',
        'is_active',
    ];

    protected $casts = [
        'track_stock' => 'boolean',
        'is_active' => 'boolean',
        'min_stock' => 'decimal:4',
    ];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
