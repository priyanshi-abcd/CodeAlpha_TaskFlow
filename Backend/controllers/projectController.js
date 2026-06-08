const Project = require("../models/project");
const User = require("../models/user");
const Notification = require("../models/notification");

exports.createProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const newProject = await Project.create({
            title,
            description,
            owner: req.user.id,
            members: [req.user.id] 
        });

        return res.status(201).json(newProject);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        }).populate('owner', 'name email'); 

        return res.status(200).json(projects);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email'); 

    if (!project) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    const isOwner = project.owner._id.toString() === req.user.id;
    const isMember = project.members.some(m => m._id.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied to this workspace' });
    }

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const currentUserId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project workspace not found.' });
    }

    if (project.owner.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only the project creator can invite members.' });
    }

    const userToInvite = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToInvite) {
      return res.status(404).json({ message: 'No registered user found with that email address.' });
    }

    if (userToInvite._id.toString() === project.owner.toString()) {
      return res.status(400).json({ message: 'You are already the owner of this workspace.' });
    }

    const isAlreadyMember = project.members.some(
      (memberId) => memberId.toString() === userToInvite._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'This user is already a member of this workspace.' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { members: userToInvite._id } },
      { returnDocument: 'after' }
    ).populate('members', 'name email');


    try {
      const inviteNotification = await Notification.create({
        recipient: userToInvite._id,                  
        sender: currentUserId,                        
        type: 'WORKSPACE_INVITE',
        message: `${req.user.name || 'The Project Manager'} added you to the workspace: "${project.name || 'New Project'}"`,
        projectId: projectId
      });

      const populatedNotification = await inviteNotification.populate('sender', 'name email');
      
      const io = req.app.get('socketio');
      if (io) {
        io.to(userToInvite._id.toString()).emit('NOTIFICATION_RECEIVED', populatedNotification);
      }
    } catch (notifErr) {
      console.error("Non-fatal workspace invitation alert failure:", notifErr);
    }

    res.status(200).json({
      message: `${userToInvite.name} added successfully!`,
      members: updatedProject.members
    });

  } catch (error) {
    console.error("Workspace Member Invitation Error:", error);
    res.status(500).json({ message: 'Internal server error processing invitation.', error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString(); // Standardized fallback for id fields

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project workspace node not found." });
    }

    if (project.owner.toString() !== currentUserId) {
      return res.status(403).json({ 
        message: "Access Denied: Only the Project Manager can remove workspace members." 
      });
    }


    if (memberId !== currentUserId) {
      try {
        const removalNotification = await Notification.create({
          recipient: memberId,                        
          sender: currentUserId,                     
          type: 'WORKSPACE_REMOVAL',
          message: `You have been removed from the workspace: "${project.name || 'Project Workspace'}"`,
          projectId: projectId
        });

        const populatedRemovalNotif = await removalNotification.populate('sender', 'name email');
        
        const io = req.app.get('socketio');
        if (io) {
          io.to(memberId).emit('NOTIFICATION_RECEIVED', populatedRemovalNotif);
        }
      } catch (remNotifErr) {
        console.error("Non-fatal workspace removal alert failure:", remNotifErr);
      }
    }
   
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $pull: { members: memberId } },
      { new: true }
    ).populate('members', 'name email');

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Security verification fault during member pull:", error);
    res.status(500).json({ message: error.message });
  }
};