# UYMWIZ – Use Your Money Wisely 💸

A full-stack personal finance management web application built with the MERN stack.

## ✨ Features

- **🔐 Secure Authentication** — JWT-based register/login with bcrypt password hashing + rate limiting
- **💳 Expense & Income Tracking** — Log transactions across 15+ categories with payment methods
- **🔁 Recurring Expenses** — Mark entries as weekly/monthly/yearly recurring
- **📊 Visual Dashboard** — Real-time stats, line charts (6-month trend), category doughnut charts
- **🎯 Budget Management** — Set monthly budgets with per-category limits and progress tracking
- **📋 Smart History** — Searchable, sortable, filterable transaction history with pagination
- **📥 CSV Export** — Download all your transactions as a CSV file
- **🔥 Streak Tracking** — Gamified daily logging streaks to build financial habits
- **📱 Responsive Design** — Works beautifully on desktop and mobile
- **🌙 Dark UI** — Sophisticated dark theme with smooth animations
- **♿ Accessible** — ARIA labels on charts, modals, and interactive elements

## 🛠 Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Chart.js |
| Backend  | Node.js, Express.js                    |
| Database | MongoDB, Mongoose                      |
| Auth     | JWT + bcryptjs                         |
| Security | helmet, express-rate-limit             |
| Caching  | node-cache (stats endpoint, 5 min TTL) |
| Fonts    | Sora (display) + DM Sans (body)        |

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))

### 1. Clone & Install

```bash
git clone <repo-url>
cd uymwiz

# Install all dependencies at once
npm run install-all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/uymwiz
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Server

```bash
# From root - runs both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
uymwiz/
├── server/                     # Express.js backend
│   ├── constants.js            # Shared categories & payment methods
│   ├── models/
│   │   ├── User.js             # User schema + bcrypt
│   │   ├── Expense.js          # Expense/income schema (with indexes)
│   │   └── Budget.js           # Monthly budget schema
│   ├── routes/
│   │   ├── auth.js             # Register, login, profile
│   │   ├── expenses.js         # CRUD + analytics/stats + CSV export
│   │   └── budgets.js          # Budget CRUD
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   └── server.js               # Express app entry + rate limiting
│
├── client/                     # React frontend
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Global auth state
│   │   │   └── ToastContext.jsx# Toast notifications
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx   # Stats + charts
│   │   │   ├── AddExpense.jsx  # Add/edit transaction + recurring
│   │   │   ├── History.jsx     # Transaction list + CSV export
│   │   │   └── BudgetPage.jsx  # Budget management
│   │   ├── components/
│   │   │   └── Layout.jsx      # Sidebar + shell
│   │   ├── utils/
│   │   │   ├── api.js          # Axios with interceptors
│   │   │   └── constants.js    # Shared categories, emojis, etc.
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind + custom styles
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── package.json                # Root with concurrently scripts
```

## 🌐 API Endpoints

### Auth

| Method | Route                | Description                      |
| ------ | -------------------- | -------------------------------- |
| POST   | `/api/auth/register` | Register new user (rate limited) |
| POST   | `/api/auth/login`    | Login (rate limited: 10/15min)   |
| GET    | `/api/auth/me`       | Get current user                 |
| PUT    | `/api/auth/profile`  | Update profile                   |

### Expenses

| Method | Route                  | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| GET    | `/api/expenses`        | List with filters/search/sort       |
| GET    | `/api/expenses/stats`  | Dashboard statistics (cached 5 min) |
| GET    | `/api/expenses/export` | Download all as CSV                 |
| POST   | `/api/expenses`        | Create transaction                  |
| PUT    | `/api/expenses/:id`    | Update transaction                  |
| DELETE | `/api/expenses/:id`    | Delete transaction                  |

### Budgets

| Method | Route              | Description             |
| ------ | ------------------ | ----------------------- |
| GET    | `/api/budgets`     | Get budget (month/year) |
| POST   | `/api/budgets`     | Create/update budget    |
| DELETE | `/api/budgets/:id` | Delete budget           |

## 🔒 Security

- Auth routes rate limited (10 requests per 15 minutes)
- General API rate limited (100 requests per minute)
- HTTP security headers via `helmet`
- JWT tokens with 7-day expiry
- bcrypt password hashing (12 rounds)
- Request body size limit (10kb)
- User-scoped data — users can only access their own records

## 🚢 Deployment

**Frontend** → [Netlify](https://netlify.com): drag `client/dist` folder or connect GitHub repo

**Backend** → [Render](https://render.com): connect repo, set root to `server/`, add env vars

**Database** → [MongoDB Atlas](https://cloud.mongodb.com): free tier M0 cluster

## 👥 Team

| Member                     | Role                                     |
| -------------------------- | ---------------------------------------- |
| Prince Mundra (23BCON0066) | Frontend — React, Tailwind, Dashboard    |
| Devarsh Shah (23BCON0064)  | Backend — Node.js, Express, MongoDB, JWT |
