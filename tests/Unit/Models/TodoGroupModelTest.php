<?php

namespace Tests\Unit\Models;

use App\Features\Todo\Models\Todo;
use App\Features\Todo\Models\TodoGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoGroupModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_todo_group_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $group->user);
        $this->assertEquals($user->id, $group->user->id);
    }

    public function test_todo_group_has_many_todos(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id]);
        $todo = Todo::factory()->create([
            'user_id' => $user->id,
            'todo_group_id' => $group->id,
        ]);

        $this->assertTrue($group->todos->contains($todo));
    }

    public function test_user_has_many_todo_groups(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->todoGroups->contains($group));
    }

    public function test_todo_belongs_to_group(): void
    {
        $user = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $user->id]);
        $todo = Todo::factory()->create([
            'user_id' => $user->id,
            'todo_group_id' => $group->id,
        ]);

        $this->assertInstanceOf(TodoGroup::class, $todo->group);
        $this->assertEquals($group->id, $todo->group->id);
    }

    public function test_name_accessor_and_mutator(): void
    {
        $group = new TodoGroup();
        $group->name = 'Custom Group Title';

        $this->assertEquals('Custom Group Title', $group->title);
        $this->assertEquals('Custom Group Title', $group->name);
    }
}
