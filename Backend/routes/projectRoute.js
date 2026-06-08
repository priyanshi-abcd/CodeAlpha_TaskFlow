const express = require('express');
const router = express.Router();
const { createProject, getProjects,getProjectById ,addMember,removeMember} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.post("/", protect, createProject);
router.get("/", protect, getProjects);
router.get("/:projectId",protect, getProjectById);
router.put("/:projectId/invite",protect, addMember);
router.delete("/:projectId/members/:memberId",protect,removeMember);

module.exports = router;