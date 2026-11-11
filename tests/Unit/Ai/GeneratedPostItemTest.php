<?php

namespace Tests\Unit\Ai;

use App\Features\Ai\DTO\GeneratedPostItem;
use Tests\TestCase;

class GeneratedPostItemTest extends TestCase
{
    public function test_defaults_and_to_array(): void
    {
        $item = new GeneratedPostItem('Judul');

        $this->assertSame(
            ['title' => 'Judul', 'category' => 'Umum', 'excerpt' => null, 'content' => ''],
            $item->toArray()
        );
    }

    public function test_full_values(): void
    {
        $item = new GeneratedPostItem('J', 'Bisnis', 'Ex', 'Isi');

        $this->assertSame(['title' => 'J', 'category' => 'Bisnis', 'excerpt' => 'Ex', 'content' => 'Isi'], $item->toArray());
    }
}