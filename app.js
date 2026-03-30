const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://cdn.jsdelivr.net"],
        },
    },
}));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./database.db');

//Import
const taskRoutes = require('./routes/task')

//use routes
app.use('/tasks', taskRoutes)

// Creating tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
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

    // Creating an admin
    db.get("SELECT * FROM users WHERE role = 'admin'", [], (err, row) => {
        if (!row) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run(
                "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')",
                ['admin', hashedPassword]
            );
            console.log('Default admin created (username: admin, password: admin123)');
        }
    });
});

// Make db available to routes
app.locals.db = db;

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home',
        user: req.session.user 
    });
});

// Auth routes
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { 
        title: 'Login',
        user: null 
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.render('login', { 
                error: 'Database error',
                user: null 
            });
        }
        
        if (!user) {
            return res.render('login', { 
                error: 'Invalid username or password',
                user: null 
            });
        }
        
        // Compare password with hashed password
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                // Store user in session (excluding password)
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                };
                res.redirect('/');
            } else {
                res.render('login', { 
                    error: 'Invalid username or password',
                    user: null 
                });
            }
        });
    });
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { 
        title: 'Register',
        user: null 
    });
});

app.post('/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;
    
    // Validation
    if (password !== confirmPassword) {
        return res.render('register', { 
            error: 'Passwords do not match',
            user: null 
        });
    }
    
    if (password.length < 6) {
        return res.render('register', { 
            error: 'Password must be at least 6 characters',
            user: null 
        });
    }
    
    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.render('register', { 
                error: 'Error creating user',
                user: null 
            });
        }
        
        // Insert user
        db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hash],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.render('register', { 
                            error: 'Username already exists',
                            user: null 
                        });
                    }
                    return res.render('register', { 
                        error: 'Database error',
                        user: null 
                    });
                }
                
                res.redirect('/login?registered=true');
            }
        );
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});