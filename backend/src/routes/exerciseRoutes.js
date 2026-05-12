const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addExercise, getExercises } = require('../controllers/exerciseController');

router.post('/', protect, addExercise);
router.get('/', protect, getExercises);

module.exports = router;
