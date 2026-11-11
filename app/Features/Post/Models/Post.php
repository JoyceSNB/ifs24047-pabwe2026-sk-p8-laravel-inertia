<?php

namespace App\Features\Post\Models;

use App\Models\User;
use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'user_id', 'title', 'slug', 'category', 'excerpt',
    'content', 'cover_image_path', 'is_published', 'published_at',
])]
class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory;

    protected $table = 'posts';

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function coverImageUrl(): ?string
    {
        if ($this->cover_image_path && Storage::disk('public')->exists($this->cover_image_path)) {
            return Storage::disk('public')->url($this->cover_image_path);
        }

        return null;
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function newFactory(): PostFactory
    {
        return PostFactory::new();
    }
}