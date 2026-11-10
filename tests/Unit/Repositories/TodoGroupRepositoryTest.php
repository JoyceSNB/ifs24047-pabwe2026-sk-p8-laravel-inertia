<?php

namespace Tests\Unit\Repositories;

use App\Features\Todo\Models\Todo;
use App\Features\Todo\Models\TodoGroup;
use App\Features\Todo\Repositories\TodoGroupRepository;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoGroupRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private TodoGroupRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new TodoGroupRepository();
    }

    public function test_for_user_returns_user_groups(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        TodoGroup::factory()->count(2)->create(['user_id' => $user1->id]);
        TodoGroup::factory()->create(['user_id' => $user2->id]);

        $results = $this->repository->forUser($user1->id);
        $this->assertCount(2, $results);
    }

    public function test_public_templates_filters_and_paginates(): void
    {
        $user = User::factory()->create();
        TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => true, 'title' => 'Laravel Starter']);
        TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => false, 'title' => 'Secret Group']);
        TodoGroup::factory()->create(['user_id' => $user->id, 'is_public' => true, 'title' => 'Vue Tutorial']);

        $allPublic = $this->repository->publicTemplates();
        $this->assertCount(2, $allPublic->items());

        $filtered = $this->repository->publicTemplates('Laravel');
        $this->assertCount(1, $filtered->items());
        $this->assertEquals('Laravel Starter', $filtered->items()[0]->title);
    }

    public function test_create_and_find_by_id(): void
    {
        $user = User::factory()->create();
        $group = $this->repository->create([
            'user_id' => $user->id,
            'title' => 'Sprint 1',
            'description' => 'First sprint',
            'is_public' => true,
        ]);

        $found = $this->repository->find($group->id);
        $this->assertNotNull($found);
        $this->assertEquals('Sprint 1', $found->title);

        $foundOr = $this->repository->findOrFail($group->id);
        $this->assertEquals('Sprint 1', $foundOr->title);

        $foundPublic = $this->repository->findPublicOrFail($group->id);
        $this->assertEquals('Sprint 1', $foundPublic->title);
    }

    public function test_update_and_delete(): void
    {
        $group = TodoGroup::factory()->create(['title' => 'Old Name']);

        $res = $this->repository->update($group, ['title' => 'New Name']);
        $this->assertTrue($res);
        $this->assertEquals('New Name', $group->fresh()->title);

        $del = $this->repository->delete($group);
        $this->assertTrue($del);
        $this->assertNull($this->repository->find($group->id));
    }

    public function test_toggle_public(): void
    {
        $group = TodoGroup::factory()->create(['is_public' => false]);
        $toggled = $this->repository->togglePublic($group);
        $this->assertTrue($toggled->is_public);

        $toggledBack = $this->repository->togglePublic($toggled);
        $this->assertFalse($toggledBack->is_public);
    }

    public function test_clone_template(): void
    {
        $author = User::factory()->create();
        $cloner = User::factory()->create();

        $template = TodoGroup::factory()->create([
            'user_id' => $author->id,
            'title' => 'Master Checklist',
            'description' => 'Template desc',
            'is_public' => true,
        ]);

        Todo::factory()->create([
            'user_id' => $author->id,
            'todo_group_id' => $template->id,
            'title' => 'Step 1',
            'description' => 'Do this first',
        ]);
        Todo::factory()->create([
            'user_id' => $author->id,
            'todo_group_id' => $template->id,
            'title' => 'Step 2',
            'description' => 'Do this second',
        ]);

        $cloned = $this->repository->cloneTemplate($template, $cloner->id);

        $this->assertEquals($cloner->id, $cloned->user_id);
        $this->assertEquals('Master Checklist (Salinan)', $cloned->title);
        $this->assertFalse($cloned->is_public);
        $this->assertCount(2, $cloned->todos);
        $this->assertEquals('pending', $cloned->todos[0]->status);
    }
}
