<?php

namespace App\Features\Post\Services;

use App\Features\Post\Enums\PostCategory;
use App\Features\Post\Models\Post;
use Illuminate\Database\Eloquent\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PostExcelService
{
    public function __construct(
        protected PostService $postService
    ) {}

    /**
     * Kolom: No, Title, Category, Excerpt, Content, Status, Published At, Author, Created At.
     * Semua teks ditulis sebagai string eksplisit supaya isi berawalan "=" tidak dianggap rumus.
     *
     * @param Collection<int, Post> $posts
     */
    public function buildSpreadsheet(Collection $posts, string $sheetTitle = 'Posts'): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr($sheetTitle, 0, 31));

        $headers = ['No', 'Title', 'Category', 'Excerpt', 'Content', 'Status', 'Published At', 'Author', 'Created At'];
        $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        foreach ($headers as $index => $header) {
            $this->setText($sheet, "{$columns[$index]}1", $header);
        }

        $headerRange = 'A1:I1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $rowNumber = 2;
        foreach ($posts as $idx => $post) {
            $sheet->setCellValue("A{$rowNumber}", $idx + 1);
            $this->setText($sheet, "B{$rowNumber}", $post->title);
            $this->setText($sheet, "C{$rowNumber}", $post->category);
            $this->setText($sheet, "D{$rowNumber}", $post->excerpt ?? '-');
            $this->setText($sheet, "E{$rowNumber}", $post->content ?? '');
            $this->setText($sheet, "F{$rowNumber}", $post->is_published ? 'Published' : 'Draft');
            $this->setText($sheet, "G{$rowNumber}", $post->published_at ? $post->published_at->format('Y-m-d H:i') : '-');
            $this->setText($sheet, "H{$rowNumber}", $post->relationLoaded('user') && $post->user ? $post->user->name : '-');
            $this->setText($sheet, "I{$rowNumber}", $post->created_at ? $post->created_at->format('Y-m-d H:i') : '-');
            $rowNumber++;
        }

        $lastRow = max(2, $rowNumber - 1);
        $sheet->getStyle("A1:I{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        foreach ($columns as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Konten artikel bisa sangat panjang: batasi lebar kolom.
        $sheet->getColumnDimension('E')->setAutoSize(false)->setWidth(60);
        $sheet->getColumnDimension('D')->setAutoSize(false)->setWidth(40);

        return $spreadsheet;
    }

    /** @param Collection<int, Post> $posts */
    public function exportToResponse(Collection $posts, string $filename = 'posts.xlsx'): StreamedResponse
    {
        $spreadsheet = $this->buildSpreadsheet($posts);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Setiap baris yang valid menjadi artikel milik $userId.
     *
     * @return array{imported: int, errors: array<int, string>}
     */
    public function import(string $filePath, int $userId): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);

        $imported = 0;
        $errors = [];
        $isFirst = true;

        foreach ($rows as $row) {
            if ($isFirst) {
                $isFirst = false;
                continue;
            }

            $title = trim((string) ($row['B'] ?? ''));
            if ($title === '') {
                $title = trim((string) ($row['A'] ?? ''));
            }

            if ($title === '' || in_array(strtolower($title), ['no', 'title'], true)) {
                continue;
            }

            $excerpt = trim((string) ($row['D'] ?? ''));
            $content = trim((string) ($row['E'] ?? ''));
            $statusRaw = strtolower(trim((string) ($row['F'] ?? '')));
            $published = in_array($statusRaw, ['published', 'publish', 'terbit', 'dipublikasikan'], true);

            $this->postService->createPost($userId, [
                'title' => mb_substr($title, 0, 255),
                'category' => PostCategory::fromInput((string) ($row['C'] ?? ''))->value,
                'excerpt' => $excerpt === '' || $excerpt === '-' ? null : $excerpt,
                'content' => $content,
                'is_published' => $published,
            ]);

            $imported++;
        }

        return [
            'imported' => $imported,
            'errors' => $errors,
        ];
    }

    protected function setText(Worksheet $sheet, string $cell, string $value): void
    {
        $sheet->setCellValueExplicit($cell, $value, DataType::TYPE_STRING);
    }
}