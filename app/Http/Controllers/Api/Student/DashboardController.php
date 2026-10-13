<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $student = $request->user()->student()->withTrashed()
            ->with(['latestApplication', 'digitalId', 'correctionRequests'])->first();

        return response()->json([
            'status' => $student?->portalStatus() ?? 'incomplete',
            'completion' => $student?->completion() ?? 0,
            'student' => $student ? StudentResource::make($student) : null,
            'pending_corrections' => $student?->correctionRequests->where('status', 'pending')->count() ?? 0,
            'activity' => $student ? $this->activity($student)->values() : [],
        ]);
    }

    /**
     * Student-safe timeline built from the student's own records; staff names,
     * internal notes and audit metadata are never included.
     */
    private function activity(Student $student): Collection
    {
        $events = collect();

        foreach ($student->applications()->get() as $a) {
            $events->push(['at' => $a->submitted_at, 'label' => 'Application submitted for review', 'kind' => 'submitted']);
            if ($a->reviewed_at) {
                $events->push([
                    'at' => $a->reviewed_at,
                    'label' => $a->status->value === 'approved' ? 'Application approved' : 'Application not approved',
                    'kind' => $a->status->value,
                ]);
            }
        }

        if ($id = $student->digitalId) {
            $events->push(['at' => $id->issued_at, 'label' => 'Digital ID issued', 'kind' => 'issued']);
            if ($id->suspended_at) {
                $events->push(['at' => $id->suspended_at, 'label' => 'Digital ID suspended', 'kind' => 'suspended']);
            }
            if ($id->revoked_at) {
                $events->push(['at' => $id->revoked_at, 'label' => 'Digital ID revoked', 'kind' => 'revoked']);
            }
        }

        foreach ($student->correctionRequests as $c) {
            $events->push(['at' => $c->created_at, 'label' => 'Correction requested: '.str_replace('_', ' ', $c->field), 'kind' => 'correction']);
            if ($c->reviewed_at) {
                $events->push(['at' => $c->reviewed_at, 'label' => 'Correction request '.$c->status, 'kind' => 'correction']);
            }
        }

        return $events
            ->sortByDesc(fn ($e) => $e['at']->timestamp)
            ->take(8)
            ->map(fn ($e) => [...$e, 'at' => $e['at']->toIso8601String()]);
    }
}
