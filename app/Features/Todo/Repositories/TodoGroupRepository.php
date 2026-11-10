<?php

namespace App\Features\Todo\Repositories;

use App\Features\Todo\Contracts\TodoGroupRepositoryInterface;
use App\Features\Todo\Models\Todo;
use App\Features\Todo\Models\TodoGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TodoGroupRepository implements TodoGroupRepositoryInterface
{
    /**
     * Get all todo groups for a user with todo counts.
     *
     * @return Collection<int, TodoGroup>
     */
    public function forUser(int $userId): Collection
    {
        return TodoGroup::query()
            ->where('user_id', $userId)
            ->withCount('todos')
            ->latest('id')
            ->get();
    }

    /**
     * Get paginated public templates with optional search.
     */
    public function publicTemplates(?string $search = null, int $perPage = 9): LengthAwarePaginator
    {
        $query = TodoGroup::query()
            ->where('is_public', true)
            ->with('user:id,name,username')
            ->withCount('todos');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->latest('id')->paginate($perPage);
    }

    /**
     * Find a todo group by id.
     */
    public function find(int $id): ?TodoGroup
    {
        return TodoGroup::find($id);
    }

    /**
     * Find a todo group by id or throw an exception.
     */
    public function findOrFail(int $id): TodoGroup
    {
        return TodoGroup::findOrFail($id);
    }

    /**
     * Find a public template by id or fail.
     */
    public function findPublicOrFail(int $id): TodoGroup
    {
        return TodoGroup::where('is_public', true)
            ->with(['user:id,name,username', 'todos'])
            ->findOrFail($id);
    }

    /**
     * Create a new todo group.
     *
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): TodoGroup
    {
        return TodoGroup::create($attributes);
    }

    /**
     * Update an existing todo group.
     *
     * @param array<string, mixed> $attributes
     */
    public function update(TodoGroup $group, array $attributes): bool
    {
        return $group->update($attributes);
    }

    /**
     * Delete a todo group.
     */
    public function delete(TodoGroup $group): bool
    {
        return (bool) $group->delete();
    }

    /**
     * Toggle public visibility of a group.
     */
    public function togglePublic(TodoGroup $group): TodoGroup
    {
        $group->is_public = !$group->is_public;
        $group->save();

        return $group;
    }

    /**
     * Clone a public template into a user's personal todo group.
     */
    public function cloneTemplate(TodoGroup $template, int $targetUserId): TodoGroup
    {
        return DB::transaction(function () use ($template, $targetUserId) {
            $newGroup = TodoGroup::create([
                'user_id' => $targetUserId,
                'title' => $template->title . ' (Salinan)',
                'description' => $template->description,
                'is_public' => false,
            ]);

            $templateTodos = Todo::where('todo_group_id', $template->id)->get();
            foreach ($templateTodos as $todo) {
                Todo::create([
                    'user_id' => $targetUserId,
                    'todo_group_id' => $newGroup->id,
                    'title' => $todo->title,
                    'description' => $todo->description,
                    'status' => 'pending',
                    'due_date' => $todo->due_date,
                    'cover_image_path' => null,
                ]);
            }

            return $newGroup;
        });
    }
}
