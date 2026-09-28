# 🐶 Dog Breed Explorer

A full-stack web application to explore and filter dog breeds by traits.

Built with **React + Vite** (frontend) and **Node.js + Express** (backend).

---

## 📁 Project Structure

```
dog-breed/
├── backend/        # Express API server (port 7000)
│   ├── app.js
│   ├── data.json
│   └── src/
├── frontend/       # React + Vite app (port 5173)
│   ├── src/
│   └── index.html
└── package.json    # Root — runs both with one command
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm

---

### 1. Install Dependencies

Install root, backend, and frontend dependencies:

```bash
# Root (concurrently)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

### 2. Run the Application

From the **project root**, run both servers simultaneously:

```bash
npm run start
```

This starts:
| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:7000        |

> The terminal will show color-coded output — **cyan** for the backend, **magenta** for the frontend.

---

### 3. Run Individually (optional)

**Backend only:**
```bash
cd backend
node app.js
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | `/api/breeds`    | Get all dog breeds       |
| GET    | `/healthcheck`   | Server health status     |

---

## 🛠️ Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React 19, Vite 8        |
| Backend  | Node.js, Express 5      |
| Styling  | Vanilla CSS             |

---

## 📦 Scripts

From the project root:

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm run start` | Run backend + frontend together    |
