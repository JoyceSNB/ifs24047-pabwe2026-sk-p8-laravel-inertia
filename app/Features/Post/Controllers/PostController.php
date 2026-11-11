<?php

namespace App\Features\Post\Controllers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use App\Features\Post\Services\PostExcelService;
use App\Features\Post\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PostController
{
    /** @return array<string, array<int, mixed>> */
    protected function postRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::enum(PostCategory::class)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    public function index(Request $request, PostService $service): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $category = $request->query('category');

        $posts = $service->getPostsForUser(
            (int) Auth::id(),
            $status ? (string) $status : null,
            $search ? (string) $search : null,
            8,
            $category ? (string) $category : null
        );

        return Inertia::render('Post/Index', [
            'posts' => $posts,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'category' => $category ?? '',
            ],
            'categories' => PostCategory::options(),
            'stats' => $service->getStatsForUser((int) Auth::id()),
        ]);
    }

    public function store(Request $request, PostService $service): RedirectResponse
    {
        $validated = $request->validate($this->postRules());

        $service->createPost((int) Auth::id(), $validated);

        return back()->with('success', 'Artikel baru berhasil disimpan.');
    }

    public function show(Post $post): Response
    {
        Gate::authorize('view', $post);

        return Inertia::render('Post/Show', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category' => $post->category,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'cover_image_path' => $post->cover_image_path,
                'is_published' => $post->is_published,
                'published_at' => $post->published_at ? $post->published_at->format('d M Y H:i') : null,
                'created_at' => $post->created_at ? $post->created_at->format('d M Y H:i') : null,
                'updated_at' => $post->updated_at ? $post->updated_at->format('d M Y H:i') : null,
            ],
            'categories' => PostCategory::options(),
        ]);
    }

    public function update(Request $request, Post $post, PostService $service): RedirectResponse
    {
        Gate::authorize('update', $post);

        $validated = $request->validate($this->postRules());

        $service->updatePost($post, $validated);

        return back()->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroy(Post $post, PostService $service): RedirectResponse
    {
        Gate::authorize('delete', $post);

        $service->deletePost($post);

        return redirect()->route('dashboard.posts.index')->with('success', 'Artikel berhasil dihapus.');
    }

    public function togglePublish(Post $post, PostService $service): RedirectResponse
    {
        Gate::authorize('update', $post);

        $service->togglePublish($post);

        return back()->with('success', 'Status publikasi artikel berhasil diperbarui.');
    }

    public function updateCover(Request $request, Post $post, PostService $service): RedirectResponse
    {
        Gate::authorize('update', $post);

        $request->validate([
            'coverPhoto' => ['required', 'image', 'max:5120'],
        ]);

        $service->updateCoverPhoto($post, $request->file('coverPhoto'));

        return back()->with('success', 'Foto cover berhasil diperbarui.');
    }

    public function deleteCover(Post $post, PostService $service): RedirectResponse
    {
        Gate::authorize('update', $post);

        $service->deleteCoverPhoto($post);

        return back()->with('success', 'Foto cover berhasil dihapus.');
    }

    public function exportExcel(PostExcelService $excelService): StreamedResponse
    {
        $posts = Auth::user()->posts()->with('user:id,name,username')->latest('id')->get();

        return $excelService->exportToResponse($posts, 'artikel-'.now()->format('Ymd-His').'.xlsx');
    }

    public function importExcel(Request $request, PostExcelService $excelService): RedirectResponse
    {
        $request->validate([
            'importFile' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $result = $excelService->import($request->file('importFile')->getRealPath(), (int) Auth::id());

        return back()->with('success', "Berhasil mengimpor {$result['imported']} artikel.");
    }

    public function generateAi(Request $request, AiClientInterface $aiClient): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'prompt' => ['required_without:aiPrompt', 'nullable', 'string', 'min:3', 'max:1000'],
            'aiPrompt' => ['required_without:prompt', 'nullable', 'string', 'min:3', 'max:1000'],
            'count' => ['nullable', 'integer', 'min:1', 'max:10'],
            'aiCount' => ['nullable', 'integer', 'min:1', 'max:10'],
        ], [
            'prompt.required_without' => 'Topik / instruksi artikel harus diisi minimal 3 karakter.',
            'prompt.min' => 'Topik / instruksi artikel harus minimal 3 karakter.',
            'aiPrompt.required_without' => 'Topik / instruksi artikel harus diisi minimal 3 karakter.',
            'aiPrompt.min' => 'Topik / instruksi artikel harus minimal 3 karakter.',
        ]);

        $prompt = (string) ($validated['prompt'] ?? $validated['aiPrompt'] ?? '');
        $count = (int) ($validated['count'] ?? $validated['aiCount'] ?? 3);

        try {
            $items = $aiClient->generatePosts($prompt, $count);
            $data = array_map(fn ($item) => $item->toArray(), $items);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'posts' => $data,
                    'items' => $data,
                ]);
            }

            return back()->with('aiGeneratedItems', $data);
        } catch (\Throwable $e) {
            $msg = 'Gagal menghasilkan artikel dengan AI: '.$e->getMessage();
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 422);
            }

            return back()->with('error', $msg);
        }
    }

    public function saveAi(Request $request, PostService $service): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required_without:posts', 'nullable', 'array', 'min:1'],
            'posts' => ['required_without:items', 'nullable', 'array', 'min:1'],
        ]);

        $rawItems = $validated['items'] ?? $validated['posts'] ?? [];
        $count = 0;
        foreach ($rawItems as $item) {
            if (empty($item['title'])) {
                continue;
            }

            $service->createPost((int) Auth::id(), [
                'title' => mb_substr((string) $item['title'], 0, 255),
                'category' => PostCategory::fromInput($item['category'] ?? null)->value,
                'excerpt' => $item['excerpt'] ?? null,
                'content' => $item['content'] ?? '',
                'is_published' => false,
            ]);
            $count++;
        }

        return back()->with('success', "Berhasil menyimpan {$count} artikel draf yang digenerate oleh AI.");
    }
}