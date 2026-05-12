const mongoose = require("mongoose");

const mealSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      food: String,

      calories: String,

      protein: String,

      image: String,
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "Meal",
  mealSchema
);