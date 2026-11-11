<?php

namespace Tests\Feature;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoutingTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_renders_public_posts_for_guest(): void
    {
        Post::factory()->published()->count(2)->create();
        Post::factory()->draft()->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/PostIndex')
                ->where('isHome', true)
                ->has('posts.data', 2)
                ->has('categories')
            );
    }

    public function test_root_renders_public_posts_for_member(): void
    {
        $member = User::factory()->member()->create();

        $this->actingAs($member)->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Public/PostIndex'));
    }

    public function test_articles_route_is_not_home(): void
    {
        $this->get('/articles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('isHome', false));
    }

    public function test_guest_is_redirected_from_dashboard(): void
    {
        $this->get('/dashboard/posts')->assertRedirect('/login');
    }

    public function test_logout_redirects_to_home(): void
    {
        $member = User::factory()->member()->create();

        $this->actingAs($member)->post('/logout')->assertRedirect(route('home'));
        $this->assertGuest();
    }

    public function test_health_check_endpoint(): void
    {
        $this->get('/up')->assertStatus(200);
    }
}