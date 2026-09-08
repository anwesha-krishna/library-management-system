# Library Book Issue & Return Management System

A full-stack web app for librarians to manage books and track issue/return activity using QR codes, with an admin dashboard and an AI-powered library assistant.

## 🔗 Live Demo

- **Frontend (Vercel):** https://library-management-client-roan.vercel.app
- **Backend API (Render):** https://library-management-system-8s6h.onrender.com

> Note: the backend is on Render's free tier, so it may take ~30-50 seconds to wake up if it's been inactive.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS + [html5-qrcode](https://github.com/mebjas/html5-qrcode) (camera QR scanning, via CDN)
- **Backend:** Node.js + Express
- **Database:** MongoDB (via Mongoose), hosted on MongoDB Atlas
- **QR generation:** `qrcode` npm package
- **CSV export:** `json2csv`
- **AI Assistant:** Google Gemini API (`@google/genai`), grounded on live book and transaction data
- **Deployment:** Render (backend), Vercel (frontend)

## Project Structure
library-system/
├── server/
│ ├── models/ Book.js, Transaction.js
│ ├── controllers/ booksController.js, transactionsController.js, aiController.js
│ ├── routes/ books.js, transactions.js, ai.js
│ ├── .env.example
│ ├── package.json
│ └── server.js
└── client/
├── index.html Dashboard: stats, add/search/list books
├── scan.html QR scanner: issue/return
├── script.js
└── style.css

## Features Implemented

**Core (Task requirements):**
- Add books with title, author, ISBN, category, and total copies
- Auto-generated unique QR code per book (encodes the book's `bookId`)
- Camera-based QR scanning via device camera (html5-qrcode)
- Issue/return flow: scan → issue to a named borrower, or check the book back in
- Real-time Available/Issued status per book, derived from `availableCopies`
- Search and filter books by title, author, category, and status
- Validation: prevents issuing an already-fully-issued book, and prevents returning a book with no active issue
- Full issue/return transaction history with timestamps and borrower info
- CSV export of the full transaction history

**Brownie subtask — Admin Dashboard:**
- Live stat cards: Total Books, Available, Issued, Overdue Books
- Overdue calculation based on issue duration

**Optional bonus — AI Assistant:**
- Chat-based library assistant powered by Google Gemini
- Grounded on live data: the assistant is given the current book catalog and transaction history as context, so it can answer questions like "which books are overdue?" or "is Harry Potter available?" using real, up-to-date information rather than guessing

## APIs Implemented

| Method | Route | Description |
|---|---|---|
| POST | `/api/books` | Add a book; auto-generates a unique `bookId` and QR code |
| GET | `/api/books` | List books; supports `?title=&author=&category=&status=` filters |
| GET | `/api/books/:bookId` | Look up one book by its QR-encoded `bookId` |
| DELETE | `/api/books/:id` | Delete a book |
| POST | `/api/transactions/issue` | Issue a book — body: `{ bookId, borrowerName }` |
| POST | `/api/transactions/return` | Return a book — body: `{ bookId }` |
| GET | `/api/transactions` | Full issue/return history |
| GET | `/api/transactions/export` | Download history as CSV |
| POST | `/api/ai/chat` | AI assistant chat — body: `{ prompt }` *(confirm exact route name in `routes/ai.js`)* |

## How to Run Locally

### 1. Set up MongoDB
Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). If your network blocks the standard `mongodb+srv://` connection format (common on some campus/mobile networks — you'll see a `querySrv ENOTFOUND` error), use Atlas's non-SRV connection string instead (toggle "SRV Connection String" off on the Connect screen).

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGO_URI, PORT, and GEMINI_API_KEY in .env
npm run dev
```
Server runs at `http://localhost:5000`.

### 3. Frontend
Open `client/index.html` with VS Code's Live Server extension (camera access needs `http://localhost`, not `file://`). Update `API_BASE` in `script.js` if pointing to a different backend.

## Deployment Notes

- **Backend (Render):** connected to this GitHub repo, root directory `library-system/server`, build command `npm install`, start command `node server.js`. Environment variables (`MONGO_URI`, `PORT`, `GEMINI_API_KEY`) set in Render's Environment tab.
- **Frontend (Vercel):** connected to the same repo, root directory `library-system/client`, framework preset "Other" (static site, no build step). `script.js`'s `API_BASE` points to the live Render backend URL.
- CORS is enabled on the backend so the Vercel-hosted frontend can call the Render-hosted API across origins.

## Implementation Notes / Concepts Learned

- Mongoose virtuals: Derived book status dynamically from availableCopies to prevent state desynchronization.
- Multi-copy handling: Used totalCopies vs availableCopies to manage concurrent borrowing.
- QR code payloads: Encoded only the bookId string to keep payload size lightweight and independent of book metadata changes.
- MongoDB connection strings: Used standard connection URIs instead of mongodb+srv:// to bypass network-level DNS SRV record blocking.
- Cross-origin deployment: Configured CORS headers on backend APIs deployed across separate platforms (Vercel + Render).
- LLM context grounding: Injected real-time database state into prompts before each request for accurate response generation.
