const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  saveBasicInfo,
  saveGoal,
  saveHealth
} = require("../controllers/userDetailsController");

router.put("/basic", authMiddleware, saveBasicInfo);
router.put("/goal", authMiddleware, saveGoal);
router.put("/health", authMiddleware, saveHealth);

module.exports = router;
