const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true
  },
  type: {
    type: String,
    enum: ['TASK_ASSIGNMENT', 'COMMENT_LEFT', 'WORKSPACE_INVITE', 'WORKSPACE_REMOVAL', 'TASK_DELETION'], 
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'project'
  },
  isUnread: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("notification", notificationSchema);