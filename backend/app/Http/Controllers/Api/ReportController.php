<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    /**
     * Dispatch report requests with strict RBAC enforcement.
     */
    public function index(Request $request, string $type): JsonResponse
    {
        $user = $request->user();

        // 1. Base RBAC: Only Admin and Receptionist can access reports
        if (! $user || (! $user->isAdmin() && ! $user->isReceptionist())) {
            return response()->json([
                'message' => 'You are not authorized to access reporting resources.',
            ], 403);
        }

        // 2. Clinical Report Protection: Receptionists cannot access medications administration report
        if ($type === 'medications' && ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Receptionists are not authorized to access clinical medication reports.',
            ], 403);
        }

        return match ($type) {
            'patients' => response()->json($this->reportService->getPatientsReport($request)),
            'treatment-sessions' => response()->json($this->reportService->getTreatmentSessionsReport($request)),
            'billing' => response()->json($this->reportService->getBillingReport($request)),
            'payments' => response()->json($this->reportService->getPaymentsReport($request)),
            'medications' => response()->json($this->reportService->getMedicationsReport($request)),
            'appointments' => response()->json($this->reportService->getAppointmentsReport($request)),
            default => response()->json(['message' => "Invalid report type: '{$type}'."], 404),
        };
    }
}
