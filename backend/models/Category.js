const db = require('../config/database');

const Category = {};

// Retorna todas as categorias (padrões e do usuário)
Category.findAll = (user_id, callback) => {
    db.all(
        `SELECT * FROM expense_categories WHERE is_default = 1 OR user_id = ? OR user_id IS NULL`,
        [user_id],
        (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        }
    );
};

Category.create = (category, callback) => {
    const { name, is_recurring, user_id } = category;
    db.run(
        `INSERT INTO expense_categories (name, is_recurring, user_id) VALUES (?, ?, ?)`,
        [name, is_recurring ? 1 : 0, user_id],
        function (err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID });
        }
    );
};

module.exports = Category;