const ExerciseModel = require('../models/ExerciseModel');

const addExercise = async (req, res) => {
    try {
        const exerciseId = await ExerciseModel.addExercise(req.user.id, req.body);
        res.status(201).json({ success: true, message: 'Exercise added', exercise_id: exerciseId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getExercises = async (req, res) => {
    try {
        const exercises = await ExerciseModel.getExercisesByUser(req.user.id);
        res.json({ success: true, exercises });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addExercise, getExercises };
