<?php

namespace App\Features\Profile\Controllers;

use App\Features\Profile\Services\ProfileService;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController
{
    public function edit(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        return Inertia::render('Profile/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'profile_photo_path' => $user->profile_photo_path,
            ],
        ]);
    }

    public function update(Request $request, ProfileService $service): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $service->updateProfile($user, $validated);

        return back()->with('success', 'Identitas profil berhasil diperbarui.');
    }

    public function updatePassword(Request $request, ProfileService $service): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Password saat ini yang Anda masukkan salah.',
            ]);
        }

        $service->updatePassword($user, $validated['password']);

        return back()->with('success', 'Password akun berhasil diubah.');
    }

    public function updatePhoto(Request $request, ProfileService $service): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $request->validate([
            'photo' => ['required'],
        ]);

        $photoInput = $request->input('photo');

        if ($request->hasFile('photo')) {
            $service->updateProfilePhoto($user, $request->file('photo')->getRealPath());
        } elseif (is_string($photoInput)) {
            $service->updateProfilePhoto($user, $photoInput);
        }

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    public function deletePhoto(ProfileService $service): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $service->deleteProfilePhoto($user);

        return back()->with('success', 'Foto profil berhasil dihapus.');
    }
}

