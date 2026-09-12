import React from 'react';
import { Cloud, Activity, Server, Globe, Sun, Moon } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  activeApp, 
  setActiveApp, 
  clusterSummary,
  theme,
  toggleTheme
}) {
  const isLight = theme !== 'dark';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => { setActiveApp('public'); setActiveTab('home'); }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isLight 
                ? 'border border-red-200 bg-white text-red-600 shadow-xs' 
                : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
            }`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  CloudScale
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-cyan-500/10 text-gray-700 dark:text-cyan-400 border border-gray-200 dark:border-cyan-500/20">
                  AWS Multi-AZ
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Elastic Auto-Scaling Infrastructure
              </p>
            </div>
          </div>

          {/* Center Navigation (depends on activeApp) */}
          {activeApp === 'public' ? (
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About' },
                { id: 'features', label: 'Features' },
                { id: 'contact', label: 'Contact' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? isLight
                        ? 'bg-white text-slate-900 border border-gray-200 shadow-xs'
                        : 'bg-slate-800 text-cyan-400 shadow-inner'
                      : isLight
                        ? 'text-gray-500 hover:text-slate-900 hover:bg-gray-100/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ALB Ingress Active (Port 80/443)
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                Region: <span className="text-slate-800 dark:text-slate-200">ap-south-1</span>
              </span>
            </div>
          )}

          {/* Right side: Domain / App Switcher & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Live Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
              <Activity className={`w-3.5 h-3.5 animate-pulse ${isLight ? 'text-red-500' : 'text-cyan-400'}`} />
              <span>{clusterSummary?.healthyInstances || 0} / {clusterSummary?.totalInstances || 0} Healthy</span>
            </div>

            {/* App Toggle */}
            <div className="bg-gray-100/80 dark:bg-slate-900 p-1 rounded-xl border border-gray-200/80 dark:border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setActiveApp('public')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeApp === 'public'
                    ? isLight
                      ? 'bg-white text-slate-900 font-medium shadow-xs border border-gray-200/80'
                      : 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                    : isLight
                      ? 'text-gray-500 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
                title="cloudscale.com (Public Website)"
              >
                <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-red-500' : activeApp === 'public' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">cloudscale.com</span>
                <span className="sm:hidden">Public</span>
              </button>

              <button
                onClick={() => setActiveApp('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeApp === 'admin'
                    ? isLight
                      ? 'bg-white text-slate-900 font-medium shadow-xs border border-gray-200/80'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-md'
                    : isLight
                      ? 'text-gray-500 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
                title="admin.cloudscale.com (Admin Dashboard)"
              >
                <Server className={`w-3.5 h-3.5 ${isLight ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">admin.cloudscale.com</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </div>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isLight
                  ? 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50 shadow-xs'
                  : 'border-slate-800 bg-slate-900 text-amber-400 hover:bg-slate-800'
              }`}
              title={isLight ? 'Switch to Dark Mode (Current Theme)' : 'Switch to Light Mode (Screenshot Theme)'}
              aria-label="Toggle theme"
            >
              {isLight ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar for Public App */}
        {activeApp === 'public' && (
          <div className="md:hidden flex items-center justify-around py-2 border-t border-gray-200 dark:border-slate-800/60">
            {['home', 'about', 'features', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs capitalize font-medium px-2.5 py-1 rounded-md transition-all ${
                  activeTab === tab 
                    ? isLight
                      ? 'bg-white text-slate-900 border border-gray-200 shadow-xs'
                      : 'bg-slate-800 text-cyan-400' 
                    : isLight
                      ? 'text-gray-500'
                      : 'text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
