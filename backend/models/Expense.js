const db = require('../config/database');

const Expense = {};

Expense.create = (expense, callback) => {
    const { description, amount, category_id, user_id, date, is_recurring } = expense;
    db.run(
        `INSERT INTO expenses (description, amount, category_id, user_id, date, is_recurring) VALUES (?, ?, ?, ?, ?, ?)`,
        [description, parseFloat(amount), category_id, user_id, date, is_recurring ? 1 : 0],
        function (err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID });
        }
    );
};

Expense.findByUserId = (user_id, callback) => {
    db.all(
        `SELECT e.*, ec.name as category_name 
         FROM expenses e 
         LEFT JOIN expense_categories ec ON e.category_id = ec.id 
         WHERE e.user_id = ?`,
        [user_id],
        (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        }
    );
};

Expense.update = (id, expense, callback) => {
    const { description, amount, category_id, date, is_recurring } = expense;
    db.run(
        `UPDATE expenses SET description=?, amount=?, category_id=?, date=?, is_recurring=? WHERE id=?`,
        [description, parseFloat(amount), category_id, date, is_recurring ? 1 : 0, id],
        function (err) {
            if (err) return callback(err);
            callback(null, { changes: this.changes });
        }
    );
};

Expense.delete = (id, callback) => {
    db.run(`DELETE FROM expenses WHERE id=?`, [id], function (err) {
        if (err) return callback(err);
        callback(null, { changes: this.changes });
    });
};

module.exports = Expense;