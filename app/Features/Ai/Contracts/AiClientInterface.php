<?php

namespace App\Features\Ai\Contracts;

use App\Features\Ai\DTO\GeneratedPostItem;

interface AiClientInterface
{
    /** @return array<int, GeneratedPostItem> */
    public function generatePosts(string $prompt, int $count = 3): array;
}