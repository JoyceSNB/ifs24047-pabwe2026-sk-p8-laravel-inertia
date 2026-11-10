<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoutingTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_renders_public_templates_for_guest(): void
    {
        $this->get('/')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Template/Index')
                ->has('templates')
            );
    }

    public function test_root_renders_public_templates_for_member(): void
    {
        $member = User::factory()->member()->create();

        $this->actingAs($member)
            ->get('/')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Template/Index')
            );
    }

    public function test_health_check_endpoint(): void
    {
        $this->get('/up')
            ->assertStatus(200);
    }
}
