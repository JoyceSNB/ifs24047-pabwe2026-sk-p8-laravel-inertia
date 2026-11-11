<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render_register_page(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Register')
            );
    }

    public function test_register_validation(): void
    {
        $response = $this->post('/register', [
            'name' => '',
            'username' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertSessionHasErrors(['name', 'username', 'email', 'password']);
        $this->assertGuest();
    }

    public function test_register_duplicate_email_and_username(): void
    {
        User::factory()->create([
            'username' => 'existing_user',
            'email' => 'duplicate@test.com',
        ]);

        $response = $this->post('/register', [
            'name' => 'John Doe',
            'username' => 'existing_user',
            'email' => 'duplicate@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasErrors(['username', 'email']);
        $this->assertGuest();
    }

    public function test_successful_registration(): void
    {
        $response = $this->post('/register', [
            'name' => 'New Member',
            'username' => 'new_member',
            'email' => 'newmember@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect(route('dashboard.posts.index'));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'username' => 'new_member',
            'email' => 'newmember@test.com',
            'role' => 'member',
        ]);
    }
}
