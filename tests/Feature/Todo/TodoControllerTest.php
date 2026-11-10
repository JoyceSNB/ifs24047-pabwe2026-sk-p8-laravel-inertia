<?php

namespace Tests\Feature\Todo;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\DTO\GeneratedTodoItem;
use App\Features\Todo\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class TodoControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_guest_cannot_access_todos(): void
    {
        $this->get('/todos')->assertRedirect(route('login'));
    }

    public function test_member_can_view_own_todos(): void
    {
        $user = User::factory()->member()->create();
        Todo::factory()->create(['user_id' => $user->id, 'title' => 'Tugas Spesifik Member']);

        $otherUser = User::factory()->member()->create();
        Todo::factory()->create(['user_id' => $otherUser->id, 'title' => 'Tugas Rahasia Orang Lain']);

        $response = $this->actingAs($user)->get('/todos');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Todo/Index')
                ->has('todos.data', 1)
                ->where('todos.data.0.title', 'Tugas Spesifik Member')
            );
    }

    public function test_todo_search_and_filter(): void
    {
        $user = User::factory()->member()->create();
        Todo::factory()->create(['user_id' => $user->id, 'title' => 'Makan Pagi', 'status' => 'pending']);
        Todo::factory()->create(['user_id' => $user->id, 'title' => 'Olahraga Malam', 'status' => 'completed']);

        $this->actingAs($user)
            ->get('/todos?search=Makan')
            ->assertInertia(fn (Assert $page) => $page
                ->has('todos.data', 1)
                ->where('todos.data.0.title', 'Makan Pagi')
            );

        $this->actingAs($user)
            ->get('/todos?status=completed')
            ->assertInertia(fn (Assert $page) => $page
                ->has('todos.data', 1)
                ->where('todos.data.0.title', 'Olahraga Malam')
            );
    }

    public function test_create_todo_validation_and_success(): void
    {
        $user = User::factory()->member()->create();

        // Validation error
        $this->actingAs($user)
            ->post('/todos', [
                'title' => '',
                'status' => 'invalid_status',
            ])
            ->assertSessionHasErrors(['title', 'status']);

        // Success
        $this->actingAs($user)
            ->post('/todos', [
                'title' => 'Todo Baru',
                'description' => 'Deskripsi todo',
                'status' => 'pending',
                'due_date' => '2026-11-20',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'Todo Baru',
            'description' => 'Deskripsi todo',
        ]);
    }

    public function test_show_todo(): void
    {
        $user = User::factory()->member()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id, 'title' => 'Detail Todo']);

        $this->actingAs($user)
            ->get("/todos/{$todo->id}")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Todo/Show')
                ->where('todo.title', 'Detail Todo')
            );
    }

    public function test_update_todo_success(): void
    {
        $user = User::factory()->member()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id, 'title' => 'Judul Lama']);

        $this->actingAs($user)
            ->put("/todos/{$todo->id}", [
                'title' => 'Judul Baru',
                'description' => 'Deskripsi baru',
                'status' => 'completed',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('todos', [
            'id' => $todo->id,
            'title' => 'Judul Baru',
            'status' => 'completed',
        ]);
    }

    public function test_toggle_complete(): void
    {
        $user = User::factory()->member()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id, 'status' => 'pending']);

        $this->actingAs($user)
            ->patch("/todos/{$todo->id}/toggle")
            ->assertSessionHas('success');

        $this->assertEquals('completed', $todo->fresh()->status);
    }

    public function test_update_and_delete_cover_photo(): void
    {
        $user = User::factory()->member()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('cover.jpg', 600, 400);

        $this->actingAs($user)
            ->post("/todos/{$todo->id}/cover", ['coverPhoto' => $file])
            ->assertSessionHas('success');

        $todo->refresh();
        $this->assertNotNull($todo->cover_image_path);
        Storage::disk('public')->assertExists($todo->cover_image_path);

        // Delete cover
        $this->actingAs($user)
            ->delete("/todos/{$todo->id}/cover")
            ->assertSessionHas('success');

        $todo->refresh();
        $this->assertNull($todo->cover_image_path);
    }

    public function test_delete_todo(): void
    {
        $user = User::factory()->member()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->delete("/todos/{$todo->id}")
            ->assertRedirect(route('todos.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('todos', ['id' => $todo->id]);
    }

    public function test_export_excel(): void
    {
        $user = User::factory()->member()->create();
        Todo::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get('/todos/export');

        $this->assertInstanceOf(StreamedResponse::class, $response->baseResponse);
        $this->assertStringContainsString('spreadsheetml', (string) $response->headers->get('content-type'));
    }

    public function test_import_excel(): void
    {
        $user = User::factory()->member()->create();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['No', 'Title', 'Description', 'Status', 'Due Date'],
            [1, 'Tugas Impor 1', 'Deskripsi impor', 'pending', '2026-11-25'],
            [2, 'Tugas Impor 2', null, 'completed', null],
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_excel_').'.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        $uploaded = new UploadedFile($tempFile, 'import.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $this->actingAs($user)
            ->post('/todos/import', ['importFile' => $uploaded])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'Tugas Impor 1',
        ]);
        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'Tugas Impor 2',
        ]);

        if (file_exists($tempFile)) {
            @unlink($tempFile);
        }
    }

    public function test_generate_ai(): void
    {
        $user = User::factory()->member()->create();

        $mockItem = new GeneratedTodoItem('Todo dari AI', 'Deskripsi AI', 'pending', '2026-11-30');
        $stubAi = $this->createStub(AiClientInterface::class);
        $stubAi->method('generateTodos')->willReturn([$mockItem]);

        $this->app->instance(AiClientInterface::class, $stubAi);

        // Wants JSON
        $this->actingAs($user)
            ->postJson('/todos/ai-generate', [
                'aiPrompt' => 'Rancang rencana peluncuran web',
                'aiCount' => 1,
            ])
            ->assertStatus(200)
            ->assertJson([
                'items' => [
                    ['title' => 'Todo dari AI'],
                ],
            ]);

        // Standard inertia post
        $this->actingAs($user)
            ->post('/todos/ai-generate', [
                'aiPrompt' => 'Rancang rencana peluncuran web',
                'aiCount' => 1,
            ])
            ->assertSessionHas('aiGeneratedItems');
    }

    public function test_save_ai(): void
    {
        $user = User::factory()->member()->create();

        $this->actingAs($user)
            ->post('/todos/ai-save', [
                'items' => [
                    ['title' => 'AI Item 1', 'description' => 'Desc 1', 'due_date' => '2026-12-01'],
                    ['title' => 'AI Item 2', 'description' => null, 'due_date' => null],
                ],
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'AI Item 1',
        ]);
        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'AI Item 2',
        ]);
    }

    public function test_cannot_access_other_user_todo(): void
    {
        $user = User::factory()->member()->create();
        $otherUser = User::factory()->member()->create();
        $otherTodo = Todo::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($user);

        $this->get("/todos/{$otherTodo->id}")->assertStatus(403);
        $this->put("/todos/{$otherTodo->id}", ['title' => 'Hacked', 'status' => 'pending'])->assertStatus(403);
        $this->patch("/todos/{$otherTodo->id}/toggle")->assertStatus(403);
        $this->delete("/todos/{$otherTodo->id}")->assertStatus(403);
        $this->post("/todos/{$otherTodo->id}/cover", ['coverPhoto' => UploadedFile::fake()->image('c.jpg')])->assertStatus(403);
        $this->delete("/todos/{$otherTodo->id}/cover")->assertStatus(403);
    }
}
