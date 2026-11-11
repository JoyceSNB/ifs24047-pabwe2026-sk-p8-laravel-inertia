<?php

namespace App\Features\Post\Services;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostService
{
    public function __construct(
        protected PostRepositoryInterface $postRepository
    ) {}

    public function getPublicPosts(?string $search = null, ?string $category = null, int $perPage = 9): LengthAwarePaginator
    {
        return $this->postRepository->publicPaginate($search, $category, $perPage);
    }

    public function getPublishedPost(string $slug): Post
    {
        return $this->postRepository->findPublishedBySlugOrFail($slug);
    }

    /** @return Collection<int, Post> */
    public function getRelatedPosts(Post $post, int $limit = 3): Collection
    {
        return $this->postRepository->relatedTo($post, $limit);
    }

    public function getPostsForUser(int $userId, ?string $status = null, ?string $search = null, int $perPage = 8, ?string $category = null): LengthAwarePaginator
    {
        return $this->postRepository->forUser($userId, $status, $search, $perPage, $category);
    }

    public function getAllPosts(?string $search = null, ?string $status = null, ?string $category = null, int $perPage = 10): LengthAwarePaginator
    {
        return $this->postRepository->paginateAll($search, $status, $category, $perPage);
    }

    /** @return Collection<int, Post> */
    public function getAllPostsForExport(): Collection
    {
        return $this->postRepository->allWithUser();
    }

    /** @param array<string, mixed> $data */
    public function createPost(int $userId, array $data): Post
    {
        $published = (bool) ($data['is_published'] ?? false);

        return $this->postRepository->create([
            'user_id' => $userId,
            'title' => $data['title'],
            'slug' => $this->generateUniqueSlug($data['title']),
            'category' => $data['category'] ?? PostCategory::UMUM->value,
            'excerpt' => $data['excerpt'] ?? null,
            'content' => $data['content'] ?? '',
            'cover_image_path' => $data['cover_image_path'] ?? null,
            'is_published' => $published,
            'published_at' => $published ? now() : null,
        ]);
    }

    /** @param array<string, mixed> $data */
    public function updatePost(Post $post, array $data): bool
    {
        $attributes = [
            'title' => $data['title'] ?? $post->title,
            'category' => $data['category'] ?? $post->category,
            'excerpt' => array_key_exists('excerpt', $data) ? $data['excerpt'] : $post->excerpt,
            'content' => $data['content'] ?? $post->content,
            'cover_image_path' => array_key_exists('cover_image_path', $data) ? $data['cover_image_path'] : $post->cover_image_path,
        ];

        if (array_key_exists('is_published', $data)) {
            $published = (bool) $data['is_published'];
            $attributes['is_published'] = $published;
            $attributes['published_at'] = $published ? ($post->published_at ?? now()) : null;
        }

        return $this->postRepository->update($post, $attributes);
    }

    public function togglePublish(Post $post): bool
    {
        return $this->updatePost($post, ['is_published' => !$post->is_published]);
    }

    public function updateCoverPhoto(Post $post, mixed $file): string
    {
        $this->removeCoverFile($post);

        $path = $file->store('post-covers', 'public');
        $this->updatePost($post, ['cover_image_path' => $path]);

        return $path;
    }

    public function deleteCoverPhoto(Post $post): bool
    {
        $this->removeCoverFile($post);

        return $this->updatePost($post, ['cover_image_path' => null]);
    }

    public function deletePost(Post $post): bool
    {
        $this->removeCoverFile($post);

        return $this->postRepository->delete($post);
    }

    /** @return array{total: int, published: int, draft: int} */
    public function getStatsForUser(int $userId): array
    {
        return $this->postRepository->getStatsForUser($userId);
    }

    public function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::limit(Str::slug($title), 100, '');
        $base = trim($base, '-');

        if ($base === '') {
            $base = 'artikel';
        }

        $slug = $base;
        $counter = 2;

        while ($this->postRepository->slugExists($slug, $ignoreId)) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    protected function removeCoverFile(Post $post): void
    {
        if ($post->cover_image_path && Storage::disk('public')->exists($post->cover_image_path)) {
            Storage::disk('public')->delete($post->cover_image_path);
        }
    }
}