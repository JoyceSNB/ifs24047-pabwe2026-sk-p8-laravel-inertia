<?php

namespace App\Features\Todo\Controllers;

use App\Features\Todo\Services\TodoGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PublicTemplateController
{
    /**
     * Display a listing of public templates.
     */
    public function index(Request $request, TodoGroupService $service): Response
    {
        $search = $request->query('search');
        $templates = $service->getPublicTemplates($search ?: null, 9);

        return Inertia::render('Template/Index', [
            'templates' => $templates,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Display the specified public template.
     */
    public function show(int $id, TodoGroupService $service): Response
    {
        $template = $service->getPublicTemplate($id);

        return Inertia::render('Template/Show', [
            'template' => $template,
            'isOwner' => Auth::check() && Auth::id() === $template->user_id,
        ]);
    }

    /**
     * Clone a public template into the authenticated user's todos.
     */
    public function clone(int $id, TodoGroupService $service): RedirectResponse
    {
        if (!Auth::check()) {
            return redirect()->route('login')->with('info', 'Silakan login terlebih dahulu untuk menyalin template ini.');
        }

        $template = $service->getPublicTemplate($id);
        $newGroup = $service->cloneTemplate($template, (int) Auth::id());

        return redirect()->route('todos.index', ['group_id' => $newGroup->id])
            ->with('success', "Template \"{$template->title}\" berhasil disalin ke todolist Anda!");
    }
}
