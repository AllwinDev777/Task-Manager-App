# Secure Task Manager

A safe task management web application that illustrates the CRUD operations, role-based access control (user/admin) and enterprise-level security services. Created using Node.js, Express, SQLite, and EJS.


---

## Table of Contents
- [Project Overview](#project-overview)
- [Features & Security Objectives](#features--security-objectives)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Usage Guidelines](#usage-guidelines)
- [Security Improvements](#security-improvements)
- [Testing Process](#testing-process)
- [Contributions](#contributions)

---

## Project Overview

Secure Task Manager enables registered users to add, read, edit and delete their own tasks. Administrators are also given the privilege to control any users and tasks. The application is developed in-house (Option B) with security at the core of it, adopting the mitigation of the vulnerabilities of the OWASP Top 10 list, which includes SQL injection, XSS, CSRF, broken authentication and insecure direct object references.

**Live Demo (Video):** 

---

## Features & Security Objectives

### Functional Features
- Registering and logging in users (hashed password using bcrypt)
- Session management (24 hours lifetime, HttpOnly cookies, Same-site=Strict cookies)
- Task CRUD: create, view, edit, delete (users can only view their tasks)
List all users - Admin panel: change user roles, delete users (except self)
- Delete confirmation (external JavaScript to comply with CSP)

### Security Objectives Implemented
| Objective | Implementation |
|-----------|----------------|
| No plaintext passwords | bcrypt hashing (salt factor 10) |
| SQL injection prevention | Parameterised queries (all `db.run` / `db.get` use `?` placeholders) |
| XSS prevention | EJS auto‑escaping (`<%= %>`), CSP blocks inline scripts |
| CSRF protection | `csurf` middleware with hidden tokens in every POST form |
| Session hijacking protection | `HttpOnly`, `SameSite=Strict` cookie flags |
| Brute‑force mitigation | Rate limiting on login (5 attempts / 15 minutes) |
| Role‑based access control | Middleware `isAuthenticated`, `isAdmin`, `canAccessTask` |
| Secure HTTP headers | Helmet.js with strict CSP (no `unsafe-inline`) |

---

## Project Structure
```
secure-task-manager/
├── app.js # Main Express app (middleware, routes, server)
├── package.json # Dependencies & scripts
├── .env # Environment variables (SESSION_SECRET, PORT)
├── .gitignore # Ignore node_modules, .env, database.db
├── database.db # SQLite file (created on first run)
├── routes/
│ ├── tasks.js # Task CRUD routes (authenticated)
│ └── admin.js # Admin user management routes
├── middleware/
│ └── auth.js # isAuthenticated, isAdmin, canAccessTask
├── models/ # (No separate models – SQLite queries inline)
├── views/
│ ├── partials/
│ │ ├── header.ejs # Navbar, CSP‑compliant CSS/JS includes
│ │ └── footer.ejs # Closing tags, Bootstrap JS
│ ├── index.ejs # Home page
│ ├── login.ejs, register.ejs
│ ├── tasks/
│ │ ├── list.ejs # Display tasks with delete confirmation
│ │ ├── create.ejs
│ │ └── edit.ejs
│ ├── admin/
│ │ └── users.ejs # User management table (role change via external JS)
│ └── error.ejs
├── public/
│ ├── css/
│ │ └── style.css # Custom styles
│ └── js/
│ ├── tasks.js # Delete confirmation handler (external)
│ └── admin.js # Auto‑submit role change dropdown (external)
└── README.md
```
---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later)
- npm (comes with Node.js)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/secure-task-manager.git
   cd secure-task-manager

2. **Install Dependencies**
   ```bash
     install npm

3. **Create a .env file in root directory**
    SESSION_SECRET=your-super-secret-key-change-this
    PORT=3000
    NODE_ENV=development

4. **Start the Application**
   ```bash
   npm run dev      # uses nodemon for auto‑restart
   # or
   npm start        # node app.js

6. **Open Browser and go to http://localhost:3000**
   
   Default admin account (created automatically on first run):
   - Username: admin
   - Password: admin123
   
---


## Usage Guidelines

### Regular User

1. Register a new account (username, password ≥6 chars).
2. Login with your credentials.
3. Create tasks – provide a title, optional description, and status (pending/completed).
4. View all your tasks on the /tasks page.
5. Edit or delete any task (delete triggers a confirmation dialog).
6. Logout using the navbar link.

### Adminsitrator
1. Login with the admin account (or promote a user via the admin panel).
2. Navigate to Manage Users (visible only to admins).
3. Change any user’s role (user/admin) – the dropdown auto‑submits (external JS).
4. Delete any user (except yourself). All associated tasks are also removed.

### Security Improvements
This project transforms a basic CRUD app into a secure web application by addressing vulnerabilities at every layer:

| Vulnerability | Basic Implementation (Insecure) | Secure Implementation (Our App) |
|---------------|--------------------------------|----------------------------------|
| SQL injection | String concatenation in queries | **Parameterised queries** (all `db.run`/`db.get` use `?`) |
| XSS | Rendering unsanitised user input | **EJS auto‑escaping** + CSP blocking inline scripts |
| Password storage | Plaintext or weak hash | **bcrypt** with salt factor 10 |
| Session hijacking | No cookie flags | `HttpOnly`, `SameSite=Strict` |
| CSRF | No tokens | **`csurf` middleware** + hidden fields in all POST forms |
| Privilege escalation | No authorisation checks | Middleware: `isAdmin`, `canAccessTask` |
| Brute‑force login | Unlimited attempts | **Rate limiting** (5 attempts / 15 min) |
| Information disclosure | Verbose error messages | Generic error pages, no stack traces |

**CSP Compliance:**  
The Content Security Policy (configured via Helmet) blocks `unsafe-inline`. All JavaScript (delete confirmation, role change) is moved to external files (`/js/tasks.js`, `/js/admin.js`).

---

## Testing Process

### Functional Testing (Manual)
We tested all user stories and edge cases:

| Test Case | Result |
|-----------|--------|
| Register with duplicate username | Error shown |
| Login with wrong password 6 times in 15 min | Rate limit blocks request |
| User tries to edit another user’s task via URL | 403 Forbidden |
| Admin changes a user’s role | Role updated in DB |
| Delete task – click Cancel on confirmation dialog | Task not deleted |

### Static Application Security Testing (SAST)
- **Tool:** ESLint with `eslint-plugin-security`  
- **Findings fixed:** Inline event handlers (CSP violation), missing CSRF tokens, missing rate limiting.  
- **Remaining issues (not fixed – noted for future):** No audit logging, no HTTPS.

### Security Feature Tests
| Attack | Payload | Result |
|--------|---------|--------|
| SQL injection (login) | `' OR '1'='1` as username | Login fails – parameterised query treats as literal |
| XSS (task title) | `<script>alert('XSS')</script>` | Rendered as text, not executed |
| IDOR (task access) | Change `id` in `/tasks/edit/2` | 403 unless admin or owner |

---

## Contributions

This project was developed individually for the **Secure Web Development** assignment.  

**Technologies & libraries used:**  
- [Node.js](https://nodejs.org/) – Runtime  
- [Express](https://expressjs.com/) – Web framework  
- [SQLite3](https://www.sqlite.org/) – Embedded database  
- [EJS](https://ejs.co/) – Templating engine  
- [bcrypt](https://www.npmjs.com/package/bcrypt) – Password hashing  
- [express-session](https://www.npmjs.com/package/express-session) – Session management  
- [helmet](https://helmetjs.github.io/) – Secure HTTP headers  
- [csurf](https://www.npmjs.com/package/csurf) – CSRF protection  
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) – Brute‑force mitigation  
- [Bootstrap](https://getbootstrap.com/) – Frontend styling  

---

## Future Improvements
- Add HTTPS (production deployment)
- Implement audit logging (Mandatory to have for role change feature)
- Two‑factor authentication
- Password reset via email

---

**Author:** Allwin Gnanaraj Charles Rajkumar - 24318728 
**Date:** 15th April 2025
```


