<?php

namespace App\Features\Todo\Services;

use App\Features\Todo\Contracts\TodoRepositoryInterface;
use App\Features\Todo\Enums\TodoStatus;
use App\Features\Todo\Models\Todo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class TodoService
{
    public function __construct(
        protected TodoRepositoryInterface $todoRepository
    ) {}

    /**
     * Get paginated todos for the specified user.
     */
    public function getTodosForUser(int $userId, ?string $status = null, ?string $search = null, int $perPage = 10, ?int $groupId = null): LengthAwarePaginator
    {
        return $this->todoRepository->forUser($userId, $status, $search, $perPage, $groupId);
    }

    /**
     * Create a new todo item for the user.
     *
     * @param array<string, mixed> $data
     */
    public function createTodo(int $userId, array $data): Todo
    {
        return $this->todoRepository->create([
            'user_id' => $userId,
            'todo_group_id' => $data['todo_group_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? TodoStatus::PENDING->value,
            'due_date' => $data['due_date'] ?? null,
            'cover_image_path' => $data['cover_image_path'] ?? null,
        ]);
    }

    /**
     * Update an existing todo item.
     *
     * @param array<string, mixed> $data
     */
    public function updateTodo(Todo $todo, array $data): bool
    {
        return $this->todoRepository->update($todo, [
            'todo_group_id' => array_key_exists('todo_group_id', $data) ? $data['todo_group_id'] : $todo->todo_group_id,
            'title' => $data['title'] ?? $todo->title,
            'description' => array_key_exists('description', $data) ? $data['description'] : $todo->description,
            'status' => $data['status'] ?? $todo->status,
            'due_date' => array_key_exists('due_date', $data) ? $data['due_date'] : $todo->due_date,
            'cover_image_path' => array_key_exists('cover_image_path', $data) ? $data['cover_image_path'] : $todo->cover_image_path,
        ]);
    }

    /**
     * Update or upload a cover photo for the todo.
     */
    public function updateCoverPhoto(Todo $todo, mixed $file): string
    {
        if ($todo->cover_image_path && Storage::disk('public')->exists($todo->cover_image_path)) {
            Storage::disk('public')->delete($todo->cover_image_path);
        }

        $path = $file->store('todo-covers', 'public');
        $this->updateTodo($todo, ['cover_image_path' => $path]);

        return $path;
    }

    /**
     * Delete the cover photo of the todo.
     */
    public function deleteCoverPhoto(Todo $todo): bool
    {
        if ($todo->cover_image_path && Storage::disk('public')->exists($todo->cover_image_path)) {
            Storage::disk('public')->delete($todo->cover_image_path);
        }

        return $this->updateTodo($todo, ['cover_image_path' => null]);
    }

    /**
     * Delete a todo item and its cover photo if exists.
     */
    public function deleteTodo(Todo $todo): bool
    {
        if ($todo->cover_image_path && Storage::disk('public')->exists($todo->cover_image_path)) {
            Storage::disk('public')->delete($todo->cover_image_path);
        }

        return $this->todoRepository->delete($todo);
    }

    /**
     * Toggle todo status between completed and pending.
     */
    public function toggleComplete(Todo $todo): bool
    {
        $newStatus = $todo->status === TodoStatus::COMPLETED->value
            ? TodoStatus::PENDING->value
            : TodoStatus::COMPLETED->value;

        return $this->todoRepository->update($todo, ['status' => $newStatus]);
    }

    /**
     * Get statistics summary for a given user.
     *
     * @return array{total: int, completed: int, pending: int}
     */
    public function getStatsForUser(int $userId): array
    {
        return $this->todoRepository->getStatsForUser($userId);
    }
}

