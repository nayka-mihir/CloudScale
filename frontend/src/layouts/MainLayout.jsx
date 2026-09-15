import React from 'react';
import Navbar from '../components/Navbar';
import { Cloud, CheckCircle2 } from 'lucide-react';

export default function MainLayout({ 
  children, 
  activeApp, 
  setActiveApp, 
  activeTab, 
  setActiveTab, 
  clusterSummary, 
  toastMessage,
  theme,
  toggleTheme,
  adminUser,
  onLogout
}) {
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' 
        ? 'dark bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950' 
        : 'bg-[#f8fafc] text-slate-900 selection:bg-rose-500 selection:text-white'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white/95 dark:bg-slate-900/95 border border-red-200 dark:border-cyan-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-cyan-500/10 flex items-start gap-3 transition-all">
          <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeApp={activeApp}
        setActiveApp={setActiveApp}
        clusterSummary={clusterSummary}
        theme={theme}
        toggleTheme={toggleTheme}
        adminUser={adminUser}
        onLogout={onLogout}
      />

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-red-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">CloudScale Platform</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">— AWS Elastic Architecture Demo</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            <span className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-400">AWS VPC</span>
            <span className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-400">Multi-AZ ALB</span>
            <span className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-400">EC2 Auto Scaling</span>
            <span className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-400">CloudWatch Alarms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
