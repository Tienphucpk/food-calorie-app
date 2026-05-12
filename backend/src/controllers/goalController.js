const GoalModel = require('../models/GoalModel');

const setGoal = async (req, res) => {
    try {
        await GoalModel.setGoal(req.user.id, req.body);
        res.status(200).json({ success: true, message: 'Goal updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getGoal = async (req, res) => {
    try {
        const goal = await GoalModel.getGoalByUser(req.user.id);
        res.json({ success: true, goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { setGoal, getGoal };
