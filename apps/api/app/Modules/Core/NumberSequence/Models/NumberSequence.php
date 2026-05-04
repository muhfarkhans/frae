<?php

namespace App\Modules\Core\NumberSequence\Models;

use Illuminate\Database\Eloquent\Model;

class NumberSequence extends Model
{
    protected $fillable = [
        'company_id',
        'document_type',
        'prefix',
        'current_number',
        'padding',
        'period_format',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}