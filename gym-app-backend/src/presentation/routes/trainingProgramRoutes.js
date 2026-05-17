const express = require("express");
const router = express.Router();
const { generateProgram, getUserProgram } = require("../controllers/trainingProgramController");
const { authMiddleware } = require("../middleware/authMiddleware");


router.get("/user", authMiddleware, getUserProgram);
router.post("/generate", authMiddleware, generateProgram);


module.exports = router;
