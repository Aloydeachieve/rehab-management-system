<?php

namespace App\Http\Middleware;

use App\Models\Guardian;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGuardian
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! ($user instanceof Guardian)) {
            return response()->json(['message' => 'Guardian access required.'], 403);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Guardian account is not active.'], 403);
        }

        return $next($request);
    }
}
