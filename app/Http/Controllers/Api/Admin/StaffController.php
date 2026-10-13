<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Staff and administrator accounts. Route group is restricted to the admin role. */
class StaffController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->whereIn('role', [Role::Staff->value, Role::Admin->value])
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.addcslashes($request->query('search'), '%_\\').'%';
                $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return UserResource::collection($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in([Role::Staff->value, Role::Admin->value])],
        ]);

        $user = new User([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => Str::random(40), // replaced by the invitee through the reset link
        ]);
        $user->role = Role::from($data['role']);
        $user->is_active = true;
        $user->save();

        AuditLogger::record('staff.created', $user, metadata: ['role' => $data['role'], 'email' => $user->email]);

        Password::sendResetLink(['email' => $user->email]);

        return response()->json([
            'message' => 'Account created. A password setup link was sent through the configured mailer.',
            'user' => UserResource::make($user),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::whereIn('role', [Role::Staff->value, Role::Admin->value])->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'role' => ['sometimes', 'required', Rule::in([Role::Staff->value, Role::Admin->value])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $isSelf = $user->id === $request->user()->id;
        if ($isSelf && ((isset($data['role']) && $data['role'] !== $user->role->value) || (isset($data['is_active']) && ! $data['is_active']))) {
            abort(422, 'You cannot change your own role or deactivate your own account.');
        }

        $before = ['role' => $user->role->value, 'is_active' => $user->is_active];

        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        if (isset($data['role'])) {
            $user->role = Role::from($data['role']);
        }
        if (array_key_exists('is_active', $data)) {
            $user->is_active = (bool) $data['is_active'];
        }
        $user->save();

        AuditLogger::record('staff.updated', $user, metadata: [
            'before' => $before,
            'after' => ['role' => $user->role->value, 'is_active' => $user->is_active],
        ]);

        return response()->json(['message' => 'Account updated.', 'user' => UserResource::make($user)]);
    }
}
