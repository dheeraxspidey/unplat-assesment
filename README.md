# EventFlow - Event Management System

A full-stack Event Management platform built with FastAPI (Backend) and React/Vite (Frontend).

## Features
- **User Roles**: Organizers (create events) and Attendees (book tickets).
- **Event Management**: Create, edit, cancel events. Supports Drafts and Recurring features.
- **Search & Explore**: Browse events by category, location, and date.
- **Booking System**: Real-time seat availability and booking history.
- **User Profile**: customization including Name, Avatar, and Interests.

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, MySQL, Docker.
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI, Vite.
- **Deployment**: Render (Backend/DB on Aiven), Vercel (Frontend).

---

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+) & npm

### 1. Backend Setup (Docker)

The backend runs in a Docker container along with the MySQL database.

1.  Navigate to the project root.
2.  Start the services:
    ```bash
    docker compose up --build
    ```
    - This starts the MySQL database (Port 3306) and FastAPI Backend (Port 8000).
    - API Documentation: http://localhost:8000/docs

### 2. Frontend Setup (NPM)

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    - The app will run at http://localhost:5173

### 3. Database Seeding (`setup_data.sh`)

We provide a convenient script to reset the database and verify the flow by populating it with sample data (Users, Events, Bookings).

**Usage:**
```bash
# Make sure docker compose is running
./setup_data.sh
```

**What it does:**
1.  **Resets Database**: Drops all tables and recreates them (via `docker compose exec backend python reset_db.py`).
2.  **Creates Users**:
    - Organizer: `organizer@gmail.com` / `password123`
    - Attendee: `attendee@gmail.com` / `password123`
3.  **Creates Events**: Populates ~10 sample events (Concerts, Workshops, etc).
4.  **Creates Bookings**: Simulates bookings for the attendee.

**Using for Production Seeding:**
To seed your remote production database (e.g. Render/Aiven), open `setup_data.sh` and:
1.  Comment out the "RESET DATABASE" section (lines 13-20).
2.  Run with your production API URL:
    ```bash
    BASE_URL=https://your-backend.onrender.com/api ./setup_data.sh
    ```

---

## Environment Variables

### Backend (`backend/.env` or Docker env)

| Variable | Description | Default (Local) |
|----------|-------------|-----------------|
| `DATABASE_URL` | MySQL Connection String | `mysql+pymysql://user:password@db/event_db` |
| `SECRET_KEY` | JWT Secret Key | (See config.py) |
| `API_V1_STR` | API Prefix | `/api` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL | `http://localhost:8000` |

---

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed Entity Relationship Diagrams and Table definitions.

---

## AI Tools & Methodology

**Tools Used:** Antigravity IDE with Gemini 3 Pro

**Usage Philosophy:**  
I utilized AI as a Pair Programming partner to accelerate the implementation of boilerplate code and React/TypeScript syntax. My role was the **Navigator**, defining the application architecture, database schema, and core business logic, while using AI to assist with the "Driver" tasks of writing repetitive components and formatting.

**Verification Process:**
*   **Logic Auditing:** Every AI-generated function was manually reviewed to ensure it met the functional requirements, specifically for overbooking prevention and seat management.
*   **Security & Constraints:** I manually implemented the role-based access control (Organizer vs. Attendee) and data validation logic to ensure the application remains secure beyond simple code generation.
*   **Refinement:** I iterated on AI suggestions to align with the required MySQL schema and the specific Event Management constraints outlined in the prompt.