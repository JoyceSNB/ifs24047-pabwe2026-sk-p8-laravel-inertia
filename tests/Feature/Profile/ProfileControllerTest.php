<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_guest_cannot_access_profile(): void
    {
        $this->get('/profile')->assertRedirect(route('login'));
    }

    public function test_profile_renders_with_user_data(): void
    {
        $user = User::factory()->create([
            'name' => 'Budi Setiawan',
            'username' => 'budiset',
            'email' => 'budi@test.com',
        ]);

        $this->actingAs($user)
            ->get('/profile')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('user.name', 'Budi Setiawan')
                ->where('user.username', 'budiset')
                ->where('user.email', 'budi@test.com')
            );
    }

    public function test_update_profile_validation(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create([
            'username' => 'taken_username',
            'email' => 'taken@test.com',
        ]);

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => '',
                'username' => 'taken_username',
                'email' => 'taken@test.com',
            ])
            ->assertSessionHasErrors(['name', 'username', 'email']);
    }

    public function test_update_profile_success(): void
    {
        $user = User::factory()->create([
            'name' => 'Nama Lama',
            'username' => 'lama123',
            'email' => 'lama@test.com',
        ]);

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Nama Baru',
                'username' => 'baru123',
                'email' => 'baru@test.com',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $user->refresh();
        $this->assertEquals('Nama Baru', $user->name);
        $this->assertEquals('baru123', $user->username);
        $this->assertEquals('baru@test.com', $user->email);
    }

    public function test_update_password_validation_and_wrong_current(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        // Wrong current password
        $this->actingAs($user)
            ->put('/profile/password', [
                'current_password' => 'incorrect-pwd',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertSessionHasErrors(['current_password']);

        // Password confirmation mismatch
        $this->actingAs($user)
            ->put('/profile/password', [
                'current_password' => 'old-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'mismatch-123',
            ])
            ->assertSessionHasErrors(['password']);
    }

    public function test_update_password_success(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)
            ->put('/profile/password', [
                'current_password' => 'old-password',
                'password' => 'new-strong-password',
                'password_confirmation' => 'new-strong-password',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertTrue(Hash::check('new-strong-password', $user->fresh()->password));
    }

    public function test_update_and_delete_profile_photo(): void
    {
        $user = User::factory()->create();

        // 1. Upload via file
        $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);
        $this->actingAs($user)
            ->post('/profile/photo', ['photo' => $file])
            ->assertSessionHas('success');

        $user->refresh();
        $this->assertNotNull($user->profile_photo_path);
        Storage::disk('public')->assertExists($user->profile_photo_path);

        // 2. Upload via base64 data URI
        $img = imagecreatetruecolor(100, 100);
        ob_start();
        imagepng($img);
        $base64 = 'data:image/png;base64,'.base64_encode(ob_get_clean());
        imagedestroy($img);

        $this->actingAs($user)
            ->post('/profile/photo', ['photo' => $base64])
            ->assertSessionHas('success');

        $user->refresh();
        Storage::disk('public')->assertExists($user->profile_photo_path);

        // 3. Delete photo
        $this->actingAs($user)
            ->delete('/profile/photo')
            ->assertSessionHas('success');

        $user->refresh();
        $this->assertNull($user->profile_photo_path);
    }
}

