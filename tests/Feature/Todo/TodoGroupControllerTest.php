<?php

namespace Tests\Feature\Todo;

use App\Features\Todo\Models\TodoGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoGroupControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_todo_group(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/todo-groups', [
            'title' => 'Kuliah Semester 6',
            'description' => 'Mata kuliah PABWE dan AI',
            'is_public' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'user_id' => $user->id,
            'title' => 'Kuliah Semester 6',
            'is_public' => true,
        ]);
    }

    public function test_user_can_create_todo_group_using_name_field(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/todo-groups', [
            'name' => 'Kuliah Semester 7',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'user_id' => $user->id,
            'title' => 'Kuliah Semester 7',
        ]);
    }

    public function test_create_group_requires_title(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/todo-groups', [
            'title' => '',
        ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_user_can_update_own_group(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id, 'title' => 'Old Name']);

        $response = $this->actingAs($user)->put("/todo-groups/{$group->id}", [
            'title' => 'Updated Name',
            'description' => 'Updated Desc',
            'is_public' => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'id' => $group->id,
            'title' => 'Updated Name',
        ]);
    }

    public function test_user_can_update_own_group_using_name_field(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id, 'title' => 'Old Name']);

        $response = $this->actingAs($user)->put("/todo-groups/{$group->id}", [
            'name' => 'Updated Via Name',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'id' => $group->id,
            'title' => 'Updated Via Name',
        ]);
    }

    public function test_user_cannot_update_other_users_group(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($other)->put("/todo-groups/{$group->id}", [
            'title' => 'Hacked Name',
        ]);

        $response->assertForbidden();
    }

    public function test_user_can_delete_own_group(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete("/todo-groups/{$group->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('todo_groups', ['id' => $group->id]);
    }

    public function test_user_cannot_delete_other_users_group(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($other)->delete("/todo-groups/{$group->id}");

        $response->assertForbidden();
    }

    public function test_user_can_toggle_public_status(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => false]);

        $response = $this->actingAs($user)->patch("/todo-groups/{$group->id}/toggle-public");

        $response->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'id' => $group->id,
            'is_public' => true,
        ]);

        // Toggle back from public to private
        $responseBack = $this->actingAs($user)->patch("/todo-groups/{$group->id}/toggle-public");
        $responseBack->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'id' => $group->id,
            'is_public' => false,
        ]);
    }
}
