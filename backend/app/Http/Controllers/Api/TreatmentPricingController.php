<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTreatmentPricingRequest;
use App\Services\TreatmentPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TreatmentPricingController extends Controller
{
    public function __construct(
        protected TreatmentPricingService $pricingService
    ) {}

    /**
     * Display the current treatment pricing configuration.
     */
    public function show(): JsonResponse
    {
        $config = $this->pricingService->getCurrentConfig();
        $config->load('updatedByUser:id,name');

        return response()->json([
            'config' => $config,
        ]);
    }

    /**
     * Update the treatment pricing configuration (Admin only).
     */
    public function update(UpdateTreatmentPricingRequest $request): JsonResponse
    {
        $config = $this->pricingService->updateConfig($request->validated(), $request->user());
        $config->load('updatedByUser:id,name');

        return response()->json([
            'message' => 'Treatment pricing configuration updated successfully.',
            'config' => $config,
        ]);
    }
}
