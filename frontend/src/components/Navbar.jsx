import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Kanban, User, X, Bell, MessageSquare, Briefcase, 
  UserPlus, UserMinus, Trash2, Sun, Moon 
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const dropdownRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  let currentUser = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) currentUser = JSON.parse(userStr);
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }

  useEffect(() => {
    if (!token || !currentUser) return;

    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    const fetchNotifications = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed parsing initial user alerts log stream:", err);
      }
    };

    fetchNotifications();

    const currentUserId = currentUser._id || currentUser.id;
    if (currentUserId) {
      socket.on('connect', () => {
        socket.emit('join_user_room', currentUserId);
      });
    }

    socket.on('NOTIFICATION_RECEIVED', (newNotif) => {
      setNotifications((prev) => {
        const exists = prev.some(n => n._id === newNotif._id);
        if (exists) return prev;
        return [newNotif, ...prev];
      });

      window.dispatchEvent(
        new CustomEvent('open_notification_task', { detail: newNotif })
      );
    });

    return () => {
      socket.off('NOTIFICATION_RECEIVED');
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const handleToggleNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);

    if (!isNotifOpen && unreadCount > 0) {
      try {
        setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));

        await axios.put('http://localhost:5000/api/notifications/mark-read', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed syncing notification status array:", err);
      }
    }
  };

  const handleNotificationClick = (notif) => {
    setIsNotifOpen(false);
    const targetProjectId = notif.projectId || notif.project;
    const targetTaskId = notif.taskId || notif.task;

    if (!targetProjectId) {
      console.warn("Missing project context mapping payload.");
      return;
    }

    if (targetTaskId) {
      sessionStorage.setItem('pendingNotificationTaskId', targetTaskId);
    }

    navigate(`/project/${targetProjectId}`);

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('open_notification_task', { detail: notif })
      );
    }, 300);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'WORKSPACE_INVITE':
        return <UserPlus size={13} className="text-emerald-500 dark:text-emerald-400" />;
      case 'WORKSPACE_REMOVAL':
        return <UserMinus size={13} className="text-rose-500 dark:text-red-400" />;
      case 'TASK_ASSIGNMENT':
      case 'TASK_ASSIGNED':
        return <Briefcase size={13} className="text-purple-500 dark:text-purple-400" />;
      case 'COMMENT_LEFT':
      case 'NEW_COMMENT':
        return <MessageSquare size={13} className="text-amber-500 dark:text-amber-400" />;
      case 'TASK_DELETION':
        return <Trash2 size={13} className="text-rose-600 dark:text-rose-500" />;
      default:
        return <Bell size={13} className="text-blue-500 dark:text-blue-400" />;
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const openProfileModal = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setProfileData({
          name: parsedUser.name || '',
          email: parsedUser.email || ''
        });
      }
      setIsProfileOpen(true);
    } catch (err) {
      console.error("Failed to sequence user data node from local storage", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('http://localhost:5000/auth/api/profile',
        { name: profileData.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));

        alert("Identity metrics updated successfully.");
        setIsProfileOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Profile structural update error:", error);
      alert(error.response?.data?.message || "Could not complete profile update.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* ADAPTIVE STICKY NAV RECEPTACLE */}
      <nav className="sticky top-0 w-full bg-white/90 dark:bg-[#070913]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-6 py-4 z-50 transition-colors duration-300">
        <div className="w-full max-w-[1440px] mx-auto flex justify-between items-center">

          {/* Left Side: Brand Identity */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600/10 p-2 rounded-lg border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
              <Kanban size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
              Task<span className="text-blue-500">Flow</span>
            </span>
          </Link>

          {/* Right Side: Navigation & Theme Mechanics */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* LIVE LIGHT / DARK THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white bg-slate-100 dark:bg-[#0d1127] border border-slate-200 dark:border-slate-800/80 rounded-xl transition-all hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {token ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Dashboard
                </Link>

                {/* NOTIFICATION BELL */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleToggleNotifications}
                    className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#0d1127] border border-slate-200 dark:border-slate-800/80 rounded-xl transition-all hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
                    title="System Workspace Notifications"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* NOTIFICATION DROPDOWN OVERLAY */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#070913] border border-slate-200 dark:border-slate-900 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-900/80 bg-slate-50/50 dark:bg-[#0a0d1d]/40 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">Activity Log Broadcasts</span>
                        {unreadCount > 0 && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold">{unreadCount} New</span>}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-950/60 custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-600 font-light italic">
                            Workspace clear. No recent broadcast telemetry found.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id || Math.random()}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 text-left transition-colors flex gap-3 items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 ${notif.isUnread ? 'bg-blue-600/[0.02]' : ''}`}
                            >
                              <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-900 mt-0.5 shrink-0 flex items-center justify-center">
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-light">{notif.message || notif.text}</p>
                                <span className="text-[9px] text-slate-400 dark:text-slate-600 block tracking-tight">
                                  {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* INITIALS AVATAR TRACKER */}
                <button
                  onClick={openProfileModal}
                  className="flex items-center bg-slate-100 dark:bg-[#0d1127] border border-slate-200 dark:border-slate-800/80 p-1.5 rounded-full hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                  title={`Profile: ${currentUser?.name || 'Account'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase flex items-center justify-center border border-blue-200 dark:border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {getInitials(currentUser?.name)}
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs uppercase tracking-widest font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-600/10"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* PROFILE MODAL OVERLAY LAYER */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#070913] border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">

            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User size={14} className="text-blue-600 dark:text-blue-500" /> Identity Profile Node
              </h3>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-[#05070f] text-sm rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full bg-slate-100 dark:bg-[#05070f] text-sm rounded-xl p-3 border border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-500 cursor-not-allowed transition-colors"
                />
                <p className="text-[9px] text-slate-400 dark:text-slate-600 italic pl-1">System unique key identifier nodes cannot be reset dynamically.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/10 dark:shadow-blue-900/20"
              >
                Save Profile Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;