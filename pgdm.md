# PDMS — Patient Doctor Management System
## Complete Project Documentation

> **Generated:** 2026-05-03  
> **Status:** Development / Capstone Project  
> **Server:** MariaDB 10.4.32 | Node.js + Express 5 | EJS

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Schema](#5-database-schema)
6. [Authentication System](#6-authentication-system)
7. [Role Portals & Features](#7-role-portals--features)
8. [Appointment Lifecycle](#8-appointment-lifecycle)
9. [Cron / Slot Generation System](#9-cron--slot-generation-system)
10. [Payment System (Stripe)](#10-payment-system-stripe)
11. [Email System (Nodemailer)](#11-email-system-nodemailer)
12. [File Upload (Cloudinary)](#12-file-upload-cloudinary)
13. [Seed Data & Current DB State](#13-seed-data--current-db-state)
14. [API Route Reference](#14-api-route-reference)
15. [Known Bugs & Issues](#15-known-bugs--issues)
16. [Design Decisions & Gotchas](#16-design-decisions--gotchas)

---

## 1. Project Overview

PDMS is a full-stack hospital/clinic management web application built as a capstone project. It manages the complete workflow of a medical facility — from patient registration and appointment booking to doctor consultations and administrative oversight.

### Four User Portals

| Role | Login Method | Entry URL |
|------|-------------|-----------|
| Admin | Email + Password | `/staff/login` |
| Doctor | Email + Password | `/staff/login` |
| Receptionist | Email + Password | `/staff/login` |
| Patient | Email + OTP (no password) | `/patient/login` |

### Core Workflow

```
Patient registers (OTP email verification)
    → Patient browses departments → selects doctor → picks slot
    → Stripe payment (₹200 token fee)
    → Receptionist sees booking → records vitals → starts consultation
    → Doctor views patient history → records diagnosis/prescription
    → Slot marked fulfilled → Patient can rate doctor
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | — |
| Framework | Express.js | ^5.1.0 |
| View Engine | EJS (server-side rendering) | ^3.1.10 |
| Database | MySQL / MariaDB (via mysql2) | ^3.15.3 |
| Authentication | JWT (jsonwebtoken) + bcrypt | JWT ^9.0.3, bcrypt ^6.0.0 |
| Session | HttpOnly cookie (1-day TTL) | — |
| File Upload | Multer + Cloudinary | multer ^2.0.2, cloudinary ^1.41.3 |
| Email | Nodemailer (Gmail SMTP) | ^7.0.10 |
| Payment | Stripe Checkout | ^20.4.0 |
| Scheduler | node-cron | ^4.2.1 |
| Dev Server | nodemon | ^3.1.11 |
| Port | 3001 | — |

---

## 3. Project Structure

```
pdms/
├── app.js                          # Express entry point — mounts routes, starts server + cron
│
├── config/
│   ├── db.config.js                # MySQL single connection (promise API)
│   ├── cloudinary.config.js        # Cloudinary + Multer storage setup
│   └── doctor_pricing.js           # Fixed token fee = ₹200
│
├── middleware/
│   ├── auth.middleware.js           # protect() + restrictTo() — JWT verification
│   └── authRedirect.middleware.js   # Clears token if logged-in user hits login pages
│
├── controller/
│   ├── auth.controller.js           # Staff login + logout
│   ├── admin.controller.js          # Admin dashboard, staff CRUD, leave management
│   ├── doctor.controller.js         # Doctor dashboard, consultations, leaves, availability
│   ├── receptionist.controller.js   # Appointments, vitals, patient mgmt, reports
│   └── patient.controller.js        # Patient signup/login, booking, history, payments
│
├── routes/
│   ├── auth.route.js                # /staff/login, /logout
│   ├── admin.route.js               # /admin/*
│   ├── doctor.route.js              # /doctor/*
│   ├── receptionist.route.js        # /receptionist/*
│   └── patient.route.js             # /patient/*
│
├── utils/
│   ├── cron.js                      # Slot generation + cleanup (runs on startup + midnight)
│   └── mail_sender.js               # Nodemailer wrapper (Gmail SMTP)
│
├── views/                           # EJS templates
│   ├── pdms.ejs                     # Landing page
│   ├── admin/                       # admin_dashboard, admin_doctors, receptionist_list, manage_leaves
│   ├── doctor/                      # doctor_dashboard, doctor_all_appoinments, patient_history,
│   │                                #   doctor_profile, doctor_leaves
│   ├── receptionist/                # receptionist_dashboard, receptionist_appointment,
│   │                                #   receptionist_doctorList, receptionist_patientList,
│   │                                #   receptionist_profile, receptionist_addReport,
│   │                                #   receptionist_leaves, department_doctor
│   ├── patient/                     # patient_dashboard, patient_appoinments, patient_history,
│   │                                #   patient_profile, patient_signup, patient_login,
│   │                                #   patient_otp_page, patient_otp_login_page,
│   │                                #   patient_signup_registration, patient_department_doctor,
│   │                                #   payment_status
│   ├── auth/                        # staff_login, session_expired
│   └── components/                  # Shared partials: sidebars, header, footer, modals
│
├── seeds/
│   ├── seedAdmin.js                 # Creates admin + receptionist accounts
│   ├── seedReceptionist.js          # Creates receptionist account
│   ├── seedAllDepartments.js        # Seeds 36 doctors across 12 departments
│   └── generateSlots.js             # Generates 7-day rolling slots for all doctors
│
├── scripts/
│   └── createReceptionistLeavesTable.js  # One-time migration: creates receptionist_leaves table
│
├── scratch/                         # Debug/utility scripts (not production code)
│   ├── check_slots_detailed.js
│   ├── fix_missing_availability.js
│   ├── trigger_sync.js
│   ├── update_availability_schema.js
│   └── verify_slots.js
│
├── public/
│   ├── assets/                      # Images, favicon, logo
│   └── js/
│       ├── patient/                 # Client-side JS for patient portal
│       └── receptionist/            # Client-side JS for receptionist portal
│
├── patient_doctor_management_system.sql  # Full database dump (May 3, 2026)
└── package.json
```

---

## 4. Environment Configuration

File: `.env` (root directory)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=patient_doctor_management_system
PORT=3001

# Cloudinary (patient report uploads)
CLOUD_NAME=<your_cloud_name>
CLOUDINARY_KEY=<your_cloudinary_key>
CLOUDINARY_SECRET=<your_cloudinary_secret>

# Gmail SMTP (system notifications + OTP)
SYSTEM_MAIL_ID=<your_gmail_address>
SYSTEM_MAIL_PASS=<your_gmail_app_password>

# JWT
JWT_SECRET=<your_jwt_secret>
DOC_SET_PASS_SECRET=<your_doc_set_pass_secret>

# Stripe (test keys)
STRIPE_PUBLISHABLE_KEY=pk_test_51T554t...
STRIPE_SECRET_KEY=sk_test_51T554t...
```

### NPM Scripts

```bash
npm start           # node app.js
npm run dev         # nodemon app.js (auto-restart on file change)
npm run seed:admin         # seeds admin + receptionist
npm run seed:receptionist  # seeds receptionist only
npm run seed:doctors       # seeds 36 doctors + generates their slots
npm run seed:all           # runs all three seeds in sequence
```

---

## 5. Database Schema

**Database name:** `patient_doctor_management_system`  
**Engine:** InnoDB | **Charset:** utf8mb4_general_ci  
**Total Tables:** 13

---

### 5.1 `staff`

All hospital staff — admin, doctors, receptionists share one table.

```sql
CREATE TABLE `staff` (
  `id`          int(11) NOT NULL AUTO_INCREMENT,
  `firstname`   varchar(255),
  `lastname`    varchar(255),
  `mobile`      varchar(20),
  `email`       varchar(255) UNIQUE,
  `address`     varchar(255),
  `role_id`     int(11),           -- 1=Admin, 2=Doctor, 3=Receptionist
  `gender`      varchar(20),
  `dob`         date,
  `blood_group` varchar(10),
  `profile_pic` varchar(255),      -- URL (currently unused for upload)
  `password`    varchar(255),      -- bcrypt hashed
  `is_deleted`  tinyint(1) DEFAULT 0,   -- soft delete flag
  `created_at`  timestamp DEFAULT current_timestamp()
);
```

**Notes:**
- `role_id` is a bare integer with no FK to the `role` table (no referential integrity enforced).
- Soft delete via `is_deleted = 1` — queries always filter `WHERE is_deleted = 0`.
- No FK to `role` table exists despite the `role` table being present.

---

### 5.2 `doctor_details`

Doctor-specific professional information, 1:1 with `staff` where `role_id = 2`.

```sql
CREATE TABLE `doctor_details` (
  `id`               int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id`        int(11),      -- FK → staff.id
  `department`       varchar(255),
  `degree`           varchar(255), -- e.g. "MBBS, MD"
  `qualification`    varchar(255), -- e.g. "MD, DM Cardiology"
  `practicing_date`  date,         -- currently NULL for all seeded doctors
  `joining_date`     date,         -- currently NULL for all seeded doctors
  `rating_avg`       float,        -- updated when patient rates
  `total_rating`     int(11),      -- count of all ratings received
  `description`      text,         -- currently NULL for all
  `experience`       varchar(50),  -- stored as string e.g. "14" (years)
  `consultation_fee` decimal(10,2) DEFAULT 200.00,
  `rating`           decimal(3,2)  DEFAULT 0.00,  -- legacy column, not used
  `created_at`       timestamp DEFAULT current_timestamp()
);
```

**Notes:**
- `rating_avg` and `total_rating` are updated in `doctor_details` when a patient submits a rating via `doctor_ratings` table.
- `rating` column is a legacy duplicate of `rating_avg` — never updated by current code.
- `experience` is stored as a varchar string (e.g. `"14"`) not an integer.
- `practicing_date` and `joining_date` are NULL for all 37 seeded doctors.

---

### 5.3 `doctor_availability`

Controls the cron slot generation schedule per doctor.

```sql
CREATE TABLE `doctor_availability` (
  `id`            int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id`     int(11),          -- FK → staff.id
  `start_time`    time,             -- LEGACY: full-day start (now deprecated)
  `end_time`      time,             -- LEGACY: full-day end (now deprecated)
  `duration`      int(11),          -- slot duration in minutes (default 30)
  `max_seats`     int(11) DEFAULT 20,  -- defined but NEVER enforced in code
  `morning_start` time DEFAULT '10:00:00',
  `morning_end`   time DEFAULT '13:00:00',
  `evening_start` time DEFAULT '15:00:00',
  `evening_end`   time DEFAULT '18:00:00',
  `created_at`    timestamp DEFAULT current_timestamp()
);
```

**Default schedule for all 36 seeded doctors:**
- Morning: 10:00–13:00 (6 slots × 30 min = 6 slots)
- Evening: 15:00–18:00 (6 slots × 30 min = 6 slots)
- **12 slots/day × 7 days = 84 slots per doctor**

**Special case — Dr. Nikhil Kumar (id=39):**
- Evening end: `19:00` (extended to 7 PM)
- `start_time` and `end_time` are NULL (set via profile update form which uses `ON DUPLICATE KEY UPDATE` without backfilling legacy columns)

**Notes:**
- `max_seats` column exists but the cron ignores it entirely.
- `start_time`/`end_time` are legacy columns from an earlier schema version, superseded by `morning_start`/`morning_end`/`evening_start`/`evening_end`.

---

### 5.4 `appointment_slots`

The central table of the entire system. Every bookable time unit lives here.

```sql
CREATE TABLE `appointment_slots` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id`  int(11),           -- FK → staff.id
  `patient_id` int(11),           -- FK → patients.id (NULL when available)
  `slot_date`  date,
  `slot_start` time,
  `slot_end`   time,
  `status`     enum('is_available','is_fulfilled','is_occupied','is_in_process')
               DEFAULT 'is_available',
  `reason`     text,              -- cancellation/leave reason
  `created_at` timestamp DEFAULT current_timestamp()
);
```

**Status Values:**

| Status | Meaning |
|--------|---------|
| `is_available` | Open for booking |
| `is_occupied` | Booked by a patient (not yet seen) |
| `is_in_process` | Receptionist sent patient to doctor |
| `is_fulfilled` | Doctor completed consultation |
| `''` (empty string) | **Bug** — code writes `'cancelled'` but it's not in the enum, so MariaDB stores `''` |

**Critical Bug:** `'cancelled'` is missing from the enum definition. The application code sets `status = 'cancelled'` in multiple places, but MariaDB silently stores it as empty string `''`. This affects:
- Patient cancellations (`patient.controller.js`)
- Patient reschedules (old slot cancelled)
- Receptionist reschedules (old slot freed — though receptionist uses `is_available` not `cancelled`)

**Current DB State (from dump — 2026-05-03):**
- AUTO_INCREMENT at 2716, meaning ~2715 slots have been created total
- Approximately 2700 active `is_available` slots across 36 doctors
- 4 slots with empty string status (live cancelled bug)
- 1 `is_fulfilled` slot (the one completed consultation)
- 1 `is_in_process` slot (stuck — consultation never completed)
- 3 `is_occupied` slots (active bookings)

---

### 5.5 `patients`

Patient accounts — no password, login is OTP-only.

```sql
CREATE TABLE `patients` (
  `id`          int(11) NOT NULL AUTO_INCREMENT,
  `firstname`   varchar(255),
  `lastname`    varchar(255),
  `mobile`      varchar(20),
  `email`       varchar(255) UNIQUE,
  `address`     varchar(255),
  `gender`      varchar(20),
  `dob`         date,
  `blood_group` varchar(10),
  `created_at`  timestamp DEFAULT current_timestamp()
);
```

**Current patients in DB (3 total):**

| id | Name | Email | Notes |
|----|------|-------|-------|
| 1 | Varshil Lathiya | varshillathiya@gmail.com | Primary test user — has completed consultation |
| 2 | test test | test@gmail.com | Test account |
| 3 | test2 test2 | test2@gmail.com | Test account — has active booking with Dr. Vinay Kamat |

---

### 5.6 `consultation_records`

Doctor's consultation notes, written after `is_in_process` → `is_fulfilled`.

```sql
CREATE TABLE `consultation_records` (
  `id`           int(11) NOT NULL AUTO_INCREMENT,
  `slot_id`      int(11),           -- FK → appointment_slots.id
  `doctor_id`    int(11),           -- FK → staff.id
  `patient_id`   int(11),           -- FK → patients.id
  `summary_text` text,              -- auto-generated from all fields combined
  `symptoms`     text,
  `observation`  text,
  `diagnosis`    text,
  `conclusion`   text,
  `medicine`     varchar(255),      -- comma-separated medicine names
  `dosage`       varchar(255),      -- comma-separated dosages
  `days`         int(11),           -- BUG: int but code stores comma-separated string
  `instruction`  varchar(255),      -- comma-separated instructions
  `created_at`   timestamp DEFAULT current_timestamp()
);
```

**Bug — `days` column:** Defined as `int(11)` but the application joins multiple medicines:
```js
const durations = medicineList.map(m => m.days).join(", ");
// stores "5, 3, 7" → only "5" survives in an INT column
```

**Only 1 record exists in the current DB:**
- id=1, slot_id=2630, doctor_id=39 (Nikhil Kumar), patient_id=1 (Varshil Lathiya)
- Diagnosis: "maleria" (test data, typo of malaria)
- Medicine: Paracetamol, 500mg, 5 days, After Breakfast

---

### 5.7 `patient_vitals`

Pre-consultation vitals recorded by receptionist before sending patient to doctor.  
Uses **EAV (Entity-Attribute-Value)** pattern.

```sql
CREATE TABLE `patient_vitals` (
  `id`           int(11) NOT NULL AUTO_INCREMENT,
  `slot_id`      int(11),           -- FK → appointment_slots.id
  `entity_type`  varchar(60),       -- 'BP', 'Weight', 'Temp', 'HR', 'SpO2'
  `entity_value` varchar(60),
  `patient_id`   int(11)            -- FK → patients.id
);
```

**Entity types used:** `BP`, `Weight`, `Temp`, `HR`, `SpO2`

**Critical Bug — Missing UNIQUE constraint:**  
The application uses `ON DUPLICATE KEY UPDATE entity_value = ?` but the table has **no unique index** on `(slot_id, entity_type)`. Without the unique constraint, `ON DUPLICATE KEY UPDATE` silently falls back to a regular INSERT, creating duplicate vital rows for every update.

**Current state:** 0 rows (empty in the dump).

---

### 5.8 `patient_reports`

Lab reports uploaded by receptionist, stored on Cloudinary.

```sql
CREATE TABLE `patient_reports` (
  `id`          int(11) NOT NULL AUTO_INCREMENT,
  `patient_id`  int(11),           -- FK → patients.id
  `report_name` varchar(255),      -- original filename
  `report_url`  varchar(255),      -- Cloudinary URL
  `upload_date` date,
  `created_at`  timestamp DEFAULT current_timestamp()
);
```

Accepted formats: `jpg`, `png`, `pdf`. Uploaded to Cloudinary folder `pdms_reports`.  
**Current state:** 0 rows (empty in the dump).

---

### 5.9 `doctor_leaves`

Leave requests submitted by doctors, approved/rejected by admin.

```sql
CREATE TABLE `doctor_leaves` (
  `id`           int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id`    int(11),           -- FK → staff.id
  `from_date`    date,
  `to_date`      date,
  `reason`       text,
  `status`       enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_remark` text,
  `created_at`   timestamp DEFAULT current_timestamp()
);
```

**Current records (all for Dr. Nikhil Kumar, doctor_id=39):**

| id | From | To | Reason | Status |
|----|------|----|--------|--------|
| 1 | 2026-05-07 | 2026-05-07 | family function | approved |
| 2 | 2026-05-08 | 2026-05-08 | feaver | approved |
| 3 | 2026-05-06 | 2026-05-06 | feaver | approved |
| 4 | 2026-05-05 | 2026-05-05 | feaver | approved |

**Leave approval side effects:**
1. Email sent to the doctor with status + admin remark
2. Email sent to all patients with `is_occupied` slots during the leave period
3. Affected slots get `reason = 'Doctor on Emergency Leave'` set
4. Patient dashboard shows an alert for these affected slots

---

### 5.10 `receptionist_leaves`

Same structure as `doctor_leaves` but for receptionists.  
**Requires manual migration:** `node scripts/createReceptionistLeavesTable.js`

```sql
CREATE TABLE `receptionist_leaves` (
  `id`               int(11) NOT NULL AUTO_INCREMENT,
  `receptionist_id`  int(11) NOT NULL,   -- FK → staff.id (NOT NULL, unlike doctor_leaves)
  `from_date`        date NOT NULL,
  `to_date`          date NOT NULL,
  `reason`           text,
  `status`           enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_remark`     text,
  `created_at`       timestamp DEFAULT current_timestamp()
);
```

**Current state:** 0 rows (empty in the dump).  
**Schema difference:** Uses `NOT NULL` on key fields unlike `doctor_leaves` which allows NULLs.

---

### 5.11 `doctor_ratings`

Patient ratings submitted after consultation is fulfilled.

```sql
CREATE TABLE `doctor_ratings` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id`  int(11),           -- FK → staff.id
  `patient_id` int(11),           -- FK → patients.id
  `slot_id`    int(11),           -- FK → appointment_slots.id
  `rating`     int(11),           -- 1–5 star
  `comment`    varchar(255),
  `created_at` timestamp DEFAULT current_timestamp()
);
```

On insert, `doctor_details.rating_avg` and `doctor_details.total_rating` are recalculated:
```js
SELECT AVG(rating), COUNT(*) FROM doctor_ratings WHERE doctor_id = ?
UPDATE doctor_details SET rating_avg = ?, total_rating = ?
```

**Current state:** 0 rows (no ratings submitted yet).

---

### 5.12 `patient_histories`

**UNUSED TABLE.** Created but never written to or read by any application code.

```sql
CREATE TABLE `patient_histories` (
  `id`        int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11),  -- FK → patients.id
  `doctor_id`  int(11),  -- FK → staff.id
  `slot_id`    int(11),  -- FK → appointment_slots.id
  `weight`     varchar(20),
  `height`     varchar(20),
  `disease`    varchar(255),
  `doctor_pr`  varchar(255),   -- likely "doctor prescription"
  `doctor_sr`  varchar(255),   -- likely "doctor summary report"
  `created_at` timestamp DEFAULT current_timestamp()
);
```

This was the original design for consultation records, superseded by `consultation_records` + `patient_vitals`. Dead schema.

---

### 5.13 `slot_updates`

**UNUSED TABLE.** Designed as an audit log for appointment reschedule/cancel actions — never wired up.

```sql
CREATE TABLE `slot_updates` (
  `id`          int(11) NOT NULL AUTO_INCREMENT,
  `slot_id`     int(11),           -- FK → appointment_slots.id
  `reschedule`  int(11),
  `action_by`   varchar(20),       -- 'patient', 'receptionist', etc.
  `entity_type` varchar(100),
  `entity_id`   int(11),
  `reason`      varchar(255),
  `created_at`  timestamp DEFAULT current_timestamp()
);
```

---

### 5.14 `role`

Reference table with 3 rows — not queried by any application code and has no FK enforcing `staff.role_id`.

| id | role_name |
|----|-----------|
| 1 | Admin |
| 2 | Doctor |
| 3 | Receptionist |

---

### Entity-Relationship Summary

```
staff (1) ──────────────── (1) doctor_details
staff (1) ──────────────── (1) doctor_availability
staff (1) ──────────────── (*) doctor_leaves
staff (1) ──────────────── (*) receptionist_leaves
staff (1) ──────────────── (*) appointment_slots  [as doctor_id]
staff (1) ──────────────── (*) consultation_records [as doctor_id]
staff (1) ──────────────── (*) doctor_ratings

patients (1) ──────────── (*) appointment_slots  [as patient_id]
patients (1) ──────────── (*) consultation_records
patients (1) ──────────── (*) patient_vitals
patients (1) ──────────── (*) patient_reports
patients (1) ──────────── (*) doctor_ratings

appointment_slots (1) ─── (1) consultation_records [slot_id]
appointment_slots (1) ─── (*) patient_vitals       [slot_id]
appointment_slots (1) ─── (*) doctor_ratings        [slot_id]
appointment_slots (1) ─── (*) slot_updates          [slot_id] -- UNUSED
```

---

## 6. Authentication System

### Staff Authentication (Admin / Doctor / Receptionist)

**File:** `controller/auth.controller.js`, `middleware/auth.middleware.js`

1. POST `/staff/login` with `{ email, password }`
2. Query `staff` table: `WHERE email = ? AND is_deleted = 0`
3. `bcrypt.compare(password, staff.password)`
4. On success: sign JWT `{ id, role }` with `JWT_SECRET`, expire `1d`
5. Set as HttpOnly cookie named `token`, `maxAge: 24h`
6. Response includes `role` string → client redirects to correct portal

**Middleware `protect()`:**
```
Cookie token present?
  No  → redirect /session-expired
  Yes → jwt.verify()
          Fail → clearCookie, redirect /session-expired
          Pass → 
            role=patient  → SELECT * FROM patients WHERE id = ?
            role=staff    → SELECT s.*, dd.* FROM staff s
                            LEFT JOIN doctor_details dd ON s.id = dd.doctor_id
                            WHERE s.id = ?
          → set req.user + res.locals.user → next()
```

**Middleware `restrictTo(...roles)`:**  
Checks `req.user.role` against allowed roles. Returns 403 if not allowed.

**Middleware `authRedirect`:**  
Applied to login pages. If cookie exists, clears it and redirects to `/session-expired`. Prevents going back to login while logged in.

---

### Patient Authentication (OTP-based)

**Signup flow:**
1. GET `/patient/signup/email` → email entry form
2. POST `/patient/signup/emailVerification`
   - Checks email not already registered
   - Generates 6-digit OTP, bcrypt-hashes it
   - Sends OTP via email (Nodemailer)
   - Stores `{ email, hashedOTP }` in cookie `signup_details` (10 min TTL)
   - ⚠️ OTP also logged to console (debug leftover)
3. GET `/patient/signup/otp_verifiaction_page` → OTP entry form
4. POST `/patient/signup/otp_verification`
   - Reads cookie, `bcrypt.compare(otp, hashedOTP)`
5. GET `/patient/signup/registration_details` → full registration form
6. POST `/patient/signup/insert_registration_details` → inserts into `patients`, clears cookie

**Login flow:**
1. GET `/patient/login` → email entry form
2. POST `/patient/login/emailVerification`
   - Checks email exists in `patients`
   - Generates OTP, emails it, stores in cookie `login_details` (10 min TTL)
3. GET `/patient/login/otpVerificationPage` → OTP entry form
4. POST `/patient/login/otp_verification`
   - Verifies OTP from cookie
   - Signs JWT `{ id, role: 'patient' }`, sets HttpOnly cookie `token`
   - Returns token in JSON response body (redundant — cookie is enough)

---

## 7. Role Portals & Features

### 7.1 Admin Portal (`/admin/*`)

**All routes protected:** `protect()` + `restrictTo('admin')`

#### Dashboard (`GET /admin/dashboard`)
Renders KPI counts in a single page:
- Doctor count, Receptionist count, Patient count
- Appointment count (occupied + fulfilled, up to current date)
- Pending leaves count (doctor + receptionist combined)
- Staff on leave today (UNION of doctor_leaves + receptionist_leaves)

#### Doctor List (`GET /admin/doctors`)
- Lists all non-deleted doctors with joined `doctor_details`
- Shows 14 department categories (merged from hardcoded list + DB values)
- Supports add/edit/delete operations via JS modals

#### Receptionist List (`GET /admin/receptionist`)
- Lists all non-deleted receptionists
- Shows staff count and patient count as header stats

#### Staff Management (CRUD)
| Method | Route | Action |
|--------|-------|--------|
| GET | `/admin/staff/:id` | Fetch single staff (JSON) — for edit modal |
| POST | `/admin/add-staff` | Create staff; if doctor: also inserts doctor_details + doctor_availability; triggers syncAllDoctorSlots() |
| POST | `/admin/update-staff/:id` | Update staff; if doctor: updates doctor_details + availability; triggers syncAllDoctorSlots() |
| DELETE | `/admin/delete-staff/:id` | Soft delete (is_deleted = 1) |

**Default password on add:** `Pdms@123` (if no password provided)

#### Leave Management (`GET /admin/manage-leaves`)
- UNION query of doctor_leaves + receptionist_leaves
- Status counts (pending/approved/rejected)

**`POST /admin/update-leave-status`:**
1. Updates status + admin_remark in appropriate table
2. Sends email to staff member (approved/rejected with remark)
3. **If doctor leave approved:**
   - Fetches all `is_occupied` slots in the leave date range for this doctor
   - Emails each affected patient with emergency notice
   - Sets `reason = 'Doctor on Emergency Leave'` on those slots

---

### 7.2 Doctor Portal (`/doctor/*`)

**All routes protected:** `protect()` + `restrictTo('doctor')`

#### Dashboard (`GET /doctor/dashboard`)
Three data sets rendered:
1. **In-Process today:** `status = 'is_in_process'` — patient currently with doctor
2. **Upcoming today:** `status = 'is_occupied' AND DATE(slot_date) = CURDATE()`
3. **Today's stats:** total / pending / fulfilled count for today

#### All Appointments (`GET /doctor/appoinments`)
Three tabs:
1. **Upcoming:** `is_in_process` OR (`is_occupied` AND date >= today)
2. **Past/No-show:** `is_occupied` OR `is_in_process` AND date < today
3. **Completed:** `is_fulfilled` — last 50 records

#### Patient History (`GET /doctor/patient_history/:patient_id/:slot_id`)
Complete patient view before/during consultation:
- Patient demographics
- Latest vitals (from `patient_vitals`, grouped by slot_id, newest first)
- Full consultation history (all past `consultation_records`)
- All uploaded reports (`patient_reports`)

#### Record Consultation (`POST /doctor/record-consultation`)
Body: `{ slot_id, patient_id, symptoms, observation, diagnosis, conclusion, medicines[] }`
1. Constructs `summary_text` from all text fields
2. Joins `medicines[]` array: names comma-separated, dosages comma-separated, etc.
3. Inserts into `consultation_records`
4. Updates slot `status = 'is_fulfilled'`

#### Set Availability (`POST /doctor/set-availability`)
Legacy endpoint — generates slots for a specific date directly (not used by main UI).

#### Update Profile (`POST /doctor/update-profile`)
Updates `staff`, `doctor_details`, `doctor_availability` tables.  
Triggers `syncAllDoctorSlots()` after saving.

#### Leave System
- `GET /doctor/leaves` — lists all leaves for logged-in doctor with approved count
- `POST /doctor/apply-leave` — checks for overlap with pending/approved leaves before inserting

---

### 7.3 Receptionist Portal (`/receptionist/*`)

**All routes protected:** `protect()` + `restrictTo('receptionist')`

#### Dashboard (`GET /receptionist/dashboard`)
Four appointment tabs:
1. **Upcoming:** `is_occupied` AND date >= today
2. **In Process:** `is_in_process`
3. **Completed:** `is_fulfilled` — last 20
4. **Absent:** `is_occupied` AND date < today (patient didn't show)

Stats: pending today count, total patient count.

#### Appointment Operations

| Endpoint | Action |
|----------|--------|
| `POST /receptionist/book-appointment` | Sets slot patient_id + status = is_occupied |
| `POST /receptionist/cancel-appointment` | Resets patient_id = NULL, status = is_available |
| `POST /receptionist/reschedule-appointment` | **Uses DB transaction:** frees old slot, books new slot atomically |
| `POST /receptionist/start-consultation` | Sets status = is_in_process; blocks if doctor already has active session |
| `POST /receptionist/update-vitals` | Inserts/updates BP, Weight, Temp, HR, SpO2 in patient_vitals |
| `GET /receptionist/get-slots` | Returns available slots for a doctor on a given date (for reschedule UI) |

**`start-consultation` guard:**
```js
SELECT id FROM appointment_slots WHERE doctor_id = ? AND status = 'is_in_process'
// If any results → 400 "doctor already has consultation in progress"
```

#### Patient Operations

| Endpoint | Action |
|----------|--------|
| `POST /receptionist/verify-patient` | Find patient by email (returns id, name) |
| `POST /receptionist/register-patient` | Insert into patients table directly (no OTP) |
| `POST /receptionist/update-patient` | Update patient demographics |

#### Report Upload (`POST /receptionist/uploadReport`)
- Uses Multer + Cloudinary storage
- Accepts jpg, png, pdf
- Uploads to Cloudinary folder `pdms_reports`
- Stores URL + original filename in `patient_reports`

#### Department View (`GET /receptionist/department/:department`)
Lists all doctors in a given department with rating info.

#### Leave System
Same as doctor: `GET /receptionist/leaves`, `POST /receptionist/apply-leave`

---

### 7.4 Patient Portal (`/patient/*`)

Public routes do not require auth. Protected routes use `protect()` + `restrictTo('patient')`.

#### Dashboard (`GET /patient/dashboard`)
- Upcoming appointment count (future `is_occupied` slots)
- Total visit/consultation count (from `consultation_records`)
- Emergency leave alerts: slots where `reason = 'Doctor on Emergency Leave'`
- List of all departments for browsing

#### Browse & Book Flow

1. `GET /patient/dashboard/department/:department` → Lists doctors in dept with available slot count
2. `GET /patient/get-slots?doctor_id=&date=` → Returns available time slots for a doctor on a date
   - Checks if doctor is on approved leave for that date first
   - Filters out past times if date is today
3. `POST /patient/create-checkout-session` → Creates Stripe Checkout session
   - Checks no active appointment already exists with this doctor
   - Fee: ₹200 (from `config/doctor_pricing.js`)
   - Success URL: `/patient/payment-success?session_id={CHECKOUT_SESSION_ID}&slot_id={slot_id}`
4. `GET /patient/payment-success` → Verifies Stripe session payment status
   - On `paid`: marks slot `is_occupied` with patient_id
   - Renders `patient/payment_status` view

#### Appointment Management

| Endpoint | Action |
|----------|--------|
| `GET /patient/appointments` | Lists all patient's appointments with computed display_status |
| `POST /patient/book-appointment` | Direct booking without payment (fallback path) |
| `POST /patient/cancel-appointment` | Sets status='cancelled' (stored as '' due to enum bug) |
| `POST /patient/reschedule-appointment` | Cancels old slot, books new slot — **no transaction** |

**`display_status` logic in appointments query:**
```sql
CASE
  WHEN status = 'is_occupied' AND (slot_date < CURDATE() OR slot_start < CURTIME()) THEN 'missed'
  WHEN status = 'is_occupied' THEN 'upcoming'
  WHEN status = 'is_fulfilled' THEN 'fulfilled'
  ELSE status
END as display_status
```

#### History & Rating

- `GET /patient/history` → All `consultation_records` for this patient with doctor + date
- `POST /patient/rate-doctor` → Inserts into `doctor_ratings`, recalculates `doctor_details.rating_avg`

#### Profile

- `GET /patient/profile` → Patient profile page
- `POST /patient/profile/update` → Updates firstname, lastname, mobile, dob, address, gender, blood_group
- `GET /patient/userdetails` → JSON endpoint for patient details

---

## 8. Appointment Lifecycle

```
[CRON creates slot]
       │
       ▼
  is_available  ────────────────────────────────────────────────┐
       │                                                         │
  Patient books (Stripe payment)                        Cron deletes if
  OR Receptionist books directly                        past + still available
       │
       ▼
  is_occupied   ◄──── Emergency Leave: reason = 'Doctor on Emergency Leave'
       │                                set by admin when approving leave
       │
  Receptionist records vitals
  Receptionist clicks "Start Consultation"
       │
       ▼
  is_in_process
       │
  Doctor records consultation in doctor portal
       │
       ▼
  is_fulfilled  ──── Patient can now rate doctor
```

**Cancellation paths (both store '' due to enum bug):**
- Patient cancels → `status = 'cancelled'`, `patient_id = NULL`
- Patient reschedules → old slot `status = 'cancelled'`, `patient_id = NULL`
- Receptionist cancels → `status = 'is_available'`, `patient_id = NULL` (different — resets to available)
- Receptionist reschedules → **uses DB transaction**, old slot → `is_available`, new slot → `is_occupied`

---

## 9. Cron / Slot Generation System

**File:** `utils/cron.js`

### Startup Behaviour

When `app.js` starts → calls `initCronJobs()`:
1. Runs `cleanupExpiredSlots()` immediately
2. Runs `syncAllDoctorSlots()` immediately
3. Schedules both to run again at `"0 0 * * *"` (midnight daily)

### `syncAllDoctorSlots()`

```
Fetch all rows from doctor_availability
For each doctor's availability:
  For days i = 0..6 (today + next 6 days):
    Generate morning slots (morning_start → morning_end, in duration-minute steps)
    Generate evening slots (evening_start → evening_end, in duration-minute steps)
    
    Before inserting each slot:
      1. Skip if slot_date < today (past date)
      2. Skip if doctor has approved leave covering slot_date
      3. Skip if slot_start <= current time (if today)
      4. Check if slot already exists → INSERT only if not
```

Triggered manually when:
- Admin adds a new doctor
- Admin updates a doctor's availability
- Doctor updates their own availability

### `cleanupExpiredSlots()`

```
Find all slots WHERE:
  status IN ('is_available', '', NULL)
  AND (slot_date < today OR (slot_date = today AND slot_start < current_time))

→ Delete associated patient_vitals (orphan cleanup)
→ Delete the slots
```

**Important:** Only deletes `is_available` (and empty/null status) slots. `is_occupied`, `is_in_process`, `is_fulfilled` slots are never deleted — they form the appointment history.

### `generateSlotsForDoctor(doctor_id, slot_date, start_time, end_time, duration)`

The core slot-creation function. Called in a loop by `syncAllDoctorSlots`.

---

## 10. Payment System (Stripe)

**Test mode** — Stripe publishable + secret keys in `.env` are `pk_test_...` / `sk_test_...`

### Flow

```
POST /patient/create-checkout-session
  → Validate: no existing active appointment with this doctor
  → Validate: slot still is_available
  → stripe.checkout.sessions.create({
      amount: 200 * 100,  // ₹200 in paise
      currency: 'inr',
      success_url: /patient/payment-success?session_id={CHECKOUT_SESSION_ID}&slot_id={slot_id}
      cancel_url: /patient/dashboard
      metadata: { slot_id, patient_id, doctor_id }
    })
  → Return { url: session.url }

[User completes payment on Stripe hosted page]

GET /patient/payment-success?session_id=...&slot_id=...
  → stripe.checkout.sessions.retrieve(session_id)
  → If payment_status === 'paid':
      UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ?
      Render payment_status view (success)
  → Else: Render payment_status view (failure)
```

### Known Payment Risk

There is **no Stripe webhook** implemented. If the user closes the browser after payment but before the redirect, the slot will remain `is_available` even though Stripe has charged the patient. A webhook on `checkout.session.completed` would fix this but is not implemented.

### Fixed Fee

`config/doctor_pricing.js`: `{ fee: 200 }` — ₹200 for all doctors regardless of department or seniority.

---

## 11. Email System (Nodemailer)

**File:** `utils/mail_sender.js`

```js
function mailSender(to, subject, text, html)
```

Uses Gmail SMTP with app password. Called in:

| Trigger | Recipients | Content |
|---------|-----------|---------|
| Patient OTP signup | Patient | 6-digit OTP |
| Patient OTP login | Patient | 6-digit OTP |
| Admin approves/rejects leave | Staff member | Leave status + admin remark |
| Admin approves doctor leave | Affected patients | Emergency notice with appointment details |

**All emails are fire-and-forget** — no callback handling if delivery fails.

---

## 12. File Upload (Cloudinary)

**File:** `config/cloudinary.config.js`

```js
CloudinaryStorage → folder: 'pdms_reports', allowed_formats: ['jpg', 'png', 'pdf']
multer({ storage }) → exported as `upload`
```

Used only in one route:
```
POST /receptionist/uploadReport → upload.single('report')
```

Cloudinary URL stored in `patient_reports.report_url`.

---

## 13. Seed Data & Current DB State

### Seeded Staff (39 total)

| id | Name | Role | Department |
|----|------|------|-----------|
| 1 | System Admin | Admin | — |
| 2 | Jane Receptionist | Receptionist | — |
| 3 | Rahul Desai | Doctor | Neurology |
| 4 | Ananya Iyer | Doctor | Neurology |
| 5 | Vikram Singh | Doctor | Neurology |
| 6 | Meera Reddy | Doctor | Orthopedics |
| 7 | Sanjay Gupta | Doctor | Orthopedics |
| 8 | Rohan Mehta | Doctor | Orthopedics |
| 9 | Sneha Kapoor | Doctor | Oncology |
| 10 | Aditya Verma | Doctor | Oncology |
| 11 | Kavyesh Nair | Doctor | Oncology |
| 12 | Nandini Rao | Doctor | Pediatrics |
| 13 | Karan Joshi | Doctor | Pediatrics |
| 14 | Pooja Bhat | Doctor | Pediatrics |
| 15 | Arjun Menon | Doctor | Pulmonology |
| 16 | Riya Shah | Doctor | Pulmonology |
| 17 | Vishal Agarwal | Doctor | Pulmonology |
| 18 | Neha Choudhary | Doctor | Rheumatology |
| 19 | Gaurav Mishra | Doctor | Rheumatology |
| 20 | Shweta Tiwari | Doctor | Rheumatology |
| 21 | Prakash Kumawat | Doctor | Gastroenterology |
| 22 | Anita Pandey | Doctor | Gastroenterology |
| 23 | Rakesh Yadav | Doctor | Gastroenterology |
| 24 | Divya Shetty | Doctor | Ophthalmology |
| 25 | Ashok Kumar | Doctor | Ophthalmology |
| 26 | Kavita Jain | Doctor | Ophthalmology |
| 27 | Siddharth Mukherjee | Doctor | Nephrology |
| 28 | Aarti Kulkarni | Doctor | Nephrology |
| 29 | Manish Garg | Doctor | Nephrology |
| 30 | Sonal Chauhan | Doctor | ENT |
| 31 | Deepak Sharma | Doctor | ENT |
| 32 | Ritu Banerjee | Doctor | ENT |
| 33 | Alok Nath | Doctor | Emergency |
| 34 | Nisha Das | Doctor | Emergency |
| 35 | Harish Rao | Doctor | Emergency |
| 36 | Vinay Kamat | Doctor | Cardiology |
| 37 | Smriti Menon | Doctor | Cardiology |
| 38 | Gautam Bose | Doctor | Cardiology |
| 39 | Nikhil Kumar | Doctor | Cardiology (manually added) |

**Default credentials:**
- Seeded doctors: `pdms@123`
- Admin/Receptionist: `Pdms@123`
- Manually added staff (id=39): Custom hash (different)

### Interesting Anomalies in Actual Data

1. **Slot id=367** (Doctor 8, Rohan Mehta) — status=`''`, reason=`'doctor is on leave'` but no leave record exists for doctor 8. Created at exact seed time. Manual test artifact.

2. **Dr. Nikhil Kumar's availability** (id=37 in doctor_availability) — `evening_end = '19:00'` (extended past standard 18:00), `start_time` and `end_time` are NULL (profile update form doesn't set legacy columns).

3. **Stuck `is_in_process` slot** (id=2631) — Patient 1 was sent to Dr. Nikhil Kumar for a 10:30 slot but the doctor never completed the consultation. This slot is permanently stuck unless manually updated.

4. **Rescheduled slot** (id=2654) — `reason = 'Rescheduled: '` with empty reason string. The patient rescheduled an appointment on May 5 with an empty reason text.

---

## 14. API Route Reference

### Auth Routes (`/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/staff/login` | None (authRedirect) | Staff login page |
| POST | `/staff/login` | None | Staff login → JWT cookie |
| GET | `/logout` | None | Clear cookie → redirect login |
| GET | `/session-expired` | None | Session expired page |

### Patient Routes (`/patient/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/login` | None | Login page |
| GET | `/signup/email` | None | Signup email entry |
| POST | `/signup/emailVerification` | None | Send OTP |
| GET | `/signup/otp_verifiaction_page` | None | OTP entry page |
| POST | `/signup/otp_verification` | None | Verify OTP |
| GET | `/signup/registration_details` | None | Registration form |
| POST | `/signup/insert_registration_details` | None | Create patient |
| POST | `/login/emailVerification` | None | Login: send OTP |
| GET | `/login/otpVerificationPage` | None | Login OTP page |
| POST | `/login/otp_verification` | None | Login: verify OTP → JWT |
| GET | `/dashboard` | Patient | Dashboard |
| GET | `/dashboard/department/:department` | Patient | Doctors by specialty |
| GET | `/get-slots` | Patient | Available slots (query: doctor_id, date) |
| GET | `/appointments` | Patient | All appointments |
| POST | `/book-appointment` | Patient | Direct book (no payment) |
| POST | `/create-checkout-session` | Patient | Stripe checkout |
| GET | `/payment-success` | Patient | Post-payment slot booking |
| POST | `/cancel-appointment` | Patient | Cancel appointment |
| POST | `/reschedule-appointment` | Patient | Reschedule appointment |
| GET | `/history` | Patient | Consultation history |
| POST | `/rate-doctor` | Patient | Submit doctor rating |
| GET | `/profile` | Patient | Profile page |
| POST | `/profile/update` | Patient | Update profile |
| GET | `/userdetails` | Patient | JSON: patient details |
| GET | `/logout` | Patient | Clear cookie → home |

### Doctor Routes (`/doctor/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Doctor | Dashboard |
| GET | `/appoinments` | Doctor | All appointments |
| GET | `/patient_history/:patient_id/:slot_id` | Doctor | Patient detail view |
| POST | `/record-consultation` | Doctor | Save consultation notes |
| POST | `/set-availability` | Doctor | Legacy: generate slots for a date |
| GET | `/profilePage` | Doctor | Profile page |
| POST | `/update-profile` | Doctor | Update profile + availability |
| GET | `/leaves` | Doctor | Leaves page |
| POST | `/apply-leave` | Doctor | Submit leave request |

### Receptionist Routes (`/receptionist/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Receptionist | Dashboard |
| GET | `/appointments` | Receptionist | Appointments page |
| GET | `/doctors` | Receptionist | Doctor list |
| GET | `/patients` | Receptionist | Patient list |
| GET | `/profile` | Receptionist | Profile page |
| GET | `/addReport` | Receptionist | Report upload page |
| POST | `/book-appointment` | Receptionist | Book slot for patient |
| POST | `/update-vitals` | Receptionist | Record vitals |
| POST | `/uploadReport` | Receptionist | Upload report to Cloudinary |
| POST | `/cancel-appointment` | Receptionist | Cancel → is_available |
| POST | `/reschedule-appointment` | Receptionist | Transactional reschedule |
| POST | `/start-consultation` | Receptionist | Send patient to doctor |
| POST | `/verify-patient` | Receptionist | Find patient by email |
| POST | `/register-patient` | Receptionist | Create patient (no OTP) |
| POST | `/update-patient` | Receptionist | Edit patient details |
| GET | `/get-slots` | Receptionist | Available slots for reschedule |
| GET | `/leaves` | Receptionist | Leaves page |
| POST | `/apply-leave` | Receptionist | Submit leave request |
| GET | `/department/:department` | Receptionist | Doctors in department |

### Admin Routes (`/admin/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Admin | Dashboard with KPIs |
| GET | `/doctors` | Admin | Doctor list |
| GET | `/receptionist` | Admin | Receptionist list |
| GET | `/staff/:id` | Admin | Get staff by ID (JSON) |
| POST | `/add-staff` | Admin | Create staff member |
| POST | `/update-staff/:id` | Admin | Update staff member |
| DELETE | `/delete-staff/:id` | Admin | Soft delete staff |
| GET | `/manage-leaves` | Admin | All leave requests |
| POST | `/update-leave-status` | Admin | Approve/reject leave |

---

## 15. Known Bugs & Issues

### Bug 1 — `'cancelled'` Missing from `appointment_slots.status` Enum ⚠️ HIGH

**File:** `patient_doctor_management_system.sql`, line 36

```sql
-- Current (broken):
`status` enum('is_available','is_fulfilled','is_occupied','is_in_process') DEFAULT 'is_available'

-- Should be:
`status` enum('is_available','is_fulfilled','is_occupied','is_in_process','cancelled') DEFAULT 'is_available'
```

**Impact:** Every patient cancellation and patient-side reschedule stores `''` (empty string) instead of `'cancelled'`. The cron cleanup query targets `status = 'is_available' OR status = '' OR status IS NULL` which accidentally deletes cancelled slots on next cleanup run. Live evidence: 4 rows in dump with `status = ''`.

**Fix:**
```sql
ALTER TABLE appointment_slots 
  MODIFY COLUMN status enum('is_available','is_fulfilled','is_occupied','is_in_process','cancelled') 
  DEFAULT 'is_available';
```

---

### Bug 2 — `patient_vitals` Missing UNIQUE Constraint ⚠️ HIGH

**File:** `patient_doctor_management_system.sql`, line 2999

The application uses:
```js
INSERT INTO patient_vitals ... ON DUPLICATE KEY UPDATE entity_value = ?
```
But there is no `UNIQUE` key on `(slot_id, entity_type)`. Without the constraint, the `ON DUPLICATE KEY` clause never triggers — every vitals call inserts a new row instead of updating.

**Fix:**
```sql
ALTER TABLE patient_vitals 
  ADD UNIQUE KEY uq_slot_entity (slot_id, entity_type);
```

---

### Bug 3 — `consultation_records.days` Column Type ⚠️ MEDIUM

**File:** `patient_doctor_management_system.sql`, line 2743

```sql
`days` int(11) DEFAULT NULL
```

The application stores: `medicineList.map(m => m.days).join(", ")` — e.g. `"5, 3, 7"`. An INT column truncates this to `5`, silently discarding duration data for all medicines after the first.

**Fix:**
```sql
ALTER TABLE consultation_records MODIFY COLUMN days varchar(255);
```

---

### Bug 4 — OTP Logged to Console ⚠️ MEDIUM (Security)

**File:** `controller/patient.controller.js`, lines 413 and 452

```js
console.log("the patient opt is >>>>>>>>>>", otp);   // signup
console.log("the patient opt is lp >>>>>>>>>>", otp); // login
```

OTPs are printed in plain text to server logs. In a hosted environment, anyone with log access can hijack any patient account.

**Fix:** Remove both console.log lines.

---

### Bug 5 — Patient Reschedule Has No Transaction ⚠️ MEDIUM

**File:** `controller/patient.controller.js`, `rescheduleAppointment`

```js
// Step 1: cancel old slot
await db.execute("UPDATE appointment_slots SET status = 'cancelled' ... WHERE id = ?", [old_slot_id]);
// Step 2: book new slot  
await db.execute("UPDATE appointment_slots SET patient_id = ? ... WHERE id = ?", [patientId, new_slot_id]);
```

If the server crashes or the new slot was taken between these two queries, the patient loses their original slot with no new slot booked.

Compare to `receptionist.controller.js → rescheduleAppointment` which correctly uses a DB transaction.

**Fix:** Wrap both queries in a transaction (same pattern as receptionist reschedule).

---

### Bug 6 — Double `module.exports` in `receptionist.controller.js` ⚠️ LOW

**File:** `controller/receptionist.controller.js`, lines ~336 and ~424

The file has two `module.exports = { ... }` blocks. The second one overwrites the first. Functions only in the first block would be silently dropped. Currently all needed functions appear in the second block too, so nothing is broken — but it's fragile and confusing.

**Fix:** Remove the first `module.exports` block (lines ~336–351), keep only the second one.

---

### Bug 7 — No Stripe Webhook ⚠️ MEDIUM

Booking confirmation depends entirely on the success redirect URL. If the user closes the browser after payment but before redirect, the slot stays `is_available` while Stripe has charged them.

**Fix:** Implement a Stripe webhook on `checkout.session.completed` to reliably confirm bookings server-side.

---

### Bug 8 — Single DB Connection (Not a Pool) ℹ️ LOW

**File:** `config/db.config.js`

```js
const connection = mysql.createConnection({ ... });
module.exports = connection.promise();
```

A single connection means one query at a time and will fail silently under concurrent load. `db.getConnection()` is called in the receptionist reschedule transaction but `createConnection` doesn't support connection pools — this works in dev but is not production-safe.

**Fix:** Switch to `mysql.createPool({ ... })` and `module.exports = pool.promise()`.

---

## 16. Design Decisions & Gotchas

### Global Cache-Control Headers

All responses carry:
```
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
```
This was added specifically to prevent the browser back-button from serving stale bfcache pages after logout.

### Staff vs Patient — Unified Token, Split Tables

Both staff and patients use `token` as the cookie name with the same JWT secret. The `protect` middleware distinguishes them by the `role` field in the JWT payload: `role === 'patient'` queries `patients` table; everything else queries `staff` table.

### `authRedirect` Middleware Behaviour

When a logged-in user (valid cookie) navigates to a login page, the middleware **clears their cookie** and redirects to `/session-expired` rather than just redirecting to their dashboard. This is intentional — it prevents sharing login URLs from logging someone out silently.

### `syncAllDoctorSlots` Called Synchronously on Profile Save

When a doctor or admin updates availability, `syncAllDoctorSlots()` is called without `await`. The API response returns immediately while slot generation runs in the background. This means the UI shows "success" before slots are actually updated.

### EAV Pattern for Vitals

`patient_vitals` uses Entity-Attribute-Value instead of fixed columns (`bp`, `weight`, etc.). This makes it easy to add new vital types without schema changes but harder to query (requires pivoting). The current query in `doctor.controller.js` builds a JS object from the array of rows.

### Unused Tables Are Still FK-Referenced

`patient_histories` and `slot_updates` have no application code but do have FK constraints. They cannot be dropped without also dropping those constraints.

### Departments Hardcoded in Admin Controller

`admin.controller.js` `doctors_list` has a hardcoded array of 14 departments:
```js
const defaultDepts = ['Cardiology', 'Neurology', 'Orthopedics', ...]
```
These are merged with `DISTINCT department` from the DB. Adding a new department without adding a doctor first requires updating the code.

### ID Gaps in `appointment_slots`

The sequential IDs in `appointment_slots` skip exactly one number between each doctor's block (IDs 1, 74, 147, 220... are missing). These were the first slots generated on May 2 (the seed date) which were cleaned up by `cleanupExpiredSlots()` on server startup.

---

*End of Documentation*
