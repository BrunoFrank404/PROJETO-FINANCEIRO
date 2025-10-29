const Expense = require('../models/Expense');

const createExpense = (req, res) => {
  const { description, amount, category_id, date, is_recurring } = req.body;
  const user_id = req.user.id;

  if (!description || !amount || !category_id || !date) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  Expense.create({ description, amount, category_id, user_id, date, is_recurring }, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(201).json({ id: result.id, message: 'Expense created successfully' });
  });
};

const getExpenses = (req, res) => {
  const user_id = req.user.id;
  Expense.findByUserId(user_id, (err, expenses) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(expenses);
  });
};

const updateExpense = (req, res) => {
  const { id } = req.params;
  const { description, amount, category_id, date, is_recurring } = req.body;

  Expense.update(id, { description, amount, category_id, date, is_recurring }, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense updated successfully' });
  });
};

const deleteExpense = (req, res) => {
  const { id } = req.params;
  Expense.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  });
};

module.exports = { createExpense, getExpenses, updateExpense, deleteExpense };