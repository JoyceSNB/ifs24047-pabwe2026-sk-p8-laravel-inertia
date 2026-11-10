<?php

namespace App\Features\Todo\Controllers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Todo\Enums\TodoStatus;
use App\Features\Todo\Models\Todo;
use App\Features\Todo\Services\TodoExcelService;
use App\Features\Todo\Services\TodoGroupService;
use App\Features\Todo\Services\TodoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TodoController
{
    public function index(Request $request, TodoService $service, TodoGroupService $groupService): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $groupId = $request->query('group_id') ? (int) $request->query('group_id') : null;

        $todos = $service->getTodosForUser(
            (int) Auth::id(),
            $status ?: null,
            $search ?: null,
            8,
            $groupId
        );

        $groups = $groupService->getGroupsForUser((int) Auth::id());

        $statuses = array_map(fn (TodoStatus $case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'badgeClass' => $case->badgeClass(),
        ], TodoStatus::cases());

        $stats = $service->getStatsForUser((int) Auth::id());

        return Inertia::render('Todo/Index', [
            'todos' => $todos,
            'groups' => $groups,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'group_id' => $groupId ? (string) $groupId : '',
            ],
            'statuses' => $statuses,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request, TodoService $service): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['nullable', 'date'],
            'todo_group_id' => ['nullable', 'integer', 'exists:todo_groups,id'],
        ]);

        $service->createTodo((int) Auth::id(), $validated);

        return back()->with('success', 'Todo baru berhasil ditambahkan.');
    }

    public function show(Todo $todo, TodoGroupService $groupService): Response
    {
        Gate::authorize('view', $todo);

        $statuses = array_map(fn (TodoStatus $case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'badgeClass' => $case->badgeClass(),
        ], TodoStatus::cases());

        $groups = $groupService->getGroupsForUser((int) Auth::id());

        return Inertia::render('Todo/Show', [
            'todo' => [
                'id' => $todo->id,
                'todo_group_id' => $todo->todo_group_id,
                'group' => $todo->group ? [
                    'id' => $todo->group->id,
                    'title' => $todo->group->title,
                ] : null,
                'title' => $todo->title,
                'description' => $todo->description,
                'status' => $todo->status,
                'due_date' => $todo->due_date ? $todo->due_date->format('Y-m-d') : null,
                'cover_image_path' => $todo->cover_image_path,
                'created_at' => $todo->created_at ? $todo->created_at->format('d M Y H:i') : null,
                'updated_at' => $todo->updated_at ? $todo->updated_at->format('d M Y H:i') : null,
            ],
            'groups' => $groups,
            'statuses' => $statuses,
        ]);
    }

    public function update(Request $request, Todo $todo, TodoService $service): RedirectResponse
    {
        Gate::authorize('update', $todo);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['nullable', 'date'],
            'todo_group_id' => ['nullable', 'integer', 'exists:todo_groups,id'],
        ]);

        $service->updateTodo($todo, $validated);

        return back()->with('success', 'Todo berhasil diperbarui.');
    }

    public function destroy(Todo $todo, TodoService $service): RedirectResponse
    {
        Gate::authorize('delete', $todo);

        $service->deleteTodo($todo);

        return redirect()->route('todos.index')->with('success', 'Todo berhasil dihapus.');
    }

    public function toggle(Todo $todo, TodoService $service): RedirectResponse
    {
        Gate::authorize('update', $todo);

        $service->toggleComplete($todo);

        return back()->with('success', 'Status todo berhasil diperbarui.');
    }

    public function updateCover(Request $request, Todo $todo, TodoService $service): RedirectResponse
    {
        Gate::authorize('update', $todo);

        $request->validate([
            'coverPhoto' => ['required', 'image', 'max:5120'],
        ]);

        $service->updateCoverPhoto($todo, $request->file('coverPhoto'));

        return back()->with('success', 'Cover todo berhasil diperbarui.');
    }

    public function deleteCover(Todo $todo, TodoService $service): RedirectResponse
    {
        Gate::authorize('update', $todo);

        $service->deleteCoverPhoto($todo);

        return back()->with('success', 'Cover todo berhasil dihapus.');
    }

    public function exportExcel(TodoExcelService $excelService): StreamedResponse
    {
        $user = Auth::user();
        $todos = $user ? $user->todos()->latest('id')->get() : collect();

        return $excelService->exportToResponse($todos, 'todolist-'.now()->format('Ymd-His').'.xlsx');
    }

    public function importExcel(Request $request, TodoExcelService $excelService): RedirectResponse
    {
        $request->validate([
            'importFile' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $path = $request->file('importFile')->getRealPath();
        $result = $excelService->import($path, (int) Auth::id());

        return back()->with('success', "Berhasil mengimpor {$result['imported']} item todolist.");
    }

    public function generateAi(Request $request, AiClientInterface $aiClient): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'prompt' => ['required_without:aiPrompt', 'nullable', 'string', 'min:3', 'max:1000'],
            'aiPrompt' => ['required_without:prompt', 'nullable', 'string', 'min:3', 'max:1000'],
            'count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'aiCount' => ['nullable', 'integer', 'min:1', 'max:20'],
        ], [
            'prompt.required_without' => 'Instruksi / rencana pekerjaan harus diisi minimal 3 karakter.',
            'prompt.min' => 'Instruksi / rencana pekerjaan harus minimal 3 karakter.',
            'aiPrompt.required_without' => 'Instruksi / rencana pekerjaan harus diisi minimal 3 karakter.',
            'aiPrompt.min' => 'Instruksi / rencana pekerjaan harus minimal 3 karakter.',
        ]);

        $prompt = (string) ($validated['prompt'] ?? $validated['aiPrompt'] ?? '');
        $count = (int) ($validated['count'] ?? $validated['aiCount'] ?? 3);

        try {
            $items = $aiClient->generateTodos($prompt, $count);
            $data = array_map(fn ($item) => $item->toArray(), $items);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'todos' => $data,
                    'items' => $data,
                ]);
            }

            return back()->with('aiGeneratedItems', $data);
        } catch (\Throwable $e) {
            $msg = 'Gagal menghasilkan todo dengan AI: ' . $e->getMessage();
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 422);
            }

            return back()->with('error', $msg);
        }
    }

    public function saveAi(Request $request, TodoService $service): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required_without:todos', 'nullable', 'array', 'min:1'],
            'todos' => ['required_without:items', 'nullable', 'array', 'min:1'],
        ]);

        $rawItems = $validated['items'] ?? $validated['todos'] ?? [];
        $count = 0;
        foreach ($rawItems as $item) {
            if (empty($item['title'])) {
                continue;
            }
            $service->createTodo((int) Auth::id(), [
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'status' => TodoStatus::PENDING->value,
                'due_date' => $item['due_date'] ?? null,
                'todo_group_id' => $item['todo_group_id'] ?? null,
            ]);
            $count++;
        }

        return back()->with('success', "Berhasil menambahkan {$count} todo yang digenerate oleh AI.");
    }
}

