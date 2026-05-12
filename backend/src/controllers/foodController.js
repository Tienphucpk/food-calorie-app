const FoodModel = require('../models/FoodModel');

const getFoods = async (req, res) => {
    try {
        const foods = await FoodModel.getAll();
        res.json({ success: true, count: foods.length, foods });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getFood = async (req, res) => {
    try {
        const food = await FoodModel.findById(req.params.id);
        if (food) {
            res.json({ success: true, food });
        } else {
            res.status(404).json({ success: false, message: 'Food not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createFood = async (req, res) => {
    try {
        const foodId = await FoodModel.create(req.body);
        res.status(201).json({ success: true, message: 'Food added', id: foodId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getFoods, getFood, createFood };