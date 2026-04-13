const express = require('express');
const router = express.Router();
const { isAuthenticated, canAccessTask } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware to check if user is authenticated for all task routes
router.use(isAuthenticated);

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        // Admin can see all tasks
        query = `
            SELECT tasks.*, users.username 
            FROM tasks 
            LEFT JOIN users ON tasks.user_id = users.id 
            ORDER BY tasks.created_at DESC
        `;
        params = [];
    } else {
        // users see only their tasks
        query = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
        params = [userId];
    }
    
    db.all(query, params, (err, tasks) => {
        if (err) {
            return res.render('tasks/list', { 
                error: 'Error loading tasks',
                tasks: [],
                user: req.session.user
            });
        }
        
        res.render('tasks/list', { 
            title: 'My Tasks',
            tasks: tasks,
            user: req.session.user
        });
    });
});

// Show create task form
router.get('/create', (req, res) => {
    res.render('tasks/create', { 
        title: 'Create Task',
        user: req.session.user,
        error: null
    });
});

// Create new task
router.post('/create', [
    body('title').trim().isLength({ min: 1, max: 200 }).escape(),
    body('description').trim().escape(),
    body('status').isIn(['pending', 'completed'])
], (req, res) => {
    const errors = validationResult(req);
    const { title, description, status } = req.body;
    const userId = req.session.user.id;
    const db = req.app.locals.db;

    if(!errors.isEmpty()){
        return res.render('tasks/create',{
            error: 'Invalid input',
            user: req.session.user
        });
    }
    
    // Input validation
    if (!title || title.trim().length === 0) {
        return res.render('tasks/create', { 
            error: 'Title is required',
            user: req.session.user
        });
    }
    
    if (title.length > 200) {
        return res.render('tasks/create', { 
            error: 'Title must be less than 200 characters',
            user: req.session.user
        });
    }
    
    // SQL injection is prevented by using parameterized queries
    db.run(
        'INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)',
        [title.trim(), description || '', status || 'pending', userId],
        function(err) {
            if (err) {
                return res.render('tasks/create', { 
                    error: 'Error creating task',
                    user: req.session.user
                });
            }
            
            res.redirect('/tasks?success=Task created successfully');
        }
    );
});

// Show edit task form
router.get('/edit/:id', canAccessTask, (req, res) => {
    const task = req.task;
    
    res.render('tasks/edit', { 
        title: 'Edit Task',
        task: task,
        user: req.session.user,
        error: null
    });
});

// Update task
router.post('/edit/:id', canAccessTask, (req, res) => {
    const { title, description, status } = req.body;
    const taskId = req.params.id;
    const db = req.app.locals.db;
    
    // Input validation
    if (!title || title.trim().length === 0) {
        return res.render('tasks/edit', { 
            error: 'Title is required',
            task: req.task,
            user: req.session.user
        });
    }
    
    // Update task using parameterized query
    db.run(
        'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
        [title.trim(), description || '', status, taskId],
        function(err) {
            if (err) {
                return res.render('tasks/edit', { 
                    error: 'Error updating task',
                    task: req.task,
                    user: req.session.user
                });
            }
            
            res.redirect('/tasks?success=Task updated successfully');
        }
    );
});

// Delete task
router.post('/delete/:id', canAccessTask, (req, res) => {
    const taskId = req.params.id;
    const db = req.app.locals.db;
    
    db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
        if (err) {
            return res.status(500).send('Error deleting task');
        }
        
        res.redirect('/tasks?success=Task deleted successfully');
    });
});

module.exports = router;