<?php

namespace Database\Factories;

use App\Features\Todo\Models\TodoGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TodoGroup>
 */
class TodoGroupFactory extends Factory
{
    protected $model = TodoGroup::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'is_public' => false,
        ];
    }

    /**
     * Mark the group as public template.
     */
    public function publicTemplate(): static
    {
        return $this->state(fn () => [
            'is_public' => true,
        ]);
    }
}

