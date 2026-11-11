<?php

namespace Tests\Unit\Services;

use App\Features\Admin\Services\AdminUserService;
use App\Features\Post\Models\Post;
use App\Features\Post\Repositories\PostRepository;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminUserService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AdminUserService(new PostRepository());
    }

    public function test_get_users_list_without_search(): void
    {
        User::factory()->count(3)->create();

        $this->assertCount(3, $this->service->getUsersList());
    }

    public function test_get_users_list_with_search(): void
    {
        User::factory()->create(['name' => 'Alice Wonder', 'username' => 'alice_w', 'email' => 'alice@test.com']);
        User::factory()->create(['name' => 'Bob Marley', 'username' => 'carol_dev', 'email' => 'bob@test.com']);

        $this->assertCount(1, $this->service->getUsersList(search: 'Alice'));
        $this->assertCount(1, $this->service->getUsersList(search: 'bob@test.com'));
        $this->assertCount(1, $this->service->getUsersList(search: 'carol_dev'));
        $this->assertCount(0, $this->service->getUsersList(search: 'tidak-ada'));
    }

    public function test_users_list_contains_posts_count(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(2)->create(['user_id' => $user->id]);

        $this->assertSame(2, $this->service->getUsersList()->first()->posts_count);
    }

    public function test_get_user_posts_with_filters(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(2)->published()->create(['user_id' => $user->id]);
        Post::factory()->draft()->create(['user_id' => $user->id, 'title' => 'Draf Khusus Xyz']);
        Post::factory()->create(); // milik user lain

        $this->assertCount(3, $this->service->getUserPosts($user->id));
        $this->assertCount(2, $this->service->getUserPosts($user->id, 'published'));
        $this->assertCount(1, $this->service->getUserPosts($user->id, 'draft'));
        $this->assertCount(1, $this->service->getUserPosts($user->id, null, 'khusus xyz'));
    }
}