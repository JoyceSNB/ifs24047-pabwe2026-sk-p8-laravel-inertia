<?php

namespace Tests\Unit\Ai;

use App\Features\Ai\DTO\GeneratedPostItem;
use App\Features\Ai\Services\OpenAiPostGeneratorService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class OpenAiPostGeneratorServiceTest extends TestCase
{
    private function fakeReply(string $content): void
    {
        Http::fake(['*' => Http::response(['choices' => [['message' => ['content' => $content]]]], 200)]);
    }

    private function validJson(): string
    {
        return json_encode(['posts' => [
            ['title' => 'Judul 1', 'category' => 'Teknologi', 'excerpt' => 'Ex 1', 'content' => 'Isi 1'],
            ['title' => 'Judul 2', 'category' => 'bisnis', 'excerpt' => 'Ex 2', 'content' => 'Isi 2'],
        ]]);
    }

    public function test_generate_posts_success_and_request_shape(): void
    {
        $this->fakeReply($this->validJson());
        $service = new OpenAiPostGeneratorService('https://api.test/v1/', 'sk-test', 'gpt-test');

        $items = $service->generatePosts('  Topik AI  ', 2);

        $this->assertCount(2, $items);
        $this->assertContainsOnlyInstancesOf(GeneratedPostItem::class, $items);
        $this->assertSame('Bisnis', $items[1]->category);

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://api.test/v1/chat/completions'
                && $request->hasHeader('Authorization', 'Bearer sk-test')
                && $request->data()['model'] === 'gpt-test'
                && $request->data()['messages'][1]['content'] === 'Topik AI';
        });
    }

    public function test_count_below_one_is_clamped(): void
    {
        $this->fakeReply($this->validJson());
        $service = new OpenAiPostGeneratorService('https://api.test/v1', 'k', 'm');

        $this->assertCount(2, $service->generatePosts('Topik', 0));

        Http::assertSent(fn (Request $r) => str_contains($r->data()['messages'][0]['content'], 'exactly 1 distinct'));
    }

    public function test_config_defaults_are_used(): void
    {
        config(['openai.endpoint' => 'https://cfg.test/v1/', 'openai.key' => 'cfgkey', 'openai.model' => 'cfg-model']);
        $this->fakeReply($this->validJson());

        (new OpenAiPostGeneratorService())->generatePosts('Topik');

        Http::assertSent(fn (Request $r) => $r->url() === 'https://cfg.test/v1/chat/completions'
            && $r->hasHeader('Authorization', 'Bearer cfgkey')
            && $r->data()['model'] === 'cfg-model');
    }

    public function test_swapped_endpoint_and_key_are_corrected(): void
    {
        $this->fakeReply($this->validJson());
        $service = new OpenAiPostGeneratorService('sk-abc', 'https://swap.test/v1', 'm');

        $service->generatePosts('Topik');

        Http::assertSent(fn (Request $r) => $r->url() === 'https://swap.test/v1/chat/completions'
            && $r->hasHeader('Authorization', 'Bearer sk-abc'));
    }

    public function test_scheme_is_added_when_missing(): void
    {
        $this->fakeReply($this->validJson());
        $service = new OpenAiPostGeneratorService('api.test/v1', 'k', 'm');

        $service->generatePosts('Topik');

        Http::assertSent(fn (Request $r) => $r->url() === 'https://api.test/v1/chat/completions');
    }

    public function test_empty_prompt_throws(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Prompt tidak boleh kosong.');

        (new OpenAiPostGeneratorService('https://api.test', 'k', 'm'))->generatePosts('   ');
    }

    public function test_api_error_with_message(): void
    {
        Http::fake(['*' => Http::response(['error' => ['message' => 'Kunci salah']], 401)]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI API Error: Kunci salah');

        (new OpenAiPostGeneratorService('https://api.test', 'k', 'm'))->generatePosts('Topik');
    }

    public function test_api_error_without_message(): void
    {
        Http::fake(['*' => Http::response('', 500)]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Request failed with status code 500');

        (new OpenAiPostGeneratorService('https://api.test', 'k', 'm'))->generatePosts('Topik');
    }

    public function test_parse_content_handles_fences_and_plain_list(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.test', 'k', 'm');

        $fenced = "```json\n".$this->validJson()."\n```";
        $this->assertCount(2, $service->parseContent($fenced));

        $bare = "```\n".json_encode([['title' => 'Satu']])."\n```";
        $items = $service->parseContent($bare);
        $this->assertSame('Satu', $items[0]->title);
        $this->assertSame('Umum', $items[0]->category);
        $this->assertNull($items[0]->excerpt);
        $this->assertSame('', $items[0]->content);
    }

    public function test_parse_content_normalizes_items(): void
    {
        $service = new OpenAiPostGeneratorService('https://api.test', 'k', 'm');

        $items = $service->parseContent(json_encode(['posts' => [
            'bukan-array',
            ['content' => 'tanpa judul'],
            ['title' => str_repeat('x', 300), 'excerpt' => '   ', 'category' => 'ngawur'],
        ]]));

        $this->assertCount(1, $items);
        $this->assertSame(255, mb_strlen($items[0]->title));
        $this->assertNull($items[0]->excerpt);
        $this->assertSame('Umum', $items[0]->category);
    }

    #[DataProvider('invalidPayloads')]
    public function test_parse_content_rejects_invalid_payload(string $raw, string $message): void
    {
        $service = new OpenAiPostGeneratorService('https://api.test', 'k', 'm');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage($message);

        $service->parseContent($raw);
    }

    /** @return array<string, array{string, string}> */
    public static function invalidPayloads(): array
    {
        return [
            'bukan json' => ['halo dunia', 'format respon yang tidak valid'],
            'skalar json' => ['"teks"', 'format respon yang tidak valid'],
            'posts kosong' => ['{"posts":[]}', 'Tidak ada artikel yang berhasil'],
            'objek kosong' => ['{}', 'Tidak ada artikel yang berhasil'],
            'semua item tanpa judul' => ['{"posts":[{"content":"x"},{"title":""}]}', 'tidak sesuai spesifikasi'],
        ];
    }
}