<?php

namespace App\Features\Post\Controllers;

use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Services\PostExcelService;
use App\Features\Post\Services\PostService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminPostController
{
    public function index(Request $request, PostService $service): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $category = $request->query('category');

        $posts = $service->getAllPosts(
            $search ? (string) $search : null,
            $status ? (string) $status : null,
            $category ? (string) $category : null,
            10
        );

        return Inertia::render('Admin/PostList', [
            'posts' => $posts,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'category' => $category ?? '',
            ],
            'categories' => PostCategory::options(),
        ]);
    }

    public function export(PostExcelService $excelService, PostService $service): StreamedResponse
    {
        return $excelService->exportToResponse(
            $service->getAllPostsForExport(),
            'semua-artikel-'.now()->format('Ymd-His').'.xlsx'
        );
    }
}