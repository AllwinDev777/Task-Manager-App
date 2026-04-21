# Task Manager – Vulnerable Version
**This branch (`vulnerable`) contains an intentionally insecure web application.**  

The **secure version** is available on the [`main`](https://github.com/AllwinDev777/Task-Manager-App) branch.

---

## Purpose

- Showcase how a typical CRUD application looks **without** security controls.
- Provide a baseline for testing security fixes (SQL injection, XSS, broken authentication, IDOR, etc.).

---

## Key Vulnerabilities (What’s Missing / Broken)

| Vulnerability | Impact |
|---------------|--------|
| **Plaintext passwords** | Passwords stored as-is in the database. |
| **SQL injection** | All queries use string concatenation (e.g., `' WHERE id = ' + userId`). |
| **No password hashing** | Registration and login compare raw passwords. |
| **Insecure session cookies** | No `HttpOnly` or `SameSite` flags; sessions saved even for unauthenticated users. |
| **No CSRF protection** | State‑changing requests (POST) have no tokens. |
| **No rate limiting** | Login endpoint allows unlimited brute‑force attempts. |
| **IDOR (Insecure Direct Object Reference)** | Users can edit/delete any task by changing the `id` in the URL. |
| **No role‑based access control** | Any logged‑in user can access `/admin` pages and change roles/delete users. |
| **XSS (Cross‑Site Scripting)** | No output encoding; user‑supplied script tags execute. |
| **Verbose error messages** | Database errors may reveal system information. |
| **Missing security headers** | No CSP, no X‑Frame‑Options, etc. |

---

## How to Run This Vulnerable Version

1. **Switch to the `vulnerable` branch**  
   ```bash
   git checkout vulnerable

2. **Install dependencies**
     ```bash
     npm install

3. **Create a `.env` file**
     SESSION_SECRET=CPASM
     PORT=3000

4. **Start the server**
     ```bash
     npm run dev

5. **Open `http://localhost:3000`**
     Default admin: `admin` / `admin123`

---

## Testing Vulnerabilities

1. **SQL Injection on Login**
   Enter the following as username (any password):
    ```bash
    ' OR '1'='1
  
  You will be logged in as the first user (admin).

2. **IDOR – Access Another User’s Task**
    Login as a regular user, note a task ID, then change the ID in the URL to another user’s task – you can edit/delete it.

3. **Privilege Escalation**
    Login as a regular user, navigate to /admin/users – you can promote yourself to admin.

4. **XSS**
    Create a task with title:
    ```bash
    <script>alert('XSS')</script>

  The script executes when viewing the task list.

---

## Contrast with Secure Branch

- All vulnerabilities listed above are fixed in the `main` branch using:
- crypt password hashing
- Parameterised queries (SQL injection prevention)
- CSRF tokens (csurf)
- Rate limiting (express-rate-limit)
- Role‑based middleware (isAdmin, canAccessTask)
- Helmet.js with strict CSP
- External JavaScript (to comply with CSP)
- Secure session cookie attributes

---

Author: Allwin Gnanaraj Charles Rajkumar (24318728)

Date: 21 April 2026
