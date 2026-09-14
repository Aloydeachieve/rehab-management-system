# Changelog

All notable changes to this project will be documented in this file.

## [Phase 1: Foundation] - 2026-08-28

### Added
- Backend Laravel 11 application setup with Sanctum authentication.
- Frontend Next.js 16 + React 19 application setup with Tailwind CSS v4.
- Frontend libraries installed: Axios, Zod, React Hook Form, TanStack Query.
- Core database migrations for `users`, `roles`, `role_user`, and `staff_profiles`.
- Role-based middleware `EnsureUserHasRole` (`role`) registered in Laravel.
- Default database seeding with roles and admin staff user account.
- Basic API routes for login, logout, and authenticated user fetch.

---

## [Phase 2: Public Website and Appointments] - 2026-08-28

### Added
- **Database Migrations**:
  - `create_patients_and_guardians_tables`: Base tables for admissions model integrity.
  - `create_appointments_table`: Schema with foreign keys, status values, and indexes.
- **Models & Factories**:
  - `Patient`, `Guardian`, and `Appointment` models with relationships and status constants.
  - `AppointmentFactory` for seeding and tests.
- **Laravel Mail/Notifications**:
  - `AppointmentStatusChanged` notification class to email visitors when their appointment state changes.
- **API Endpoints**:
  - Public `POST /api/v1/appointments` to request appointments.
  - Staff `GET /api/v1/appointments` and `GET /api/v1/appointments/{appointment}` with search and status filtering.
  - Staff `PATCH` endpoints to approve, reject, reschedule, complete, and cancel appointments.
  - Admin `GET`, `POST`, `PATCH`, `DELETE` endpoints for managing staff users (`/api/v1/users`).
- **Public Frontend Pages**:
  - Responsive header/navbar, footer, and base layout.
  - Informational pages: Home, About, Services, Facilities, FAQ, Contact.
  - Public booking form with inputs for name, phone, email, preferred date, reason, and notes.
- **Staff Portals & Login**:
  - Login page with form validation and testing autofill shortcuts.
  - Dashboard layout with sidebar navigation, profile tags, and logouts.
  - Overview screen with appointment counts and placeholders.
  - Appointments Management table with status filter, search, and action modals.
  - Staff Management CRUD pages with forms for employee credentials.
- **Feature Tests**:
  - `AppointmentTest` verifying request creation, validation, notifications, and authorization.
  - `UserTest` verifying staff creation, updates, and role-based permissions.

---

## [Phase 3: Patients, Guardians, & Admissions] - 2026-08-28

### Added
- **Database Migrations**:
  - `create_admissions_table`: Added schema with patient relationships, voluntary/involuntary status, and the recording staff member.
- **Models**:
  - `Admission` model with validation, timestamps, and relationships back to `Patient` and `User`.
  - Added `admissions` relationship in `Patient` model.
- **API Endpoints**:
  - `POST /api/v1/patients` (Register patient + guardian)
  - `POST /api/v1/patients/{patient}/admission` (Record admission log)
  - `GET /api/v1/patients` and `GET /api/v1/patients/{patient}`
  - `GET /api/v1/patients/{patient}/guardians` and `GET /api/v1/patients/{patient}/admissions`
  - `GET /api/v1/admissions`
- **Frontend Directory & Registration Pages**:
  - Patients sidebar nav link enabled on dashboard.
  - Searchable patient directory listing page `/dashboard/patients`.
  - Intakes/Registration form `/dashboard/patients/register` validating demographics and guardian contact details.
  - Profile layout and timeline panel `/dashboard/patients/[id]` displaying intake logs and guardian info.
  - Admission registration dialog `/dashboard/patients/[id]/admit` to log intake parameters.
- **Feature Tests**:
  - `PatientAdmissionTest` verifying registration transaction integrity, guardian link creation, active admission checks, and role-based permissions (admin/receptionist write, doctor read-only).

---

## [Phase 4: Doctor & Clinical Records] - 2026-08-28

### Added
- **Database Migrations**:
  - `create_clinical_records_tables`: Added schemas for `medical_histories`, `assessments`, `vital_signs`, `clinical_notes`, `prescriptions`, `prescription_items`, `treatment_plans`, and `progress_notes`.
- **Models**:
  - Created `MedicalHistory`, `Assessment`, `VitalSign`, `ClinicalNote`, `Prescription`, `PrescriptionItem`, `TreatmentPlan`, and `ProgressNote` Eloquent models with relationship definitions.
- **REST API Endpoints**:
  - `GET`/`POST` clinical endpoints under `/api/v1/patients/{id}` for: `/medical-history`, `/assessments`, `/vital-signs`, `/clinical-notes`, `/prescriptions`, `/treatment-plans`, and `/progress-notes`.
- **EMR Authorization & Patient Filtering**:
  - Enforced strict Laravel policies: Admins have full EMR access, Receptionists receive 403, Doctors can only view/write EMR for patients they have scheduled appointments with.
  - Filtered the patient directory listing so doctors only see their assigned patients.
- **Frontend Clinical Workspace**:
  - Tabbed clinicians menu on patient profiles (Medical History, Vitals, Assessments, Clinical Notes, Progress Notes, Prescriptions, Treatment Plans).
  - Multi-item prescription writer allowing dynamically adding/removing medication lines.
  - Append-only EMR inputs and active/inactive auto-management for treatment plans.
- **Feature Tests**:
  - `ClinicalRecordTest` verifying clinical CRUD access levels, receptionist denials, doctor appointment assignments, multi-item prescriptions, and treatment plan deactivation.

---

## [Phase 5: Residential Treatment Sessions] - 2026-08-29

### Added
- **Database Migrations**:
  - `create_treatment_sessions_table`: Configured schema with patient relationships, sequential numbers, active/completed/discharged statuses, payment status, reassessment recommend logs, decision authorities, and a unique constraint index.
  - Established database foreign key constraints for `treatment_session_id` on all Phase 4 clinical tables.
- **Models**:
  - `TreatmentSession` model with castings, active/completed transitions, and relationships mapping to clinical EMR items.
  - Linked `treatmentSessions` HasMany relation in `Patient` model.
- **Auto-Initialization Workflow**:
  - Updated `AdmissionController` to automatically spawn **Session 1** lasting exactly **30 days** starting on the `admission_date` under a database transaction.
- **REST API Endpoints**:
  - `POST`/`GET` `/patients/{id}/sessions` (Manually initiate or list sessions).
  - `GET` `/sessions/{id}` (View session details).
  - `POST` `/sessions/{id}/reassessment` (Practitioner logs decision recommendation).
  - `POST` `/sessions/{id}/continue` (Closes active session and opens next session inside transaction).
  - `POST` `/sessions/{id}/discharge` (Discharges session and sets patient discharged).
- **Frontend Timeline & Workspaces**:
  - Embedded a "Treatment Sessions / Residential Care" timeline panel inside patient profiles linking to session detail workspaces.
  - Created a clinician decision-board page `/dashboard/sessions/[id]` displaying reassessment inputs, continuation/discharge triggers, and nested EMR logs captured during that session.
- **Feature Tests**:
  - `TreatmentSessionTest` verifying sequential session number increments, 30-day defaults, reassessment stamps, transaction continuity locks, and EMR session foreign key associations.

---

## [Phase 6: Medication Administration] - 2026-08-29

### Added
- **Database Migrations**:
  - `create_medication_administrations_table`: Configured schema with patient relationships, prescription item references, administering staff logs, scheduled dose times, actual administration times, status updates, and notes reasons.
- **Models**:
  - `MedicationAdministration` model with castings and relations mapping to Patients, PrescriptionItems, and administering Users.
  - Linked `medicationAdministrations` HasMany relations in `Patient` and `PrescriptionItem` models.
- **Auto-Scheduling Trigger**:
  - Updated `ClinicalController` so saving a new prescription automatically parses frequency/duration parameters (QD, BID, TID) and schedules medication administrations slots in the database.
- **REST API Endpoints**:
  - `GET` `/patients/{id}/prescriptions` (Staff prescriptions lookup).
  - `GET` `/patients/{id}/medication-administrations` (Patient-specific administration logs).
  - `GET` `/medication-administrations` (Global index with date and doctor assignment filters).
  - `POST` `/medication-administrations` (Manually schedule/log administrations).
  - `PATCH` `/medication-administrations/{id}` (Marks scheduled doses as given, missed, refused, or cancelled, recording actual times and logged staff IDs).
- **Frontend Workspace & Profile Tabs**:
  - Added a sidebar nav item for "Medications" linking to the staff-only daily eMAR schedule workspace.
  - Built an interactive modal confirmation system to log doses.
  - Appended a "Medications & eMAR" tab to patient profiles displaying active prescriptions and sequential administration histories.
- **Feature Tests**:
  - `MedicationAdministrationTest` verifying schedule views, given/missed updates, authenticated staff records, patient-prescription matches, receptionist prescription blocks, and doctor patient assignments.

---

## [Phase 7: Guardian Communication & Support Chat] - 2026-09-01

### Added
- **Database Migrations**:
  - `2026_09_01_000001_add_auth_fields_to_guardians_table`: Added `password`, `status`, and `last_login_at` columns to `guardians` table.
  - `2026_09_01_000002_create_guardian_messages_table`: Schema with foreign keys to `patients`, `guardians`, and nullable `sender_user_id` (staff user), indexed on `[guardian_id, patient_id]`, `read_at`, and `created_at`.
- **Models & Authentication**:
  - Upgraded `Guardian` Eloquent model to support Laravel Sanctum authentication and token issuance with separate credentials and provider config in `config/auth.php`.
  - Created `GuardianMessage` Eloquent model with relations to `Patient`, `Guardian`, and staff `User`.
  - Linked `guardianMessages` HasMany relation in `Patient` model.
  - Registered `guardian` middleware alias (`EnsureGuardian`) to strictly isolate guardian endpoints from staff RBAC.
  - Updated `EnsureUserHasRole` to enforce staff user model type and reject unauthorized guardian tokens on staff routes.
- **REST API Endpoints**:
  - `POST /api/v1/guardian/login`: Guardian authentication returning Sanctum token and profile with linked patients.
  - `POST /api/v1/guardian/activate`: Guardian self-activation using email and patient ID number on file.
  - `POST /api/v1/guardian/logout`: Revokes guardian Sanctum token.
  - `GET /api/v1/guardian/me`: Returns guardian info and accessible patient list.
  - `GET /api/v1/guardian/messages`: Guardian message history for linked patient.
  - `POST /api/v1/guardian/messages`: Sends guardian support message (`sender_user_id = null`).
  - `PATCH /api/v1/guardian/messages/{id}/read`: Marks staff reply as read by guardian.
  - `GET /api/v1/guardian/support-status`: Returns receptionist availability status and working hours.
  - `GET /api/v1/messages`: Receptionist / Admin inbox listing grouped conversations with unread counters and latest message snippets.
  - `GET /api/v1/patients/{id}/messages`: Staff conversation view with guardian and patient identity.
  - `POST /api/v1/patients/{id}/messages`: Receptionist / Admin reply to guardian (`sender_user_id = auth()->id()`).
  - `PATCH /api/v1/messages/{id}/read`: Staff marks incoming guardian message as read.
  - `POST /api/v1/patients/{id}/messages/mark-read`: Bulk marks unread guardian conversation messages as read.
- **Public Frontend Support Chat**:
  - Created `SupportChatWidget` component floating action button on public layout.
  - Integrated dual authentication tabs for Guardian Sign In and Account Activation.
  - WhatsApp-style chat interface displaying Guardian/Patient identity, relationship tags, message bubbles, timestamps, read checkmarks, multi-patient selector, and offline support notice banner.
  - Created `guardianAuth.ts` with React Query hooks for token storage, authentication mutations, and 4-second polling intervals.
- **Receptionist Dashboard Inbox**:
  - Added "Messages" navigation item in dashboard sidebar for Receptionists and Admins (hidden from Doctors).
  - Built two-pane WhatsApp-style inbox workspace at `/dashboard/messages` with searchable conversations list, unread badge counters, complete chronological message feeds, quick links to patient profiles, and reply bar.
- **Feature Tests**:
  - `GuardianMessagingTest` containing 18 comprehensive test scenarios covering authentication, validation, guardian message dispatch, conversation history, cross-guardian/patient boundary protection, receptionist inbox listing and replies, unread counters, doctor 403 blocks, admin oversight, and clinical/staff dashboard denial.

---

## [Phase 8: Billing & Payments] - 2026-09-01

### Added
- **Database Migrations**:
  - `2026_09_01_000003_create_invoices_table`: Schema with foreign keys to `patients`, `treatment_sessions` (nullable), and `created_by` (staff user), indexed on `[patient_id, status]`, `invoice_number`, and `due_date`.
  - `2026_09_01_000004_create_payments_table`: Schema with foreign keys to `patients`, `invoices`, and `recorded_by` (staff user), indexed on `[invoice_id, status]`, `reference`, `paid_at`, and `created_at`.
- **Models & Calculations**:
  - `Invoice` model with relationships (`patient`, `treatmentSession`, `payments`, `creator`), status constants (`unpaid`, `partially_paid`, `paid`, `overdue`, `cancelled`), and `recalculateBalanceAndStatus()` server-side atomic calculation method.
  - `Payment` model with relationships (`patient`, `invoice`, `recordedByUser`), payment method constants (`cash`, `bank_transfer`, `card`, `pos`, `cheque`), and status constants (`pending`, `successful`, `failed`, `refunded`).
  - Linked `invoices` and `payments` relationships on `Patient` model.
  - Linked `invoices` and `invoice` (latest) relationships on `TreatmentSession` model.
- **Notifications**:
  - `InvoiceCreatedNotification`: Queueable notification emailing primary guardian with invoice details, amount due, payment instructions, and safe non-clinical references.
  - `PaymentReceivedNotification`: Queueable notification emailing primary guardian with payment receipt, remaining balance, and updated invoice status.
- **REST API Endpoints**:
  - `GET /api/v1/invoices`: List and filter invoices by search term, patient, status, and date range.
  - `POST /api/v1/invoices`: Create invoice for patient and optional treatment session with server-side unique `INV-YYYY-XXXXX` numbering, cross-patient session validation, duplicate active invoice prevention, and guardian notification.
  - `GET /api/v1/invoices/{id}`: Detailed invoice breakdown with patient info, guardians, session info, and full payment ledger.
  - `GET /api/v1/payments`: List payments filtered by invoice, patient, reference, and status.
  - `POST /api/v1/payments`: Record verified payment with row locking (`lockForUpdate`), overpayment rejection, duplicate reference prevention, atomic balance recalculation, session sync, and guardian receipt email.
  - `POST /api/v1/payments/webhook`: Provider-agnostic payment gateway webhook handler supporting idempotent processing, transaction reference verification, and automatic invoice updates.
- **Role-Based Access Control**:
  - Restricted invoice creation and payment recording to `admin` and `receptionist` roles.
  - Strictly blocked `doctor` (403), `guardian` (403), and unauthenticated visitors (401) from accessing billing endpoints.
- **Frontend Billing Workspace & Integration**:
  - Added "Billing" navigation item in staff dashboard sidebar for Admin and Receptionist.
  - Created full billing workspace at `/dashboard/billing` with real-time financial metrics (Total Invoiced, Total Collected, Outstanding Balance, Action Required counts), multi-status filter tabs, searchable invoices table, "+ Create Invoice" modal with session linkage, "Record Payment" modal with auto-balance calculation, and detailed "Invoice Ledger" modal.
  - Added "Billing & Invoices" tab to patient profile view at `/dashboard/patients/[id]` showing historical client invoices and settlement statuses.
- **Feature Tests**:
  - `BillingPaymentTest` containing 15 comprehensive test scenarios covering admin/receptionist creation, unauthorized role blocks, session ownership checks, duplicate invoice rejection, server-side number generation, balance calculations, partial/full payments, overpayment rejection, duplicate payment reference rejection, provider webhook idempotency, and guardian notification triggers. All 70 tests in backend suite passing (262 assertions).

---

## [Phase 9: Administration Dashboard, Operational Monitoring & Reporting] - 2026-09-03

### Added
- **Database Migrations**:
  - `2026_09_03_000001_create_treatment_pricing_configs_table`: Configurable pricing schema storing `initial_session_price` (default 300,000.00), `subsequent_session_price` (default 200,000.00), `currency` (NGN), `session_duration_days` (30), and `updated_by` foreign key.
  - `2026_09_03_000002_add_session_price_to_treatment_sessions_table`: Added nullable `session_price` (decimal 12,2) to `treatment_sessions` table to permanently record the snapshot price of each treatment cycle.
- **Models & Services**:
  - `TreatmentPricingConfig` model with relationship to `updatedByUser`.
  - Updated `TreatmentSession` model with `session_price` attribute and decimal casting.
  - `TreatmentPricingService`: Centralized pricing calculation engine providing dynamic access to current rates, tiered session pricing (Session 1 vs Session 2+), session durations, and Admin configuration updates.
  - `DashboardService`: Operational and administrative monitoring engine computing live statistics across patients, appointments, billing, medications, and guardian communications, and generating real-time action alerts (expiring sessions, overdue invoices, pending appointments, missed/refused doses, unread messages, clinical decisions).
  - `ReportService`: Comprehensive reporting service generating 6 tabular reports with date range, status, search filtering, and summary metrics (`patients`, `treatment-sessions`, `billing`, `payments`, `medications`, `appointments`).
- **REST API Endpoints**:
  - `GET /api/v1/dashboard/summary`: Live operational summary metrics for Admin and Receptionist staff.
  - `GET /api/v1/dashboard/alerts`: Live actionable operational alerts prioritized by severity, with strict role-based redaction of confidential clinical notes for Receptionists.
  - `GET /api/v1/treatment-sessions`: Operational listing of treatment sessions with filtering (`status`, `approaching_end`, `decision_state`, `payment_status`, `search`), pagination, and computed monitoring attributes (`is_approaching_end`, `days_remaining`).
  - `GET /api/v1/pricing-config`: Retrieve current treatment pricing configuration (Admin and Receptionist).
  - `PUT /api/v1/pricing-config`: Update treatment pricing configuration (Admin only; validated via `UpdateTreatmentPricingRequest`).
  - `GET /api/v1/reports/{type}`: Multi-type reporting endpoint enforcing RBAC (Admin accesses all reports; Receptionist accesses operational reports and receives 403 on clinical `medications` report; Doctor/Guardian receive 403).
- **Core Business Logic Enhancements**:
  - `AdmissionController@store`: Automatically sets `session_price` to the configured initial session price (₦300,000) and duration to configured days upon initial residential admission.
  - `TreatmentSessionController@store` & `continueTreatment`: Automatically sets `session_price` to the configured subsequent session price (₦200,000) upon treatment continuation.
  - `InvoiceController@store`: Automatically populates invoice amount and balance from linked session price if amount is omitted, permanently recording the immutable snapshot in `invoices` table.
- **Frontend Workspaces**:
  - `Dashboard Overview` (`/dashboard`): Unified operational dashboard with real-time stats cards (clickable navigation), live Operational Alerts / Action Required section with direct triage links, real-time Treatment Session Monitoring table with expiration badges and filters, and 4 department overview cards (Billing, Medications, Appointments, Guardian Support).
  - `Operational & Clinical Reports` (`/dashboard/reports`): Multi-tab reporting suite with date ranges, status filters, search, summary metric cards, responsive data tables, pagination, and print-friendly styling. Role-gated so Receptionists cannot view clinical medication eMAR records.
  - `Treatment Pricing Configuration` (`/dashboard/settings/pricing`): Admin settings interface allowing configuration of Session 1 rate, Session 2+ rate, duration, and currency, with historical invoice immutability assurances and non-admin access restriction.
  - `Billing Workspace` (`/dashboard/billing`): Updated "+ Create Invoice" modal to auto-populate the invoice amount when a treatment session is selected.
  - `Layout Navigation` (`/dashboard/layout.tsx`): Integrated "Reports" and "Pricing Config" links with role visibility controls.
- **Automated Verification**:
  - Created `AdminDashboardReportingTest` with 13 comprehensive feature tests covering stats computation, receptionist operational access, unauthorized role blocks (Doctor, Guardian, Unauthenticated), database-driven accuracy, operational alert detection, reporting RBAC gates, pricing updates, receptionist pricing update denial (403), tiered session pricing, historical invoice preservation, and invalid pricing validation (422).
  - Full backend test suite passing: 83 tests, 364 assertions (100% pass).
  - Production frontend build verified: `npm run build` completed with 0 errors and 23 routes generated.

---

## [Phase 10: Production-Readiness Audit, Security Hardening & Final Verification] - 2026-09-04

### Security & Access Control Hardening
- **IDOR Vulnerability Elimination**:
  - `PatientController@guardians`: Added strict doctor appointment-assignment verification so doctors cannot inspect guardian contact details of unassigned patients.
  - `AdmissionController@patientAdmissions`: Added doctor appointment-assignment validation preventing doctors from viewing admission records of unassigned patients.
- **Route & Middleware Hardening**:
  - Removed duplicate route definition for `GET /patients/{patient}/prescriptions` in `backend/routes/api.php` that was previously shadowed across staff base and doctor route groups.
  - Enforced `User` model instance check in `AuthController@me`, returning HTTP 403 if a Guardian token attempts to authenticate against the staff identity endpoint.
- **Static Analysis & IDE Diagnostics**:
  - Identified root cause of IDE red squigglies on `auth()->user()`: In Laravel 12, `auth($guard = null)` specifies `@return ($guard is null ? \Illuminate\Contracts\Auth\Factory : \Illuminate\Contracts\Auth\Guard)`. Without an argument, Intelephense infers `Factory` (which lacks `user()` and `id()`), while runtime dynamically forwards calls via `AuthManager::__call`.
  - Added `backend/_ide_helper.php` stub supplementing `auth()` with `\Illuminate\Contracts\Auth\Guard|\Illuminate\Contracts\Auth\Factory`.
  - Added explicit PHPDoc `/** @var \App\Models\User $user */` type annotations across all controllers (`ClinicalController`, `TreatmentSessionController`, `MedicationAdministrationController`, `AppointmentController`, `PatientController`, `AuthController`).

### Frontend Production Hardening
- **Role-Gated Route Protection & Fallback UI**:
  - Added `useUser` authentication hook and role verification cards to `/dashboard/staff`, `/dashboard/billing`, and `/dashboard/messages`.
  - Unauthorized direct visits now render a styled, branded "Access Restricted" alert card with direct links back to the main dashboard rather than failing silently with unhandled API errors.
  - Added `'use client'` directive to `frontend/src/app/dashboard/billing/page.tsx` resolving Next.js Turbopack client component compilation error.
  - Created `frontend/.env.example` documenting `NEXT_PUBLIC_API_URL`.

### Automated Verification & Regression Testing
- **Security Audit Test Suite**:
  - Created `Tests\Feature\Phase10SecurityAuditTest` with 12 targeted feature tests verifying:
    - Doctor IDOR prevention on guardians (403 for unassigned, 200 for assigned).
    - Doctor IDOR prevention on admissions (403 for unassigned, 200 for assigned).
    - Guardian token rejection on staff endpoints (`/auth/me`, `/patients`, `/invoices`).
    - Staff token rejection on guardian endpoints (`/guardian/me`, `/guardian/messages`).
    - Receptionist restriction from confidential clinical records (clinical notes, medical history, assessments, prescriptions).
    - Receptionist restriction from clinical medication reports (403).
    - Treatment pricing update restricted to Admin only (Receptionist 403, Doctor 403, Admin 200).
    - Billing financial integrity: overpayment rejection (422), duplicate payment reference rejection (422), and partial payment allocation (201).
- **Full Suite Regression & Build**:
  - Backend: 95 feature & unit tests passing across all modules with 387 assertions (100% pass rate).
  - Frontend: `npm run build` completed cleanly with 0 TypeScript/ESLint errors and 23 optimized routes generated.

---

## [Manual Acceptance Testing: Post-Phase 10 Stabilization] - 2026-09-11

### Bug Fixes
- **Medications & eMAR Tab Paginator Handling & RBAC Protection (Bug 1)**:
  - Fixed `TypeError: patientPrescriptionsRes?.map is not a function` in `frontend/src/app/dashboard/patients/[id]/page.tsx`.
  - Updated `patientPrescriptionsRes` query to be role-gated with `isClinician` (`enabled: !!id && isClinician && activeTab === 'medications'`), preventing unauthorized HTTP 403 requests by Receptionists while preserving strict RBAC.
  - Aligned prescription list rendering and empty state checks with the documented Laravel paginated response structure (`patientPrescriptionsRes?.data?.map` and `patientPrescriptionsRes?.data?.length`), ensuring consistent consumption across all clinical tabs.
  - Added role-aware empty state text displaying `"Active prescription details are restricted to clinical staff."` for non-clinicians while maintaining full eMAR medication administration tracking capabilities.
- **Dashboard Logout Redirection (Bug 2)**:
  - Updated `handleLogout` in `frontend/src/app/dashboard/layout.tsx` to redirect to the public home page (`/`) via `router.replace('/')` using `onSettled`.
  - Preserved backend Sanctum token revocation (`AuthController@logout`), frontend localStorage token removal (`setToken(null)`), and React Query cache clearing (`queryClient.clear()`).

