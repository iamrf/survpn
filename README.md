# Persian Mini App 🍏

A premium Telegram Mini App built with React and Vite, featuring a robust SQLite backend for seamless user data synchronization and persistence.

## 🚀 Features

- **Telegram Integration**: Built-in support for Telegram WebApp environment and user data retrieval.
- **Auto-Sync**: Automatically synchronizes user profiles with a secure SQLite backend on every app launch.
- **Premium UI**: Modern, responsive design using Tailwind CSS, Radix UI, and Framer Motion for smooth animations.
- **Bilingual Core**: Optimized for Persian (Farsi) language with Vazirmatn typography.
- **Secure Persistence**: Node.js/Express backend with a `better-sqlite3` storage layer.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18+](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **State/Query**: [TanStack Query](https://tanstack.com/query/latest)

### Backend
- **Environment**: [Node.js](https://nodejs.org/)
- **Server**: [Express](https://expressjs.com/)
- **Database**: [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Environment Management**: [dotenv](https://github.com/motdotla/dotenv)

## 📁 Project Structure

```text
├── backend/                # Express server and database
│   ├── database/           # SQLite DB and schema
│   ├── .env                # Backend-specific environment variables
│   ├── server.js           # Server entry point
│   └── package.json
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── lib/                # API and utility functions
│   ├── pages/              # Application views/routes
│   ├── App.tsx             # Main app component and sync logic
│   └── main.tsx
├── .env                    # Frontend-specific environment variables
├── package.json
└── README.md
```

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18.x or later)
- npm or bun

### 2. Installation
Clone the repository and install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configuration
Create `.env` files for both frontend and backend based on the following templates:

**Root `.env` (Frontend):**
```env
VITE_API_URL=http://localhost:5000
```

**`backend/.env` (Backend):**
```env
BOT_TOKEN=your_telegram_bot_token
DB_PATH=./database.sqlite
PORT=5000
```

### 4. Running Locally
Run both servers in separate terminal windows:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
npm start
```

## 🔐 Database Schema
The backend automatically initializes a SQLite database with the following `users` table:
- `id` (Primary Key)
- `first_name`
- `last_name`
- `username`
- `language_code`
- `photo_url`
- `last_seen` (Automatic timestamp)
- `created_at` (Automatic timestamp)

---
*Built with ❤️ for the Telegram community.*
