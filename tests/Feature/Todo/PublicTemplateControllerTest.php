<?php

namespace Tests\Feature\Todo;

use App\Features\Todo\Models\Todo;
use App\Features\Todo\Models\TodoGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicTemplateControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_templates_gallery(): void
    {
        $user = User::factory()->create();
        TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => true, 'title' => 'Template Belajar']);

        $response = $this->get('/templates');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Template/Index')
                ->has('templates.data', 1)
            );
    }

    public function test_guest_can_search_templates(): void
    {
        $user = User::factory()->create();
        TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => true, 'title' => 'Laravel Guide']);
        TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => true, 'title' => 'React Guide']);

        $response = $this->get('/templates?search=React');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Template/Index')
                ->has('templates.data', 1)
                ->where('templates.data.0.title', 'React Guide')
            );
    }

    public function test_guest_can_view_single_public_template(): void
    {
        $author = User::factory()->create();
        $group = TodoGroup::factory()->create([
            'user_id' => $author->id,
            'is_public' => true,
            'title' => 'Publik Checklist',
        ]);
        Todo::factory()->create([
            'user_id' => $author->id,
            'todo_group_id' => $group->id,
            'title' => 'Tugas A',
        ]);

        $response = $this->get("/templates/{$group->id}");

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Template/Show')
                ->where('template.id', $group->id)
                ->where('isOwner', false)
                ->has('template.todos', 1)
            );
    }

    public function test_guest_cannot_view_private_template(): void
    {
        $author = User::factory()->create();
        $group = TodoGroup::factory()->create([
            'user_id' => $author->id,
            'is_public' => false,
            'title' => 'Rahasia',
        ]);

        $response = $this->get("/templates/{$group->id}");
        $response->assertNotFound();
    }

    public function test_guest_redirected_to_login_when_cloning_template(): void
    {
        $author = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $author->id, 'is_public' => true]);

        $response = $this->post("/templates/{$group->id}/clone");
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_clone_public_template(): void
    {
        $author = User::factory()->create();
        $user = User::factory()->create();

        $group = TodoGroup::factory()->create([
            'user_id' => $author->id,
            'title' => 'Sprint Template',
            'is_public' => true,
        ]);
        Todo::factory()->create([
            'user_id' => $author->id,
            'todo_group_id' => $group->id,
            'title' => 'Sprint Task 1',
        ]);

        $response = $this->actingAs($user)->post("/templates/{$group->id}/clone");

        $response->assertRedirect();
        $this->assertDatabaseHas('todo_groups', [
            'user_id' => $user->id,
            'title' => 'Sprint Template (Salinan)',
            'is_public' => false,
        ]);
        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'Sprint Task 1',
        ]);
    }
}
