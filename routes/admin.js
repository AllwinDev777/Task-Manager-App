module.exports = (db) => {
    const router = require('express').Router();

    //any logged-in user can access
    router.get('/users', (req, res) => {
        db.all(`SELECT id, username, role FROM users`, (err, users) => {
            res.render('admin/users', { users, user: req.session.user });
        });
    });

    // Change role – no authorisation, no CSRF
    router.post('/users/:id/role', (req, res) => {
        const userId = req.params.id;
        const { role } = req.body;
        db.run(`UPDATE users SET role = '${role}' WHERE id = ${userId}`, (err) => {
            res.redirect('/admin/users');
        });
    });

    // Delete user – no ownership check, can delete admin
    router.post('/users/:id/delete', (req, res) => {
        const userId = req.params.id;
        db.run(`DELETE FROM tasks WHERE user_id = ${userId}`, () => {
            db.run(`DELETE FROM users WHERE id = ${userId}`, () => {
                res.redirect('/admin/users');
            });
        });
    });

    return router;
};