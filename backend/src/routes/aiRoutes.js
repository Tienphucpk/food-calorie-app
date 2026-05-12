const express = require("express");

const multer = require("multer");

const router =
  express.Router();

const {
  analyzeFood,
} = require(
  "../controllers/aiController"
);

// MULTER
const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(null, "uploads/");
    },

    filename: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        Date.now() +
          "-" +
          file.originalname
      );
    },
  });

const upload = multer({
  storage,
});

// ROUTE
router.post(
  "/analyze",
  upload.single("image"),
  analyzeFood
);

module.exports = router;