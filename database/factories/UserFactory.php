<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('Password#12345'),
            'remember_token' => Str::random(10),
        ];
    }

    /** role / is_active are not mass-assignable, so they are set after make(). */
    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            $user->role ??= Role::Student;
            $user->is_active ??= true;
        });
    }

    public function role(Role $role): static
    {
        return $this->afterMaking(fn (User $user) => $user->role = $role);
    }

    public function admin(): static
    {
        return $this->role(Role::Admin);
    }

    public function staff(): static
    {
        return $this->role(Role::Staff);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    public function inactive(): static
    {
        return $this->afterMaking(fn (User $user) => $user->is_active = false);
    }
}
