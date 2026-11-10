<?php

namespace Tests\Unit\Policies;

use App\Features\Todo\Models\TodoGroup;
use App\Features\Todo\Policies\TodoGroupPolicy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoGroupPolicyTest extends TestCase
{
    use RefreshDatabase;

    private TodoGroupPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new TodoGroupPolicy();
    }

    public function test_view_any(): void
    {
        $user = User::factory()->create();
        $this->assertTrue($this->policy->viewAny($user));
    }

    public function test_view(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $admin = User::factory()->admin()->create();

        $privateGroup = TodoGroup::factory()->create(['user_id' => $owner->id, 'is_public' => false]);
        $publicGroup = TodoGroup::factory()->create(['user_id' => $owner->id, 'is_public' => true]);

        // Guest view
        $this->assertTrue($this->policy->view(null, $publicGroup));
        $this->assertFalse($this->policy->view(null, $privateGroup));

        // Authenticated view
        $this->assertTrue($this->policy->view($owner, $privateGroup));
        $this->assertFalse($this->policy->view($other, $privateGroup));
        $this->assertTrue($this->policy->view($admin, $privateGroup));
        $this->assertTrue($this->policy->view($other, $publicGroup));
    }

    public function test_create(): void
    {
        $user = User::factory()->create();
        $this->assertTrue($this->policy->create($user));
    }

    public function test_update_and_delete_only_by_owner(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $group = TodoGroup::factory()->create(['user_id' => $owner->id]);

        $this->assertTrue($this->policy->update($owner, $group));
        $this->assertFalse($this->policy->update($other, $group));

        $this->assertTrue($this->policy->delete($owner, $group));
        $this->assertFalse($this->policy->delete($other, $group));
    }

    public function test_clone_allows_if_public_or_owner(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $admin = User::factory()->admin()->create();

        $privateGroup = TodoGroup::factory()->create(['user_id' => $owner->id, 'is_public' => false]);
        $publicGroup = TodoGroup::factory()->create(['user_id' => $owner->id, 'is_public' => true]);

        $this->assertTrue($this->policy->clone($owner, $privateGroup));
        $this->assertFalse($this->policy->clone($other, $privateGroup));
        $this->assertTrue($this->policy->clone($admin, $privateGroup));
        $this->assertTrue($this->policy->clone($other, $publicGroup));
    }
}
