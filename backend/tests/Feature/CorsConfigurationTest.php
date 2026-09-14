<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    public function test_allowed_origins_configuration_contains_no_wildcard(): void
    {
        $allowedOrigins = config('cors.allowed_origins');

        $this->assertIsArray($allowedOrigins);
        $this->assertNotContains('*', $allowedOrigins, 'Wildcard * must NOT be used for allowed_origins.');
        $this->assertContains('http://localhost:3000', $allowedOrigins);
        $this->assertContains('http://localhost:3001', $allowedOrigins);
    }

    public function test_support_status_allows_origin_localhost_3001(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3001',
        ])->get('/api/v1/guardian/support-status');

        $response->assertStatus(200);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    }

    public function test_support_status_allows_origin_localhost_3000(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])->get('/api/v1/guardian/support-status');

        $response->assertStatus(200);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    }

    public function test_auth_login_preflight_options_allows_origin_localhost_3001(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3001',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, Authorization',
        ])->options('/api/v1/auth/login');

        $response->assertStatus(204);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    }

    public function test_auth_login_preflight_options_allows_origin_localhost_3000(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, Authorization',
        ])->options('/api/v1/auth/login');

        $response->assertStatus(204);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    }

    public function test_unauthorized_origin_is_not_allowed(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://evil-domain.com',
        ])->get('/api/v1/guardian/support-status');

        $allowOriginHeader = $response->headers->get('Access-Control-Allow-Origin');
        $this->assertNotEquals('http://evil-domain.com', $allowOriginHeader);
    }
}
