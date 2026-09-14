<?php

$configuredOrigins = env('CORS_ALLOWED_ORIGINS');

if ($configuredOrigins !== null && $configuredOrigins !== '') {
    $origins = explode(',', $configuredOrigins);
} else {
    $origins = [
        'http://localhost:3000',
        'http://localhost:3001',
    ];
}

if ($frontendUrl = env('FRONTEND_URL')) {
    $origins[] = $frontendUrl;
}

$allowedOrigins = array_values(array_unique(array_filter(array_map('trim', $origins))));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

