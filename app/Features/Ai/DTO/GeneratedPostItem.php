<?php

namespace App\Features\Ai\DTO;

class GeneratedPostItem
{
    public function __construct(
        public string $title,
        public string $category = 'Umum',
        public ?string $excerpt = null,
        public string $content = '',
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
        ];
    }
}