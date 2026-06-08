const Notification = require("../models/notification");

exports.createNotification = async (io, { recipient, sender, type, message, projectId }) => {
  try {
    const newNotification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      projectId
    });

    const populatedNotification = await newNotification.populate('sender', 'name email');

    io.to(recipient.toString()).emit('NOTIFICATION_RECEIVED', populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error("Failed to generate system notification:", error);
  }
};

