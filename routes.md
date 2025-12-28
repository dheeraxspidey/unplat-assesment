# API Routes Documentation

This document outlines the available API endpoints for the **UnPlat Assessment** backend.
All routes are prefixed with `/api`.

## 1. Authentication & User Management
**Prefix**: `/api/auth`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Register a new user (Organizer or Attendee). | Public |
| `POST` | `/login` | Authenticate and retrieve an access token. | Public |
| `GET` | `/me` | Get the currently logged-in user's profile. | Authenticated |
| `PUT` | `/profile` | Update user profile (Full Name, Profile Image). | Authenticated |
| `POST` | `/change-password` | Change the current user's password. | Authenticated |

---

## 2. Event Management
**Prefix**: `/api/events`

### **General Access**
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List events. Supports filtering by: <br>• `search` (Title/Location)<br>• `type` (Concert, Workshop, etc.)<br>• `status` (Default: PUBLISHED)<br>• `start_date` / `end_date`<br>• `location` | Public |
| `GET` | `/recommendations` | Get personalized event recommendations based on user history. | Authenticated |
| `GET` | `/{id}` | Get detailed information for a specific event. | Public |

### **Organizer Specific**
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create a new event. Supports image upload. | Organizer |
| `GET` | `/my-events` | List all events created by the current organizer. | Organizer |
| `GET` | `/stats/overview` | Get organizer dashboard statistics (Revenue, Sold, etc.). | Organizer |
| `PUT` | `/{id}` | Update an existing event details. | Organizer |
| `DELETE` | `/{id}` | **Cancel** a published event. | Organizer |
| `DELETE` | `/{id}/permanent` | **Permanently delete** a draft event. | Organizer |

---

## 3. Bookings
**Prefix**: `/api/bookings`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Book tickets for an event. Checks availability and locks seats. | Attendee |
| `GET` | `/my-bookings` | List all bookings for the current user. | Authenticated |
| `GET` | `/my-stats` | Get attendee dashboard statistics (e.g. Upcoming Events). | Authenticated |
| `POST` | `/{id}/cancel` | Cancel a specific booking. Restores seat availability. | Authenticated |

---

## 4. Media
**Prefix**: `/media`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/{filename}` | Serve static media files (Event images, User avatars). | Public |

---

## Error Handling
The API returns standard HTTP status codes:
- **200 OK**: Success.
- **201 Created**: Resource successfully created.
- **400 Bad Request**: Invalid input (e.g., booking a full event).
- **401 Unauthorized**: Missing or invalid token.
- **403 Forbidden**: User lacks permission (e.g., Attendee trying to create event).
- **404 Not Found**: Resource (Event/User) not found.
