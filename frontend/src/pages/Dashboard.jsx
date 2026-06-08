import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Layers, ArrowRight } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();

    try {
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const currentUserId = currentUser._id || currentUser.id;
        
        if (currentUserId) {
          socket.emit('join_user_room', currentUserId);
        }
      }
    } catch (e) {
      console.error("Failed to link socket session to notification room:", e);
    }

    socket.on('global_project_created', (newProject) => {
      // Check if project isn't already in the array to prevent duplication
      setProjects((prevProjects) => {
        if (prevProjects.some(p => p._id === newProject._id)) return prevProjects;
        return [...prevProjects, newProject];
      });
    });

    const handleWorkspaceRosterShift = () => {
      console.log("Workspace update detected via notification payload. Synchronizing grid records...");
      fetchProjects();
    };

    window.addEventListener('workspace_roster_shifted', handleWorkspaceRosterShift);

    return () => {
      socket.off('global_project_created');
      window.removeEventListener('workspace_roster_shifted', handleWorkspaceRosterShift);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
      } else {
        setError(data.message || 'Failed to load workspaces');
      }
    } catch (err) {
      setError('Network connection failed');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description })
      });
      const data = await response.json();

      if (response.ok) {
        setProjects([...projects, data]);
        
        socket.emit('new_project_deployed', data);

        setTitle('');
        setDescription('');
      } else {
        setError(data.message || 'Could not create project');
      }
    } catch (err) {
      setError('Network connection failed');
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#05070f] min-h-[calc(100vh-73px)] w-full text-slate-800 dark:text-slate-100 px-6 py-12 md:px-12 transition-colors duration-300">
      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Hand Column: Create a Workspace Control Form */}
        <div className="bg-white dark:bg-[#070913] border border-slate-200 dark:border-slate-900 p-6 rounded-2xl h-fit sticky top-24 shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-2 mb-6">
            <FolderPlus className="text-blue-600 dark:text-blue-500" size={20} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Workspace Initialization</h2>
          </div>
          
          {error && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20 mb-4">{error}</p>}

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">Project Title</label>
              <input 
                type="text" 
                placeholder="e.g., Mobile App Build v1" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">Workspace Scope Summary</label>
              <textarea 
                placeholder="Describe milestones, user roles, or code repos..."
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#05070f] border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl tracking-wide transition-all duration-200">
              Deploy Workspace
            </button>
          </form>
        </div>

        {/* Right Hand Widescreen Column: Live Engine Active Projects Layout List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="text-blue-600 dark:text-blue-400 uppercase tracking-[0.4em] text-[10px] font-bold block mb-2">OPERATIONAL CONTROL SHELLS</span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Active Workspaces</h1>
          </div>

          {projects.length === 0 ? (
            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 transition-colors duration-300">
              No deployed clusters found. Use the control pane initialization terminal to spin up your first workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Link 
                  key={project._id} 
                  to={`/project/${project._id}`}
                  className="group bg-white dark:bg-[#070913] border border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 p-6 rounded-2xl flex flex-col justify-between transition-all hover:-translate-y-1 duration-300 shadow-sm dark:shadow-none"
                >
                  <div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg p-2.5 w-fit mb-4 text-blue-600 dark:text-blue-400 transition-colors">
                      <Layers size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.title || project.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6 font-light transition-colors">{project.description || "No supplemental details provided."}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-900/60 transition-colors">
                    Enter Board Engine <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;