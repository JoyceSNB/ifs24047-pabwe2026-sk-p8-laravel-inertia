<?php

namespace Tests\Unit\Repositories;

use App\Features\Post\Models\Post;
use App\Features\Post\Repositories\PostRepository;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostRepositoryTest extends TestCase
{
    use RefreshDatabase;

    protected PostRepository $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = new PostRepository();
    }

    public function test_public_paginate(): void
    {
        $old = Post::factory()->published()->create([
            'title' => 'Belajar Laravel', 'category' => 'Teknologi', 'published_at' => now()->subDay(),
        ]);
        $new = Post::factory()->published()->create([
            'title' => 'Resep Nasi', 'category' => 'Gaya Hidup', 'published_at' => now(),
            'excerpt' => null, 'content' => 'isi khusus qqq',
        ]);
        Post::factory()->draft()->create(['title' => 'Draf Laravel']);

        $all = $this->repo->publicPaginate();
        $this->assertCount(2, $all);
        $this->assertSame($new->id, $all->first()->id);

        $this->assertSame($old->id, $this->repo->publicPaginate('LARAVEL')->first()->id);
        $this->assertCount(1, $this->repo->publicPaginate('qqq'));
        $this->assertSame($new->id, $this->repo->publicPaginate(null, 'Gaya Hidup')->first()->id);
        $this->assertCount(0, $this->repo->publicPaginate('tidak-ada-zzz'));
    }

    public function test_search_matches_excerpt(): void
    {
        Post::factory()->published()->create(['excerpt' => 'ringkasan unik zzz']);

        $this->assertCount(1, $this->repo->publicPaginate('zzz'));
    }

    public function test_find_published_by_slug(): void
    {
        $pub = Post::factory()->published()->create(['slug' => 'artikel-publik']);
        Post::factory()->draft()->create(['slug' => 'artikel-draf']);

        $this->assertTrue($this->repo->findPublishedBySlugOrFail('artikel-publik')->is($pub));

        $this->expectException(ModelNotFoundException::class);
        $this->repo->findPublishedBySlugOrFail('artikel-draf');
    }

    public function test_related_to(): void
    {
        $main = Post::factory()->published()->create(['category' => 'Bisnis']);
        Post::factory()->published()->count(4)->create(['category' => 'Bisnis']);
        Post::factory()->published()->create(['category' => 'Opini']);
        Post::factory()->draft()->create(['category' => 'Bisnis']);

        $related = $this->repo->relatedTo($main, 3);

        $this->assertCount(3, $related);
        $this->assertFalse($related->contains('id', $main->id));
        $this->assertTrue($related->every(fn ($p) => $p->category === 'Bisnis'));
    }

    public function test_for_user_filters(): void
    {
        $user = User::factory()->create();
        Post::factory()->published()->create(['user_id' => $user->id, 'title' => 'Satu Pub', 'category' => 'Bisnis']);
        Post::factory()->draft()->create(['user_id' => $user->id, 'title' => 'Dua Draf', 'category' => 'Opini']);
        Post::factory()->create(); // milik user lain

        $this->assertCount(2, $this->repo->forUser($user->id));
        $this->assertCount(2, $this->repo->forUser($user->id, 'semua'));
        $this->assertCount(1, $this->repo->forUser($user->id, 'published'));
        $this->assertCount(1, $this->repo->forUser($user->id, 'draft'));
        $this->assertCount(1, $this->repo->forUser($user->id, null, 'dua draf'));
        $this->assertCount(1, $this->repo->forUser($user->id, null, null, 10, 'Bisnis'));
        $this->assertCount(2, $this->repo->allForUser($user->id));
    }

    public function test_paginate_all_and_all_with_user(): void
    {
        Post::factory()->published()->create(['title' => 'Alpha Pub', 'category' => 'Bisnis']);
        Post::factory()->draft()->create(['title' => 'Beta Draf', 'category' => 'Opini']);

        $this->assertCount(2, $this->repo->paginateAll());
        $this->assertCount(1, $this->repo->paginateAll('alpha'));
        $this->assertCount(1, $this->repo->paginateAll(null, 'draft'));
        $this->assertCount(1, $this->repo->paginateAll(null, 'published'));
        $this->assertCount(1, $this->repo->paginateAll(null, null, 'Opini'));

        $all = $this->repo->allWithUser();
        $this->assertCount(2, $all);
        $this->assertTrue($all->first()->relationLoaded('user'));
    }

    public function test_crud_helpers(): void
    {
        $user = User::factory()->create();

        $post = $this->repo->create([
            'user_id' => $user->id, 'title' => 'Baru', 'slug' => 'baru',
            'category' => 'Umum', 'content' => 'isi',
        ]);

        $this->assertTrue($this->repo->find($post->id)->is($post));
        $this->assertNull($this->repo->find(999999));
        $this->assertTrue($this->repo->findOrFail($post->id)->is($post));

        $this->assertTrue($this->repo->update($post, ['title' => 'Diubah']));
        $this->assertSame('Diubah', $post->fresh()->title);

        $this->assertTrue($this->repo->delete($post));
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);

        $this->expectException(ModelNotFoundException::class);
        $this->repo->findOrFail($post->id);
    }

    public function test_slug_exists(): void
    {
        $post = Post::factory()->create(['slug' => 'slug-ada']);

        $this->assertTrue($this->repo->slugExists('slug-ada'));
        $this->assertFalse($this->repo->slugExists('slug-ada', $post->id));
        $this->assertFalse($this->repo->slugExists('slug-lain'));
    }

    public function test_stats_for_user(): void
    {
        $user = User::factory()->create();
        Post::factory()->published()->count(2)->create(['user_id' => $user->id]);
        Post::factory()->draft()->create(['user_id' => $user->id]);

        $this->assertSame(['total' => 3, 'published' => 2, 'draft' => 1], $this->repo->getStatsForUser($user->id));
    }
}