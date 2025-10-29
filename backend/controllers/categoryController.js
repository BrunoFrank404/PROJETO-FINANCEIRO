const Category = require('../models/Category');

const getCategories = (req, res) => {
  const user_id = req.user?.id || null;
  Category.findAll(user_id, (err, categories) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(categories);
  });
};

const createCategory = (req, res) => {
  const { name, is_recurring } = req.body;
  const user_id = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Please enter category name' });
  }

  Category.create({ name, is_recurring, user_id }, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(201).json({ id: result.id, message: 'Category created successfully' });
  });
};

module.exports = { getCategories, createCategory };