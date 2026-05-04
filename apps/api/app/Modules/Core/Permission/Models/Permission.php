<?php

namespace App\Modules\Core\Permission\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = [
        'key',
        'name',
        'module',
        'description',
    ];
}