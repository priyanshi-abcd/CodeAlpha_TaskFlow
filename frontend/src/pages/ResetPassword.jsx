import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams(); 
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`http://localhost:5000/auth/api/reset-password/${token}`, {
        newPassword
      });

      if (response.status === 200) {
        setSuccess('Your password has been securely updated! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Token validation link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl dark:shadow-none transition-colors duration-300">
        
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
            Set New Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
            Establish a strong, updated credential phrase for your workspace profile.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center font-medium mb-4 transition-colors duration-300">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm p-3 rounded-lg text-center font-medium mb-4 transition-colors duration-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Password</label>
            <input 
              type="password" required value={newPassword} onChange={(e) => { setNewPassword(e.target.value); if(error) setError(''); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <input 
              type="password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if(error) setError(''); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/10 transition-all duration-200 disabled:opacity-50 mt-2 text-xs uppercase tracking-widest font-bold"
          >
            {loading ? 'Updating Security Node...' : 'Commit New Password'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-600 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Sign In</Link>
        </p>

      </div>
    </div>
  );
};

export default ResetPassword;