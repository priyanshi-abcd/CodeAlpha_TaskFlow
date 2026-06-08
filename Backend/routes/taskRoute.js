const express = require('express');
const router = express.Router();
const { createTask, getProjectTasks ,updateTask, deleteTask} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.post("/", protect, createTask);
router.get("/project/:projectId",protect ,getProjectTasks)
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

module.exports = router;