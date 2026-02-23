# An Phuc Nien So — Temple Management System

Full-stack application with an ASP.NET Core 8 API backend and a React (Vite) frontend.

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Backend  | ASP.NET Core 8 Web API, EF Core 8      |
| Frontend | React 19, Vite 7, Tailwind CSS 4       |
| Database | PostgreSQL 15                           |
| DevOps   | Docker Compose, pgAdmin                |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

This spins up:

- **PostgreSQL 15** on `localhost:5432`
- **pgAdmin** on [http://localhost:5050](http://localhost:5050)
  - Email: `admin@anphucnienso.local`
  - Password: `admin`

### 2. Run the backend

```bash
cd backend
dotnet run
```

The API starts at `http://localhost:5062` with Swagger UI at `/swagger`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

## Project Structure

```
├── backend/                  # ASP.NET Core 8 Web API
│   ├── Controllers/          # API controllers
│   ├── Program.cs            # App entry point & CORS config
│   ├── appsettings.json      # Production settings
│   └── appsettings.Development.json  # Dev settings (PostgreSQL connection)
├── frontend/                 # React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx           # Root component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Tailwind imports
│   └── vite.config.js        # Vite + Tailwind plugin config
├── docker-compose.yml        # PostgreSQL 15 + pgAdmin
└── README.md
```
