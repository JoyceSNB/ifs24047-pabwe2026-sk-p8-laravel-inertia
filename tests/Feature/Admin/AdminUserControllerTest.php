<?php

namespace Tests\Feature\Admin;

use App\Features\Todo\Models\Todo;
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
        $targetUser = User::factory()->member()->create();

        $this->actingAs($member)
            ->get('/admin/users')
            ->assertStatus(403);

        $this->actingAs($member)
            ->get("/admin/users/{$targetUser->id}/todos")
            ->assertStatus(403);

        $this->actingAs($member)
            ->get("/admin/users/{$targetUser->id}/todos/export")
            ->assertStatus(403);
    }

    public function test_admin_can_view_user_list(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Budi Santoso', 'email' => 'budi@test.com']);
        User::factory()->create(['name' => 'Citra Lestari', 'email' => 'citra@test.com']);

        $this->actingAs($admin)
            ->get('/admin/users')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserList')
                ->has('users.data')
            );

        $this->actingAs($admin)
            ->get('/admin/users?search=Budi')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserList')
                ->where('users.data.0.name', 'Budi Santoso')
            );
    }

    public function test_admin_can_view_user_todos_read_only(): void
    {
        $admin = User::factory()->admin()->create();
        $targetUser = User::factory()->member()->create(['name' => 'Doni Target']);

        Todo::factory()->create(['user_id' => $targetUser->id, 'title' => 'Todo Spesifik Doni', 'status' => 'pending']);
        Todo::factory()->create(['user_id' => $targetUser->id, 'title' => 'Todo Lain Doni', 'status' => 'completed']);

        $this->actingAs($admin)
            ->get("/admin/users/{$targetUser->id}/todos")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/UserTodoList')
                ->where('targetUser.name', 'Doni Target')
                ->has('todos.data', 2)
            );

        $this->actingAs($admin)
            ->get("/admin/users/{$targetUser->id}/todos?search=Spesifik")
            ->assertInertia(fn (Assert $page) => $page
                ->has('todos.data', 1)
                ->where('todos.data.0.title', 'Todo Spesifik Doni')
            );

        $this->actingAs($admin)
            ->get("/admin/users/{$targetUser->id}/todos?status=completed")
            ->assertInertia(fn (Assert $page) => $page
                ->has('todos.data', 1)
                ->where('todos.data.0.title', 'Todo Lain Doni')
            );
    }

    public function test_admin_can_export_user_todos(): void
    {
        $admin = User::factory()->admin()->create();
        $targetUser = User::factory()->member()->create(['name' => 'Budi Target']);
        Todo::factory()->count(2)->create(['user_id' => $targetUser->id]);

        $response = $this->actingAs($admin)
            ->get("/admin/users/{$targetUser->id}/todos/export");

        $this->assertInstanceOf(StreamedResponse::class, $response->baseResponse);
    }
}

