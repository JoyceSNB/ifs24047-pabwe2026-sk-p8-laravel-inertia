<?php

namespace App\Http\Middleware;

use App\Features\Post\Models\Post;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePostOwnership
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            abort(401, 'Unauthenticated');
        }

        $routePost = $request->route('post');
        if ($routePost) {
            $post = $routePost instanceof Post ? $routePost : Post::find($routePost);

            if ($post) {
                if ($currentUser->isMember() && $currentUser->id !== $post->user_id) {
                    abort(403, 'Akses ditolak: Member tidak dapat mengakses artikel milik orang lain.');
                }

                if ($request->isMethodSafe() === false && $currentUser->id !== $post->user_id) {
                    abort(403, 'Akses ditolak: Hanya penulis yang dapat mengubah artikel ini.');
                }
            }
        }

        return $next($request);
    }
}