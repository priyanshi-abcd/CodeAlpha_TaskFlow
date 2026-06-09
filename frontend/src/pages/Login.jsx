import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isForgotMode, setIsForgotMode] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateLoginForm = () => {
    const { email, password } = formData;

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email format.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const validateForgotForm = () => {
    const { email } = formData;

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email format.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isForgotMode) {
      if (!validateForgotForm()) return;
      setLoading(true);

      try {
        const response = await axios.post('http://localhost:5000/auth/api/forgot-password', {
          email: formData.email
        });

        if (response.status === 200) {
          setSuccess('A secure password reset link has been broadcasted to your inbox!');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not complete verification dispatch lifecycle.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!validateLoginForm()) return;
      setLoading(true);

      try {
        const response = await axios.post('http://localhost:5000/auth/api/login', formData);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid email or password credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl dark:shadow-none transition-colors duration-300">
        
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
            {isForgotMode ? 'Forgot Password' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
            {isForgotMode ? 'Enter your email to receive a secure configuration verification link.' : 'Enter your workspace details to sign back in.'}
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
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-300">Email Address</label>
            <input 
              type="text" name="email" required value={formData.email} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors duration-300"
              placeholder="alex@example.com"
            />
          </div>

          {!isForgotMode && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">
                  Password
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              <input 
                type="password" name="password" required value={formData.password} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors duration-300"
                placeholder="••••••••"
              />
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/10 transition-all duration-200 disabled:opacity-50 mt-2 text-xs uppercase tracking-widest font-bold"
          >
            {loading ? 'Processing Context...' : isForgotMode ? 'Send Reset Link' : 'Sign In'}
          </button>

          {isForgotMode && (
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setError('');
                setSuccess('');
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mt-2 transition-colors focus:outline-none"
            >
              Cancel and Return to Login
            </button>
          )}
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-600 mt-6 transition-colors duration-300">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-300">Get Started</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;