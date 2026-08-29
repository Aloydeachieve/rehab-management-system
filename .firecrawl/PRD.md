# REHABILITATION CENTER MANAGEMENT SYSTEM

## Product Requirements Document (PRD)

*Version 1.0 — MVP*

*Prepared for a residential rehabilitation center in Nibo, Anambra State, Nigeria*

---

## 1. Product Overview

The Rehabilitation Center Management System is a simple web-based system that gives the
center an online presence and a practical internal tool for managing appointments, admitted
patients, medical records, residential treatment sessions, medication administration,
guardian communication, payments, staff activities, and financial/operational reports.

The system is intentionally focused on the center's real day-to-day workflow. It is not
intended to be a large enterprise hospital ERP.

## 2. Product Objectives

● Give the rehabilitation center a professional online presence.

● Allow members of the public to learn about the center and request appointments.

● Allow staff to manage patients after admission.

● Give doctors a dedicated dashboard for clinical work.

● Give receptionists a dedicated dashboard for appointments, communication, and daily
operations.

● Give the administrator full visibility and control.

● Track the patient's residential treatment from admission through discharge or
continuation.

● Keep medical and operational information organized in one place.

● Track treatment-session payments and notify guardians when another session requires
payment.

● Provide useful financial and operational reports.

● Keep the system simple enough for normal staff to use without a technical specialist.

## 3. Core Business Rule — The Initial 30-Day Residential Session

Every patient who is formally admitted begins with an initial 30-day residential
treatment/observation session. The 30 days is a starting period used to observe the patient,
begin treatment, assess progress, and determine whether further residential care is
necessary.

● The initial session is 30 days.

● The patient remains under professional observation and treatment during the session.

● At the end of the session, a qualified professional reassesses the patient.

● If the patient is doing well and further residential treatment is not considered necessary,
the patient can be discharged.

● If further residential treatment is required, another treatment session is created.

● The guardian is notified when another paid session is required.

● Every session and every continuation/discharge decision must remain in the patient's
history.

● The system must not assume that every patient requires 60, 90, or 180 days;

continuation is based on professional assessment.

---

## 4. Target Users

● View the center's public website.

## 4.1 Public Visitor

● Learn about the center and its services.

● View facilities and relevant information.

● Contact the center.

● Request an appointment.

● Receive appointment status/confirmation through the available notification channel.

A public visitor does not create a patient account.

## 4.2 Administrator

● Full access to the system.

● Create and manage staff accounts.

● Manage patients, appointments, admissions, treatment sessions, payments, reports, and
settings.

● View operational and financial information.

● Oversee communications and system activity.

## 4.3 Doctor / Professional

● View assigned patients.

● Review patient history.

● Perform and record assessments.

● Record vital signs where permitted.

● Create clinical notes.

● Create prescriptions.

● Create and update treatment plans.

● Record progress notes.

● Review the current treatment session.

● Perform end-of-session reassessment.

● Recommend discharge or continued residential treatment.

## 4.4 Receptionist

● Manage appointment requests and schedules.

● Register patients after admission has been approved.

● Manage basic patient and guardian information.

● Communicate with guardians.

● View operational patient information required for the role.

● Support payment/session notification workflows.

● View and record medication administration as permitted by the center's workflow.

● Handle normal front-desk operations.

## 5. Public Website

The public website should contain only information appropriate for visitors.

---

● About the Center

● Home

● Treatment / Rehabilitation Services

● Facilities

● Contact

● Frequently Asked Questions

● Appointment Booking

● Privacy Policy

● Terms / appropriate notices

The public website must not expose patient information, staff-only information, clinical
records, or internal operational data.

## 6. Appointment Booking

Appointment booking is the main entry point for a new person who wants to visit the center.

## Appointment workflow

Visitor opens website → submits appointment request → receptionist/admin reviews request
→ appointment is approved, rejected, or rescheduled → visitor is notified → patient and
guardian attend the center → professional assessment takes place.

## Appointment information

● Visitor name

● Phone number

● Email where available

● Preferred date/time

● Reason for appointment

● Optional message

● Appointment status

● Assigned professional where applicable

● Staff notes

## Appointment statuses

● Pending

● Approved

● Rejected

● Rescheduled

● Completed

● Cancelled

● No-show

## 7. Assessment and Admission

An appointment does not automatically create an admitted patient. Admission happens after
the patient and guardian visit the center and a qualified professional evaluates the situation.

---

## Workflow

● Appointment is completed.

● Patient attends with guardian where applicable.

● Professional performs an assessment.

● Professional determines whether residential admission is appropriate.

● If admitted, staff create the internal patient record.

● The patient receives an internal patient number.

● The initial 30-day residential session is created.

The exact clinical decision remains with qualified professionals. The software records the
decision and supports the workflow; it does not make medical decisions.

## 8. Patient Management

The patient record is the central record for all admitted patients.

● Patient number

● Full name

● Date of birth

● Gender

● Contact/basic demographic information

● Guardian information

● Emergency contact

● Admission history

● Medical history

● Assessments

● Vital signs

● Clinical notes

● Prescriptions

● Treatment plans

● Progress notes

● Medication administration records

● Documents

● Appointments

● Invoices and payments

● Treatment-session history

● Discharge information

## 9. Guardian Management

Because the patient does not operate their own account, guardian information is important to
the system.

● Guardian name

● Relationship to patient

● Phone number

● Email address

---

● Address where appropriate

● Emergency contact details

● Communication history

A patient may have more than one relevant guardian/contact if the center requires it.

## 10. Residential Treatment Sessions

A treatment session represents one continuous period of residential care.

● Session number

● Patient

● Start date

● Expected end date

● Actual end date

● Status

● Professional responsible

● Payment/invoice status

● Progress information

● End-of-session assessment

● Continuation or discharge decision

## Session lifecycle

● Session created

● Session active

● Session approaching end

● Professional reassessment

● Discharge OR continuation

● Session closed

## 11. Doctor Dashboard

The doctor dashboard should focus on clinical work and assigned patients.

● Today's appointments

● Assigned patients

● Patient search

● Patient overview

● Medical history

● Assessments

● Vital signs

● Clinical notes

● Prescriptions

● Treatment plans

● Progress notes

● Current treatment session

● Previous session history

---

● End-of-session reassessment

● Discharge/continuation recommendation

## 12. Receptionist Dashboard

The receptionist dashboard should focus on front-desk and operational work.

● Appointment requests

● Appointment calendar

● Appointment status management

● Patient registration after admission

● Basic patient information

● Guardian information

● Guardian message inbox

● Payment/session status needed for communication

● Medication administration view/recording

● Daily patient operational information

The receptionist should not have unrestricted access to sensitive clinical information unless
the center explicitly grants that permission.

## 13. Administrator Dashboard

The administrator has full system access.

● Dashboard overview

● Patients

● Appointments

● Admissions

● Treatment sessions

● Doctors/professionals

● Receptionists/staff

● Medical/operational overview

● Payments and invoices

● Guardian communications

● Reports

● System settings

● Audit logs

## 14. Medical Records

The system should support structured but simple electronic patient records.

● Medical history

● Initial and follow-up assessments

● Vital signs

● Clinical observations/notes

---

● Prescriptions

● Treatment plans

● Progress notes

● Relevant uploaded documents

● Session reassessment

The system should preserve a history rather than silently replacing important clinical records.

## 15. Medication Administration

This is medication administration tracking, not pharmacy inventory management. Doctors
prescribe medication. Staff control and administer medication because patients are not given
medication to self-manage.

● Medication name

● Dosage

● Frequency

● Instructions

● Scheduled administration time

● Administration date/time

● Given / missed / refused status

● Staff member who administered it

● Notes

V1 does not include stock management, purchasing, supplier management, or pharmacy
inventory.

## 16. Guardian Communication

● Guardian sends a message/question.

Guardian communication should be simple and centered around the receptionist.

● Receptionist sees the message in an inbox.

● Receptionist replies.

● Admin can oversee communication when necessary.

● Important system events can generate email notifications.

This is a simple support-style conversation feature, not a complex social chat platform.

## 17. Notifications

● Appointment submitted

● Appointment approved/rejected/rescheduled

● Admission confirmation where appropriate

● New treatment session/payment required

● Payment confirmation

● Important administrative notification

---

## ● Discharge notification where appropriate

Email is the primary notification channel for guardian payment/session alerts in V1.

## 18. Billing and Payments

The center charges per residential treatment session rather than asking the patient to
choose a long-term program online.

## Payment workflow

Treatment session created → invoice/payment request → guardian notified → payment
recorded/verified → session payment status updated.

● Invoice number

● Patient

● Treatment session

● Amount

● Amount paid

● Balance

● Due date

● Payment method

● Payment reference

● Payment status

● Receipt/history

## Payment statuses

● Pending

● Partially Paid

● Paid

● Failed

● Refunded/Cancelled where applicable

## 19. Reports

Management should be able to see simple reports without needing an external analyst.

## Patient/operational reports

● Total patients

● Active residential patients

● New admissions

● Discharges

● Active treatment sessions

● Completed sessions

● Continued sessions

● Appointment statistics

---

**Financial reports**

● Revenue

● Payments received

● Outstanding balances

● Session revenue

● Payment history

Reports should support useful date filters where practical.

**20. Role and Permission Summary**

| Area | Admin | Doctor/Professional | Receptionist |
| --- | --- | --- | --- |
| Patients | Full | Assigned/authorizedpatients | Basic/operational |
| Clinical records | Full | Create/view/updateas permitted | Restricted |
| Appointments | Full | View assigned | Manage |
| Admissions | Full | Assess/recommend | Register/support |
| Treatment sessions | Full | Clinicalassessment/recommendation | Operational view |
| Medication | Full | Prescribe | Administer/record aspermitted |
| Guardian messages | Full/oversight | As permitted | Manage |
| Payments | Full | View as needed | Support/view |
| Reports | Full | Relevant clinicalviews | Relevant operationalviews |
| Staff accounts | Full | No | No |
| System settings | Full | No | No |

## 21. Security and Privacy Requirements

● Patient information must only be available to authorized staff.

● Clinical records must have role-based access.

● Public appointment endpoints must not expose internal patient data.

● Staff authentication must be required for dashboards.

● Passwords must be securely hashed.

● Sensitive actions should be auditable.

● Patient documents must not be publicly accessible.

● Use HTTPS in production.

● Application secrets must not be committed to Git.

● Regular database backups must be configured.

● The system must follow applicable Nigerian privacy/data-protection requirements and the
center's internal policies.

---

## 22. Usability Requirements

● The interface should be clean and easy for non-technical staff.

● Common tasks should require as few steps as reasonably possible.

● Dashboards should prioritize today's work.

● Use clear labels instead of technical terminology.

● Forms should validate inputs and explain errors.

● Search and filtering should be available for patient and appointment lists.

● Important statuses should be visually obvious.

● The system should work well on normal desktop/laptop screens used by staff.

## 23. V1 Scope — Build This

● Professional public website

● Appointment booking

● Three internal dashboards: Admin, Doctor, Receptionist

● Staff authentication

● Role-based permissions

● Patient registration after admission

● Assessments and vital signs

● Patient medical records

● Prescriptions

● Treatment plans

● Progress notes

● 30-day initial residential session

● Additional treatment sessions

● Medication administration records

● Email notifications

● Guardian/receptionist messaging

● Invoices and payment tracking

● Financial and operational reports

● Audit logging

● Basic document management

## 24. Explicitly Out of Scope for V1

● Patient self-service accounts

● Patient mobile application

● Online consultation

● Virtual counseling

● Pharmacy inventory management

● Insurance management

● Laboratory management

● Multi-branch management

● Complex hospital ERP modules

● AI diagnosis or autonomous clinical decisions

● Public selection of treatment duration

---

● Complex family portal

● Unnecessary enterprise integrations

## 25. Complete Patient Lifecycle

The system must support the following complete workflow:

1. Visitor discovers the center online.

2. Visitor submits an appointment request.

3. Receptionist/admin reviews the request.

4. Appointment is approved and visitor attends with guardian.

5. Professional performs assessment.

6. If admission is appropriate, staff create the patient record.

7. Initial 30-day residential session begins.

8. Doctor/professional records medical information, treatment, prescriptions, progress and
reassessments.

9. Staff administer and record medication.

10. Guardian communicates with the receptionist when necessary.

11. Near the end of the session, the professional reassesses the patient.

12. Patient is either discharged or recommended for continued residential treatment.

13. If continued, a new session/invoice is created and the guardian is notified.

14. Payment is recorded and the next session continues.

15. All sessions and decisions remain in the patient's history.

## 26. Success Criteria

● A visitor can understand the center's services and request an appointment online.

● Staff can approve and manage appointments.

● An admitted patient can be registered once and managed throughout treatment.

● A doctor can see the information required to assess and treat assigned patients.

● Staff can safely record medication administration.

● The system clearly tracks each 30-day session and later continuation.

● Guardians can communicate with the receptionist.

● Guardians can receive email alerts when another paid session is required.

● Admin can see financial and operational performance.

● Unauthorized staff cannot access restricted patient information.

● The center can operate the core workflow without technical assistance.

## 27. Product Principle

Build the smallest system that accurately represents how this rehabilitation center actually
works. Do not add features simply because they exist in large hospital-management
products. Every feature should make a real daily task easier, safer, faster, or more organized.

---

## 28. Handoff Note for the Development Agent

This PRD is the product boundary for V1. The development agent should implement the
requirements in small verified phases. It must not invent additional modules or expand the
scope without explicit approval. Technical implementation details belong in the
accompanying Technical Requirements Document (TRD).