<?php

namespace Tests\Unit\Services;

use App\Features\Post\Models\Post;
use App\Features\Post\Repositories\PostRepository;
use App\Features\Post\Services\PostService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PostService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PostService(new PostRepository());
    }

    public function test_create_post_defaults(): void
    {
        $user = User::factory()->create();

        $post = $this->service->createPost($user->id, ['title' => 'Judul Baru']);

        $this->assertSame('judul-baru', $post->slug);
        $this->assertSame('Umum', $post->category);
        $this->assertNull($post->excerpt);
        $this->assertSame('', $post->content);
        $this->assertFalse($post->is_published);
        $this->assertNull($post->published_at);
    }

    public function test_create_published_post(): void
    {
        $user = User::factory()->create();

        $post = $this->service->createPost($user->id, [
            'title' => 'Terbit', 'category' => 'Bisnis', 'excerpt' => 'ex', 'content' => 'isi',
            'cover_image_path' => 'post-covers/a.jpg', 'is_published' => true,
        ]);

        $this->assertTrue($post->is_published);
        $this->assertNotNull($post->published_at);
        $this->assertSame('Bisnis', $post->category);
        $this->assertSame('post-covers/a.jpg', $post->cover_image_path);
    }

    public function test_update_post_partial_keeps_other_fields(): void
    {
        $post = Post::factory()->create(['title' => 'Lama', 'excerpt' => 'ex lama', 'category' => 'Opini']);

        $this->service->updatePost($post, ['title' => 'Baru']);
        $post->refresh();

        $this->assertSame('Baru', $post->title);
        $this->assertSame('ex lama', $post->excerpt);
        $this->assertSame('Opini', $post->category);
    }

    public function test_update_post_can_clear_excerpt_and_change_fields(): void
    {
        $post = Post::factory()->create(['excerpt' => 'ada']);

        $this->service->updatePost($post, [
            'category' => 'Bisnis', 'excerpt' => null, 'content' => 'isi baru', 'cover_image_path' => 'x/y.jpg',
        ]);
        $post->refresh();

        $this->assertNull($post->excerpt);
        $this->assertSame('Bisnis', $post->category);
        $this->assertSame('isi baru', $post->content);
        $this->assertSame('x/y.jpg', $post->cover_image_path);
    }

    public function test_update_publish_state(): void
    {
        $post = Post::factory()->draft()->create();

        $this->service->updatePost($post, ['is_published' => true]);
        $this->assertNotNull($post->fresh()->published_at);

        $original = now()->subDays(3);
        $post->update(['published_at' => $original]);
        $this->service->updatePost($post, ['is_published' => true]);
        $this->assertSame($original->timestamp, $post->fresh()->published_at->timestamp);

        $this->service->updatePost($post, ['is_published' => false]);
        $this->assertFalse($post->fresh()->is_published);
        $this->assertNull($post->fresh()->published_at);
    }

    public function test_toggle_publish(): void
    {
        $post = Post::factory()->draft()->create();

        $this->service->togglePublish($post);
        $this->assertTrue($post->fresh()->is_published);

        $this->service->togglePublish($post);
        $this->assertFalse($post->fresh()->is_published);
    }

    public function test_cover_photo_upload_replace_and_delete(): void
    {
        Storage::fake('public');
        $post = Post::factory()->create();

        $first = $this->service->updateCoverPhoto($post, UploadedFile::fake()->image('a.jpg'));
        Storage::disk('public')->assertExists($first);
        $this->assertSame($first, $post->fresh()->cover_image_path);

        $second = $this->service->updateCoverPhoto($post->fresh(), UploadedFile::fake()->image('b.jpg'));
        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($second);

        $this->service->deleteCoverPhoto($post->fresh());
        Storage::disk('public')->assertMissing($second);
        $this->assertNull($post->fresh()->cover_image_path);
    }

    public function test_delete_post_removes_cover_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('post-covers/c.jpg', 'x');
        $post = Post::factory()->create(['cover_image_path' => 'post-covers/c.jpg']);

        $this->assertTrue($this->service->deletePost($post));

        Storage::disk('public')->assertMissing('post-covers/c.jpg');
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_delete_post_with_missing_cover_file(): void
    {
        Storage::fake('public');
        $post = Post::factory()->create(['cover_image_path' => 'post-covers/hilang.jpg']);

        $this->assertTrue($this->service->deletePost($post));
    }

    public function test_generate_unique_slug(): void
    {
        $this->assertSame('halo-dunia', $this->service->generateUniqueSlug('Halo Dunia'));

        $existing = Post::factory()->create(['slug' => 'halo-dunia']);
        $this->assertSame('halo-dunia-2', $this->service->generateUniqueSlug('Halo Dunia'));

        Post::factory()->create(['slug' => 'halo-dunia-2']);
        $this->assertSame('halo-dunia-3', $this->service->generateUniqueSlug('Halo Dunia'));

        $this->assertSame('halo-dunia', $this->service->generateUniqueSlug('Halo Dunia', $existing->id));
        $this->assertSame('artikel', $this->service->generateUniqueSlug('!!!'));
        $this->assertSame(100, strlen($this->service->generateUniqueSlug(str_repeat('a', 150))));
    }

    public function test_query_delegations(): void
    {
        $user = User::factory()->create();
        $a = Post::factory()->published()->create(['user_id' => $user->id, 'category' => 'Bisnis']);
        Post::factory()->published()->create(['category' => 'Bisnis']);
        Post::factory()->draft()->create(['user_id' => $user->id]);

        $this->assertCount(2, $this->service->getPublicPosts());
        $this->assertTrue($this->service->getPublishedPost($a->slug)->is($a));
        $this->assertCount(1, $this->service->getRelatedPosts($a));
        $this->assertCount(2, $this->service->getPostsForUser($user->id));
        $this->assertCount(3, $this->service->getAllPosts());
        $this->assertCount(3, $this->service->getAllPostsForExport());
        $this->assertSame(['total' => 2, 'published' => 1, 'draft' => 1], $this->service->getStatsForUser($user->id));
    }
}