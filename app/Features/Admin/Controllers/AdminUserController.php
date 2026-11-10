<?php

namespace App\Features\Admin\Controllers;

use App\Features\Admin\Services\AdminUserService;
use App\Features\Todo\Enums\TodoStatus;
use App\Features\Todo\Services\TodoExcelService;
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

    public function todos(Request $request, User $user, AdminUserService $adminService): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $todos = $adminService->getUserTodos(
            $user->id,
            $status ?: null,
            $search ?: null,
            10
        );

        $statuses = array_map(fn (TodoStatus $case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'badgeClass' => $case->badgeClass(),
        ], TodoStatus::cases());

        return Inertia::render('Admin/UserTodoList', [
            'targetUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'todos' => $todos,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
            'statuses' => $statuses,
        ]);
    }

    public function exportUserTodos(User $user, TodoExcelService $excelService): StreamedResponse
    {
        $todos = $user->todos()->latest('id')->get();
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '_', $user->name);

        return $excelService->exportToResponse($todos, "todolist-{$safeName}-".now()->format('Ymd-His').'.xlsx');
    }
}

