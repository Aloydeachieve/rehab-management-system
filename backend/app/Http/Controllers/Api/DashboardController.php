<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * Get aggregate administrative and operational dashboard statistics.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $summary = $this->dashboardService->getSummary($user);

        return response()->json($summary);
    }

    /**
     * Get operational action-required alerts for staff.
     */
    public function alerts(Request $request): JsonResponse
    {
        $user = $request->user();
        $alerts = $this->dashboardService->getAlerts($user);

        return response()->json([
            'alerts' => $alerts,
            'count' => count($alerts),
        ]);
    }
}
