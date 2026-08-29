<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\ClinicalController;
use App\Http\Controllers\Api\TreatmentSessionController;
use App\Http\Controllers\Api\MedicationAdministrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (versioned under /api/v1)
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/appointments', [AppointmentController::class, 'store'])
    ->middleware('throttle:10,1');

Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Appointment View Routes (Accessible to Admin, Receptionist, and Doctor)
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);

    // Patient View Routes (Accessible to Admin, Receptionist, and Doctor)
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/{patient}', [PatientController::class, 'show']);
    Route::get('/patients/{patient}/guardians', [PatientController::class, 'guardians']);
    Route::get('/patients/{patient}/admissions', [AdmissionController::class, 'patientAdmissions']);

    // Treatment Session View Routes (Accessible to Admin, Receptionist, and Doctor)
    Route::get('/patients/{patient}/sessions', [TreatmentSessionController::class, 'index']);
    Route::get('/sessions/{session}', [TreatmentSessionController::class, 'show']);

    // Medication Administration Routes (Phase 6)
    Route::get('/patients/{patient}/prescriptions', [MedicationAdministrationController::class, 'getPatientPrescriptions']);
    Route::get('/patients/{patient}/medication-administrations', [MedicationAdministrationController::class, 'getPatientAdministrations']);
    Route::get('/medication-administrations', [MedicationAdministrationController::class, 'index']);
    Route::post('/medication-administrations', [MedicationAdministrationController::class, 'store']);
    Route::patch('/medication-administrations/{administration}', [MedicationAdministrationController::class, 'update']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    Route::middleware('role:admin,doctor')->group(function () {
        // Clinical routes (Phase 4)
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

        // Treatment Session clinical workflows (Phase 5)
        Route::post('/patients/{patient}/sessions', [TreatmentSessionController::class, 'store']);
        Route::post('/sessions/{session}/reassessment', [TreatmentSessionController::class, 'reassessment']);
        Route::post('/sessions/{session}/continue', [TreatmentSessionController::class, 'continueTreatment']);
        Route::post('/sessions/{session}/discharge', [TreatmentSessionController::class, 'discharge']);
    });

    Route::middleware('role:admin,receptionist')->group(function () {
        // Front-desk & Appointment management routes (status changes)
        Route::patch('/appointments/{appointment}/approve', [AppointmentController::class, 'approve']);
        Route::patch('/appointments/{appointment}/reject', [AppointmentController::class, 'reject']);
        Route::patch('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
        Route::patch('/appointments/{appointment}/complete', [AppointmentController::class, 'complete']);
        Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);

        // Front-desk Patient & Admission creation routes
        Route::post('/patients', [PatientController::class, 'store']);
        Route::patch('/patients/{patient}', [PatientController::class, 'update']);
        Route::post('/patients/{patient}/admission', [AdmissionController::class, 'store']);
        Route::get('/admissions', [AdmissionController::class, 'index']);
    });
});
