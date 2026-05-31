<?php

namespace App\Modules\Inventory\Unit\Models;

use App\Modules\Inventory\Item\Models\Item;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'precision',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'precision' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
