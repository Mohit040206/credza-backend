# Credza Backend 🚀

Credza is a digital ledger system for small businesses to manage credit (udhaar) and payments.

## Features

- Add Customers
- Add Credit (with product details)
- Add Debit (payments)
- Running Balance per entry
- Generate PDF Ledger Statement

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- PDFKit

## API Endpoints

### Customer
- POST /api/customer/add

### Ledger
- POST /api/ledger/add
- GET /api/ledger/:customerId
- GET /api/ledger/pdf/:customerId

## Future Scope

- WhatsApp integration
- Multi-shop (Owner system)
- UI dashboard
