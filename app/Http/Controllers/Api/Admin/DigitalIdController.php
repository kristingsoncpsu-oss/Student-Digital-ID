<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DigitalIdResource;
use App\Models\DigitalId;
use App\Services\DigitalIdService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DigitalIdController extends Controller
{
    public function __construct(private DigitalIdService $service)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', DigitalId::class);

        $request->validate([
            'status' => ['nullable', Rule::in(['active', 'suspended', 'revoked'])],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ]);

        $query = DigitalId::query()
            ->with(['student' => fn ($q) => $q->withTrashed()])
            ->when($request->filled('status'), fn (Builder $q) => $q->where('status', $request->query('status')))
            ->when($request->filled('search'), function (Builder $q) use ($request) {
                $q->whereHas('student', fn ($s) => $s->withTrashed()->search($request->query('search')));
            })
            ->latest('issued_at')->orderByDesc('id');

        return DigitalIdResource::collection($query->paginate($request->integer('per_page', 15))->withQueryString());
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $digitalId = DigitalId::findOrFail($id);
        $this->authorize('manage', $digitalId);

        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:255']]);

        return $this->respond($this->service->suspend($digitalId, $data['reason'], $request->user()), 'Digital ID suspended.');
    }

    public function revoke(Request $request, int $id): JsonResponse
    {
        $digitalId = DigitalId::findOrFail($id);
        $this->authorize('manage', $digitalId);

        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:255']]);

        return $this->respond($this->service->revoke($digitalId, $data['reason'], $request->user()), 'Digital ID revoked.');
    }

    public function reactivate(Request $request, int $id): JsonResponse
    {
        $digitalId = DigitalId::findOrFail($id);
        $this->authorize('manage', $digitalId);

        return $this->respond($this->service->reactivate($digitalId, $request->user()), 'Digital ID reactivated.');
    }

    public function rotate(Request $request, int $id): JsonResponse
    {
        $digitalId = DigitalId::findOrFail($id);
        $this->authorize('manage', $digitalId);

        return $this->respond($this->service->rotateToken($digitalId, $request->user()), 'Verification code replaced. Previously shared QR codes no longer work.');
    }

    private function respond(DigitalId $digitalId, string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'digital_id' => DigitalIdResource::make($digitalId->load('student')),
        ]);
    }
}
