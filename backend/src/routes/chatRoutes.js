const express = require('express');
const router = express.Router();
const { askAi, getHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askAi);
router.get('/history', protect, getHistory);

module.exports = router;
