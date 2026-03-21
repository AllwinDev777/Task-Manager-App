// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).render('error', { 
        message: 'Access denied. Admin privileges required.' 
    });
};

// Middleware to check if user owns the resource or is admin
const canAccessTask = (req, res, next) => {
    const taskId = req.params.id;
    const userId = req.session.user.id;
    const userRole = req.session.user.role;
    
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
        if (err) {
            return res.status(500).render('error', { message: 'Database error' });
        }
        if (!task) {
            return res.status(404).render('error', { message: 'Task not found' });
        }
        
        // Allow if user is admin or owns the task
        if (userRole === 'admin' || task.user_id === userId) {
            req.task = task;
            return next();
        }
        
        res.status(403).render('error', { 
            message: 'Access denied. You can only access your own tasks.' 
        });
    });
};

module.exports = { isAuthenticated, isAdmin, canAccessTask };