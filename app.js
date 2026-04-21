const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

//No helmet, no CSP
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//no HttpOnly, no SameSite
app.use(session({
    secret: process.env.SESSION_SECRET || 'weaksecret',
    resave: false,
    saveUninitialized: true, // saves empty sessions
    cookie: { secure: false } // allows HTTP, no HttpOnly flag
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    //stores plaintext passwords
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,   -- plaintext
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    
    db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, 'admin')",
        ['admin', 'admin123']);
});

app.locals.db = db;

//No authentication middleware on routes

app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

// Login – no rate limiting, no parameterized query
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // VULNERABLE: string concatenation
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    db.get(query, (err, user) => {
        if (user) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid credentials', user: null });
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login', { user: null });
});

//Registration – no password hashing, no input validation
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    // VULNERABLE: plaintext insert
    db.run(`INSERT INTO users (username, password) VALUES ('${username}', '${password}')`, (err) => {
        if (err) res.render('register', { error: 'Username exists' });
        else res.redirect('/login');
    });
});

app.get('/register', (req, res) => {
    res.render('register', { user: null });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

//TASK ROUTES – no authentication required, no authorisation checks
const taskRoutes = require('./routes/tasks')(db); // pass db
app.use('/tasks', taskRoutes);

// ADMIN ROUTES
const adminRoutes = require('./routes/admin')(db);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));