# SwarnaAI Monorepo

This is the monorepo for SwarnaAI, an AI-powered gold/silver web application.

## Structure

```
/
├── backend/      # Node.js Express backend (TypeScript)
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── service-account.json
├── frontend/     # React frontend (Vite + TailwindCSS)
│   ├── src/
│   ├── package.json
│   ├── index.html
│   └── ...
├── .gitignore
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
See `backend/.env` for backend configuration.

---

- Backend and frontend are fully decoupled and can be run independently.
- Backend uses TypeScript, Express, LangChain, and VertexAI.
- Frontend uses React, Vite, and TailwindCSS.

# 🚀 SwarnaAI – Gold/Silver AI Assistant

## 📦 Backend Setup
```bash
cd backend
npm install
npm run dev
```

## 🌐 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Docs
- Swagger UI: http://localhost:3000/api-docs

---

### Project Structure

- `/backend` – Node.js Express backend (AI, APIs)
- `/frontend` – React + Vite + Tailwind frontend
  - `/components` – Reusable UI components (e.g. ChatBubble)
  - `/api` – API utilities (e.g. axiosClient, ai.js)
  - `/pages` – (for future expansion)

---

## 🤖 About
SwarnaAI is an AI-powered assistant for Indian gold and silver market insights, prices, and trends.
