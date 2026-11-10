<?php

namespace App\Features\Todo\Contracts;

use App\Features\Todo\Models\TodoGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TodoGroupRepositoryInterface
{
    /**
     * Get all todo groups for a user.
     *
     * @return Collection<int, TodoGroup>
     */
    public function forUser(int $userId): Collection;

    /**
     * Get paginated public templates with optional search.
     */
    public function publicTemplates(?string $search = null, int $perPage = 9): LengthAwarePaginator;

    /**
     * Find a todo group by id.
     */
    public function find(int $id): ?TodoGroup;

    /**
     * Find a todo group by id or throw an exception.
     */
    public function findOrFail(int $id): TodoGroup;

    /**
     * Find a public template by id or fail.
     */
    public function findPublicOrFail(int $id): TodoGroup;

    /**
     * Create a new todo group.
     *
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): TodoGroup;

    /**
     * Update an existing todo group.
     *
     * @param array<string, mixed> $attributes
     */
    public function update(TodoGroup $group, array $attributes): bool;

    /**
     * Delete a todo group.
     */
    public function delete(TodoGroup $group): bool;

    /**
     * Toggle public visibility of a group.
     */
    public function togglePublic(TodoGroup $group): TodoGroup;

    /**
     * Clone a template into a user's personal todo group.
     */
    public function cloneTemplate(TodoGroup $template, int $targetUserId): TodoGroup;
}
