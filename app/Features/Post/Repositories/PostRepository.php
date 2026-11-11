<?php

namespace App\Features\Post\Repositories;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class PostRepository implements PostRepositoryInterface
{
    /** @var array<int, string> */
    protected const LIST_COLUMNS = [
        'id', 'user_id', 'title', 'slug', 'category', 'excerpt',
        'cover_image_path', 'is_published', 'published_at', 'created_at', 'updated_at',
    ];

    public function publicPaginate(?string $search = null, ?string $category = null, int $perPage = 9): LengthAwarePaginator
    {
        $query = Post::query()
            ->select(self::LIST_COLUMNS)
            ->with('user:id,name,username')
            ->where('is_published', true);

        $this->applySearch($query, $search);

        if (!empty($category)) {
            $query->where('category', $category);
        }

        return $query->orderByDesc('published_at')->orderByDesc('id')->paginate($perPage);
    }

    public function findPublishedBySlugOrFail(string $slug): Post
    {
        return Post::query()
            ->with('user:id,name,username')
            ->where('is_published', true)
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /** @return Collection<int, Post> */
    public function relatedTo(Post $post, int $limit = 3): Collection
    {
        return Post::query()
            ->select(self::LIST_COLUMNS)
            ->with('user:id,name,username')
            ->where('is_published', true)
            ->where('category', $post->category)
            ->where('id', '!=', $post->id)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function forUser(int $userId, ?string $status = null, ?string $search = null, int $perPage = 10, ?string $category = null): LengthAwarePaginator
    {
        // Membawa kolom content agar modal "Ubah" bisa dibuka langsung.
        $query = Post::query()->where('user_id', $userId);

        $this->applyStatus($query, $status);
        $this->applySearch($query, $search);

        if (!empty($category)) {
            $query->where('category', $category);
        }

        return $query->latest('id')->paginate($perPage);
    }

    /** @return Collection<int, Post> */
    public function allForUser(int $userId): Collection
    {
        return Post::query()
            ->where('user_id', $userId)
            ->latest('id')
            ->get();
    }

    public function paginateAll(?string $search = null, ?string $status = null, ?string $category = null, int $perPage = 10): LengthAwarePaginator
    {
        $query = Post::query()
            ->select(self::LIST_COLUMNS)
            ->with('user:id,name,username');

        $this->applyStatus($query, $status);
        $this->applySearch($query, $search);

        if (!empty($category)) {
            $query->where('category', $category);
        }

        return $query->latest('id')->paginate($perPage);
    }

    /** @return Collection<int, Post> */
    public function allWithUser(): Collection
    {
        return Post::query()
            ->with('user:id,name,username')
            ->latest('id')
            ->get();
    }

    public function find(int $id): ?Post
    {
        return Post::find($id);
    }

    public function findOrFail(int $id): Post
    {
        return Post::findOrFail($id);
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Post
    {
        return Post::create($attributes);
    }

    /** @param array<string, mixed> $attributes */
    public function update(Post $post, array $attributes): bool
    {
        return $post->update($attributes);
    }

    public function delete(Post $post): bool
    {
        return (bool) $post->delete();
    }

    public function slugExists(string $slug, ?int $ignoreId = null): bool
    {
        $query = Post::query()->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /** @return array{total: int, published: int, draft: int} */
    public function getStatsForUser(int $userId): array
    {
        $total = Post::where('user_id', $userId)->count();
        $published = Post::where('user_id', $userId)->where('is_published', true)->count();

        return [
            'total' => $total,
            'published' => $published,
            'draft' => $total - $published,
        ];
    }

    /** @param Builder<Post> $query */
    protected function applyStatus(Builder $query, ?string $status): void
    {
        if ($status === 'published') {
            $query->where('is_published', true);
        } elseif ($status === 'draft') {
            $query->where('is_published', false);
        }
    }

    /** @param Builder<Post> $query */
    protected function applySearch(Builder $query, ?string $search): void
    {
        if (empty($search)) {
            return;
        }

        $needle = '%'.mb_strtolower($search).'%';

        $query->where(function (Builder $q) use ($needle) {
            $q->whereRaw('LOWER(title) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(COALESCE(excerpt, \'\')) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(content) LIKE ?', [$needle]);
        });
    }
}