<?php

namespace App\Features\Todo\Services;

use App\Features\Todo\Contracts\TodoGroupRepositoryInterface;
use App\Features\Todo\Models\TodoGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class TodoGroupService
{
    public function __construct(
        protected TodoGroupRepositoryInterface $groupRepository
    ) {}

    /**
     * Get all todo groups belonging to a user.
     *
     * @return Collection<int, TodoGroup>
     */
    public function getGroupsForUser(int $userId): Collection
    {
        return $this->groupRepository->forUser($userId);
    }

    /**
     * Get paginated public templates.
     */
    public function getPublicTemplates(?string $search = null, int $perPage = 9): LengthAwarePaginator
    {
        return $this->groupRepository->publicTemplates($search, $perPage);
    }

    /**
     * Find a public template by id or fail.
     */
    public function getPublicTemplate(int $id): TodoGroup
    {
        return $this->groupRepository->findPublicOrFail($id);
    }

    /**
     * Create a new todo group.
     *
     * @param array<string, mixed> $data
     */
    public function createGroup(int $userId, array $data): TodoGroup
    {
        return $this->groupRepository->create([
            'user_id' => $userId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'is_public' => (bool) ($data['is_public'] ?? false),
        ]);
    }

    /**
     * Update an existing todo group.
     *
     * @param array<string, mixed> $data
     */
    public function updateGroup(TodoGroup $group, array $data): bool
    {
        return $this->groupRepository->update($group, [
            'title' => $data['title'] ?? $group->title,
            'description' => array_key_exists('description', $data) ? $data['description'] : $group->description,
            'is_public' => array_key_exists('is_public', $data) ? (bool) $data['is_public'] : $group->is_public,
        ]);
    }

    /**
     * Delete a todo group.
     */
    public function deleteGroup(TodoGroup $group): bool
    {
        return $this->groupRepository->delete($group);
    }

    /**
     * Clone a public template for a user.
     */
    public function cloneTemplate(TodoGroup $template, int $targetUserId): TodoGroup
    {
        return $this->groupRepository->cloneTemplate($template, $targetUserId);
    }
}

