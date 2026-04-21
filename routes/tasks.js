module.exports = (db) => {
    const router = require('express').Router();

    //anyone can access tasks
    router.get('/', (req, res) => {
        const userId = req.session.user ? req.session.user.id : null;
        if (!userId) return res.redirect('/login');
        //VULNERABLE: string concatenation
        db.all(`SELECT * FROM tasks WHERE user_id = ${userId}`, (err, tasks) => {
            res.render('tasks/list', { tasks, user: req.session.user });
        });
    });

    router.get('/create', (req, res) => {
        if (!req.session.user) return res.redirect('/login');
        res.render('tasks/create', { user: req.session.user });
    });

    router.post('/create', (req, res) => {
        const { title, description, status } = req.body;
        const userId = req.session.user.id;
        //VULNERABLE: SQL injection via title
        db.run(`INSERT INTO tasks (title, description, status, user_id) VALUES ('${title}', '${description}', '${status}', ${userId})`, (err) => {
            res.redirect('/tasks');
        });
    });

    // IDOR – anyone can edit any task by changing id in URL
    router.get('/edit/:id', (req, res) => {
        const taskId = req.params.id;
        db.get(`SELECT * FROM tasks WHERE id = ${taskId}`, (err, task) => {
            res.render('tasks/edit', { task, user: req.session.user });
        });
    });

    router.post('/edit/:id', (req, res) => {
        const { title, description, status } = req.body;
        const taskId = req.params.id;
        db.run(`UPDATE tasks SET title = '${title}', description = '${description}', status = '${status}' WHERE id = ${taskId}`, (err) => {
            res.redirect('/tasks');
        });
    });

    router.post('/delete/:id', (req, res) => {
        const taskId = req.params.id;
        db.run(`DELETE FROM tasks WHERE id = ${taskId}`, (err) => {
            res.redirect('/tasks');
        });
    });

    return router;
};