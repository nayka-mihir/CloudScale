import React from 'react';
import { Layers, Cpu, ArrowRight } from 'lucide-react';

export default function About({ onNavigate, theme }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          About CloudScale
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          A demonstration of enterprise AWS architecture designed for fault tolerance, elastic scaling, and zero single points of failure.
        </p>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 space-y-6 transition-all">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 flex items-center justify-center text-red-600 dark:text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          The Scalability Philosophy
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Traditional monolithic setups require over-provisioning servers to survive peak traffic hours, incurring huge idle cloud costs. CloudScale implements dynamic elasticity: compute resources expand automatically during surges and contract during lulls, keeping costs minimal while sustaining high performance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-[#f8fafc] dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 rounded-xl">
            <span className="text-red-600 dark:text-cyan-400 font-mono text-xs font-bold block mb-1">AWS ALB</span>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-2">Layer 7 Load Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Distributes inbound HTTP/HTTPS traffic across all available EC2 target instances in real time using health checks to bypass failed nodes.
            </p>
          </div>

          <div className="bg-[#f8fafc] dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 rounded-xl">
            <span className="text-red-600 dark:text-indigo-400 font-mono text-xs font-bold block mb-1">AWS Auto Scaling</span>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-2">Dynamic Fleet Management</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Maintains steady-state availability between Min (2) and Max (6) instances based on aggregated CloudWatch CPU metrics.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center text-red-600 dark:text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          Multi-AZ Network Isolation
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
          To ensure strict production security, compute instances do not possess public IP addresses. They reside solely within isolated private subnets across multiple availability zones. Internet egress for package updates is routed via a NAT Gateway.
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-mono">AWS Region: ap-southeast-2 (Sydney)</span>
          <button
            onClick={() => onNavigate('features')}
            className="text-xs text-red-600 hover:text-red-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
          >
            Review Features <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
