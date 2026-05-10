# Credza Backend 🚀

Credza is a digital ledger system for small businesses to manage credit (udhaar) and payments.

## Features

- Owner authentication (register/login)
- Add Customers
- Add Credit (with product details)
- Add Debit (payments)
- Running Balance per entry
- Generate PDF Ledger Statement
- WhatsApp ledger summary link

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- PDFKit

## Base URL

All endpoints are mounted under:

- `POST/GET /api/...`

Server root route:

- `GET /` → `App is live`

## Authentication

Most ledger/customer routes require a JWT.

### Send JWT

Include header:

- `Authorization: Bearer <token>`

## API Endpoints

### Auth

- POST `/api/auth/register`
- POST `/api/auth/login`

### Customer

- POST `/api/customer/add`

### Ledger

- POST `/api/ledger/add`
- GET `/api/ledger/:customerId` (returns entries + running balance)
- GET `/api/ledger/pdf/:customerId` (downloads PDF statement)
- GET `/api/ledger/whatsapp/:customerId` (returns WhatsApp share link)

## Request Payloads (High-level)

### POST `/api/auth/register`

Registers an Owner.

### POST `/api/auth/login`

Logs in an Owner and returns a JWT.

### POST `/api/customer/add`

Creates a Customer for the authenticated owner.

Expected fields:

- `name`
- `phone` (10-digit, validated)
- `location` (optional)

### POST `/api/ledger/add`

Adds a ledger entry (credit/debit) for a customer owned by the authenticated owner.

Expected fields:

- `customerId`
- `type`: `"credit"` or `"debit"`
- `note` (optional)

For `credit`:

- `products`: array of `{ name, qty, price }`

For `debit`:

- `amount`: number (> 0)

## PDF Ledger Statement

- Generated using `pdfkit`
- Endpoint sets:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename=<customer_name>_ledger.pdf`

## Future Scope

- WhatsApp integration (UI / automation)
- Multi-shop (Owner system enhancements)
- UI dashboard

