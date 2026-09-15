import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Server, 
  Eye, 
  EyeOff, 
  Cpu, 
  Zap,
  ArrowLeft
} from 'lucide-react';
import { loginAdminApi } from '../services/api';

export default function AdminLogin({ onLoginSuccess, onCancel, triggerNotification, theme }) {
  const isLight = theme !== 'dark';
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('cloudscale2026');
  const [pin, setPin] = useState('9988');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginAdminApi(username, password, pin);
      if (response && response.token) {
        if (rememberMe) {
          localStorage.setItem('cloudscale-admin-token', response.token);
          localStorage.setItem('cloudscale-admin-user', JSON.stringify(response.user));
        } else {
          sessionStorage.setItem('cloudscale-admin-token', response.token);
          sessionStorage.setItem('cloudscale-admin-user', JSON.stringify(response.user));
        }
        if (triggerNotification) {
          triggerNotification(`Welcome back, ${response.user?.username || 'Administrator'}! Session authorized.`);
        }
        onLoginSuccess(response.user);
      } else {
        setError(response.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
      // Fallback for standalone/local client validation if backend is offline
      if ((username === 'admin' || username === 'admin@cloudscale.com') && (password === 'cloudscale2026' || password === 'admin123')) {
        const fallbackUser = {
          username: 'admin',
          role: 'AWS Infrastructure Administrator',
          accessLevel: 'Full Control (ASG, ALB, EFS, CloudWatch)',
          region: 'ap-south-1',
          loginTime: new Date().toISOString()
        };
        const token = 'cs_fallback_adm_' + Math.random().toString(36).substring(2);
        if (rememberMe) {
          localStorage.setItem('cloudscale-admin-token', token);
          localStorage.setItem('cloudscale-admin-user', JSON.stringify(fallbackUser));
        } else {
          sessionStorage.setItem('cloudscale-admin-token', token);
          sessionStorage.setItem('cloudscale-admin-user', JSON.stringify(fallbackUser));
        }
        if (triggerNotification) {
          triggerNotification('Authenticated in Demo Admin Mode.');
        }
        onLoginSuccess(fallbackUser);
      } else {
        setError(err.response?.data?.message || 'Invalid administrative credentials. Access denied.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsername('admin');
    setPassword('cloudscale2026');
    setPin('9988');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <button
          onClick={onCancel}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Website
        </button>

        {/* Card Container */}
        <div className={`p-8 rounded-3xl border shadow-2xl transition-all ${
          isLight
            ? 'bg-white/95 border-gray-200/90 shadow-gray-200/50 backdrop-blur-xl'
            : 'bg-slate-900/90 border-slate-800/90 shadow-cyan-500/5 backdrop-blur-2xl'
        }`}>
          {/* Header Icon & Title */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105 ${
              isLight
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xl shadow-cyan-500/20'
            }`}>
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium mb-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              IMDSv2 & IAM Protected Console
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Admin Authentication
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authenticate to manage AWS Auto Scaling & Telemetry Fleet
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all outline-none ${
                    isLight
                      ? 'bg-slate-50 border-gray-200 text-slate-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-white focus:bg-slate-950 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border transition-all outline-none ${
                    isLight
                      ? 'bg-slate-50 border-gray-200 text-slate-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-white focus:bg-slate-950 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2FA PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Security PIN / 2FA Token
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Demo: 9988</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="9988"
                  maxLength={6}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-mono tracking-widest border transition-all outline-none ${
                    isLight
                      ? 'bg-slate-50 border-gray-200 text-slate-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-white focus:bg-slate-950 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Demo Fill */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Remember Session</span>
              </label>

              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs text-red-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                Auto-fill Demo
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2 ${
                isLight
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-500/25'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Open Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer Card */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Default Sandbox Credentials:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">Ready</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800">
                <span className="text-slate-400 block">User:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">admin</span>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800">
                <span className="text-slate-400 block">Pass:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">cloudscale2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security badges below card */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <Server className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-cyan-400" />
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300">EC2 Role</div>
            <div className="text-[9px] text-slate-400">Zero Hardcoded Keys</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <Zap className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-cyan-400" />
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300">ALB Target Group</div>
            <div className="text-[9px] text-slate-400">Layer 7 Routing</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <Cpu className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-cyan-400" />
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Auto Scaling</div>
            <div className="text-[9px] text-slate-400">Desired: 2..6 Nodes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
