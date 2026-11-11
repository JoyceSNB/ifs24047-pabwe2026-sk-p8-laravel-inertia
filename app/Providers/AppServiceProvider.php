<?php

namespace App\Providers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\Services\OpenAiPostGeneratorService;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Models\Post;
use App\Features\Post\Policies\PostPolicy;
use App\Features\Post\Repositories\PostRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PostRepositoryInterface::class, PostRepository::class);
        $this->app->bind(AiClientInterface::class, OpenAiPostGeneratorService::class);
    }

    public function boot(): void
    {
        if (config('app.force_https', false) || $this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Gate::policy(Post::class, PostPolicy::class);

        RateLimiter::for('1000-per-second', function (Request $request) {
            return Limit::perSecond(1000)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('global', function (Request $request) {
            return Limit::perSecond(1000)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perSecond(1000)->by($request->user()?->id ?: $request->ip());
        });
    }
}