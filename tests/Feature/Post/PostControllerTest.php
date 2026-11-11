<?php

namespace Tests\Feature\Post;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\DTO\GeneratedPostItem;
use App\Features\Post\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    private function member(): User
    {
        return User::factory()->member()->create();
    }

    private function bindFakeAi(?\Throwable $error = null): object
    {
        $fake = new class($error) implements AiClientInterface {
            public ?string $prompt = null;
            public ?int $count = null;

            public function __construct(private ?\Throwable $error) {}

            public function generatePosts(string $prompt, int $count = 3): array
            {
                $this->prompt = $prompt;
                $this->count = $count;

                if ($this->error) {
                    throw $this->error;
                }

                return [new GeneratedPostItem('Judul AI', 'Teknologi', 'Ringkasan', 'Isi **AI**')];
            }
        };
        $this->app->instance(AiClientInterface::class, $fake);

        return $fake;
    }

    private function validPayload(array $override = []): array
    {
        return array_merge([
            'title' => 'Judul Baru', 'category' => 'Teknologi', 'excerpt' => 'Ringkas', 'content' => '# Isi',
        ], $override);
    }

    // ---------- index ----------

    public function test_guest_cannot_access_dashboard(): void
    {
        $this->get('/dashboard/posts')->assertRedirect('/login');
    }

    public function test_index_lists_only_own_posts_with_stats(): void
    {
        $user = $this->member();
        Post::factory()->published()->create(['user_id' => $user->id]);
        Post::factory()->draft()->count(2)->create(['user_id' => $user->id]);
        Post::factory()->published()->create();

        $this->actingAs($user)->get('/dashboard/posts')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Post/Index')
                ->has('posts.data', 3)
                ->has('categories', 6)
                ->where('stats.total', 3)
                ->where('stats.published', 1)
                ->where('stats.draft', 2)
            );
    }

    public function test_index_applies_filters(): void
    {
        $user = $this->member();
        Post::factory()->published()->create(['user_id' => $user->id, 'title' => 'Kopi Pagi', 'category' => 'Bisnis']);
        Post::factory()->draft()->create(['user_id' => $user->id, 'title' => 'Teh Sore', 'category' => 'Opini']);

        $this->actingAs($user)->get('/dashboard/posts?status=draft&search=teh&category=Opini')
            ->assertInertia(fn (Assert $page) => $page
                ->has('posts.data', 1)
                ->where('posts.data.0.title', 'Teh Sore')
                ->where('filters.status', 'draft')
                ->where('filters.search', 'teh')
                ->where('filters.category', 'Opini')
            );
    }

    // ---------- store / show / update / destroy ----------

    public function test_store_validation(): void
    {
        $this->actingAs($this->member())
            ->post('/dashboard/posts', ['title' => '', 'category' => 'Ngawur', 'content' => ''])
            ->assertSessionHasErrors(['title', 'category', 'content']);
    }

    public function test_store_creates_draft_and_published_posts(): void
    {
        $user = $this->member();

        $this->actingAs($user)->post('/dashboard/posts', $this->validPayload())
            ->assertRedirect()
            ->assertSessionHas('success');

        $draft = Post::where('title', 'Judul Baru')->first();
        $this->assertSame($user->id, $draft->user_id);
        $this->assertSame('judul-baru', $draft->slug);
        $this->assertFalse($draft->is_published);

        $this->actingAs($user)->post('/dashboard/posts', $this->validPayload(['title' => 'Terbit', 'is_published' => true]));
        $this->assertTrue(Post::where('title', 'Terbit')->first()->is_published);
    }

    public function test_show_owner_other_member_and_admin(): void
    {
        $owner = $this->member();
        $post = Post::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->get("/dashboard/posts/{$post->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Post/Show')
                ->where('post.id', $post->id)
                ->has('categories')
            );

        $this->actingAs($this->member())->get("/dashboard/posts/{$post->id}")->assertForbidden();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get("/dashboard/posts/{$post->id}")->assertOk();
    }

    public function test_show_handles_null_dates(): void
    {
        $owner = $this->member();
        $post = Post::factory()->draft()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->get("/dashboard/posts/{$post->id}")
            ->assertInertia(fn (Assert $page) => $page->where('post.published_at', null));
    }

    public function test_update_validation_and_success(): void
    {
        $owner = $this->member();
        $post = Post::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->put("/dashboard/posts/{$post->id}", ['title' => ''])
            ->assertSessionHasErrors(['title', 'category', 'content']);

        $this->actingAs($owner)->put("/dashboard/posts/{$post->id}", $this->validPayload(['title' => 'Diubah']))
            ->assertSessionHas('success');

        $this->assertSame('Diubah', $post->fresh()->title);
    }

    public function test_update_forbidden_for_other_member_and_admin(): void
    {
        $post = Post::factory()->create();

        $this->actingAs($this->member())->put("/dashboard/posts/{$post->id}", $this->validPayload())->assertForbidden();
        $this->actingAs(User::factory()->admin()->create())
            ->put("/dashboard/posts/{$post->id}", $this->validPayload())->assertForbidden();
    }

    public function test_destroy_removes_post_and_cover(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('post-covers/z.jpg', 'x');

        $owner = $this->member();
        $post = Post::factory()->create(['user_id' => $owner->id, 'cover_image_path' => 'post-covers/z.jpg']);

        $this->actingAs($owner)->delete("/dashboard/posts/{$post->id}")
            ->assertRedirect(route('dashboard.posts.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
        Storage::disk('public')->assertMissing('post-covers/z.jpg');
    }

    public function test_toggle_publish(): void
    {
        $owner = $this->member();
        $post = Post::factory()->draft()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->patch("/dashboard/posts/{$post->id}/publish")->assertSessionHas('success');
        $this->assertTrue($post->fresh()->is_published);

        $this->actingAs($owner)->patch("/dashboard/posts/{$post->id}/publish");
        $this->assertFalse($post->fresh()->is_published);
    }

    // ---------- cover ----------

    public function test_cover_upload_validation_and_delete(): void
    {
        Storage::fake('public');
        $owner = $this->member();
        $post = Post::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->post("/dashboard/posts/{$post->id}/cover", ['coverPhoto' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf')])
            ->assertSessionHasErrors('coverPhoto');

        $this->actingAs($owner)
            ->post("/dashboard/posts/{$post->id}/cover", ['coverPhoto' => UploadedFile::fake()->image('cover.jpg')])
            ->assertSessionHas('success');

        $path = $post->fresh()->cover_image_path;
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);

        $this->actingAs($owner)->delete("/dashboard/posts/{$post->id}/cover")->assertSessionHas('success');

        $this->assertNull($post->fresh()->cover_image_path);
        Storage::disk('public')->assertMissing($path);
    }

    // ---------- excel ----------

    public function test_export_only_own_posts(): void
    {
        $owner = $this->member();
        Post::factory()->count(2)->create(['user_id' => $owner->id]);
        Post::factory()->create();

        $response = $this->actingAs($owner)->get('/dashboard/posts/export');

        $this->assertInstanceOf(StreamedResponse::class, $response->baseResponse);
        $this->assertStringStartsWith('PK', $response->streamedContent());
    }

    public function test_import_validation_and_success(): void
    {
        $owner = $this->member();

        $this->actingAs($owner)->post('/dashboard/posts/import', [])->assertSessionHasErrors('importFile');
        $this->actingAs($owner)
            ->post('/dashboard/posts/import', ['importFile' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])
            ->assertSessionHasErrors('importFile');

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getActiveSheet()->fromArray([
            ['No', 'Title', 'Category', 'Excerpt', 'Content', 'Status'],
            [1, 'Impor Satu', 'Bisnis', 'Ex', 'Isi', 'Published'],
            [2, 'Impor Dua', 'Opini', '-', 'Isi', 'Draft'],
        ], null, 'A1');
        $path = tempnam(sys_get_temp_dir(), 'xl').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'impor.xlsx', null, null, true);
            $this->actingAs($owner)->post('/dashboard/posts/import', ['importFile' => $file])
                ->assertSessionHas('success', 'Berhasil mengimpor 2 artikel.');
        } finally {
            @unlink($path);
        }

        $this->assertSame(2, Post::where('user_id', $owner->id)->count());
    }

    // ---------- AI ----------

    public function test_ai_generate_json_success(): void
    {
        $fake = $this->bindFakeAi();

        $this->actingAs($this->member())
            ->postJson('/dashboard/posts/ai-generate', ['prompt' => 'Topik AI', 'count' => 2])
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('posts.0.title', 'Judul AI')
            ->assertJsonPath('items.0.category', 'Teknologi');

        $this->assertSame('Topik AI', $fake->prompt);
        $this->assertSame(2, $fake->count);
    }

    public function test_ai_generate_accepts_alias_fields_and_default_count(): void
    {
        $fake = $this->bindFakeAi();

        $this->actingAs($this->member())
            ->postJson('/dashboard/posts/ai-generate', ['aiPrompt' => 'Topik Alias'])
            ->assertOk();

        $this->assertSame('Topik Alias', $fake->prompt);
        $this->assertSame(3, $fake->count);

        $this->actingAs($this->member())
            ->postJson('/dashboard/posts/ai-generate', ['prompt' => 'Topik', 'aiCount' => 4]);
        $this->assertSame(4, $fake->count);
    }

    public function test_ai_generate_non_json_flashes_items(): void
    {
        $this->bindFakeAi();

        $this->actingAs($this->member())
            ->post('/dashboard/posts/ai-generate', ['prompt' => 'Topik AI', 'count' => 1])
            ->assertSessionHas('aiGeneratedItems');
    }

    public function test_ai_generate_validation(): void
    {
        $this->bindFakeAi();
        $member = $this->member();

        $this->actingAs($member)->postJson('/dashboard/posts/ai-generate', [])->assertStatus(422);
        $this->actingAs($member)
            ->postJson('/dashboard/posts/ai-generate', ['prompt' => 'Topik', 'count' => 11])
            ->assertStatus(422)->assertJsonValidationErrors('count');
    }

    public function test_ai_generate_failure_json_and_non_json(): void
    {
        $this->bindFakeAi(new RuntimeException('Koneksi putus'));
        $member = $this->member();

        $this->actingAs($member)->postJson('/dashboard/posts/ai-generate', ['prompt' => 'Topik'])
            ->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonPath('message', 'Gagal menghasilkan artikel dengan AI: Koneksi putus');

        $this->actingAs($member)->post('/dashboard/posts/ai-generate', ['prompt' => 'Topik'])
            ->assertSessionHas('error', 'Gagal menghasilkan artikel dengan AI: Koneksi putus');
    }

    public function test_ai_save_creates_drafts_and_skips_blank_titles(): void
    {
        $user = $this->member();

        $this->actingAs($user)->post('/dashboard/posts/ai-save', ['items' => [
            ['title' => 'AI Satu', 'category' => 'Bisnis', 'excerpt' => 'Ex', 'content' => 'Isi'],
            ['title' => 'AI Dua'],
            ['title' => '', 'content' => 'tanpa judul'],
            ['title' => str_repeat('x', 300), 'category' => 'ngawur'],
        ]])->assertSessionHas('success', 'Berhasil menyimpan 3 artikel draf yang digenerate oleh AI.');

        $this->assertSame(3, Post::where('user_id', $user->id)->count());

        $satu = Post::where('title', 'AI Satu')->first();
        $this->assertFalse($satu->is_published);
        $this->assertSame('Bisnis', $satu->category);

        $dua = Post::where('title', 'AI Dua')->first();
        $this->assertSame('Umum', $dua->category);
        $this->assertSame('', $dua->content);

        $this->assertSame(255, mb_strlen(Post::where('title', 'like', 'xxx%')->first()->title));
    }

    public function test_ai_save_accepts_posts_alias_and_validates(): void
    {
        $user = $this->member();

        $this->actingAs($user)->post('/dashboard/posts/ai-save', ['posts' => [['title' => 'Via Posts']]])
            ->assertSessionHas('success');
        $this->assertDatabaseHas('posts', ['title' => 'Via Posts', 'user_id' => $user->id]);

        $this->actingAs($user)->post('/dashboard/posts/ai-save', [])->assertSessionHasErrors();
    }
}