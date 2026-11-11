<?php

namespace App\Features\Post\Controllers;

use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Services\PostService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicPostController
{
    public function index(Request $request, PostService $service): Response
    {
        $search = $request->query('search');
        $category = $request->query('category');

        $posts = $service->getPublicPosts(
            is_string($search) ? $search : null,
            is_string($category) ? $category : null,
            9
        );

        return Inertia::render('Public/PostIndex', [
            'posts' => $posts,
            'categories' => PostCategory::options(),
            'filters' => [
                'search' => is_string($search) ? $search : '',
                'category' => is_string($category) ? $category : '',
            ],
            'isHome' => $request->routeIs('home'),
        ]);
    }

    public function show(string $slug, PostService $service): Response
    {
        $post = $service->getPublishedPost($slug);
        $related = $service->getRelatedPosts($post, 3);

        return Inertia::render('Public/PostShow', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category' => $post->category,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'cover_image_path' => $post->cover_image_path,
                'published_at' => $post->published_at?->toIso8601String(),
                'author' => [
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                ],
            ],
            'related' => $related,
        ]);
    }
}