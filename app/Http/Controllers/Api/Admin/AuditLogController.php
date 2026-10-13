<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /** Staff can see student-related history; administrators see everything. */
    private const STAFF_TARGETS = ['student', 'application', 'digital_id', 'correction_request'];

    public function index(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ]);

        $query = AuditLog::query()
            ->with('actor')
            ->when(! $user->isAdmin(), fn (Builder $q) => $q->whereIn('target_type', self::STAFF_TARGETS))
            ->when($request->filled('action'), fn (Builder $q) => $q->where('action', 'like', addcslashes($request->query('action'), '%_\\').'%'))
            ->when($request->filled('target_type'), fn (Builder $q) => $q->where('target_type', $request->query('target_type')))
            ->when($request->filled('target_id'), fn (Builder $q) => $q->where('target_id', $request->integer('target_id')))
            ->when($request->filled('from'), fn (Builder $q) => $q->where('created_at', '>=', $request->date('from')->startOfDay()))
            ->when($request->filled('to'), fn (Builder $q) => $q->where('created_at', '<=', $request->date('to')->endOfDay()))
            ->latest('id');

        return AuditLogResource::collection($query->paginate($request->integer('per_page', 25))->withQueryString());
    }
}
