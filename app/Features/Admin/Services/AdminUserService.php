<?php

namespace App\Features\Admin\Services;

use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminUserService
{
    public function __construct(
        protected PostRepositoryInterface $postRepository
    ) {}

    public function getUsersList(?string $search = null, int $perPage = 10): LengthAwarePaginator
    {
        $query = User::query()->withCount('posts');

        if (!empty($search)) {
            $needle = '%'.mb_strtolower($search).'%';

            $query->where(function ($q) use ($needle) {
                $q->whereRaw('LOWER(name) LIKE ?', [$needle])
                  ->orWhereRaw('LOWER(username) LIKE ?', [$needle])
                  ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            });
        }

        return $query->latest('id')->paginate($perPage);
    }

    public function getUserPosts(int $userId, ?string $status = null, ?string $search = null, int $perPage = 10): LengthAwarePaginator
    {
        return $this->postRepository->forUser($userId, $status, $search, $perPage);
    }
}