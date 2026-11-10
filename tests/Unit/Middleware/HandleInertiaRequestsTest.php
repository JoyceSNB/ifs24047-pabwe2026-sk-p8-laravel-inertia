<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    public function test_handle_inertia_requests_share_data(): void
    {
        $middleware = new HandleInertiaRequests();
        $request = Request::create('/todos', 'GET');

        // Without user
        $data = $middleware->share($request);
        $this->assertNull($data['auth']['user']);

        // With user
        $user = User::factory()->make([
            'id' => 99,
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'role' => 'member',
            'profile_photo_path' => 'photos/test.png',
        ]);
        $request->setUserResolver(fn () => $user);

        $session = app('session.store');
        $session->put('success', 'Berhasil!');
        $session->put('error', 'Gagal!');
        $session->put('aiGeneratedItems', [['title' => 'AI']]);
        $request->setLaravelSession($session);

        $shared = $middleware->share($request);
        $this->assertEquals(99, $shared['auth']['user']['id']);
        $this->assertEquals('Test User', $shared['auth']['user']['name']);
        $this->assertEquals('Berhasil!', $shared['flash']['success']());
        $this->assertEquals('Gagal!', $shared['flash']['error']());
        $this->assertCount(1, $shared['flash']['aiGeneratedItems']());

        $this->assertNotNull($middleware->version($request));
    }
}
