<?php

use App\Features\Admin\Controllers\AdminUserController;
use App\Features\Auth\Controllers\AuthController;
use App\Features\Profile\Controllers\ProfileController;
use App\Features\Todo\Controllers\PublicTemplateController;
use App\Features\Todo\Controllers\TodoController;
use App\Features\Todo\Controllers\TodoGroupController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:1000-per-second'])->group(function () {
    // Public Template Routes (Dapat diakses oleh umum tanpa perlu login)
    Route::get('/', [PublicTemplateController::class, 'index'])->name('home');
    Route::get('/templates', [PublicTemplateController::class, 'index'])->name('templates.index');
    Route::get('/templates/{id}', [PublicTemplateController::class, 'show'])->name('templates.show');
    Route::post('/templates/{id}/clone', [PublicTemplateController::class, 'clone'])->name('templates.clone');

    // Guest Authentication Routes
    Route::middleware('guest')->group(function () {
        Route::get('/login', [AuthController::class, 'createLogin'])->name('login');
        Route::post('/login', [AuthController::class, 'storeLogin']);
        Route::get('/register', [AuthController::class, 'createRegister'])->name('register');
        Route::post('/register', [AuthController::class, 'storeRegister']);
    });

    // Authenticated Routes
    Route::middleware('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

        // Todo Group Management
        Route::post('/todo-groups', [TodoGroupController::class, 'store'])->name('todo-groups.store');
        Route::put('/todo-groups/{todoGroup}', [TodoGroupController::class, 'update'])->name('todo-groups.update');
        Route::delete('/todo-groups/{todoGroup}', [TodoGroupController::class, 'destroy'])->name('todo-groups.destroy');
        Route::patch('/todo-groups/{todoGroup}/toggle-public', [TodoGroupController::class, 'togglePublic'])->name('todo-groups.toggle-public');

        // Todo Excel & AI (Placed before wildcard {todo} route)
        Route::get('/todos/export', [TodoController::class, 'exportExcel'])->name('todos.export');
        Route::post('/todos/import', [TodoController::class, 'importExcel'])->name('todos.import');
        Route::post('/todos/ai-generate', [TodoController::class, 'generateAi'])->name('todos.ai.generate');
        Route::post('/todos/ai-save', [TodoController::class, 'saveAi'])->name('todos.ai.save');
        Route::post('/todos/batch', [TodoController::class, 'saveAi'])->name('todos.batch');

        // Member Todo Resource Routes
        Route::get('/todos', [TodoController::class, 'index'])
            ->middleware('owns.todo')
            ->name('todos.index');
        Route::post('/todos', [TodoController::class, 'store'])->name('todos.store');

        Route::get('/todos/{todo}', [TodoController::class, 'show'])
            ->middleware('owns.todo')
            ->name('todos.show');
        Route::put('/todos/{todo}', [TodoController::class, 'update'])
            ->middleware('owns.todo')
            ->name('todos.update');
        Route::delete('/todos/{todo}', [TodoController::class, 'destroy'])
            ->middleware('owns.todo')
            ->name('todos.destroy');
        Route::patch('/todos/{todo}/toggle', [TodoController::class, 'toggle'])
            ->middleware('owns.todo')
            ->name('todos.toggle');
        Route::post('/todos/{todo}/cover', [TodoController::class, 'updateCover'])
            ->middleware('owns.todo')
            ->name('todos.cover.update');
        Route::delete('/todos/{todo}/cover', [TodoController::class, 'deleteCover'])
            ->middleware('owns.todo')
            ->name('todos.cover.delete');

        // User Profile Routes
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
        Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])->name('profile.photo.update');
        Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto'])->name('profile.photo.delete');

        // Admin Routes protected by Role middleware
        Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index'])->name('users');
            Route::get('/users/{user}/todos', [AdminUserController::class, 'todos'])->name('users.todos');
            Route::get('/users/{user}/todos/export', [AdminUserController::class, 'exportUserTodos'])->name('users.todos.export');
        });
    });
});
