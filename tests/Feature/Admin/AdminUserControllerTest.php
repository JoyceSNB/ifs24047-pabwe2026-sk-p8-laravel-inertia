<?php

namespace Tests\Feature\Admin;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_forbidden_from_admin_pages(): void
    {
        $member = User::factory()->member()->create();
        $target = User::factory()->member()->create();

        $this->actingAs($member)->get('/admin/users')->assertStatus(403);
        $this->actingAs($member)->get("/admin/users/{$target->id}/posts")->assertStatus(403);
        $this->actingAs($member)->get("/admin/users/{$target->id}/posts/export")->assertStatus(403);
    }

    public function test_admin_can_view_user_list(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Budi Santoso', 'email' => 'budi@test.com']);
        User::factory()->create(['name' => 'Citra Lestari', 'email' => 'citra@test.com']);

        $this->actingAs($admin)->get('/admin/users')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/UserList')->has('users.data'));

        $this->actingAs($admin)->get('/admin/users?search=Budi')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserList')
                ->has('users.data', 1)
                ->where('users.data.0.name', 'Budi Santoso')
            );
    }

    public function test_admin_can_view_user_posts_read_only(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->member()->create(['name' => 'Doni Target']);

        Post::factory()->draft()->create(['user_id' => $target->id, 'title' => 'Artikel Spesifik Doni']);
        Post::factory()->published()->create(['user_id' => $target->id, 'title' => 'Artikel Lain Doni']);

        $this->actingAs($admin)->get("/admin/users/{$target->id}/posts")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserPostList')
                ->where('targetUser.name', 'Doni Target')
                ->has('posts.data', 2)
            );

        $this->actingAs($admin)->get("/admin/users/{$target->id}/posts?search=Spesifik")
            ->assertInertia(fn (Assert $page) => $page
                ->has('posts.data', 1)
                ->where('posts.data.0.title', 'Artikel Spesifik Doni')
            );

        $this->actingAs($admin)->get("/admin/users/{$target->id}/posts?status=published")
            ->assertInertia(fn (Assert $page) => $page
                ->has('posts.data', 1)
                ->where('posts.data.0.title', 'Artikel Lain Doni')
            );
    }

    public function test_admin_can_export_user_posts(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->member()->create(['name' => 'Budi Target!']);
        Post::factory()->count(2)->create(['user_id' => $target->id]);

        $response = $this->actingAs($admin)->get("/admin/users/{$target->id}/posts/export");

        $this->assertInstanceOf(StreamedResponse::class, $response->baseResponse);
        $this->assertStringContainsString('artikel-Budi_Target_-', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('PK', $response->streamedContent());
    }
}