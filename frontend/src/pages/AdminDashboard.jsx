import React, { useState } from 'react';
import { 
  Server, 
  Activity, 
  Cpu, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Flame, 
  Square, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  LogOut,
  UserCheck
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  scaleIncrease, 
  scaleDecrease, 
  startLoadTest, 
  stopLoadTest 
} from '../services/api';

export default function AdminDashboard({ metrics, refreshMetrics, triggerNotification, adminUser, onLogout }) {
  const [actionLoading, setActionLoading] = useState(false);

  const summary = metrics?.summary || {
    totalInstances: 3,
    healthyInstances: 3,
    avgCpuPercent: 65,
    requestsPerMinute: 250,
    desiredCapacity: 3,
    minCapacity: 2,
    maxCapacity: 6,
    loadTestActive: false
  };

  const instances = metrics?.instances || [
    { id: 'i-0a81b2c3d4e5f001', az: 'us-east-1a', state: 'running', health: 'healthy', cpu: 64, launchTime: new Date().toISOString() },
    { id: 'i-0b92c3d4e5f6a002', az: 'us-east-1b', state: 'running', health: 'healthy', cpu: 66, launchTime: new Date().toISOString() },
    { id: 'i-0c73d4e5f6a7b003', az: 'us-east-1a', state: 'running', health: 'healthy', cpu: 65, launchTime: new Date().toISOString() }
  ];

  const history = metrics?.history || [];

  const handleCapacityChange = async (action) => {
    setActionLoading(true);
    try {
      const res = action === 'increase' ? await scaleIncrease() : await scaleDecrease();
      triggerNotification(res.message || `Capacity action ${action} executed successfully`);
      refreshMetrics();
    } catch (err) {
      triggerNotification(err.response?.data?.error || `Failed to ${action} capacity`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLoadTest = async () => {
    setActionLoading(true);
    try {
      if (summary.loadTestActive) {
        const res = await stopLoadTest();
        triggerNotification(res.message);
      } else {
        const res = await startLoadTest();
        triggerNotification(res.message);
      }
      refreshMetrics();
    } catch (err) {
      triggerNotification('Could not toggle load test');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Sub-domain banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-500/20 font-medium">
              admin.cloudscale.com
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Control Plane v1.0</span>

            {/* Authenticated Admin Pill */}
            {adminUser && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-3 h-3" />
                <span>{adminUser.username}</span>
                <span className="text-slate-400">({adminUser.role || 'Admin'})</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Infrastructure Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time AWS Auto Scaling Group, Application Load Balancer & CloudWatch Metrics
          </p>
        </div>

        {/* Action Controls Header */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleCapacityChange('increase')}
            disabled={actionLoading || summary.desiredCapacity >= summary.maxCapacity}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-cyan-500 text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
            title="Increase Desired Capacity (+1)"
          >
            <Plus className="w-3.5 h-3.5 text-red-600 dark:text-cyan-400" />
            Increase Capacity
          </button>

          <button
            onClick={() => handleCapacityChange('decrease')}
            disabled={actionLoading || summary.desiredCapacity <= summary.minCapacity}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-rose-500 text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
            title="Decrease Desired Capacity (-1)"
          >
            <Minus className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            Decrease Capacity
          </button>

          <button
            onClick={handleToggleLoadTest}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              summary.loadTestActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-red-600 hover:bg-red-700 text-white dark:bg-gradient-to-r dark:from-amber-500 dark:to-orange-600 dark:text-slate-950'
            }`}
          >
            {summary.loadTestActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Load Test
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 fill-current" />
                Start Load Test
              </>
            )}
          </button>

          <button
            onClick={refreshMetrics}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-gray-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-gray-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Lock Admin Session and Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock / Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Load Test Alert Banner */}
      {summary.loadTestActive && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-300 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Synthetic Stress Test in Progress:</span> High CPU load active. CloudWatch alarm threshold &gt;70% reached. Evaluating ASG scale-out trigger.
            </div>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 bg-amber-500/20 rounded font-semibold">
            STATUS: EVALUATING
          </span>
        </div>
      )}

      {/* 7 Core Metric Cards (Specified in Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Metric 1: EC2 Instances */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">EC2 Instances</span>
            <Server className="w-4 h-4 text-red-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {summary.totalInstances}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Active nodes</div>
        </div>

        {/* Metric 2: Healthy Instances */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Healthy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {summary.healthyInstances}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">ALB target checks passing</div>
        </div>

        {/* Metric 3: CPU Usage */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">CPU Usage</span>
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className={`text-2xl font-mono font-bold ${summary.avgCpuPercent > 70 ? 'text-red-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {summary.avgCpuPercent}%
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">CloudWatch aggregated</div>
        </div>

        {/* Metric 4: Requests */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Requests</span>
            <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400">
            {summary.requestsPerMinute}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Requests / min</div>
        </div>

        {/* Metric 5: Desired Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Desired</span>
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
            {summary.desiredCapacity}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Target capacity</div>
        </div>

        {/* Metric 6: Min Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Min</span>
            <ArrowDownRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">
            {summary.minCapacity}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Floor constraint</div>
        </div>

        {/* Metric 7: Max Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/90 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Max</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">
            {summary.maxCapacity}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Ceiling constraint</div>
        </div>
      </div>

      {/* Real-time Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-600 dark:text-cyan-400" />
                Aggregated CPU Utilization (%)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Target threshold: 70% (Scale-Out) / 30% (Scale-In)</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#f8fafc] dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-red-600 dark:text-cyan-400">
              {summary.avgCpuPercent}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests Chart */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Application Load Balancer Request Rate
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Requests per minute routed via ALB listeners</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#f8fafc] dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">
              {summary.requestsPerMinute} req/min
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#reqGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* EC2 Instances Inventory Table */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-red-600 dark:text-cyan-400" />
              Target Group Instance Health
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current compute instances attached to ALB Target Group</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {instances.length} Active Nodes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-medium">Instance ID</th>
                <th className="pb-3 font-medium">Availability Zone</th>
                <th className="pb-3 font-medium">State</th>
                <th className="pb-3 font-medium">Target Health</th>
                <th className="pb-3 font-medium">Instance CPU</th>
                <th className="pb-3 font-medium">Launch Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
              {instances.map((inst) => (
                <tr key={inst.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 text-red-600 dark:text-cyan-400 font-semibold">{inst.id}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {inst.az}
                    </span>
                  </td>
                  <td className="py-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="capitalize">{inst.state}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      {inst.health}
                    </span>
                  </td>
                  <td className="py-3 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${inst.cpu > 70 ? 'bg-rose-500' : 'bg-cyan-500'}`} 
                          style={{ width: `${Math.min(100, inst.cpu)}%` }}
                        ></div>
                      </div>
                      <span>{inst.cpu}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">
                    {new Date(inst.launchTime).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scaling Rules Quick Reference */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Configured Auto Scaling Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Scale-Out Policy</span>
            <span className="text-red-600 dark:text-rose-400 font-bold">CPU &gt; 70%</span>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] mt-1">Action: +1 Instance | 300s cooldown</span>
          </div>

          <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Scale-In Policy</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">CPU &lt; 30%</span>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] mt-1">Action: -1 Instance | 300s cooldown</span>
          </div>

          <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Capacity Bounds</span>
            <span className="text-indigo-600 dark:text-cyan-400 font-bold">Min: 2 | Desired: {summary.desiredCapacity} | Max: 6</span>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] mt-1">Enforces high availability across 2 AZs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
