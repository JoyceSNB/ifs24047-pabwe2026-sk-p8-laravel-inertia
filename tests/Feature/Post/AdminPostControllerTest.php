<?php

namespace Tests\Feature\Post;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class AdminPostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_and_guest_cannot_access(): void
    {
        $member = User::factory()->member()->create();

        $this->actingAs($member)->get('/admin/posts')->assertForbidden();
        $this->actingAs($member)->get('/admin/posts/export')->assertForbidden();

        auth()->logout();
        $this->get('/admin/posts')->assertRedirect('/login');
    }

    public function test_admin_sees_all_posts_with_filters(): void
    {
        $admin = User::factory()->admin()->create();
        Post::factory()->published()->create(['title' => 'Alpha Pub', 'category' => 'Bisnis']);
        Post::factory()->draft()->create(['title' => 'Beta Draf', 'category' => 'Opini']);

        $this->actingAs($admin)->get('/admin/posts')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/PostList')
                ->has('posts.data', 2)
                ->has('categories', 6)
            );

        $this->actingAs($admin)->get('/admin/posts?search=alpha&status=published&category=Bisnis')
            ->assertInertia(fn (Assert $page) => $page
                ->has('posts.data', 1)
                ->where('filters.search', 'alpha')
                ->where('filters.status', 'published')
                ->where('filters.category', 'Bisnis')
            );
    }

    public function test_admin_can_export_all_posts(): void
    {
        $admin = User::factory()->admin()->create();
        Post::factory()->count(3)->create();

        $response = $this->actingAs($admin)->get('/admin/posts/export');

        $this->assertInstanceOf(StreamedResponse::class, $response->baseResponse);
        $this->assertStringContainsString('semua-artikel-', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('PK', $response->streamedContent());
    }
}