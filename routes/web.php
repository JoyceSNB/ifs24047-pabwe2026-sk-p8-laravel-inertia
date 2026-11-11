<?php

use App\Features\Admin\Controllers\AdminUserController;
use App\Features\Auth\Controllers\AuthController;
use App\Features\Post\Controllers\AdminPostController;
use App\Features\Post\Controllers\PostController;
use App\Features\Post\Controllers\PublicPostController;
use App\Features\Profile\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:1000-per-second'])->group(function () {
    // Tingkat 1 - Publik (tanpa login)
    Route::get('/', [PublicPostController::class, 'index'])->name('home');
    Route::get('/articles', [PublicPostController::class, 'index'])->name('articles.index');
    Route::get('/articles/{slug}', [PublicPostController::class, 'show'])->name('articles.show');

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

        // Tingkat 2 - Member/Penulis: Excel & AI (sebelum rute wildcard {post})
        Route::get('/dashboard/posts/export', [PostController::class, 'exportExcel'])->name('dashboard.posts.export');
        Route::post('/dashboard/posts/import', [PostController::class, 'importExcel'])->name('dashboard.posts.import');
        Route::post('/dashboard/posts/ai-generate', [PostController::class, 'generateAi'])->name('dashboard.posts.ai.generate');
        Route::post('/dashboard/posts/ai-save', [PostController::class, 'saveAi'])->name('dashboard.posts.ai.save');

        Route::get('/dashboard/posts', [PostController::class, 'index'])->name('dashboard.posts.index');
        Route::post('/dashboard/posts', [PostController::class, 'store'])->name('dashboard.posts.store');

        Route::get('/dashboard/posts/{post}', [PostController::class, 'show'])
            ->middleware('owns.post')
            ->name('dashboard.posts.show');
        Route::put('/dashboard/posts/{post}', [PostController::class, 'update'])
            ->middleware('owns.post')
            ->name('dashboard.posts.update');
        Route::delete('/dashboard/posts/{post}', [PostController::class, 'destroy'])
            ->middleware('owns.post')
            ->name('dashboard.posts.destroy');
        Route::patch('/dashboard/posts/{post}/publish', [PostController::class, 'togglePublish'])
            ->middleware('owns.post')
            ->name('dashboard.posts.publish');
        Route::post('/dashboard/posts/{post}/cover', [PostController::class, 'updateCover'])
            ->middleware('owns.post')
            ->name('dashboard.posts.cover.update');
        Route::delete('/dashboard/posts/{post}/cover', [PostController::class, 'deleteCover'])
            ->middleware('owns.post')
            ->name('dashboard.posts.cover.delete');

        // User Profile Routes
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
        Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])->name('profile.photo.update');
        Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto'])->name('profile.photo.delete');

        // Tingkat 3 - Admin (read-only + ekspor)
        Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index'])->name('users');
            Route::get('/users/{user}/posts', [AdminUserController::class, 'posts'])->name('users.posts');
            Route::get('/users/{user}/posts/export', [AdminUserController::class, 'exportUserPosts'])->name('users.posts.export');
            Route::get('/posts', [AdminPostController::class, 'index'])->name('posts');
            Route::get('/posts/export', [AdminPostController::class, 'export'])->name('posts.export');
        });
    });
});