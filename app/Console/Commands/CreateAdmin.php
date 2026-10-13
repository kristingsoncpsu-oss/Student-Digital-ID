<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {name} {email}';

    protected $description = 'Create the first administrator account (public registration can never create one).';

    public function handle(): int
    {
        $password = $this->secret('Password (min 10 chars, mixed case, with numbers)');

        $validator = Validator::make(
            ['name' => $this->argument('name'), 'email' => $this->argument('email'), 'password' => $password],
            [
                'name' => ['required', 'string', 'max:150'],
                'email' => ['required', 'email', 'unique:users,email'],
                'password' => ['required', Password::defaults()],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = new User([
            'name' => $this->argument('name'),
            'email' => strtolower($this->argument('email')),
            'password' => $password,
        ]);
        $user->role = Role::Admin;
        $user->is_active = true;
        $user->email_verified_at = now();
        $user->save();

        $this->info('Administrator created: '.$user->email);

        return self::SUCCESS;
    }
}
