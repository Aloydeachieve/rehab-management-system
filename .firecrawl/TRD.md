# REHABILITATION CENTER MANAGEMENT SYSTEM

## Technical Requirements Document (TRD)

*Version 1.0 — MVP*

*Prepared for a residential rehabilitation center in Nibo, Anambra State, Nigeria*

---

## 1. Technical Overview

Build a simple, secure web application that supports the rehabilitation center's real daily
workflow. V1 should use a straightforward frontend/backend architecture and avoid
microservices or unnecessary infrastructure.

## 2. Recommended Technology Stack

● Frontend: Next.js + React + TypeScript

● Styling: Tailwind CSS

● Forms: React Hook Form + Zod

● Server/API data fetching: TanStack Query

● Backend: Laravel + PHP

● Database: MySQL

● Authentication: Laravel Sanctum

● Queues/cache: Redis where needed

● Email: Laravel Mail/Notifications with an SMTP or transactional email provider

● File storage: Laravel filesystem in development; private S3-compatible storage in
production

● Version control: Git + GitHub

## 3. Architecture

Public Website / Internal Dashboard
|
Next.js
|
HTTPS / REST
|
Laravel API
|
MySQL
|
-------------------
| | |
Queue Files Email
Redis Storage Provider

Use one Laravel backend and one Next.js frontend. Do not introduce microservices for V1.

## 4. Applications and Areas

● Public website: public informational pages and appointment request form.

● Admin dashboard: complete system management.

● Doctor dashboard: clinical work and assigned patients.

● Receptionist dashboard: appointments, registration, guardian communication and daily
operational work.

● Laravel API: authentication, authorization, business logic and database access.

---

## 5. Authentication

● Only staff accounts can log into the internal dashboards.

● Admin creates staff accounts.

● Public visitors do not create patient accounts.

● Patients do not log in during V1.

● Use Laravel Sanctum for authenticated staff API access.

● Implement login, logout, password reset and appropriate account status handling.

● Passwords must be securely hashed by Laravel.

● Rate-limit login and sensitive authentication endpoints.

## 6. Role-Based Access Control

Backend authorization is mandatory. Frontend role checks only control what is displayed;
they are not a security boundary.

● Admin: full access.

● Doctor/Professional: access clinical functions and patients assigned/authorized to them.

● Receptionist: access appointments, patient registration/basic information, guardian
communication, payment/session status needed for operations, and medication
administration functions explicitly permitted by the center.

● Unauthorized roles must receive a proper authorization response rather than hidden
data.

## 7. Database Design

Use MySQL with foreign keys, timestamps, indexes and appropriate constraints. Avoid
storing an entire patient record as one large unstructured JSON field; important
operational/clinical entities should have their own tables.

**users**

id, name, email, phone, password, status, last_login_at, timestamps

**roles**

id, name, description, timestamps

**role_user**

user_id, role_id

**patients**

id, patient_number, name, date_of_birth, gender, address, phone, status, timestamps

**guardians**

id, patient_id, name, relationship, phone, email, address, is_primary, timestamps

**staff_profiles**

id, user_id, profession, license_number nullable, status, timestamps

---

**appointments**

id, patient_id nullable, visitor_name, visitor_phone, visitor_email, reason, preferred_at,
scheduled_at nullable, assigned_staff_id nullable, status, notes, timestamps

**admissions**

id, patient_id, admission_date, admission_type, admitted_by, status, notes, timestamps

**treatment_sessions**

id, patient_id, session_number, start_date, expected_end_date, actual_end_date nullable,
status, professional_id nullable, recommendation nullable, payment_status, notes,
timestamps

**medical_histories**

id, patient_id, recorded_by, content, recorded_at, timestamps

**assessments**

id, patient_id, treatment_session_id nullable, practitioner_id, assessment_type, findings,
recommendation, recorded_at, timestamps

**vital_signs**

id, patient_id, recorded_by, temperature nullable, pulse nullable, blood_pressure nullable,
respiratory_rate nullable, weight nullable, notes, recorded_at, timestamps

**clinical_notes**

id, patient_id, practitioner_id, treatment_session_id nullable, note_type, content,
recorded_at, timestamps

**prescriptions**

id, patient_id, practitioner_id, treatment_session_id nullable, status, notes, prescribed_at,
timestamps

**prescription_items**

id, prescription_id, medication_name, dosage, frequency, duration, instructions, timestamps

**treatment_plans**

id, patient_id, practitioner_id, treatment_session_id nullable, goals, plan, review_date
nullable, status, timestamps

**progress_notes**

id, patient_id, practitioner_id, treatment_session_id nullable, content, recorded_at,
timestamps

**medication_administrations**

id, patient_id, prescription_item_id, administered_by, scheduled_at, administered_at
nullable, status, notes, timestamps

**documents**

id, patient_id, uploaded_by, document_type, original_name, path, mime_type, size,
timestamps

---

**invoices**

id, patient_id, treatment_session_id, invoice_number, amount, amount_paid, balance,
due_date, status, timestamps

**payments**

id, patient_id, invoice_id, reference, amount, method, provider nullable, status, paid_at
nullable, timestamps

**guardian_messages**

id, patient_id, guardian_id, sender_user_id nullable, message, read_at nullable, timestamps

**notifications**

id, user_id, type, title, message, read_at nullable, sent_at nullable, timestamps

**audit_logs**

id, user_id nullable, action, entity_type, entity_id, old_values nullable, new_values nullable,
ip_address nullable, user_agent nullable, created_at

## 8. Key Database Relationships

● Patient has many guardians.

● Patient has many appointments, admissions and treatment sessions.

● Treatment session belongs to one patient and may have assessments, clinical notes,
prescriptions, treatment plans and progress notes.

● Prescription belongs to a patient and practitioner and has many prescription items.

● Medication administration belongs to a prescription item and records the staff member
who administered it.

● Invoice belongs to a patient and treatment session; an invoice can have multiple
payments.

● Guardian messages belong to a patient and guardian.

● Staff accounts belong to users; role assignments determine access.

## 9. Treatment Session Logic

The initial residential session must be 30 days. The system must represent sessions
separately so the patient can have a complete treatment history.

## Admission

-> Session 1 (30 days)
-> Professional reassessment
-> Discharge
OR
-> Session 2
-> Reassessment
-> Discharge OR another session

● Session 1 should default to 30 days.

● Do not create automatic 60/90/180-day programs.

---

● Continuation requires an authorized professional workflow.

● Each continuation creates a new session record rather than overwriting the previous
session.

● Each session should have a payment/invoice state.

● Session history must remain visible to authorized staff.

## 10. Appointment API

POST /api/v1/appointments

GET /api/v1/appointments

GET /api/v1/appointments/{id}

PATCH /api/v1/appointments/{id}/approve

PATCH /api/v1/appointments/{id}/reject

PATCH /api/v1/appointments/{id}/reschedule

PATCH /api/v1/appointments/{id}/complete

PATCH /api/v1/appointments/{id}/cancel

Public appointment creation must only accept safe public fields. Internal patient data must
never be returned to anonymous visitors.

## 11. Patient API

GET /api/v1/patients

POST /api/v1/patients

GET /api/v1/patients/{id}

PATCH /api/v1/patients/{id}

GET /api/v1/patients/{id}/guardians

GET /api/v1/patients/{id}/sessions

GET /api/v1/patients/{id}/documents

Patient creation is an internal staff operation after admission approval, not a public
registration endpoint.

## 12. Clinical API

GET /api/v1/patients/{id}/medical-history

POST /api/v1/patients/{id}/medical-history

POST /api/v1/patients/{id}/assessments

POST /api/v1/patients/{id}/vital-signs

POST /api/v1/patients/{id}/clinical-notes

POST /api/v1/patients/{id}/prescriptions

POST /api/v1/patients/{id}/treatment-plans

POST /api/v1/patients/{id}/progress-notes

● All clinical routes require authentication.

● All clinical routes require authorization.

● Doctor access should be limited to assigned/authorized patients.

● Clinical records should preserve historical entries.

● Do not allow the frontend to decide whether a user has clinical access.

---

## 13. Admission API

POST /api/v1/patients/{id}/admission

GET /api/v1/patients/{id}/admissions

GET /api/v1/admissions

PATCH /api/v1/admissions/{id}

Admission should be an explicit internal workflow and must not be created merely because
an appointment was booked.

## 14. Treatment Session API

POST /api/v1/patients/{id}/sessions

GET /api/v1/patients/{id}/sessions

PATCH /api/v1/sessions/{id}

GET /api/v1/sessions/{id}

POST /api/v1/sessions/{id}/reassessment

POST /api/v1/sessions/{id}/continue

POST /api/v1/sessions/{id}/discharge

The continue/discharge actions must be authorized and should record who made the
decision and when.

## 15. Medication Administration API

GET /api/v1/patients/{id}/prescriptions

GET /api/v1/patients/{id}/medication-administrations

POST /api/v1/medication-administrations

PATCH /api/v1/medication-administrations/{id}

● Doctor creates prescription.

● Staff sees the medication schedule.

● Staff records administration.

● Possible statuses: scheduled, given, missed, refused, cancelled.

● Record administering staff member and actual administration time.

● Do not build medication inventory in V1.

## 16. Billing and Payment API

GET /api/v1/invoices

POST /api/v1/invoices

GET /api/v1/invoices/{id}

POST /api/v1/payments

GET /api/v1/payments

POST /api/v1/payments/webhook

Payment workflow: create invoice → notify guardian → payment → server-side
verification/webhook → update payment → update invoice → send confirmation.

● Never trust a payment-success value submitted by the browser.

● Use an idempotent transaction/reference for payment callbacks.

---

● Payment records must not be deleted casually; use appropriate status/history.

● Invoice balance should be derived safely from recorded amounts.

## 17. Guardian Messaging

GET /api/v1/patients/{id}/messages

POST /api/v1/patients/{id}/messages

PATCH /api/v1/messages/{id}/read

The initial implementation is an internal receptionist inbox linked to a patient/guardian. Keep
it simple; do not build a social or real-time messaging platform unless later required.

## 18. Notifications and Email

● Use Laravel Notifications/Mail.

● Queue email sending when possible.

● Appointment updates should notify the relevant contact.

● New-session payment requirements should trigger a guardian email.

● Payment confirmation should trigger an email where appropriate.

● Store notification status so failed delivery can be investigated.

## 19. File and Document Management

● Store patient documents privately.

● Validate file type and size.

● Generate safe storage names rather than trusting uploaded filenames.

● Authorize every download/view request.

● Log important document access.

● Do not expose private document paths publicly.

● Use private object storage in production where possible.

## 20. Frontend Dashboard Requirements

**Admin**

● Overview cards

● Patient management

● Appointments

● Admissions

● Treatment sessions

● Staff accounts

● Payments/invoices

● Reports

● Guardian communication oversight

● Audit logs

● Settings

---

## Doctor

● Today's work

● Assigned patients

● Patient timeline

● Medical history

● Assessments

● Vital signs

● Prescriptions

● Treatment plans

● Progress notes

● Session reassessment

## Receptionist

● Appointment requests

● Calendar

● Patient registration

● Guardian information

● Guardian inbox

● Operational patient information

● Medication administration

● Payment/session status

## 21. Frontend UX Rules

● Use clear labels and simple language.

● Show loading, empty and error states.

● Prioritize today's tasks on dashboards.

● Use confirmation for destructive/sensitive actions.

● Use search and filters on long lists.

● Do not expose navigation items as a substitute for authorization.

● Keep forms short and group related fields logically.

● Use responsive layouts, with desktop as the primary staff use case.

## 22. Laravel Code Organization

● Models: database entities and relationships.

● Controllers: HTTP request/response handling only.

● Form Requests: validation.

● Policies: authorization.

● Services: business workflows such as admissions, treatment sessions and payments.

● API Resources: consistent JSON responses.

● Notifications: email/system notifications.

● Jobs: queued emails and other slow work.

● Events/listeners where useful, without overengineering.

● Database migrations/seeders/factories for repeatable environments.

---

## 23. API Standards

● Version API under /api/v1.

● Return consistent JSON structures.

● Use correct HTTP status codes.

● Validate all incoming data server-side.

● Paginate large collections.

● Use stable IDs and never rely on user-supplied role information.

● Return safe error messages without leaking stack traces or secrets.

● Use request authorization before sensitive queries.

## 24. Security Requirements

● HTTPS in production.

● Laravel password hashing.

● Sanctum authentication.

● Role/policy authorization on every protected resource.

● Rate limiting.

● CSRF protections where applicable.

● SQL injection protection through Laravel ORM/query parameterization.

● XSS-safe output handling.

● Secure file upload validation.

● Environment variables for secrets.

● No passwords, API keys or payment secrets in Git.

● Audit sensitive actions.

● Database backups.

● Least-privilege database/service credentials.

## 25. Audit Logging

Audit logs should cover sensitive or important operational actions.

● Staff account creation/update

● Permission changes

● Patient record creation/update

● Clinical record creation/update

● Prescription creation/update

● Medication administration

● Session continuation

● Admission/discharge

● Invoice/payment changes

● Document access

● Important guardian communication actions

---

## 26. Testing Requirements

## Backend tests

● Authentication tests

● Role/permission tests

● Appointment workflow tests

● Admission tests

● 30-day session creation tests

● Continuation/discharge authorization tests

● Clinical record tests

● Medication administration tests

● Invoice/payment tests

● Notification tests

## Frontend tests

● Appointment form validation

● Dashboard rendering

● Critical patient forms

● Role-aware UI behavior

● Payment/session status displays

## End-to-end test

Verify the full workflow: public appointment → approval → visit/assessment → admission →
30-day session → clinical records → medication administration → reassessment →
discharge OR new session → invoice → guardian notification → payment.

## 27. Deployment Requirements

● Development, staging if practical, and production environments should use separate
credentials.

● Next.js frontend served over HTTPS.

● Laravel API served over HTTPS.

● MySQL production database.

● Private storage for patient documents.

● Queue worker if Redis/queues are enabled.

● Scheduled database backups.

● Environment configuration kept outside source control.

● Production error monitoring/logging.

## 28. Backup and Recovery

● Automated database backups.

● Keep more than one recent backup where infrastructure allows.

● Test restoration periodically.

● Protect backups from unauthorized access.

● Document the recovery procedure.

---

## 29. Development Phases

## Phase 1 — Foundation

Set up Git repository, Next.js, Laravel, MySQL, authentication, roles, base layouts, API
versioning and development environment.

## Phase 2 — Public Website & Appointments

Build public pages, appointment form, receptionist appointment list,

approval/rejection/rescheduling workflow and email notifications.

## Phase 3 — Patients & Admissions

Build patient registration, guardian records, admissions and patient profile/timeline.

## Phase 4 — Doctor & Clinical Records

Build doctor dashboard, medical history, assessments, vital signs, clinical notes,
prescriptions, treatment plans and progress notes.

## Phase 5 — Residential Sessions

Build 30-day initial session, session history, reassessment, continuation and discharge
workflows.

## Phase 6 — Medication Administration

Build prescription schedule view and staff medication administration records.

## Phase 7 — Guardian Communication

Build receptionist inbox and patient-linked guardian conversations.

## Phase 8 — Billing & Payments

Build invoices, payment records, provider integration/webhooks and session renewal
payment notifications.

## Phase 9 — Reports & Audit

Build operational/financial reports, filters and audit logs.

## Phase 10 — Hardening & Deployment

Security review, authorization audit, automated tests, performance checks, backups,
production deployment and documentation.

## 30. Agentic AI Build Rules

● Treat this TRD and the PRD as the source of truth for V1.

● Do not invent extra modules without approval.

● Do not build microservices.

● Do not introduce a new framework when an existing familiar technology solves the
problem.

● Build one phase at a time.

● After each phase, run tests and verify the existing application still works before starting
the next phase.

---

● Create migrations, relationships, validation, authorization and tests as features are
implemented.

● Never rely on frontend-only security.

● Never expose patient clinical data through public endpoints.

● Never mark payments successful based only on frontend data.

● Do not make clinical decisions automatically.

● Keep the UI simple enough for ordinary center staff.

● Document setup commands, environment variables and important implementation
decisions.

● Do not expand V1 into pharmacy inventory, telemedicine, mobile apps, insurance,
laboratory systems or multi-branch ERP functionality.

## 31. Definition of Done

● Feature works through the intended UI.

● Backend endpoint exists where required.

● Server-side validation is implemented.

● Authorization is enforced.

● Database migration and relationships are complete.

● Relevant automated tests pass.

● Loading, empty and error states are handled.

● Sensitive data is protected.

● Existing features continue to work.

● Documentation is updated.

● Feature has been manually verified against the PRD workflow.

## 32. Final Technical Principle

Keep the architecture boring, secure and maintainable. The center needs a dependable
everyday management system, not a showcase of unnecessary technologies. Next.js,
Laravel and MySQL are sufficient for V1. Complexity should only be introduced when an
actual business requirement justifies it.