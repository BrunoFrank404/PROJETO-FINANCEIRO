const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {};

User.findByEmail = (email, callback) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return callback(err);
    callback(null, row);
  });
};

User.findById = (id, callback) => {
  db.get('SELECT id, name, email, monthly_income FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return callback(err);
    callback(null, row);
  });
};

User.create = (user, callback) => {
  const { name, email, password } = user;
  const hashed = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed],
    function (err) {
      if (err) return callback(err);
      callback(null, { id: this.lastID });
    }
  );
};

module.exports = User;
