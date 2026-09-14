<?php

/**
 * IDE Helper Stubs for Rehabilitation Center Management System.
 *
 * This file is purely for static analysis / IDE autocompletion (e.g. Intelephense,
 * PhpStorm, PHPStan). It is never executed at runtime.
 *
 * @noinspection ALL
 * phpcs:ignoreFile
 */

namespace {
    exit('This file should not be included, only analyzed by your IDE.');
}

namespace {
    use Illuminate\Contracts\Auth\Factory as AuthFactory;
    use Illuminate\Contracts\Auth\Guard;
    use Illuminate\Contracts\Auth\StatefulGuard;

    if (! function_exists('auth')) {
        /**
         * Get the available auth instance.
         *
         * @param  string|null  $guard
         * @return \Illuminate\Contracts\Auth\Guard|\Illuminate\Contracts\Auth\StatefulGuard|\Illuminate\Contracts\Auth\Factory
         */
        function auth($guard = null)
        {
            return app(AuthFactory::class);
        }
    }
}
