const Task = require("../models/task");
const Project = require("../models/project");
const Notification = require("../models/notification");

exports.createTask = async (req, res) => {
  try {
    const { project, title, description, status, priority, assignedTo } = req.body;
    const currentUserId = req.user.id;

    const targetProject = await Project.findById(project);
    if (!targetProject) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    if (!targetProject.members.includes(currentUserId) && targetProject.owner.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this workspace' });
    }

    let task = await Task.create({
      project,
      title,
      description,
      status,
      priority,
      assignedTo: assignedTo || null,
      createdBy: currentUserId
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name' }
    ]);

    if (task.assignedTo && task.assignedTo._id.toString() !== currentUserId) {
      try {
        const newNotification = await Notification.create({
          recipient: task.assignedTo._id,
          sender: currentUserId,
          type: 'TASK_ASSIGNMENT', 
          message: `${task.createdBy.name} assigned you a new task: "${task.title}"`,
          projectId: task.project
        });

        const populatedNotification = await newNotification.populate('sender', 'name email');
        
        const payload = populatedNotification.toObject();
        payload.type = 'TASK_ASSIGNED';

        const io = req.app.get('socketio');
        if (io) {
          io.to(task.assignedTo._id.toString()).emit('NOTIFICATION_RECEIVED', payload);
        }
      } catch (notifErr) {
        console.error("Non-fatal creation alert failure:", notifErr.message);
      }
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    if (!project.members.includes(req.user.id) && project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this workspace board' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedTo } = req.body;
    const currentUserId = req.user.id;

    if (!req.user || !currentUserId) {
      return res.status(401).json({ message: 'Authentication required. Missing user payload.' });
    }

    let task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task target not found' });
    }

    const previousAssigneeId = task.assignedTo ? task.assignedTo.toString() : null;
    const previousStatus = task.status;

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Associated project workspace not found' });
    }

    const isMember = project.members && project.members.map(m => m.toString()).includes(currentUserId);
    const isOwner = project.owner && project.owner.toString() === currentUserId;

    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Action not authorized on this workspace' });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    
    if (assignedTo !== undefined) {
      updateFields.assignedTo = (assignedTo === '' || assignedTo === 'Unassigned') ? null : assignedTo;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: false }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name');


    const io = req.app.get('socketio');
    const updaterName = req.user.name || 'A teammate';

    
    if (updatedTask.assignedTo) {
      const newAssigneeId = updatedTask.assignedTo._id.toString();
      
      if (newAssigneeId !== previousAssigneeId && newAssigneeId !== currentUserId) {
        try {
          const updateNotification = await Notification.create({
            recipient: updatedTask.assignedTo._id,
            sender: currentUserId,
            type: 'TASK_ASSIGNMENT', 
            message: `You have been assigned to the task: "${updatedTask.title}"`,
            projectId: updatedTask.project
          });

          const populatedNotification = await updateNotification.populate('sender', 'name email');
          
          const payload = populatedNotification.toObject();
          payload.type = 'TASK_ASSIGNED'; 

          if (io) {
            io.to(newAssigneeId).emit('NOTIFICATION_RECEIVED', payload);
          }
        } catch (notifErr) {
          console.error("Non-fatal update alert failure:", notifErr.message);
        }
      }
    }

    if (status !== undefined && previousStatus !== status) {
      let statusRecipientId = null;

      if (updatedTask.assignedTo && updatedTask.assignedTo._id.toString() !== currentUserId) {
        statusRecipientId = updatedTask.assignedTo._id.toString();
      } else if (updatedTask.createdBy && updatedTask.createdBy._id.toString() !== currentUserId) {
        statusRecipientId = updatedTask.createdBy._id.toString();
      }

      if (statusRecipientId) {
        try {
          const statusNotification = await Notification.create({
            recipient: statusRecipientId,
            sender: currentUserId,
            type: 'COMMENT_LEFT', 
            message: `${updaterName} moved "${updatedTask.title}" from ${previousStatus} to ${status}`,
            projectId: updatedTask.project
          });

          const populatedStatusNotif = await statusNotification.populate('sender', 'name email');
          
          const payload = populatedStatusNotif.toObject();
          payload.type = 'COMMENT_LEFT';

          if (io) {
            io.to(statusRecipientId).emit('NOTIFICATION_RECEIVED', payload);
          }
        } catch (statusErr) {
          console.error("Non-fatal status update alert failure:", statusErr.message);
        }
      }
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Task Update Crash Trace:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task target not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Associated project workspace not found' });
    }

    const isMember = project.members && project.members.map(m => m.toString()).includes(currentUserId);
    const isOwner = project.owner && project.owner.toString() === currentUserId;

    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Action not authorized on this workspace' });
    }

 
    let deleteRecipientId = null;
    
    if (task.assignedTo && task.assignedTo.toString() !== currentUserId) {
      deleteRecipientId = task.assignedTo.toString();
    } else if (task.createdBy && task.createdBy.toString() !== currentUserId) {
      deleteRecipientId = task.createdBy.toString();
    }

    if (deleteRecipientId) {
      try {
        const deleteNotification = await Notification.create({
          recipient: deleteRecipientId,
          sender: currentUserId,
          type: 'TASK_DELETION', 
          message: `${req.user.name || 'A teammate'} deleted the task card: "${task.title}"`,
          projectId: task.project
        });

        const populatedDeleteNotif = await deleteNotification.populate('sender', 'name email');
        
        const payload = populatedDeleteNotif.toObject();
        payload.type = 'TASK_DELETION';

        const io = req.app.get('socketio');
        if (io) {
          io.to(deleteRecipientId).emit('NOTIFICATION_RECEIVED', payload);
        }
      } catch (delNotifErr) {
        console.error("Non-fatal deletion alert failure:", delNotifErr.message);
      }
    }

    await Task.findByIdAndDelete(id);
    res.status(200).json({ message: 'Task ticket dropped successfully from records.', taskId: id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};