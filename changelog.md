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

---

## [Post-Phase 10: Clinical Responsibility, Doctor Assignment, Dashboard UX/UI Redesign & Public Visual Enhancement] - 2026-09-18

### Clinical Responsibility & Persistent Doctor Assignment Model
- **Database Architecture**:
  - Created `patient_doctor_assignments` table migration tracking `patient_id`, `doctor_id`, `assigned_by`, `assigned_at`, `unassigned_at`, `status` (`active`, `inactive`, `transferred`), and `notes`.
  - Defined `PatientDoctorAssignment` Eloquent model with relations to `Patient`, `User` (doctor), and `User` (assignedBy).
  - Added `doctorAssignments()` and `activeDoctorAssignment()` relationships to `Patient` model, and `patientAssignments()` / `activePatientAssignments()` to `User` model.
- **Backend API & Authorization**:
  - Implemented `PatientDoctorAssignmentController` providing Admin-only assignment and reassignment (`POST /api/v1/patients/{patient}/doctor-assignments`), automatically closing previous active assignments with timestamps and audit trail.
  - Implemented `GET /api/v1/doctors` endpoint allowing authorized staff to list licensed physicians with active patient counts.
  - Updated all patient clinical checks (`ClinicalController`, `PatientController`, `AdmissionController`, `TreatmentSessionController`, `MedicationAdministrationController`) to recognize persistent active doctor assignments in addition to appointments for backward compatibility.
  - Restricted prescription creation to doctors only (`role:doctor`).
  - Added medication reaction discontinuation endpoint (`PATCH /api/v1/patients/{patient}/prescriptions/{prescription}/discontinue`) with reason, clinical notes, and audit trail.
  - Implemented automatic classification of Admin notes as `'Administrative Observation'` while preserving doctor notes as `'Clinical Record'`.
  - Implemented dedicated doctor dashboard endpoint (`GET /api/v1/dashboard/doctor`) and period-based analytics endpoint (`GET /api/v1/dashboard/analytics?period=...`).
- **Feature Tests**:
  - Created `Tests\Feature\DoctorAssignmentClinicalResponsibilityTest` with 13 automated tests covering admin assignment/reassignment, auto-closure, unassigned doctor restrictions, assigned doctor clinical access, doctor-only prescribing, adverse reaction discontinuation, and dashboard analytics.
  - Full suite verified: 127 tests passed with 537 assertions (100% pass rate).

### Dashboard UX/UI Redesign (Guided by User References)
- **Design Tokens & Theme Architecture**:
  - Upgraded `globals.css` with a refined healthcare palette: Medium Healthcare Green (`#2F7D5B`), Deep Forest Green (`#1F5C43`), Soft Sage (`#EAF6F0`), Warm Cream (`#FAF7F0`), Charcoal (`#1F2923`), and Amber Accent (`#D97706`).
  - Added `lucide-react`, `recharts`, `motion`, `clsx`, and `tailwind-merge`.
  - Created shadcn/ui-inspired primitives: `Button`, `Card`, `Badge`, and `cn` utility.
- **Sidebar & Navigation Layout**:
  - Redesigned `dashboard/layout.tsx` into grouped navigation sections (Overview, Patient Care, Operations, Administration).
  - Added role-tailored navigation items, floating staff pill header, live role indicators, and responsive mobile drawer.
- **Doctor Clinical Dashboard (`DoctorDashboard.tsx`)**:
  - Guided by Rexora design reference: "Patient Care Overview" with a 4-milestone trajectory progress track (Intake/Detox &rarr; Cognitive Therapy &rarr; Skill Reintegration &rarr; Supervised Discharge).
  - 4 circular metric rings: Total Patients, Stable Inpatients, High Observation, Discharges.
  - Interactive clinical care cards for all assigned patients with last observation, urgent vital indicators, and direct clinical workspace links.
- **Admin Management Dashboard (`page.tsx`)**:
  - Top stat cards with sparklines and period tabs (`This Month`, `Prev Month`, `3 Months`, `6 Months`).
  - Recharts visualizations: Interactive Inpatient Volume trend area chart and Revenue & Settlement donut chart.
  - Prioritized operational alerts card with left-accent warning bars and quick action buttons.
  - Responsive residential treatment sessions table with status pills and clinician badges.
- **Patient Profile Clinical Workspace (`patients/[id]/page.tsx`)**:
  - Prominent Primary Attending Physician card with active status pill, assignment timestamp, notes, and assigner identity.
  - Admin-only physician assignment/reassignment modal and assignment audit history accordion.
  - Structured Observations tab with 12 observation types, 4 severity levels (`Normal`, `Mild concern`, `Moderate concern`, `Significant concern`), and visual distinctions between Doctor Clinical Records and Admin Observations.
  - Physician-guarded prescription builder with adverse reaction discontinuation modal.
- **Patient Directory (`patients/page.tsx`)**:
  - Multi-parameter filter bar (search, admission status, assignment state, attending doctor).
  - Top metric cards with circular indicator rings.
  - Responsive table with attending physician badge and profile action links.

### Public Website Visual Enhancement
- **Authentic Local Photography Integration**:
  - Integrated local authentic photography from `frontend/public/image` across all public pages:
    - `images.jpeg`: Rehabilitation Center Hospital Exterior & modern campus (Homepage Hero, Facilities).
    - `images1.webp`: Attending physician consulting patient with clipboard (Homepage consultation card, Services).
    - `images2.jpeg`: Residential quarters & living pavilion (Homepage 30-Day section, Facilities).
    - `images3.jpg`: Multidisciplinary clinical team reviewing EMR records (About page, Staff Portal Login).
    - `images4.jpg`: Doctor taking vitals & medical monitoring (Services, Facilities).
    - `images5.jpg`: Doctor consultation office across desk (About, Facilities).
    - `images6.jpg`: Psychological counseling & behavioral therapy session (Homepage, Services).
- **Rexora-Inspired Public Healthcare Experience**:
  - Homepage: Floating pill header, Rexora-style Patient Care Trajectory track with 4 circular metric rings (128 Total, 86 Stable, 12 High Observation, 24 Discharged), clinical disciplines cards, and intake CTA banner.
  - Facilities page: Replaced all emojis and plain black placeholder boxes with high-resolution Next.js `Image` cards.
  - Staff Login page: Split modern card layout with authenticated care photo backdrop and quick-fill test credentials pills for Admin, Doctor, and Receptionist.
- **Production Build Verification**:
  - `npm run build` completed with 0 errors across 23 static and dynamic routes.

---

## [Phase 11: Dose-Level eMAR, Guardian Linking & Public Website Experience] - 2026-09-18

### Added
- **Dose-Level eMAR Architecture**:
  - Added `dose_slot` enum column (`morning`, `afternoon`, `evening`, `night`) to `medication_administrations` table with composite index `[patient_id, scheduled_at, dose_slot]`.
  - Updated prescription generation in `ClinicalController@storePrescription` to automatically create individual dose records with realistic hospital schedule times (Once Daily: 08:00, BID: 08:00 & 20:00, TID: 08:00, 14:00 & 20:00, QID: 08:00, 14:00, 18:00 & 22:00).
  - Added adverse reaction cancellation in `ClinicalController@discontinuePrescription` to cancel future scheduled doses while keeping historical given/refused records intact.
  - Implemented comprehensive `GET /api/v1/patients/{id}/medication-workspace` returning active prescriptions, today's dose matrix, calculated daily status (`completed`, `incomplete`, `in_progress`), discontinued regimens, and filterable history (`today`, `yesterday`, `7_days`, `all`).
  - Redesigned Patient Profile Medication Tab on `patients/[id]/page.tsx` into a dose-level eMAR schedule with slot-action modals and live day completion indicators.
  - Redesigned facility-wide eMAR Workspace on `medications/page.tsx` into a matrix board (`Patient | Medication | Morning | Afternoon | Evening | Night | Day Status`) with timeline log toggle and workload metrics.

- **Guardian–Patient Linking & Message Isolation**:
  - Migrated `patient_id` to nullable with foreign key constraint preserved on `guardians` and `guardian_messages`.
  - Updated `GuardianAuthController@activate` to support Option A (with patient number, instant link) and Option B (without patient number, general inquiry mode).
  - Updated `GuardianMessageController` to isolate unlinked guardian messages, prevent patient data exposure, and allow sending support inquiries.
  - Implemented staff linking endpoint `POST /api/v1/staff/guardians/{guardian}/link-patient` with duplicate prevention and automatic backlinking of earlier unlinked messages.
  - Implemented staff unlinking endpoint `POST /api/v1/staff/guardians/{guardian}/unlink-patient` with full conversation history preservation.
  - Enhanced Receptionist Support Inbox on `messages/page.tsx` with unlinked conversation badges, header action menu (`⋮`), patient search modal, and unlinking capability.

- **Calming Delayed Support Message**:
  - Added non-spamming dynamic notice generator in `GuardianMessageController@index`: returns `delayed_support_notice` whenever the latest message is from a guardian with $\ge 90$s elapsed and zero staff replies.
  - Updated `SupportChatWidget.tsx` to render a distinct, soothing "Support Update" badge card with clinical 24/7 hotline that automatically disappears once staff replies.

- **Public Website Refinement**:
  - Healthcare & Recovery Focus visual trust strip below the hero using authentic local images (`/image/images.jpeg`, `/image/images1.webp`, `/image/images2.jpeg`, `/image/images3.jpg`).
  - Added high-DPI interactive OpenStreetMap facility section at Nibo, Awka South LGA ($6.1770^\circ\text{ N}, 7.0700^\circ\text{ E}$) with transit guidance, visiting hours, and emergency desk contacts.
  - Reduced-motion support with `motion-reduce:transform-none`.

---

## [Phase 11 Bug Fix: eMAR, Guardian Verification, Social Proof Marquee] - 2026-09-19

### Fixed
- **Patient Profile eMAR Workspace Runtime Crash (Issue 1)**:
  - Fixed `TypeError: emarWorkspaceRes?.history?.map is not a function` at `/dashboard/patients/[id]` under "Medications & eMAR".
  - Defined explicit TypeScript contracts (`EmarDoseRecord`, `EmarWorkspaceHistoryPagination`, `PatientMedicationWorkspaceResponse`) matching the backend Laravel pagination structure `{ current_page, data, last_page, total }`.
  - Normalized history consumption across Admin, Receptionist, and Doctor views to `emarWorkspaceRes?.history?.data ?? []` while preserving full server-side pagination controls (Next/Previous, current page, total records).
  - Maintained facility-wide `/dashboard/medications` functionality intact.

- **Guardian Isolation & Receptionist Verification Linking (Issue 2)**:
  - Enforced strict model-level verification in `Guardian.php`: `isLinked()` and `accessiblePatients()` now strictly require `is_verified === true && !empty($this->patient_id)`.
  - Updated `GuardianAuthController@activate` Option B: When a user registers with email and password without a patient number, it provisions or updates an unlinked portal account (`patient_id = null`, `is_verified = false`) without auto-associating internal intake candidate records or exposing medical/patient records.
  - Ensured `GuardianAuthController@guardianPayload` enforces empty `patients: []` and `'Support User'` relationship whenever a guardian is unlinked.
  - Enforced `GuardianMessageController` and `StaffMessageController` strict message isolation: unlinked guardian messages and staff replies have `patient_id = null`.
  - Updated Receptionist Support Inbox (`/dashboard/messages`): unlinked threads display `'Support User'` badge and `⚠️ Patient not yet linked`.
  - Updated `StaffMessageController@linkPatient`: verifies linking, cleans up duplicate unverified intake candidate records with null password, and backlinks unlinked messages to the newly linked patient chart.
  - Updated `SupportChatWidget.tsx`: unlinked guardians see "Support User" badge and "Patient: Patient not yet linked" notice in general inquiry mode without leaking patient numbers or clinical context.

- **Healthcare Standards & Ecosystem Social Proof Marquee (Issue 3)**:
  - Replaced SVG placeholder paths with authentic local brand assets from `frontend/public/image/brands/`: `nafdac.png`, `Emzor-Logo-HIRES-1.jpg`, `Juhel-Logo-1280x462.png`, `gsk.jpg`, `afrab.jpeg`, and `abbot.png`.
  - Implemented mathematically seamless dual-track infinite marquee in `frontend/src/app/globals.css` with `@keyframes marquee-track` translating from `0%` to `-100%` across two synchronized track runners, eliminating visible jumps or loop gaps.
  - Integrated rich micro-interactions: hovering anywhere on the marquee track pauses the scroll (`animation-play-state: paused`); hovering on a brand card scales it to `1.05`, elevates shadow with an emerald glow (`rgba(16,185,129,0.18)`), changes cursor to pointer, and smoothly resumes upon mouse leave.
  - Framed content with neutral, professional medical wording: "HEALTHCARE STANDARDS & ECOSYSTEM" (adherence to national regulatory standards and quality pharmaceutical supply chains, without misleading partnership or endorsement claims).
  - Maintained accessibility with a dedicated `motion-reduce:flex` static scrollable fallback honoring user `prefers-reduced-motion` settings.

---

## [Phase 11: eMAR Dose Scheduling & Adherence Logic Correction] - 2026-09-19

### Added
- **Centralized `MedicationScheduleService` (`backend/app/Services/MedicationScheduleService.php`)**:
  - `normalizeFrequency(?string $frequency)`: Authoritative frequency normalizer mapping clinical and colloquial frequency patterns to time slots:
    - *Once daily* (`1xdaily`, `1`, `qd`, `once`) $\rightarrow$ 1 dose/day (`morning` 08:00).
    - *Twice daily* (`2xdaily`, `2`, `bid`, `twice`) $\rightarrow$ 2 doses/day (`morning` 08:00, `night` 20:00).
    - *Three times daily* (`3xdaily`, `3`, `tid`, `three`) $\rightarrow$ 3 doses/day (`morning` 08:00, `afternoon` 14:00, `night` 20:00).
    - *Four times daily* (`4xdaily`, `4`, `qid`, `four`, `q6h`) $\rightarrow$ 4 doses/day (`morning` 08:00, `afternoon` 14:00, `evening` 18:00, `night` 22:00).
  - `parseDurationDays(?string $duration)`: Converts human-entered durations (`30 days`, `2 weeks`, `1 month`, or numeric strings) into integer days (e.g. 7, 14, 30).
  - `generateDoseAdministrations(PrescriptionItem $item, mixed $startDateOrPatientId, mixed $startDate)`: Idempotently creates individual `MedicationAdministration` records across all scheduled slots for each day of the prescription duration.
  - `ensureActivePrescriptionsScheduled(Patient $patient, mixed $date)`: On-the-fly idempotent reconciler ensuring active prescription items have dose administration records generated for the target date.
  - `ensureActivePrescriptionsScheduledForAllPatients(mixed $date)`: Facility-wide reconciler generating missing slot doses for all active prescriptions on the queried date.
  - `normalizeLegacyNullSlotsForDate(mixed $targetDate)`: Backfills legacy administrations where `dose_slot` was `null` by inferring slot windows from `scheduled_at`.
  - `calculateDayAdherence(array $slotDoses, array $expectedSlotKeys)`: Regimen adherence calculator strictly enforcing:
    - Any dose marked `refused` or `missed` $\rightarrow$ `incomplete`.
    - All expected doses marked `given` $\rightarrow$ `completed`.
    - Partial doses administered + remaining doses pending/due $\rightarrow$ `in_progress` (never prematurely `completed`).
    - Future/unreached doses $\rightarrow$ `in_progress`.
  - `calculateOverallDayAdherence(array $regimenStatuses)`: Combines all active medication regimen statuses for a patient into an overall day status (`completed`, `incomplete`, or `in_progress`).

### Changed
- **Prescription Creation Flow (`backend/app/Http/Controllers/Api/ClinicalController.php`)**:
  - Replaced ad-hoc dose generation loop with delegated calls to `MedicationScheduleService::generateDoseAdministrations`.
- **Medication Administration APIs (`backend/app/Http/Controllers/Api/MedicationAdministrationController.php`)**:
  - `index()`: Calls `MedicationScheduleService::ensureActivePrescriptionsScheduledForAllPatients($startDate)` before querying, ensuring all dose slots (including night and afternoon) are scheduled without duplicating existing rows.
  - `getPatientMedicationWorkspace()`: Reconciles active prescriptions with `ensureActivePrescriptionsScheduled`, computes individual regimen adherence and `overall_day_status`, and attaches `expected_slots` and `prescription_item` objects.
- **Patient Profile eMAR Workspace (`frontend/src/app/dashboard/patients/[id]/page.tsx`)**:
  - Bound "Today's Overall Status" metric card directly to `overall_day_status` from the backend API.
  - Correctly renders dose action buttons for all scheduled slots and reflects regimen-level status badges (`Completed`, `In Progress`, `Incomplete`).
- **Facility-wide eMAR Workspace (`frontend/src/app/dashboard/medications/page.tsx`)**:
  - Updated `matrixRows` useMemo: `day_status` calculation explicitly resolves expected slots from prescription frequency (`1xdaily` $\rightarrow$ 1, `2xdaily`/`2` $\rightarrow$ 2, `3xdaily` $\rightarrow$ 3, `4xdaily` $\rightarrow$ 4).
  - Enforces that partial administrations (e.g. morning given, night pending) remain `In Progress` until all expected slots are verified given.

### Verified & Tested
- **Automated Feature Test Suite (`backend/tests/Feature/Phase11EMARDoseSchedulingAndAdherenceTest.php`)**:
  - Test 1: `test_once_daily_frequency_generates_one_morning_dose_at_0800` (1 dose/day at 08:00:00) $\rightarrow$ Passed.
  - Test 2: `test_twice_daily_and_numeric_frequency_generates_morning_and_night_doses` (`2xdaily`, `2`, `BID` $\rightarrow$ Morning 08:00 and Night 20:00) $\rightarrow$ Passed.
  - Test 3: `test_three_times_daily_frequency_generates_three_doses_per_day` (`3xdaily`, `TID` $\rightarrow$ Morning 08:00, Afternoon 14:00, Night 20:00) $\rightarrow$ Passed.
  - Test 4: `test_four_times_daily_frequency_generates_four_doses_per_day` (`4xdaily`, `QID` $\rightarrow$ Morning 08:00, Afternoon 14:00, Evening 18:00, Night 22:00) $\rightarrow$ Passed.
  - Test 5: `test_partial_administration_remains_in_progress_and_not_completed` (Morning Given, Night Pending $\rightarrow$ `in_progress`) $\rightarrow$ Passed.
  - Test 6: `test_full_administration_becomes_completed` (Both Morning and Night Given $\rightarrow$ `completed`) $\rightarrow$ Passed.
  - Test 7: `test_refused_dose_makes_regimen_incomplete` (Refused dose $\rightarrow$ `incomplete`) $\rightarrow$ Passed.
  - Test 8: `test_missed_dose_makes_regimen_incomplete` (Missed dose $\rightarrow$ `incomplete`) $\rightarrow$ Passed.
  - Test 9: `test_future_doses_stay_pending_and_not_marked_missed_or_incomplete` (Future date $\rightarrow$ `scheduled`, status `in_progress`) $\rightarrow$ Passed.
  - Test 10: `test_multiple_medications_calculate_independent_and_overall_adherence` (Multi-med patient adherence combinations) $\rightarrow$ Passed.
- **Regression Testing**:
  - `Phase11DoseLevelEMARAndGuardianLinkingTest`: 7 tests, 105 assertions $\rightarrow$ Passed (100%).
  - `MedicationAdministrationTest`: 6 tests, 18 assertions $\rightarrow$ Passed (100%).
- **Frontend Production Build**:
  - `next build`: Successfully compiled 23 routes with zero TypeScript errors.



