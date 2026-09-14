<?php

use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicalController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuardianAuthController;
use App\Http\Controllers\Api\GuardianMessageController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MedicationAdministrationController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StaffMessageController;
use App\Http\Controllers\Api\TreatmentPricingController;
use App\Http\Controllers\Api\TreatmentSessionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (versioned under /api/v1)
|--------------------------------------------------------------------------
*/

// =========================================================================
// Public Routes
// =========================================================================

Route::post('/appointments', [AppointmentController::class, 'store'])
    ->middleware('throttle:10,1');

Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Guardian Public Authentication & Support Status
Route::post('/guardian/login', [GuardianAuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::post('/guardian/activate', [GuardianAuthController::class, 'activate'])
    ->middleware('throttle:5,1');

Route::get('/guardian/support-status', [GuardianMessageController::class, 'supportStatus']);

// Payment Gateway Webhook (Public / Provider-Agnostic with Idempotency)
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);


// =========================================================================
// Guardian Protected Routes (Guarded by Sanctum + Guardian Middleware)
// =========================================================================

Route::middleware(['auth:sanctum', 'guardian'])->prefix('guardian')->group(function () {
    Route::post('/logout', [GuardianAuthController::class, 'logout']);
    Route::get('/me', [GuardianAuthController::class, 'me']);

    Route::get('/messages', [GuardianMessageController::class, 'index']);
    Route::post('/messages', [GuardianMessageController::class, 'store']);
    Route::patch('/messages/{message}/read', [GuardianMessageController::class, 'markAsRead']);
});


// =========================================================================
// Staff Protected Routes (Guarded by Sanctum + Staff Roles)
// =========================================================================

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Staff Base Views (Accessible to Admin, Receptionist, Doctor)
    Route::middleware('role:admin,receptionist,doctor')->group(function () {
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);

        Route::get('/patients', [PatientController::class, 'index']);
        Route::get('/patients/{patient}', [PatientController::class, 'show']);
        Route::get('/patients/{patient}/guardians', [PatientController::class, 'guardians']);
        Route::get('/patients/{patient}/admissions', [AdmissionController::class, 'patientAdmissions']);

        Route::get('/patients/{patient}/sessions', [TreatmentSessionController::class, 'index']);
        Route::get('/sessions/{session}', [TreatmentSessionController::class, 'show']);
        Route::get('/treatment-sessions', [TreatmentSessionController::class, 'overview']);

        Route::get('/patients/{patient}/medication-administrations', [MedicationAdministrationController::class, 'getPatientAdministrations']);
        Route::get('/medication-administrations', [MedicationAdministrationController::class, 'index']);
        Route::post('/medication-administrations', [MedicationAdministrationController::class, 'store']);
        Route::patch('/medication-administrations/{administration}', [MedicationAdministrationController::class, 'update']);
    });

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        // Treatment Pricing Configuration Update (Phase 9)
        Route::put('/pricing-config', [TreatmentPricingController::class, 'update']);
    });

    // Clinicians (Admin & Doctor)
    Route::middleware('role:admin,doctor')->group(function () {
        Route::get('/patients/{patient}/medical-history', [ClinicalController::class, 'getMedicalHistory']);
        Route::post('/patients/{patient}/medical-history', [ClinicalController::class, 'storeMedicalHistory']);

        Route::get('/patients/{patient}/assessments', [ClinicalController::class, 'getAssessments']);
        Route::post('/patients/{patient}/assessments', [ClinicalController::class, 'storeAssessment']);

        Route::get('/patients/{patient}/vital-signs', [ClinicalController::class, 'getVitalSigns']);
        Route::post('/patients/{patient}/vital-signs', [ClinicalController::class, 'storeVitalSign']);

        Route::get('/patients/{patient}/clinical-notes', [ClinicalController::class, 'getClinicalNotes']);
        Route::post('/patients/{patient}/clinical-notes', [ClinicalController::class, 'storeClinicalNote']);

        Route::get('/patients/{patient}/prescriptions', [ClinicalController::class, 'getPrescriptions']);
        Route::post('/patients/{patient}/prescriptions', [ClinicalController::class, 'storePrescription']);

        Route::get('/patients/{patient}/treatment-plans', [ClinicalController::class, 'getTreatmentPlans']);
        Route::post('/patients/{patient}/treatment-plans', [ClinicalController::class, 'storeTreatmentPlan']);

        Route::get('/patients/{patient}/progress-notes', [ClinicalController::class, 'getProgressNotes']);
        Route::post('/patients/{patient}/progress-notes', [ClinicalController::class, 'storeProgressNote']);

        // Treatment Session clinical workflows
        Route::post('/patients/{patient}/sessions', [TreatmentSessionController::class, 'store']);
        Route::post('/sessions/{session}/reassessment', [TreatmentSessionController::class, 'reassessment']);
        Route::post('/sessions/{session}/continue', [TreatmentSessionController::class, 'continueTreatment']);
        Route::post('/sessions/{session}/discharge', [TreatmentSessionController::class, 'discharge']);
    });

    // Front-Desk, Communications & Billing (Admin & Receptionist)
    Route::middleware('role:admin,receptionist')->group(function () {
        // Appointments management
        Route::patch('/appointments/{appointment}/approve', [AppointmentController::class, 'approve']);
        Route::patch('/appointments/{appointment}/reject', [AppointmentController::class, 'reject']);
        Route::patch('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
        Route::patch('/appointments/{appointment}/complete', [AppointmentController::class, 'complete']);
        Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);

        // Patient & Admission creation routes
        Route::post('/patients', [PatientController::class, 'store']);
        Route::patch('/patients/{patient}', [PatientController::class, 'update']);
        Route::post('/patients/{patient}/admission', [AdmissionController::class, 'store']);
        Route::get('/admissions', [AdmissionController::class, 'index']);

        // Guardian Communication & Support Chat (Phase 7)
        Route::get('/messages', [StaffMessageController::class, 'index']);
        Route::get('/patients/{patient}/messages', [StaffMessageController::class, 'conversation']);
        Route::post('/patients/{patient}/messages', [StaffMessageController::class, 'reply']);
        Route::patch('/messages/{message}/read', [StaffMessageController::class, 'markAsRead']);
        Route::post('/patients/{patient}/messages/mark-read', [StaffMessageController::class, 'markConversationAsRead']);

        // Billing & Payments (Phase 8)
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/payments', [PaymentController::class, 'store']);

        // Administration Dashboard, Operational Alerts, Reports & Pricing (Phase 9)
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/dashboard/alerts', [DashboardController::class, 'alerts']);
        Route::get('/reports/{type}', [ReportController::class, 'index']);
        Route::get('/pricing-config', [TreatmentPricingController::class, 'show']);
    });
});
