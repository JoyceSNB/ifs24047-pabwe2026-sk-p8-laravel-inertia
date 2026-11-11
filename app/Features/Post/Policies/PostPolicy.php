<?php

namespace App\Features\Post\Policies;

use App\Features\Post\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Admin boleh melihat semua (read-only); member hanya miliknya.
    public function view(User $user, Post $post): bool
    {
        return $user->isAdmin() || $user->id === $post->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    // Hanya penulis yang boleh mengubah (admin tidak).
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}