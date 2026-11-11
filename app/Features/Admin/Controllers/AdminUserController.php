<?php

namespace App\Features\Admin\Controllers;

use App\Features\Admin\Services\AdminUserService;
use App\Features\Post\Services\PostExcelService;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminUserController
{
    public function index(Request $request, AdminUserService $adminService): Response
    {
        $search = $request->query('search');
        $users = $adminService->getUsersList($search ?: null, 10);

        return Inertia::render('Admin/UserList', [
            'users' => $users,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    public function posts(Request $request, User $user, AdminUserService $adminService): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $posts = $adminService->getUserPosts(
            $user->id,
            $status ?: null,
            $search ?: null,
            10
        );

        return Inertia::render('Admin/UserPostList', [
            'targetUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'posts' => $posts,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    public function exportUserPosts(User $user, PostExcelService $excelService): StreamedResponse
    {
        $posts = $user->posts()->with('user:id,name,username')->latest('id')->get();
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '_', $user->name);

        return $excelService->exportToResponse($posts, "artikel-{$safeName}-".now()->format('Ymd-His').'.xlsx');
    }
}