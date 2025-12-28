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

---

## Major Challenges & Intelligent Solutions

During the development, we encountered several architectural challenges. Here is how we intelligently solved them:

### 1. Ephemeral Filesystem on Render
**Issue:** The free tier of Render (and similar PaaS) uses an ephemeral filesystem, meaning standard image uploads to a local `media/` folder are deleted whenever the server restarts or redeploys.
**Solution:** We implemented a **Hybrid Image Strategy**. The backend `EventService` was refactored to accept direct Image URLs (e.g., from Unsplash) and store them as-is in the database. The frontend was updated to intelligently detect if an image ID is a full URL (remote) or a filename (local proxy), ensuring that our seed data images persist permanently even after server restarts.

### 2. High-Performance Recommendation Engine
**Issue:**  Building a "For You" recommendation system based on user history can be resource-intensive if it naively tokenizes every single past booking text, especially for power users with hundreds of bookings.
**Solution:**  We implemented a **Frequency-Based Weighted Profiling** algorithm. Instead of analyzing everything, the service dynamically analyzes only the last 50 bookings. It calculates a weighted score for the user's top 3 Event Types and extracts the top 20 most frequent keywords from event titles. This ensures the recommendation profile remains sharp, current, and computationally efficient (O(1) relative to total history).

### 3. Automated Database Seeding & Consistency
**Issue:**  Setting up a complex relational database with foreign keys (Users -> Events -> Bookings) is tedious and error-prone for reviewers and new developers.
**Solution:**  We engineered a robust `setup_data.sh` script that orchestrates the entire lifecycle. It connects to the running Docker container, wipes the database clean, creating fresh tables, and programmatically populates 10+ realistic events with high-quality Unsplash imagery. This allows for a "One-Command" setup that guarantees a consistent state for testing the "My Stats", "Recommendations", and "Booking" flows immediately.

### 4. Strict Role-Based Access Control (RBAC)
**Issue:**  Preventing "IDOR" (Insecure Direct Object Reference) attacks where Attendees might try to delete events or Organizers might try to book their own tickets.
**Solution:**  We implemented middleware-level security dependencies (`get_current_organizer` vs `get_current_active_user`). Every critical API endpoint (Create, Edit, Delete) enforces these checks before even hitting the database. The Frontend mirrors this security by strictly conditionally rendering UI elements (e.g., hiding "Book Ticket" buttons for Organizers and "Edit Event" buttons for Attendees), providing a secure and intuitive user experience.

### 5. Intuitive Date Filtering UX
**Issue:**  Standard date range pickers are often cumbersome (`Start Date` -> `End Date`), forcing users to click multiple times just to answer a simple question: "What is happening this weekend?"
**Solution:**  We engineered a **Smart Date Filter Component** that combines power with simplicity. It offers one-click "Quick Select" presets (**Today**, **Tomorrow**, **This Weekend**) for the most common user intents. For advanced queries, it seamlessly integrates a visual Calendar Range Picker. This hybrid approach significantly reduces the "Time to Discovery" for attendees looking for immediate plans.