const express = require('express');
const { createExpense, getExpenses, updateExpense, deleteExpense } = require('../backend/controllers/expenseController');
const authMiddleware = require('../backend/middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createExpense);
router.get('/', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;