import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Circle, 
  UserPlus, 
  Users, 
  MessageSquare, 
  Send, 
  X, 
  Inbox 
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const getDynamicInitials = (nameStr) => {
  if (!nameStr) return '??';

  const parts = nameStr.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
};

const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id || decoded._id;
  } catch (err) {
    return null;
  }
};

const ProjectBoard = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState({ type: '', text: '' });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [readTasks, setReadTasks] = useState([]);

  const commentsEndRef = useRef(null);

  const selectedTaskRef = useRef(selectedTask);
  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask._id);
    }
  }, [selectedTask]);

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);


  useEffect(() => {
    const handleGlobalNotificationOpen = (event) => {
      const notification = event.detail;
      if (!notification) return;

      const targetTaskId = notification.taskId || notification.task?._id || notification.task;

      if (targetTaskId) {
        const targetTask = tasks.find(t => t._id === targetTaskId);
        if (targetTask) {
          setHighlightedTaskId(targetTaskId);
          setReadTasks(prev => prev.filter(id => id !== targetTaskId));
          return;
        }
      }

      const titleMatch = notification.text?.match(/"([^"]+)"/) || notification.message?.match(/"([^"]+)"/);
      if (titleMatch && titleMatch[1]) {
        const extractedTitle = titleMatch[1].trim();
        const targetTask = tasks.find(
          t => t.title?.trim().toLowerCase() === extractedTitle.toLowerCase()
        );

        if (targetTask) {
          setHighlightedTaskId(targetTask._id);
          setReadTasks(prev => prev.filter(id => id !== targetTask._id));
        } else {
          console.warn(`Could not find a live matching task for title: "${extractedTitle}"`);
        }
      }
    };

    window.addEventListener('open_notification_task', handleGlobalNotificationOpen);
    return () => {
      window.removeEventListener('open_notification_task', handleGlobalNotificationOpen);
    };
  }, [tasks]);


  useEffect(() => {
    if (tasks.length > 0) {
      const pendingTaskId = sessionStorage.getItem('pendingNotificationTaskId');
      
      if (pendingTaskId) {
        const targetTask = tasks.find(t => t._id === pendingTaskId);
        if (targetTask) {
          setHighlightedTaskId(pendingTaskId);
          setReadTasks(prev => prev.filter(id => id !== pendingTaskId));
        } else {
          console.warn(`Session storage task ID found (${pendingTaskId}), but no match was located in the fetched tasks list.`);
        }
        
        sessionStorage.removeItem('pendingNotificationTaskId');
      }
    }
  }, [tasks]);

  useEffect(() => {
    if (!projectId) return;

    socket.emit('join_project', projectId);

    socket.on('task_updated_stream', (data) => {
      fetchTasks();

      if (selectedTaskRef.current && selectedTaskRef.current._id === data.taskId) {
        fetchComments(data.taskId);
      }
    });

    socket.on('receive_message', (data) => {
      const incomingComment = data.message || data;

      const incomingTaskId = typeof incomingComment.task === 'object'
        ? incomingComment.task?._id
        : (incomingComment.task || incomingComment.taskId);

      if (selectedTaskRef.current && selectedTaskRef.current._id === incomingTaskId) {
        setComments((prevComments) => {
          if (prevComments.some(c => c._id === incomingComment._id)) return prevComments;
          return [...prevComments, incomingComment];
        });
      }
    });

    return () => {
      socket.off('task_updated_stream');
      socket.off('receive_message');
    };
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (err) {
      console.error("Error pulling project details:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedData = data.map(task => ({
          ...task,
          status: task.status === 'To Do' ? 'Todo' : task.status
        }));
        setTasks(normalizedData);
      } else {
        console.error(`Server returned error status: ${response.status}`);
      }
    } catch (err) {
      console.error("Network fetching error:", err);
    }
  };

  const fetchComments = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/task/${taskId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleAddComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ taskId: selectedTask._id, text: newCommentText })
      });
      const data = await response.json();

      if (response.ok) {
        setComments([...comments, data]);
        setNewCommentText('');

        socket.emit('send_message', {
          projectId: projectId,
          message: data
        });
      } else {
        console.error("Backend validation failed:", data.message);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(e);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: editText })
      });
      const data = await response.json();

      if (response.ok) {
        setComments(comments.map(c => c._id === commentId ? data : c));
        setEditingCommentId(null);
        setEditText('');
        socket.emit('task_changed', { projectId });
      }
    } catch (err) {
      console.error("Error updating comment node:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to drop this comment from logs?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setComments(comments.filter(c => c._id !== commentId));
        socket.emit('task_changed', { projectId });
      }
    } catch (err) {
      console.error("Error deleting comment node:", err);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteMessage({ type: '', text: '' });
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/invite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await response.json();

      if (response.ok) {
        setInviteMessage({ type: 'success', text: data.message });
        setProject({ ...project, members: data.members });
        setInviteEmail('');
      } else {
        setInviteMessage({ type: 'error', text: data.message || 'Invitation processing failed.' });
      }
    } catch (err) {
      setInviteMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member from the workspace?")) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/projects/${project._id}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });

      if (response.status === 200) {
        setProject(prev => ({
          ...prev,
          members: prev.members.filter(m => m._id !== memberId)
        }));
      }
    } catch (error) {
      console.error("Error removing workspace member:", error);
      alert(error.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ project: projectId, title, description, status, priority, assignedTo })
      });
      const data = await response.json();
      if (response.ok) {
        setTasks([...tasks, { ...data, status: data.status === 'To Do' ? 'Todo' : data.status }]);
        setTitle('');
        setDescription('');
        setStatus('Todo');
        setPriority('Medium');
        setAssignedTo('');
        setShowTaskForm(false);
        socket.emit('task_changed', { projectId });
      }
    } catch (err) { console.error(err); }
  };

  const handleMoveTask = async (taskId, nextStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: nextStatus } : t));
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask({ ...selectedTask, status: nextStatus });
        }
        socket.emit('task_changed', { projectId, taskId });
      } else {
        console.error("Failed to move task across database records.");
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateTaskDetails = async () => {
    if (!selectedTask.title.trim()) return;
    try {
      const rawAssigneeId = selectedTask.assignedTo?._id || selectedTask.assignedTo || null;

      const response = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          priority: selectedTask.priority,
          status: selectedTask.status,
          assignedTo: rawAssigneeId === '' ? null : rawAssigneeId
        })
      });

      if (response.ok) {
        const updatedData = await response.json();
        setTasks(tasks.map(t => t._id === selectedTask._id ? updatedData : t));
        setSelectedTask(updatedData);
        alert("Task configurations saved successfully.");
        socket.emit('task_changed', { projectId, taskId: selectedTask._id });
      } else {
        console.error("Failed to update task records.");
      }
    } catch (err) {
      console.error("Error updating task records:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to permanently delete this task ticket?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
        setSelectedTask(null);
        socket.emit('task_changed', { projectId });
      } else {
        console.error("Failed to clear task record.");
      }
    } catch (err) {
      console.error("Error deleting task node:", err);
    }
  };

  const handleTaskCardClick = (task) => {
    setSelectedTask(task);
    
    if (task._id === highlightedTaskId) {
      setReadTasks(prev => [...prev, task._id]);
      setHighlightedTaskId(null);
    }
  };

  const columns = [
    { id: 'Todo', label: 'To Do', icon: <Circle size={14} className="text-amber-500 dark:text-amber-400" /> },
    { id: 'In Progress', label: 'In Progress', icon: <Clock size={14} className="text-blue-500 dark:text-blue-400" /> },
    { id: 'Done', label: 'Done', icon: <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400" /> }
  ];

  return (
    <div className="bg-slate-50 dark:bg-[#05070f] min-h-[calc(100vh-73px)] w-full text-slate-800 dark:text-slate-100 px-6 py-12 md:px-12 relative transition-colors duration-200">
      <div className="w-full max-w-[1440px] mx-auto space-y-8">

        {/* Navigation / Header Actions Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-900/50">
          <div>
            <a href="/dashboard" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors mb-2">
              <ArrowLeft size={14} /> Back to Hub
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {project ? project.title : "Loading Board Metadata..."}
            </h1>
          </div>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 self-start sm:self-auto"
          >
            <Plus size={14} /> Initialize Task Node
          </button>
        </div>

        {/* Workspace Invites & Team Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#070913]/60 border border-slate-200 dark:border-slate-900 p-5 rounded-xl space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <UserPlus size={14} className="text-blue-600 dark:text-blue-500" /> Grant Workspace Access
            </h3>
            <form onSubmit={handleInviteMember} className="flex gap-2">
              <input
                type="email" placeholder="teammate@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
                className="flex-1 bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-black font-bold text-xs px-4 rounded-lg uppercase tracking-wider transition-colors">
                Invite
              </button>
            </form>
            {inviteMessage.text && (
              <p className={`text-xs px-3 py-2 rounded-lg border font-medium ${inviteMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                {inviteMessage.text}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-[#070913]/60 border border-slate-200 dark:border-slate-900 p-5 rounded-xl lg:col-span-2 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Users size={14} className="text-emerald-600 dark:text-emerald-500" /> Workspace Team Array
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {project?.members?.map((member) => {
                let isProjectOwner = false;
                try {
                  const currentUserStr = localStorage.getItem('user');
                  if (currentUserStr && project?.owner) {
                    const currentUser = JSON.parse(currentUserStr);
                    const currentUserId = currentUser._id || currentUser.id;
                    const ownerId = typeof project.owner === 'object' ? project.owner._id || project.owner : project.owner;
                    
                    isProjectOwner = currentUserId?.toString() === ownerId?.toString();
                  }
                } catch (e) {
                  console.error("Error evaluating manager ownership nodes", e);
                }

                return (
                  <div 
                    key={member._id} 
                    className={`bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                      isProjectOwner ? 'group hover:border-red-300 dark:hover:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/10 cursor-pointer' : 'cursor-default'
                    }`}
                    title={isProjectOwner ? `Click icon to remove ${member.name || member.email}` : member.email}
                    onClick={() => isProjectOwner && handleRemoveMember(member._id)}
                  >
                    <div className="w-5 h-5 rounded-full relative overflow-hidden shrink-0">
                      <div className={`absolute inset-0 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 rounded-full transition-all duration-150 ${
                        isProjectOwner ? 'group-hover:scale-0 group-hover:opacity-0' : ''
                      }`}>
                        {getDynamicInitials(member.name)}
                      </div>

                      {isProjectOwner && (
                        <div className="absolute inset-0 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 rounded-full scale-0 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 shadow-md">
                          <X size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <span className={`text-xs font-medium transition-colors ${
                      isProjectOwner ? 'text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-300' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {member.name || member.email}
                    </span>
                  </div>
                );
              })}
              {!project?.members?.length && (
                <span className="text-xs text-slate-400 dark:text-slate-600 font-light italic">Syncing project workspace array...</span>
              )}
            </div>
          </div>
        </div>

        {/* Task Forms Modal / Section */}
        {showTaskForm && (
          <div className="bg-white dark:bg-[#070913] border border-slate-200 dark:border-slate-900 p-6 rounded-2xl max-w-xl shadow-md dark:shadow-none">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-2">Construct Agile Task Ticket</h3>
              <input
                type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
              <textarea
                placeholder="Engineering execution directives..." rows="3" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500">
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Assign Responsibility Node</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Unassigned (Open Pool)</option>
                  {project?.members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-colors">
                  Commit Node to Array
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false);
                    setTitle('');
                    setDescription('');
                    setStatus('Todo');
                    setPriority('Medium');
                    setAssignedTo('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800 font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kanban Matrix Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {columns.map((col) => {
            const filteredTasks = tasks.filter(t => t.status === col.id);
            
            return (
              <div key={col.id} className="bg-white dark:bg-[#070913]/40 border border-slate-200 dark:border-slate-900/60 p-5 rounded-2xl space-y-4 min-h-[350px] flex flex-col justify-start shadow-sm dark:shadow-none">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
                  <h3 className="font-bold text-slate-600 dark:text-slate-300 text-xs tracking-widest uppercase flex items-center gap-2">
                    {col.icon} {col.label}
                  </h3>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#070913] px-2.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-black border border-slate-200 dark:border-slate-800">
                    {filteredTasks.length}
                  </span>
                </div>

                <div className="space-y-4 flex-1 flex flex-col justify-start">
                  {filteredTasks.map((task) => {
                    const isAlertActive = task._id === highlightedTaskId && !readTasks.includes(task._id);

                    return (
                      <div
                        key={task._id}
                        onClick={() => handleTaskCardClick(task)}
                        className={`p-5 rounded-xl space-y-3 shadow-sm dark:shadow-md transition-all duration-200 cursor-pointer group relative border ${
                          isAlertActive 
                            ? 'border-blue-500/80 shadow-lg shadow-blue-500/5 bg-blue-50/50 dark:bg-[#0a0f26]' 
                            : 'bg-slate-50 dark:bg-[#070913] border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`font-bold text-sm leading-snug transition-colors ${isAlertActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                            {task.title}
                          </h4>

                          {isAlertActive ? (
                            <span className="flex h-2 w-2 mt-1 shrink-0 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              task.priority === 'Critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20' :
                              task.priority === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                              'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed font-light line-clamp-2">{task.description}</p>}

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px]">
                            <MessageSquare size={11} />
                            <span>Discussion Logs</span>
                          </div>

                          {task.assignedTo && (
                            <div className="flex items-center gap-1.5 bg-white dark:bg-[#05070f] border border-slate-200 dark:border-slate-900/80 px-2 py-0.5 rounded-md" title={`Assigned to ${task.assignedTo.name}`}>
                              <div className="w-3.5 h-3.5 text-[8px] font-black uppercase rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                                {getDynamicInitials(task.assignedTo.name)}
                              </div>
                              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium max-w-[70px] truncate">{task.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-900 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-600 block mb-0.5">
                            Shift Status Pipeline:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {task.status !== 'Todo' && (
                              <button
                                onClick={() => handleMoveTask(task._id, 'Todo')}
                                className="bg-white dark:bg-[#05070f] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-[10px] font-bold text-amber-600 dark:text-amber-500 py-2 rounded-lg transition-colors uppercase tracking-wider"
                              >
                                ← To Do
                              </button>
                            )}
                            {task.status !== 'In Progress' && (
                              <button
                                onClick={() => handleMoveTask(task._id, 'In Progress')}
                                className="bg-white dark:bg-[#05070f] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-[10px] font-bold text-blue-600 dark:text-blue-400 py-2 rounded-lg transition-colors uppercase tracking-wider"
                              >
                                Progress
                              </button>
                            )}
                            {task.status !== 'Done' && (
                              <button
                                onClick={() => handleMoveTask(task._id, 'Done')}
                                className="bg-white dark:bg-[#05070f] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 py-2 rounded-lg transition-colors uppercase tracking-wider col-span-2 sm:col-span-1"
                              >
                                Done →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-900/80 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-[#070913]/20 my-auto min-h-[180px]">
                      <div className="p-3 bg-white dark:bg-[#05070f] border border-slate-200 dark:border-slate-900 rounded-xl text-slate-400 dark:text-slate-700 mb-3 transition-colors">
                        <Inbox size={20} className="stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-1">Pipeline Cleared</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-600 max-w-[180px] leading-normal font-light">
                        No active structural logs mapped to this segment window.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details & Collaboration Chat Sidebar */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#070913] border-l border-slate-200 dark:border-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-200">

            <div className="flex flex-col h-[calc(100vh-100px)] overflow-y-auto pr-1 scrollbar-thin">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900">
                <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded">
                  {selectedTask.status} Node
                </span>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800/50 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-6 space-y-4 border-b border-slate-100 dark:border-slate-900/80 pb-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Task Title</label>
                  <input
                    type="text"
                    value={selectedTask.title || ''}
                    onChange={(e) => setSelectedTask((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#05070f] text-slate-900 dark:text-slate-200 text-base font-black tracking-tight rounded-xl p-2.5 border border-slate-300 dark:border-slate-800/80 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Engineering Directives</label>
                  <textarea
                    rows="3"
                    value={selectedTask.description || ''}
                    onChange={(e) => setSelectedTask((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="No context structural blueprints provided."
                    className="w-full bg-slate-50 dark:bg-[#05070f] text-slate-700 dark:text-slate-300 text-xs font-light leading-relaxed rounded-xl p-3 border border-slate-300 dark:border-slate-800/80 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Priority Level</label>
                    <select
                      value={selectedTask.priority || 'Medium'}
                      onChange={(e) => setSelectedTask((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800/80 p-2.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Assignee Node</label>
                    <select
                      value={selectedTask.assignedTo?._id || selectedTask.assignedTo || ''}
                      onChange={(e) => setSelectedTask((prev) => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-300 dark:border-slate-800/80 p-2.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {project?.members?.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleUpdateTaskDetails}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-colors shadow-md"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => handleDeleteTask(selectedTask._id)}
                    className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider px-4 rounded-lg transition-colors"
                    title="Delete Task Ticket"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Chat Timeline View Segment */}
              <div className="pt-4 flex-1 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
                  <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-500" /> Communications Thread ({comments.length})
                </h3>

                <div className="space-y-4 overflow-y-auto max-h-[35vh] pr-2 scrollbar-thin flex flex-col">
                  {comments.map((comment) => {
                    const currentUserId = getCurrentUserId();
                    const isMe = comment.user?._id === currentUserId;
                    const isEditing = editingCommentId === comment._id;

                    return (
                      <div
                        key={comment._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 w-full group/msg`}
                      >
                        <div className={`flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-4 h-4 rounded-full text-[9px] font-black uppercase flex items-center justify-center ${
                            isMe ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                          }`}>
                            {getDynamicInitials(comment.user?.name)}
                          </div>

                          <span className="font-bold text-slate-600 dark:text-slate-400">
                            {isMe ? 'You' : (comment.user?.name || "System User")}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-600">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-900/10' : 'bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none'
                        }`}>
                          {isEditing ? (
                            <div className="space-y-2 min-w-[200px]">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-white dark:bg-[#05070f] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleEditComment(comment._id)}
                                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded font-bold transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="font-light">{comment.text}</p>
                          )}
                        </div>

                        {isMe && !isEditing && (
                          <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-600 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 px-1">
                            <button
                              onClick={() => { setEditingCommentId(comment._id); setEditText(comment.text); }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {comments.length === 0 && (
                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 font-light py-8 italic">
                      No entries in the communication sequence yet.
                    </p>
                  )}

                  {/* FEATURE 3 SCROLL ANCHOR NODE */}
                  <div ref={commentsEndRef} />
                </div>
              </div>
            </div>

            <form onSubmit={handleAddComment} className="border-t border-slate-100 dark:border-slate-900 pt-4 flex gap-2 bg-white dark:bg-[#070913]">
              <input
                type="text"
                placeholder="Broadcast project update into log..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={handleCommentKeyDown} 
                required
                className="flex-1 bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-blue-600/10 dark:shadow-blue-900/20"
              >
                <Send size={14} />
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;