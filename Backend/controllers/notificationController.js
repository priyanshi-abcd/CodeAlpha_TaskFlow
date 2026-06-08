const Notification = require("../models/notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(20); 

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isUnread: true },
      { $set: { isUnread: false } }
    );
    res.status(200).json({ message: "Notifications marked as read smoothly." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};