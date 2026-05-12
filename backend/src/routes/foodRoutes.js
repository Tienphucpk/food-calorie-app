const express = require('express');
const router = express.Router();
const { getFoods, getFood, createFood } = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getFoods);
router.post('/', protect, createFood);
router.get('/:id', getFood);

module.exports = router;