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
