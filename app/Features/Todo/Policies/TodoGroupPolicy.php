<?php

namespace App\Features\Todo\Policies;

use App\Features\Todo\Models\TodoGroup;
use App\Models\User;

class TodoGroupPolicy
{
    /**
     * Determine whether the user can view any groups.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the group.
     */
    public function view(?User $user, TodoGroup $group): bool
    {
        if ($group->is_public) {
            return true;
        }

        if (!$user) {
            return false;
        }

        return $user->isAdmin() || $user->id === $group->user_id;
    }

    /**
     * Determine whether the user can create a group.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the group.
     */
    public function update(User $user, TodoGroup $group): bool
    {
        return $user->id === $group->user_id;
    }

    /**
     * Determine whether the user can delete the group.
     */
    public function delete(User $user, TodoGroup $group): bool
    {
        return $user->id === $group->user_id;
    }

    /**
     * Determine whether the user can clone the group template.
     */
    public function clone(?User $user, TodoGroup $group): bool
    {
        if ($group->is_public) {
            return true;
        }

        return $user && ($user->isAdmin() || $user->id === $group->user_id);
    }
}
