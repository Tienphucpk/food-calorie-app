const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const { analyzeMeal, saveMeal, getMealHistory, deleteMeal } = require('../controllers/mealController');

router.post('/analyze',  protect, upload.single('image'), analyzeMeal);
router.post('/save',     protect, saveMeal);
router.get('/history',   protect, getMealHistory);
router.delete('/:id',    protect, deleteMeal);

module.exports = router;
