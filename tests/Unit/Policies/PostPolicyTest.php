<?php

namespace Tests\Unit\Policies;

use App\Features\Post\Models\Post;
use App\Features\Post\Policies\PostPolicy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_policy_rules(): void
    {
        $policy = new PostPolicy();
        $owner = User::factory()->member()->create();
        $other = User::factory()->member()->create();
        $admin = User::factory()->admin()->create();
        $post = Post::factory()->create(['user_id' => $owner->id]);

        $this->assertTrue($policy->viewAny($owner));
        $this->assertTrue($policy->create($owner));

        $this->assertTrue($policy->view($owner, $post));
        $this->assertTrue($policy->view($admin, $post));
        $this->assertFalse($policy->view($other, $post));

        $this->assertTrue($policy->update($owner, $post));
        $this->assertFalse($policy->update($admin, $post));
        $this->assertFalse($policy->update($other, $post));

        $this->assertTrue($policy->delete($owner, $post));
        $this->assertFalse($policy->delete($admin, $post));
        $this->assertFalse($policy->delete($other, $post));
    }
}