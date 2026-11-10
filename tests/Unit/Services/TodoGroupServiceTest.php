<?php

namespace Tests\Unit\Services;

use App\Features\Todo\Contracts\TodoGroupRepositoryInterface;
use App\Features\Todo\Models\TodoGroup;
use App\Features\Todo\Services\TodoGroupService;
use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class TodoGroupServiceTest extends TestCase
{
    private TodoGroupRepositoryInterface|MockInterface $repository;
    private TodoGroupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = Mockery::mock(TodoGroupRepositoryInterface::class);
        $this->service = new TodoGroupService($this->repository);
    }

    public function test_get_groups_for_user(): void
    {
        $this->repository->shouldReceive('forUser')
            ->once()
            ->with(1)
            ->andReturn(new Collection([]));

        $result = $this->service->getGroupsForUser(1);
        $this->assertCount(0, $result);
    }

    public function test_get_public_templates(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 9);
        $this->repository->shouldReceive('publicTemplates')
            ->once()
            ->with('query', 9)
            ->andReturn($paginator);

        $result = $this->service->getPublicTemplates('query', 9);
        $this->assertSame($paginator, $result);
    }

    public function test_get_public_template(): void
    {
        $group = new TodoGroup();
        $this->repository->shouldReceive('findPublicOrFail')
            ->once()
            ->with(1)
            ->andReturn($group);

        $result = $this->service->getPublicTemplate(1);
        $this->assertSame($group, $result);
    }

    public function test_create_group(): void
    {
        $group = new TodoGroup(['title' => 'Group A']);
        $this->repository->shouldReceive('create')
            ->once()
            ->with([
                'user_id' => 1,
                'title' => 'Group A',
                'description' => 'Desc',
                'is_public' => false,
            ])
            ->andReturn($group);

        $res = $this->service->createGroup(1, ['title' => 'Group A', 'description' => 'Desc']);
        $this->assertSame($group, $res);
    }

    public function test_update_group(): void
    {
        $group = new TodoGroup(['title' => 'Old']);
        $this->repository->shouldReceive('update')
            ->once()
            ->with($group, [
                'title' => 'New',
                'description' => null,
                'is_public' => false,
            ])
            ->andReturn(true);

        $res = $this->service->updateGroup($group, ['title' => 'New']);
        $this->assertTrue($res);
    }

    public function test_delete_group(): void
    {
        $group = new TodoGroup();
        $this->repository->shouldReceive('delete')
            ->once()
            ->with($group)
            ->andReturn(true);

        $this->assertTrue($this->service->deleteGroup($group));
    }

    public function test_clone_template(): void
    {
        $group = new TodoGroup();
        $this->repository->shouldReceive('cloneTemplate')
            ->once()
            ->with($group, 2)
            ->andReturn($group);

        $this->assertSame($group, $this->service->cloneTemplate($group, 2));
    }
}
