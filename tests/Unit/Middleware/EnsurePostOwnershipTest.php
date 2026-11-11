<?php

namespace Tests\Unit\Middleware;

use App\Features\Post\Models\Post;
use App\Http\Middleware\EnsurePostOwnership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class EnsurePostOwnershipTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Jangan beri nama "run": TestCase::run() bersifat final di PHPUnit.
     */
    private function runMiddleware(?User $user, mixed $routePost, string $method = 'GET'): Response
    {
        $request = Request::create('/dashboard/posts/1', $method);
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(fn () => new class($routePost)
        {
            public function __construct(private mixed $post)
            {
            }

            public function parameter(string $name, mixed $default = null): mixed
            {
                return $name === 'post' ? $this->post : $default;
            }
        });

        return (new EnsurePostOwnership())->handle(
            $request,
            fn () => new Response('OK', 200)
        );
    }

    public function test_blocks_unauthenticated_user(): void
    {
        try {
            $this->runMiddleware(null, null);
            $this->fail('Seharusnya melempar HttpException 401.');
        } catch (HttpException $e) {
            $this->assertEquals(401, $e->getStatusCode());
        }
    }

    public function test_passes_when_route_has_no_post(): void
    {
        $user = User::factory()->member()->create();

        $response = $this->runMiddleware($user, null);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_passes_when_post_not_found(): void
    {
        $user = User::factory()->member()->create();

        $response = $this->runMiddleware($user, 999999);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_owner_can_access_own_post_as_model(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->assertEquals(200, $this->runMiddleware($user, $post)->getStatusCode());
        $this->assertEquals(200, $this->runMiddleware($user, $post, 'PUT')->getStatusCode());
    }

    public function test_owner_can_access_own_post_as_id(): void
    {
        $user = User::factory()->member()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $response = $this->runMiddleware($user, $post->id);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_member_blocked_from_other_members_post(): void
    {
        $member = User::factory()->member()->create();
        $post = Post::factory()->create();

        try {
            $this->runMiddleware($member, $post);
            $this->fail('Seharusnya melempar HttpException 403.');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
            $this->assertStringContainsString('Member', $e->getMessage());
        }
    }

    public function test_admin_can_read_other_users_post(): void
    {
        $admin = User::factory()->admin()->create();
        $post = Post::factory()->create();

        $response = $this->runMiddleware($admin, $post, 'GET');

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_admin_cannot_modify_other_users_post(): void
    {
        $admin = User::factory()->admin()->create();
        $post = Post::factory()->create();

        try {
            $this->runMiddleware($admin, $post, 'DELETE');
            $this->fail('Seharusnya melempar HttpException 403.');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
            $this->assertStringContainsString('penulis', $e->getMessage());
        }
    }
}