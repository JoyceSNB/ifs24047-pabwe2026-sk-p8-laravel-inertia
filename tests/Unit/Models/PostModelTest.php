<?php

namespace Tests\Unit\Models;

use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($post->user->is($user));
    }

    public function test_casts_and_factory_states(): void
    {
        $published = Post::factory()->published()->create();
        $draft = Post::factory()->draft()->create();

        $this->assertTrue($published->fresh()->is_published);
        $this->assertNotNull($published->fresh()->published_at);
        $this->assertFalse($draft->fresh()->is_published);
        $this->assertNull($draft->fresh()->published_at);
    }

    public function test_cover_image_url(): void
    {
        Storage::fake('public');

        $this->assertNull(Post::factory()->create(['cover_image_path' => null])->coverImageUrl());
        $this->assertNull(Post::factory()->create(['cover_image_path' => 'post-covers/hilang.jpg'])->coverImageUrl());

        Storage::disk('public')->put('post-covers/ada.jpg', 'x');
        $post = Post::factory()->create(['cover_image_path' => 'post-covers/ada.jpg']);

        $this->assertStringContainsString('post-covers/ada.jpg', $post->coverImageUrl());
    }
}