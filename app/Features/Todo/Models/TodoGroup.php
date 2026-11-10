<?php

namespace App\Features\Todo\Models;

use App\Models\User;
use Database\Factories\TodoGroupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'title', 'description', 'is_public', 'name'])]
class TodoGroup extends Model
{
    /** @use HasFactory<TodoGroupFactory> */
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'todo_groups';

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['name'];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    /**
     * Accessor for name attribute (alias of title).
     */
    public function getNameAttribute(): string
    {
        return $this->attributes['title'] ?? '';
    }

    /**
     * Mutator for name attribute (alias of title).
     */
    public function setNameAttribute(mixed $value): void
    {
        $this->attributes['title'] = (string) $value;
    }

    /**
     * Get the user that owns the todo group.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all todos in this group.
     *
     * @return HasMany<Todo, $this>
     */
    public function todos(): HasMany
    {
        return $this->hasMany(Todo::class, 'todo_group_id');
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): TodoGroupFactory
    {
        return TodoGroupFactory::new();
    }
}
