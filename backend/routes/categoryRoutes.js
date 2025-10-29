const express = require('express');
const { getCategories, createCategory } = require('../backend/controllers/categoryController');
const authMiddleware = require('../backend/middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', createCategory);

module.exports = router;