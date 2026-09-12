import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Zap, 
  Server, 
  Globe2, 
  ShieldCheck, 
  RefreshCw
} from 'lucide-react';
import { fetchServerInfo } from '../services/api';

export default function Home({ onNavigate, clusterSummary, theme }) {
  const [serverInfo, setServerInfo] = useState(null);
  const [loadingServerInfo, setLoadingServerInfo] = useState(false);

  const loadServerInfo = async () => {
    setLoadingServerInfo(true);
    try {
      const data = await fetchServerInfo();
      setServerInfo(data);
    } catch (err) {
      setServerInfo({
        instanceId: 'i-0123456789',
        hostname: 'ip-10-0-1-25',
        availabilityZone: 'ap-south-1a'
      });
    } finally {
      setLoadingServerInfo(false);
    }
  };

  useEffect(() => {
    loadServerInfo();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12 text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-gradient-to-tr from-rose-100/40 via-slate-100/30 to-transparent dark:from-cyan-500/20 dark:via-indigo-500/15 dark:to-purple-500/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-cyan-500/30 text-slate-800 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-cyan-400 animate-pulse"></span>
            <Zap className="w-3.5 h-3.5 text-red-600 dark:text-cyan-400 fill-red-600 dark:fill-none" />
            <span>LIVE MULTI-AZ ELASTIC CLUSTER</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
            CloudScale Architecture<br className="hidden sm:inline" /> for{' '}
            <span className="text-red-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-sky-300 dark:to-indigo-400 dark:bg-clip-text dark:text-transparent">
              Zero Downtime
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Public website designed to demonstrate elastic load balancing, multi-AZ high availability, and dynamic auto-scaling in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('features')}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 dark:text-slate-950 font-bold text-sm shadow-md dark:shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              Explore Features
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 rounded-xl bg-white hover:bg-gray-50 text-slate-800 border border-gray-200 shadow-xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              Generate Traffic Request
              <Zap className="w-4 h-4 text-red-600 fill-red-600 dark:text-amber-400 dark:fill-none" />
            </button>
          </div>
        </div>
      </section>

      {/* Serving Target Node Live Banner (Demonstrates ALB Distribution) */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-indigo-500/30 dark:shadow-xl transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center text-red-600 dark:text-indigo-400 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">Serving Target Node</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-emerald-500/10 text-gray-700 dark:text-emerald-400 border border-gray-200 dark:border-emerald-500/20 font-mono font-medium">
                    ALB 200 OK
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Each HTTP request is balanced across active healthy EC2 targets
                </p>
              </div>
            </div>

            <button
              onClick={loadServerInfo}
              disabled={loadingServerInfo}
              className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-gray-200/80 dark:border-transparent flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Make new request to show round-robin ALB distribution"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingServerInfo ? 'animate-spin text-red-600 dark:text-cyan-400' : ''}`} />
              Next Request
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 font-mono text-xs">
            <div className="bg-[#f8fafc] dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider mb-1 font-semibold">INSTANCE ID</span>
              <span className="text-red-600 dark:text-cyan-400 font-bold text-sm sm:text-base">{serverInfo?.instanceId || 'i-0123456789'}</span>
            </div>
            <div className="bg-[#f8fafc] dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider mb-1 font-semibold">HOSTNAME / IP</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base">{serverInfo?.hostname || 'ip-10-0-1-25'}</span>
            </div>
            <div className="bg-[#f8fafc] dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider mb-1 font-semibold">AVAILABILITY ZONE</span>
              <span className="text-slate-800 dark:text-indigo-400 font-bold text-sm sm:text-base">{serverInfo?.availabilityZone || 'ap-south-1a'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cluster Status Preview */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-base mb-1">
                Auto-Scaling Cluster Metrics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aggregated live CloudWatch telemetry for active compute tier
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3.5 w-full sm:w-auto font-mono text-center">
              <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-5 py-3 rounded-xl min-w-[85px]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-sans tracking-wider font-semibold mb-1">EC2 NODES</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{clusterSummary?.totalInstances || 3}</div>
              </div>
              <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-5 py-3 rounded-xl min-w-[85px]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-sans tracking-wider font-semibold mb-1">CPU LOAD</div>
                <div className="text-xl font-bold text-red-600 dark:text-cyan-400">
                  {clusterSummary?.avgCpuPercent || 65}%
                </div>
              </div>
              <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-5 py-3 rounded-xl min-w-[85px]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-sans tracking-wider font-semibold mb-1">REQ / MIN</div>
                <div className="text-xl font-bold text-slate-900 dark:text-indigo-400">{clusterSummary?.requestsPerMinute || 250}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/80 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 flex items-center justify-center text-red-600 dark:text-cyan-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold text-base mb-2">Automated Elasticity</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Scale out automatically when CPU &gt; 70%. Scale in automatically when CPU &lt; 30% with a 300s stabilization period.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/80 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center text-red-600 dark:text-indigo-400 mb-4">
              <Globe2 className="w-5 h-5" />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold text-base mb-2">Multi-AZ Resilience</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Target instances spread across ap-south-1a and ap-south-1b to survive single datacenter disruptions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800/80 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-red-600 dark:text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold text-base mb-2">Private Compute</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              EC2 instances reside strictly in private subnets with no public IP exposure. ALB provides ingress control.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
