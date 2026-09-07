# Library Book Issue & Return Management System

A full-stack web app for librarians to manage books and track issue/return activity using QR codes.

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS + [html5-qrcode](https://github.com/mebjas/html5-qrcode) (camera QR scanning, loaded via CDN)
- **Backend:** Node.js + Express
- **Database:** MongoDB (via Mongoose) — designed for MongoDB Atlas (free cloud tier)
- **QR generation:** `qrcode` npm package
- **CSV export:** `json2csv`

## Project Structure
```
library-system/
├── server/
│   ├── models/         Book.js, Transaction.js (Mongoose schemas)
│   ├── controllers/    booksController.js, transactionsController.js (business logic)
│   ├── routes/         books.js, transactions.js (Express route definitions)
│   ├── .env.example    template for your MongoDB URI
│   ├── package.json
│   └── server.js       app entry point
└── client/
    ├── index.html       librarian dashboard: add/search/list/delete books
    ├── scan.html        QR scanner: issue/return a book
    ├── script.js         shared frontend logic + API_BASE constant
    └── style.css
```

## How to Run

### 1. Set up MongoDB
Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a database user, and copy your connection string.

### 2. Backend
```bash
cd server
npm install
cp .env.example .env      # then paste your MONGO_URI into .env
npm run dev                # or: npm start
```
Server runs at `http://localhost:5000`.

### 3. Frontend
No build step — just open `client/index.html` in a browser, or serve the `client/` folder with any static server (e.g. the VS Code "Live Server" extension). If your frontend is served from a different origin than `localhost:5000`, CORS is already enabled on the backend.

**Note on camera scanning:** browsers only allow camera access over `https://` or `localhost`. Opening `scan.html` directly as a `file://` path may block the camera — use Live Server (which serves over `http://localhost`) if that happens.

## APIs Implemented

| Method | Route | Description |
|---|---|---|
| POST | `/api/books` | Add a book; auto-generates a unique `bookId` and its QR code |
| GET | `/api/books` | List books; supports `?title=&author=&category=&status=` filters |
| GET | `/api/books/:bookId` | Look up one book by its QR-encoded `bookId` |
| DELETE | `/api/books/:id` | Delete a book |
| POST | `/api/transactions/issue` | Issue a book — body: `{ bookId, borrowerName }` |
| POST | `/api/transactions/return` | Return a book — body: `{ bookId }` |
| GET | `/api/transactions` | Full issue/return history |
| GET | `/api/transactions/export` | Download history as CSV |

## Features Implemented
- Add books with title, author, ISBN, category, and total copies
- Auto-generated unique QR code per book (encodes the book's `bookId`)
- Camera-based QR scanning (via device camera, using html5-qrcode)
- Issue/return flow: scanning shows the book ID, then you issue (to a named borrower) or return it
- Real-time Available/Issued status per book, computed from `availableCopies`
- Search and filter books by title, author, category, and status
- Prevents issuing an already-fully-issued book, and prevents returning a book with no active issue
- Full issue/return transaction history stored with timestamps and borrower info
- CSV export of the full transaction history
- Delete button on the dashboard to remove a book record

## Not Yet Implemented (possible next steps)
- Admin dashboard (totals, overdue tracking) — the brownie subtask
- AI-powered feature (optional bonus)
- Deployed/hosted version — currently designed to run locally

## Implementation Notes / Concepts Used
- **Mongoose virtuals**: a book's `status` (Available/Issued) isn't stored directly — it's derived on the fly from `availableCopies`, so it's never out of sync.
- **Multi-copy handling**: `totalCopies` vs `availableCopies` means a book with 3 copies can be issued to 3 different people simultaneously; returning matches against the oldest still-open transaction for that book.
- **QR codes encode only the `bookId` string** — the scanner just reads that ID and the backend looks up the rest, keeping the QR payload small and stable even if book details change later.
- **CORS** is enabled on the backend so the static frontend (opened separately, e.g. via Live Server) can call the API.
