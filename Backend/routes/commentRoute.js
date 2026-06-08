const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { addComment, getTaskComments ,editComment, deleteComment} = require('../controllers/commentController');

router.post("/",protect, addComment);
router.get("/task/:taskId",protect, getTaskComments);
router.put("/:id",protect, editComment);
router.delete("/:id",protect, deleteComment);

module.exports = router;