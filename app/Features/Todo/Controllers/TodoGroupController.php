<?php

namespace App\Features\Todo\Controllers;

use App\Features\Todo\Models\TodoGroup;
use App\Features\Todo\Services\TodoGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class TodoGroupController
{
    /**
     * Store a newly created todo group.
     */
    public function store(Request $request, TodoGroupService $service): RedirectResponse
    {
        if ($request->has('name') && !$request->has('title')) {
            $request->merge(['title' => $request->input('name')]);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $service->createGroup((int) Auth::id(), $validated);

        return back()->with('success', 'Kelompok todo berhasil dibuat.');
    }

    /**
     * Update an existing todo group.
     */
    public function update(Request $request, TodoGroup $todoGroup, TodoGroupService $service): RedirectResponse
    {
        Gate::authorize('update', $todoGroup);

        if ($request->has('name') && !$request->has('title')) {
            $request->merge(['title' => $request->input('name')]);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $service->updateGroup($todoGroup, $validated);

        return back()->with('success', 'Kelompok todo berhasil diperbarui.');
    }

    /**
     * Delete an existing todo group.
     */
    public function destroy(TodoGroup $todoGroup, TodoGroupService $service): RedirectResponse
    {
        Gate::authorize('delete', $todoGroup);

        $service->deleteGroup($todoGroup);

        return back()->with('success', 'Kelompok todo berhasil dihapus.');
    }

    /**
     * Toggle public template status.
     */
    public function togglePublic(TodoGroup $todoGroup, TodoGroupService $service): RedirectResponse
    {
        Gate::authorize('update', $todoGroup);

        $service->updateGroup($todoGroup, [
            'is_public' => !$todoGroup->is_public,
        ]);

        $msg = $todoGroup->is_public
            ? 'Kelompok todo kini menjadi privat.'
            : 'Kelompok todo berhasil dipublikasikan sebagai template!';

        return back()->with('success', $msg);
    }
}
