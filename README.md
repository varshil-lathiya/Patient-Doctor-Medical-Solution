# PDMS — Patient Doctor Management System

> A full-stack hospital management web application for **Kalp Hospital**, built with Node.js + Express. Manage patients, doctors, receptionists, and appointments — all in one place, with online payments and automated scheduling.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features by Role](#features-by-role)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seed Data](#seed-data)
- [Automated Jobs](#automated-jobs)
- [Deployment](#deployment)

---

## Overview

PDMS is a multi-role hospital management system with four distinct portals:

| Role | Access |
|------|--------|
| **Patient** | Self-service booking, payments, history |
| **Doctor** | Appointments, consultations, leave management |
| **Receptionist** | Counter operations, vitals, report uploads |
| **Admin** | Staff management, leave approvals, dashboards |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js 5 |
| Templating | EJS |
| Database | MySQL / MariaDB |
| Authentication | JWT (HTTP-only cookies) + OTP via email |
| Payments | Stripe Checkout |
| File Storage | Cloudinary (avatars, PDF reports) |
| Email | Nodemailer + Gmail OAuth2, Resend |
| Scheduling | node-cron |
| Date/Time | Luxon (IST timezone throughout) |
| Deployment | Railway |

---

## Features by Role

### Patient
- **OTP-based signup & login** — email → OTP → profile registration, no passwords needed
- **Browse by department** — filter doctors by specialty
- **Slot picker** — real-time available slots per doctor
- **Stripe payment** — ₹200 token fee per appointment, webhook-confirmed
- **Reschedule & cancel** — self-service appointment management
- **Appointment history** — past consultations with doctor notes
- **Rate doctors** — star rating after completed appointments
- **Profile management** — photo upload via Cloudinary

### Doctor
- **Dashboard** — today's schedule, upcoming appointments, stats at a glance
- **Availability setup** — configure morning/evening shifts and slot duration
- **Patient view** — full vitals + history per consultation slot
- **Record consultations** — add diagnosis, prescriptions, and notes
- **Leave management** — apply for leaves; slots are blocked on approved leave days
- **Profile** — update photo, qualifications, experience

### Receptionist
- **Counter booking** — book appointments for walk-in patients
- **Patient registration** — verify existing patient by email or register new one
- **Vitals entry** — record BP, weight, and other vitals per slot
- **Report upload** — attach PDF/image reports to patient record (Cloudinary)
- **Appointment control** — reschedule and cancel with email notification
- **Consultation start** — mark slots as in-process when patient arrives
- **Department view** — browse doctors by department
- **Leave management** — apply for own leaves

### Admin
- **Staff dashboard** — system-wide stats and activity overview
- **Doctor & receptionist management** — add, edit, delete staff members
- **Leave approvals** — review and approve/reject leave requests for all staff
- **Staff directory** — paginated lists for doctors and receptionists

---

## Database Schema

14 tables covering the full appointment lifecycle:

```
appointment_slots      — time slots per doctor (available / occupied / fulfilled / in-process)
consultation_records   — doctor notes and diagnosis per appointment
doctor_availability    — morning/evening shift config per doctor
doctor_details         — department, degree, qualifications, experience, fee, rating
doctor_leaves          — leave applications with approval status
doctor_ratings         — patient star ratings per doctor
patients               — patient profiles
patient_histories      — medical history records
patient_reports        — Cloudinary links to uploaded reports
patient_vitals         — BP, weight, and vitals per slot
receptionist_leaves    — leave applications for receptionists
role                   — role definitions (admin / doctor / receptionist)
slot_updates           — audit trail for slot status changes
staff                  — unified staff table (admins, doctors, receptionists)
```

---

## Project Structure

```
.
├── app.js                        # Entry point — Express setup, routes, cron init
├── config/
│   ├── db.config.js              # MySQL connection pool
│   ├── cloudinary.config.js      # Cloudinary setup + multer storage
│   └── doctor_pricing.js         # Consultation fee config (₹200)
├── controller/
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── doctor.controller.js
│   ├── patient.controller.js
│   ├── receptionist.controller.js
│   └── webhook.controller.js     # Stripe webhook handler
├── middleware/
│   ├── auth.middleware.js         # JWT protect + role-based restrictTo
│   └── authRedirect.middleware.js # Redirect already-logged-in users
├── routes/                        # One file per role
├── utils/
│   ├── cron.js                    # Automated slot generation & cleanup
│   ├── email_templates.js         # HTML email templates (OTP, booking)
│   ├── mail_sender.js             # Nodemailer + Resend dispatcher
│   ├── logger.js
│   └── time.js                    # Luxon IST helpers
├── views/
│   ├── admin/
│   ├── auth/
│   ├── components/                # Shared EJS partials (sidebars, header, footer)
│   ├── doctor/
│   ├── patient/
│   └── receptionist/
├── seeds/                         # Seed scripts for initial data
├── public/                        # Static assets
└── patient_doctor_management_system.sql  # Full database dump
```

---

## Getting Started

**Prerequisites:** Node.js ≥ 18, MySQL/MariaDB

```bash
# 1. Clone and install
git clone <repo-url>
cd Patient-Doctor-Medical-Solution
npm install

# 2. Configure environment
cp .env-example .env
# Fill in all values (see Environment Variables below)

# 3. Set up the database
# Import the SQL dump into your MySQL server:
mysql -u <user> -p patient_doctor_management_system < patient_doctor_management_system.sql

# 4. Seed initial data
npm run seed:all

# 5. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

Server starts at `http://localhost:3001` (or the `PORT` you set).

---

## Environment Variables

```env
# Database
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_DATABASE=patient_doctor_management_system

# Server
PORT=3001

# JWT
JWT_SECRET=

# Cloudinary
CLOUD_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=

# Gmail OAuth2 (for email sending)
SYSTEM_MAIL_ID=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# Staff password reset
DOC_SET_PASS_SECRET=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Seed Data

Convenience npm scripts to populate the database for local development:

```bash
npm run seed:admin          # Creates the admin account
npm run seed:receptionist   # Creates a default receptionist
npm run seed:doctors        # Seeds departments, doctors, and generates 7-day slots
npm run seed:all            # Runs all three in sequence
```

---

## Automated Jobs

Two cron jobs run continuously:

| Schedule | Job |
|----------|-----|
| Daily at midnight (IST) | Generate appointment slots for all doctors for the next 7 days |
| Every 30 minutes | Clean up expired available slots and orphaned vitals |

Both jobs also run once at server startup. Slot generation is leave-aware — it skips dates where a doctor has an approved leave.

---

## Deployment

The app is deployed on **Railway**. Key notes for production:

- Set `NODE_ENV=production` — the app skips `dotenv` in production mode
- The Stripe webhook route (`/stripe`) must be registered **before** `express.json()` to receive raw bytes for signature verification (already handled in `app.js`)
- All required env vars are validated at startup; the process exits with a clear error if any are missing
