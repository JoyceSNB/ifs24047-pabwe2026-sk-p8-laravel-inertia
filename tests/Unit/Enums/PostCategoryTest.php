<?php

namespace Tests\Unit\Enums;

use App\Features\Post\Enums\PostCategory;
use Tests\TestCase;

class PostCategoryTest extends TestCase
{
    public function test_labels(): void
    {
        $this->assertSame('Teknologi & Koding', PostCategory::TEKNOLOGI->label());
        $this->assertSame('Pendidikan & Tutorial', PostCategory::PENDIDIKAN->label());
        $this->assertSame('Gaya Hidup & Produktivitas', PostCategory::GAYA_HIDUP->label());
        $this->assertSame('Bisnis & Karir', PostCategory::BISNIS->label());
        $this->assertSame('Opini & Pemikiran', PostCategory::OPINI->label());
        $this->assertSame('Umum', PostCategory::UMUM->label());
    }

    public function test_values_and_options(): void
    {
        $this->assertSame(
            ['Teknologi', 'Pendidikan', 'Gaya Hidup', 'Bisnis', 'Opini', 'Umum'],
            PostCategory::values()
        );

        $options = PostCategory::options();
        $this->assertCount(6, $options);
        $this->assertSame(['value' => 'Teknologi', 'label' => 'Teknologi & Koding'], $options[0]);
    }

    public function test_from_input(): void
    {
        $this->assertSame(PostCategory::GAYA_HIDUP, PostCategory::fromInput('  gaya HIDUP '));
        $this->assertSame(PostCategory::BISNIS, PostCategory::fromInput('Bisnis'));
        $this->assertSame(PostCategory::UMUM, PostCategory::fromInput('tidak dikenal'));
        $this->assertSame(PostCategory::UMUM, PostCategory::fromInput(null));
    }
}