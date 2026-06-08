const Comment = require("../models/comment");
const Task = require("../models/task");
const Notification = require("../models/notification"); // 🌟 Import the Notification Schema


exports.addComment = async (req, res) => {
  try {
    const { taskId, text } = req.body;
    const currentUserId = req.user._id || req.user.id;

    if (!text) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task target not found' });
    }

    const comment = await Comment.create({
      task: taskId,
      user: currentUserId, 
      text
    });

    const populatedComment = await comment.populate('user', 'name email');

    let recipientId = null;

    if (task.assignedTo && task.assignedTo.toString() !== currentUserId.toString()) {
      recipientId = task.assignedTo;
    } else if (task.createdBy && task.createdBy.toString() !== currentUserId.toString()) {
      recipientId = task.createdBy;
    }

    if (recipientId) {
      try {
        const newNotification = await Notification.create({
          recipient: recipientId,      
          sender: currentUserId,       
          type: 'COMMENT_LEFT',        
          message: `${populatedComment.user.name || 'A teammate'} left a comment on task: "${task.title}"`,
          projectId: task.project      
        });

        const populatedNotification = await newNotification.populate('sender', 'name email');

        const payload = populatedNotification.toObject();
        payload.type = 'COMMENT_LEFT'; 

        const io = req.app.get('socketio'); 
        if (io) {
          io.to(recipientId.toString()).emit('NOTIFICATION_RECEIVED', payload);
        }
      } catch (notifErr) {
        console.error("Non-fatal background alert failure:", notifErr.message);
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Comment Insertion Error:", error);
    res.status(500).json({ message: 'Server Error adding comment', error: error.message });
  }
};

exports.getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Fetch Thread Error:", error);
    res.status(500).json({ message: 'Server Error fetching thread data', error: error.message });
  }
};

exports.editComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text content required' });

    let comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(401).json({ message: 'Unauthorized to edit this comment' });
    }

    comment.text = text;
    await comment.save();

    const populatedComment = await comment.populate('user', 'name email');
    res.status(200).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error editing comment', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(401).json({ message: 'Unauthorized to delete this comment' });
    }

    await comment.deleteOne();
    res.status(200).json({ message: 'Comment removed successfully', commentId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting comment', error: error.message });
  }
};