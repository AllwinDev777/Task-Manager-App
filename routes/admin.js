const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// All admin routes require admin role
router.use(isAdmin);

// List all users
router.get('/users', (req, res) => {
    const db = req.app.locals.db;
    
    db.all('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
        if (err) {
            return res.render('admin/users', {
                title: 'Manage Users',
                error: 'Error loading users',
                users: [],
                user: req.session.user
            });
        }
        
        res.render('admin/users', {
            title: 'Manage Users',
            users: users,
            user: req.session.user,
            success: req.query.success,
            error: null
        });
    });
});

// Change user role (promote/demote)
router.post('/users/:id/role', (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;
    const db = req.app.locals.db;
    const currentUserId = req.session.user.id;
    
    // Prevent admin from changing their own role (optional but good)
    if (parseInt(userId) === currentUserId) {
        return res.redirect('/admin/users?error=You cannot change your own role');
    }
    
    // Validate role
    if (role !== 'user' && role !== 'admin') {
        return res.redirect('/admin/users?error=Invalid role');
    }
    
    db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], (err) => {
        if (err) {
            return res.redirect('/admin/users?error=Database error');
        }
        res.redirect('/admin/users?success=User role updated');
    });
});

// Delete a user (and their tasks)
router.post('/users/:id/delete', (req, res) => {
    const userId = req.params.id;
    const db = req.app.locals.db;
    const currentUserId = req.session.user.id;
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === currentUserId) {
        return res.redirect('/admin/users?error=You cannot delete your own account');
    }
    
    // Delete user's tasks first (foreign key constraint)
    db.run('DELETE FROM tasks WHERE user_id = ?', [userId], (err) => {
        if (err) {
            return res.redirect('/admin/users?error=Error deleting user tasks');
        }
        
        db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
            if (err) {
                return res.redirect('/admin/users?error=Error deleting user');
            }
            res.redirect('/admin/users?success=User deleted successfully');
        });
    });
});

module.exports = router;