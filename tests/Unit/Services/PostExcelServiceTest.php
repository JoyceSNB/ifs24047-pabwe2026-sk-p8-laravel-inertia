<?php

namespace Tests\Unit\Services;

use App\Features\Post\Models\Post;
use App\Features\Post\Services\PostExcelService;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class PostExcelServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PostExcelService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PostExcelService::class);
    }

    private function makeXlsx(array $rows): string
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getActiveSheet()->fromArray($rows, null, 'A1');

        $path = tempnam(sys_get_temp_dir(), 'xl').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return $path;
    }

    public function test_build_spreadsheet_contents(): void
    {
        $author = User::factory()->create(['name' => 'Penulis Satu']);
        Post::factory()->published()->create([
            'user_id' => $author->id, 'title' => 'Artikel A', 'category' => 'Bisnis',
            'excerpt' => 'Ringkas', 'content' => '=1+1',
        ]);
        Post::factory()->draft()->create(['user_id' => $author->id, 'title' => 'Artikel B', 'excerpt' => null]);

        $posts = Post::with('user')->orderBy('id')->get();
        $sheet = $this->service->buildSpreadsheet($posts, str_repeat('X', 40))->getActiveSheet();

        $this->assertSame(31, strlen($sheet->getTitle()));
        $this->assertSame('Title', $sheet->getCell('B1')->getValue());
        $this->assertSame('Artikel A', $sheet->getCell('B2')->getValue());
        $this->assertSame('Bisnis', $sheet->getCell('C2')->getValue());
        $this->assertSame('=1+1', $sheet->getCell('E2')->getValue());
        $this->assertSame(DataType::TYPE_STRING, $sheet->getCell('E2')->getDataType());
        $this->assertSame('Published', $sheet->getCell('F2')->getValue());
        $this->assertSame('Penulis Satu', $sheet->getCell('H2')->getValue());
        $this->assertSame('-', $sheet->getCell('D3')->getValue());
        $this->assertSame('Draft', $sheet->getCell('F3')->getValue());
        $this->assertSame('-', $sheet->getCell('G3')->getValue());
    }

    public function test_author_is_dash_when_relation_not_loaded(): void
    {
        Post::factory()->create();

        $sheet = $this->service->buildSpreadsheet(Post::all())->getActiveSheet();

        $this->assertSame('-', $sheet->getCell('H2')->getValue());
    }

    public function test_build_spreadsheet_with_empty_collection(): void
    {
        $sheet = $this->service->buildSpreadsheet(new Collection())->getActiveSheet();

        $this->assertSame('No', $sheet->getCell('A1')->getValue());
        $this->assertNull($sheet->getCell('A2')->getValue());
    }

    public function test_export_to_response(): void
    {
        Post::factory()->count(2)->create();

        $response = $this->service->exportToResponse(Post::all(), 'x.xlsx');

        $this->assertInstanceOf(StreamedResponse::class, $response);
        $this->assertStringContainsString('x.xlsx', $response->headers->get('Content-Disposition'));

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringStartsWith('PK', $content);
    }

    public function test_import_creates_posts_for_user(): void
    {
        $user = User::factory()->create();

        $path = $this->makeXlsx([
            ['No', 'Title', 'Category', 'Excerpt', 'Content', 'Status'],
            [1, 'Artikel Satu', 'Teknologi', 'Ringkas', 'Isi satu', 'Published'],
            [2, 'Artikel Dua', 'kategori-ngawur', '-', 'Isi dua', 'draft'],
            ['Judul dari kolom A', null, null, null, null, 'terbit'],
            ['No', null],
            [3, 'Title'],
            [null, null, 'Teknologi'],
        ]);

        try {
            $result = $this->service->import($path, $user->id);
        } finally {
            @unlink($path);
        }

        $this->assertSame(3, $result['imported']);
        $this->assertSame([], $result['errors']);
        $this->assertSame(3, Post::where('user_id', $user->id)->count());

        $satu = Post::where('title', 'Artikel Satu')->first();
        $this->assertTrue($satu->is_published);
        $this->assertSame('Teknologi', $satu->category);
        $this->assertSame('Ringkas', $satu->excerpt);

        $dua = Post::where('title', 'Artikel Dua')->first();
        $this->assertFalse($dua->is_published);
        $this->assertSame('Umum', $dua->category);
        $this->assertNull($dua->excerpt);

        $this->assertTrue(Post::where('title', 'Judul dari kolom A')->first()->is_published);
    }

    public function test_export_then_import_roundtrip(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(2)->published()->create();

        $spreadsheet = $this->service->buildSpreadsheet(Post::with('user')->get());
        $path = tempnam(sys_get_temp_dir(), 'xl').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        try {
            $result = $this->service->import($path, $user->id);
        } finally {
            @unlink($path);
        }

        $this->assertSame(2, $result['imported']);
        $this->assertSame(2, Post::where('user_id', $user->id)->count());
    }
}