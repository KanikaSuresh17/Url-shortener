
*This project is a part of a hackathon run by https://katomaran.com*

# 🔗 MagicURL — Smart URL Shortener with Real-Time Analytics

> **Shorten. Track. Optimize.**

MagicURL is a full-stack URL shortening platform with real-time click analytics, role-based access control, QR code generation, and visit history tracking — built for the modern web.

---

## 📋 Table of Contents

- [Planning the App](#-planning-the-app)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Setup Instructions](#-setup-instructions)
- [Assumptions Made](#-assumptions-made)
- [AI Planning Document](#-ai-planning-document)
- [Demo Video](#-demo-video)

---

## 🗺 Planning the App

### Problem Statement
Standard URL shorteners only shorten links. There's no way to know who clicked, when, from where, or how many times. MagicURL solves this by combining a URL shortener with real-time analytics, an admin control panel, and QR code generation — all behind secure JWT-based authentication.

### Goals
- Allow users to shorten long URLs and share them easily
- Track every click with timestamp, IP, and browser info
- Show live click count updates without page refresh (via Socket.io)
- Give admins full visibility over all users' links
- Enable password reset via email flow
- Generate downloadable QR codes for every short link

### User Roles Planned
| Role | Capabilities |
|------|-------------|
| User | Create, view, edit, delete own URLs; view analytics; download QR |
| Admin | View all users' URLs; delete any URL; see platform-wide stats |

### Feature Roadmap (Planned → Built)
| Feature | Status |
|---------|--------|
| Register / Login with JWT | ✅ |
| URL Shortening (5-char code) | ✅ |
| Real-time click updates | ✅ |
| Visit history per URL | ✅ |
| Admin panel | ✅ |
| Forgot / Reset Password | ✅ |
| QR Code generation + download | ✅ |
| Edit destination URL | ✅ |
| Inline analytics panel | ✅ |
| Session timeout (1hr JWT) | ✅ |
| Role-based redirect on login | ✅ |

---

## ✨ Features

### 1. User Authentication
- Register with username, email, and password (min 8 chars + special character)
- Login returns a JWT token (1-hour expiry)
- Role-based redirect: `admin` → `/admin`, `user` → `/dashboard`
- Session auto-expires — token expiry checked on every app load and on 401 responses

### 2. URL Shortening
- Paste any long URL and generate a unique 5-character short code
- Short URL format: `https://url-shortener-zhkz.onrender.com/{shortCode}`
- URL format validation on both frontend and backend

### 3. Real-Time Click Tracking
- Every click on a short URL increments the click counter
- Socket.io emits a `click_update` event — dashboard updates live without page reload
- Each click saves a Visit record: timestamp, IP address, browser user-agent

### 4. Analytics Panel
- Per-URL inline analytics panel (expands below each card)
- Shows: Total Clicks, Last Visited date, Created On date
- Recent visit history table (last 10 visits)

### 5. QR Code Generation
- One-click QR code display for any short URL
- Download QR as PNG (`qr-{shortCode}.png`)
- 100% frontend — no backend call needed (uses `qrcode.react`)

### 6. Edit Destination URL
- Pencil icon opens inline edit mode on a URL card
- Change where the short link points without changing the short code
- Only the owner can edit their own URL

### 7. Delete URL
- Trash icon deletes the URL record
- Cascades — all associated Visit records are also deleted
- Only the owner can delete their own URL

### 8. Admin Panel
- Admins see all users' URLs with owner info (username, email)
- Platform-wide stats: Total Links, Total Users, Total Clicks
- Admin can delete any URL via `DELETE /api/urls/admin/:id`
- Live click count updates via Socket.io on admin panel too
- Eye icon opens analytics for any URL

### 9. Forgot Password Flow
- Request reset link via email (Nodemailer + Gmail)
- Crypto token stored with 1-hour expiry in database
- New password validated for min 8 chars + special character
- Token cleared after successful reset

### 10. Dashboard Statistics
Calculated client-side from the URL list:
- **Total Links** — total URLs created
- **Total Clicks** — sum of all click counts
- **Active Links** — URLs with at least 1 click
- **Top Performance** — highest click count on a single link

---

## 🏗 Architecture

### Deployment Architecture

```
User Browser
     ↓
Vercel (React Frontend)
url-shortener-3i96.vercel.app
     ↓  REST API calls
Render (Node.js + Express Backend)
url-shortener-zhkz.onrender.com
     ↓  Sequelize ORM
Supabase (PostgreSQL Database)
aws-0-ap-northeast-1.pooler.supabase.com
```

### Frontend Component Tree

```
App.jsx
├── /login              → Login.jsx
├── /register           → Register.jsx
├── /dashboard          → Dashboard.jsx
│   ├── URLCard.jsx
│   ├── AnalyticsPanel.jsx
│   └── QRPanel.jsx
├── /admin              → Admin.jsx
├── /forgot-password    → ForgotPassword.jsx
└── /reset-password     → ResetPassword.jsx
```

### Backend Folder Structure

```
backend/
├── config/
│   └── db.js               → Sequelize + Supabase SSL connection
├── models/
│   ├── userModel.js        → User schema (id, username, email, password, role, resetToken)
│   ├── urlModel.js         → URL schema (id, originalUrl, shortCode, userId, clicks)
│   └── visitModel.js       → Visit schema (id, urlId, timestamp, ip, userAgent)
├── controllers/
│   ├── authController.js   → Register, Login, Forgot/Reset Password
│   └── urlController.js    → Create, Read, Update, Delete, Analytics
├── services/
│   ├── authService.js      → DB logic for auth (bcrypt, JWT, crypto token)
│   └── urlService.js       → DB logic for URL operations
├── routes/
│   ├── authRoutes.js       → /api/auth/*
│   └── urlRoutes.js        → /api/urls/*
├── middleware/
│   └── authMiddleware.js   → JWT verify + requireAdmin check
├── utils/
│   └── generateShortCode.js → 5-char alphanumeric unique code
├── .env                    → Secrets (not committed)
└── server.js               → Express app + Socket.io setup + redirect route
```

### Database Schema

```sql
-- Users
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR UNIQUE NOT NULL,
  email           VARCHAR UNIQUE NOT NULL,
  password        VARCHAR,
  role            VARCHAR DEFAULT 'user',
  resetToken      VARCHAR,
  resetTokenExpiry TIMESTAMP,
  createdAt       TIMESTAMP,
  updatedAt       TIMESTAMP
);

-- URLs
CREATE TABLE urls (
  id          SERIAL PRIMARY KEY,
  originalUrl TEXT NOT NULL,
  shortCode   VARCHAR UNIQUE NOT NULL,
  userId      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  clicks      INTEGER DEFAULT 0,
  createdAt   TIMESTAMP,
  updatedAt   TIMESTAMP
);

-- Visits
CREATE TABLE visits (
  id        SERIAL PRIMARY KEY,
  urlId     INTEGER REFERENCES urls(id) ON DELETE CASCADE,
  timestamp TIMESTAMP,
  ip        VARCHAR,
  userAgent TEXT
);
```

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/forgot-password` | No | Send reset email |
| POST | `/api/auth/reset-password` | No | Reset password via token |
| GET | `/api/urls` | User | Get own URLs |
| POST | `/api/urls` | User | Create short URL |
| PUT | `/api/urls/:id` | User | Edit destination URL |
| DELETE | `/api/urls/:id` | User | Delete own URL |
| GET | `/api/urls/:id/analytics` | User | Get visit analytics |
| GET | `/api/urls/all` | Admin | Get all users' URLs |
| DELETE | `/api/urls/admin/:id` | Admin | Delete any URL |
| GET | `/:shortCode` | No | Redirect to original URL |

---

## 🛠 Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React (Vite) | Component-based, fast virtual DOM updates for live click counts |
| Styling | CSS + Glassmorphism | Navy green theme, animated gradient background |
| Backend | Node.js + Express | Non-blocking I/O, perfect for high-traffic redirects |
| Database | PostgreSQL (Supabase) | Relational structure for users → URLs → visits |
| ORM | Sequelize | Simplified DB queries, model associations, auto sync |
| Auth | JWT + bcrypt | Stateless auth, secure password hashing |
| Realtime | Socket.io | Live click count push without polling |
| Email | Nodemailer | Password reset emails via Gmail |
| QR Code | qrcode.react | Client-side SVG QR generation, PNG download |
| Frontend Deploy | Vercel | Auto-deploy from GitHub, global CDN |
| Backend Deploy | Render | 24/7 hosted Node.js server, env variable management |

---

## ⚙ Setup Instructions

### Prerequisites
- Node.js v18+
- npm v9+
- PostgreSQL (or Supabase account)
- Gmail account (for Nodemailer)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/url-shortener.git
cd url-shortener
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_jwt_secret_key
BASE_URL=http://localhost:5000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> **Note:** For Supabase, get your `DATABASE_URL` from Project Settings → Database → Connection String (URI mode).

Start the backend:

```bash
node server.js
```

The server will:
- Connect to the database via `sequelize.authenticate()`
- Auto-create tables via `sequelize.sync()`
- Start Express + Socket.io on `PORT`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Creating an Admin Account

Use Postman or any API client:

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin@123",
  "role": "admin"
}
```

Normal users register via the signup form (default role: `user`).

### 5. Deployment

**Backend → Render:**
- Connect GitHub repo
- Root directory: `backend`
- Build command: `npm install`
- Start command: `node server.js`
- Add all `.env` variables in Render's Environment settings

**Frontend → Vercel:**
- Connect GitHub repo
- Root directory: `frontend`
- Framework: Vite
- Add `VITE_BACKEND_URL=https://your-render-url.onrender.com` in Environment Variables

**Database → Supabase:**
- Create a new project
- Copy the connection URI (with SSL) to `DATABASE_URL`

---

## 📌 Assumptions Made

1. **Email service** — Gmail is used for password reset emails. A Gmail App Password (not regular password) is required. 2FA must be enabled on the Gmail account.

2. **Short code uniqueness** — Short codes are randomly generated (5-char alphanumeric). Collision check is done in `generateShortCode.js` — regenerates if code already exists in DB.

3. **JWT is stateless** — Logout is handled client-side by clearing `localStorage`. No token blacklist is maintained on the server.

4. **Render free tier cold start** — The backend may take ~50 seconds to respond on first request after inactivity (Render free tier sleeps after 15 min). Subsequent requests are fast.

5. **CORS** — Currently set to allow all origins (`*`) for development and demo purposes. Should be restricted to frontend domain in production.

6. **SSL for Supabase** — `rejectUnauthorized: false` is set in Sequelize's SSL config to allow connection to Supabase's pooler. This is acceptable for Supabase's managed SSL but should be reviewed for stricter production setups.

7. **Visit tracking** — IP address logged is the one seen by the Express server. Behind a proxy/load balancer, `req.ip` may return the proxy IP. `trust proxy` would need to be enabled for accurate tracking.

8. **Admin creation** — Admin accounts must be created manually via API (Postman/curl). There is no admin self-registration on the frontend by design.

9. **Password policy** — Minimum 8 characters + at least one special character. Enforced on both frontend and backend.

10. **QR download** — QR PNG download uses the browser's Canvas API. Works in all modern browsers; may not work in very old browsers.

---

## 🤖 AI Planning Document

### How AI Was Used in This Project

This project was planned and built with AI assistance (Claude by Anthropic) as a pair-programming and architecture advisor.

#### Phase 1 — Architecture Design
AI helped design the full backend folder structure (config → models → controllers → services → routes → middleware → utils), define the three database models (User, Url, Visit) and their associations, and plan the REST API route structure with role-based access.

#### Phase 2 — Feature Planning
Each feature was planned as a prompt before implementation:
- Auth flow (register, login, JWT, bcrypt)
- URL shortening with unique short code generation
- Role-based access (user vs admin) via JWT payload and middleware
- Socket.io integration for live click updates
- Forgot/reset password with crypto token + Nodemailer
- QR code generation with client-side PNG download
- Edit destination URL without changing the short code

#### Phase 3 — Debugging and Fixes
AI helped diagnose and fix:
- Supabase SSL connection configuration
- CORS issues between Vercel frontend and Render backend
- Sequelize sync order and model association errors
- ngrok header bypass for local testing

#### Phase 4 — Documentation
This README was generated with AI assistance based on all implementation details.

### Architecture Decisions and Rationale

| Decision | Reason |
|----------|--------|
| Node.js for backend | Non-blocking I/O handles thousands of concurrent redirect requests |
| PostgreSQL over MongoDB | Relational data (users → urls → visits) benefits from JOINs and foreign keys |
| Sequelize ORM | Auto table creation, easy associations, migration-free for this scale |
| JWT over sessions | Stateless — works across Vercel (frontend) and Render (backend) without shared session store |
| Socket.io | Real-time push is more elegant than polling for click count updates |
| Supabase over local PostgreSQL | Cloud-hosted, accessible from Render backend, free tier available |
| Vercel for frontend | Zero-config React/Vite deployment, auto-deploy on push, global CDN |
| Render for backend | Permanent URL, GitHub auto-deploy, env variable management |
| qrcode.react for QR | No backend needed — all client-side, instant, downloadable |
| 5-char short code | Balance between short URL length and collision probability (~916 million combinations) |

---

## 🎥 Demo Video

> 📺 https://youtu.be/ydMhtaY0MPQ

The video covers:
- Registering a new account and logging in
- Shortening a URL and sharing the short link
- Viewing live click count updates via Socket.io
- Exploring the analytics panel (visit history, timestamps)
- Generating and downloading a QR code
- Admin login and managing all users' links
- Forgot password email flow
- Editing a URL destination without changing the short code

---

## 📁 Live Links

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://url-shortener-3i96.vercel.app |
| Backend (Render) | https://url-shortener-zhkz.onrender.com |

---

## 📦 Dependencies

### Backend
```
express, sequelize, pg, pg-hstore, bcryptjs, jsonwebtoken,
nodemailer, socket.io, cors, dotenv, validator, crypto
```

### Frontend
```
react, react-router-dom, socket.io-client, jwt-decode,
qrcode.react, axios (or fetch)
```

---

