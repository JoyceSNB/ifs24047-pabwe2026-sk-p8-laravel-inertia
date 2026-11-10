<?php

namespace App\Features\Auth\Controllers;

use App\Features\Auth\Actions\LoginUserAction;
use App\Features\Auth\Actions\RegisterUserAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController
{
    public function createLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function storeLogin(Request $request, LoginUserAction $action): RedirectResponse
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $remember = (bool) ($credentials['remember'] ?? false);

        if ($action->execute($credentials['login'], $credentials['password'], $remember)) {
            $user = Auth::user();
            if ($user && $user->isAdmin()) {
                return redirect()->intended(route('admin.users'));
            }

            return redirect()->intended(route('todos.index'));
        }

        throw ValidationException::withMessages([
            'login' => 'Username/email atau password yang Anda masukkan tidak sesuai.',
        ]);
    }

    public function createRegister(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function storeRegister(Request $request, RegisterUserAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $action->execute([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'member',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('todos.index');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}

