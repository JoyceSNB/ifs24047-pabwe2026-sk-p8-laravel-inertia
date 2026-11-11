<?php

namespace App\Features\Post\Contracts;

use App\Features\Post\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PostRepositoryInterface
{
    public function publicPaginate(?string $search = null, ?string $category = null, int $perPage = 9): LengthAwarePaginator;

    public function findPublishedBySlugOrFail(string $slug): Post;

    /** @return Collection<int, Post> */
    public function relatedTo(Post $post, int $limit = 3): Collection;

    public function forUser(int $userId, ?string $status = null, ?string $search = null, int $perPage = 10, ?string $category = null): LengthAwarePaginator;

    /** @return Collection<int, Post> */
    public function allForUser(int $userId): Collection;

    public function paginateAll(?string $search = null, ?string $status = null, ?string $category = null, int $perPage = 10): LengthAwarePaginator;

    /** @return Collection<int, Post> */
    public function allWithUser(): Collection;

    public function find(int $id): ?Post;

    public function findOrFail(int $id): Post;

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Post;

    /** @param array<string, mixed> $attributes */
    public function update(Post $post, array $attributes): bool;

    public function delete(Post $post): bool;

    public function slugExists(string $slug, ?int $ignoreId = null): bool;

    /** @return array{total: int, published: int, draft: int} */
    public function getStatsForUser(int $userId): array;
}