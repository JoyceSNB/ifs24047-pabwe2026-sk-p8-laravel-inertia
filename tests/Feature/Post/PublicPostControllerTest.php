<?php

namespace Tests\Feature\Post;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_articles_lists_only_published_with_search_and_category(): void
    {
        Post::factory()->published()->create(['title' => 'Kopi Pagi', 'category' => 'Bisnis']);
        Post::factory()->published()->create(['title' => 'Teh Sore', 'category' => 'Opini']);
        Post::factory()->draft()->create(['title' => 'Kopi Draf']);

        $this->get('/articles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/PostIndex')
                ->where('isHome', false)
                ->has('posts.data', 2)
            );

        $this->get('/articles?search=kopi')
            ->assertInertia(fn (Assert $page) => $page
                ->has('posts.data', 1)
                ->where('posts.data.0.title', 'Kopi Pagi')
                ->where('filters.search', 'kopi')
            );

        $this->get('/articles?category=Opini')
            ->assertInertia(fn (Assert $page) => $page
                ->has('posts.data', 1)
                ->where('filters.category', 'Opini')
            );
    }

    public function test_show_published_article_with_related(): void
    {
        $author = User::factory()->create(['name' => 'Penulis X']);
        $post = Post::factory()->published()->create(['user_id' => $author->id, 'category' => 'Bisnis']);
        Post::factory()->published()->create(['category' => 'Bisnis']);

        $this->get("/articles/{$post->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/PostShow')
                ->where('post.slug', $post->slug)
                ->where('post.author.name', 'Penulis X')
                ->has('related', 1)
            );
    }

    public function test_show_works_for_logged_in_user(): void
    {
        $post = Post::factory()->published()->create();

        $this->actingAs(User::factory()->member()->create())
            ->get("/articles/{$post->slug}")
            ->assertOk();
    }

    public function test_draft_or_unknown_slug_returns_404(): void
    {
        $draft = Post::factory()->draft()->create();

        $this->get("/articles/{$draft->slug}")->assertNotFound();
        $this->get('/articles/tidak-ada')->assertNotFound();
    }
}