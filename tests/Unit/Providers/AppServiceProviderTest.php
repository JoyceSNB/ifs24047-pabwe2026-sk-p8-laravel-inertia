<?php

namespace Tests\Unit\Providers;

use App\Features\Ai\Contracts\AiClientInterface;
use App\Features\Ai\Services\OpenAiPostGeneratorService;
use App\Features\Post\Contracts\PostRepositoryInterface;
use App\Features\Post\Repositories\PostRepository;
use App\Providers\AppServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    public function test_service_bindings(): void
    {
        $this->assertInstanceOf(PostRepository::class, app(PostRepositoryInterface::class));
        $this->assertInstanceOf(OpenAiPostGeneratorService::class, app(AiClientInterface::class));
    }

    public function test_force_https_configuration(): void
    {
        config(['app.force_https' => true]);

        $provider = new AppServiceProvider($this->app);
        $provider->boot();

        $generated = URL::to('/test');
        $this->assertStringStartsWith('https://', $generated);

        // Reset
        config(['app.force_https' => false]);
    }

    public function test_rate_limiters(): void
    {
        $request = Request::create('/test', 'GET');

        $limiter1000 = RateLimiter::limiter('1000-per-second');
        $this->assertNotNull($limiter1000);
        $result = $limiter1000($request);
        $this->assertEquals(1000, $result->maxAttempts);

        $limiterGlobal = RateLimiter::limiter('global');
        $this->assertNotNull($limiterGlobal);
        $this->assertEquals(1000, $limiterGlobal($request)->maxAttempts);

        $limiterApi = RateLimiter::limiter('api');
        $this->assertNotNull($limiterApi);
        $this->assertEquals(1000, $limiterApi($request)->maxAttempts);
    }
}