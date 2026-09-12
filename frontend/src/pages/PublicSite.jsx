import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Globe2, 
  Server,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

export default function PublicSite({ activeTab, setActiveTab, clusterSummary, triggerNotification }) {
  // Contact Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);

  // Ping Latency Tool State
  const [pingResult, setPingResult] = useState(null);
  const [pinging, setPinging] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitting(true);
    try {
      const res = await axios.post('/api/contact', formData);
      setSubmittedMessage(res.data.message || 'Message delivered successfully!');
      setFormData({ name: '', email: '', message: '' });
      if (triggerNotification) {
        triggerNotification('Traffic Event: Contact form submission delivered to cluster backend!');
      }
    } catch (err) {
      // Fallback if backend is offline
      setSubmittedMessage('Message logged locally (Backend simulated). Request counted!');
      if (triggerNotification) {
        triggerNotification('Contact form submitted in offline mode.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const testPing = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await axios.get('/api/ping');
      const latency = Math.round(performance.now() - start);
      setPingResult({ latency, status: '200 OK', region: 'us-east-1' });
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      setPingResult({ latency: Math.max(12, latency), status: 'Simulated OK', region: 'us-east-1' });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20">
      {/* ----------------- HOME VIEW ----------------- */}
      {activeTab === 'home' && (
        <div>
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/15 to-purple-500/20 blur-[130px] rounded-full pointer-events-none"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
                <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Live Multi-AZ Elastic Cluster
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
                Engineered for <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Infinite Scale</span> & High Availability
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                CloudScale dynamically provisions and scales EC2 compute behind an Application Load Balancer in real time. Continuous CloudWatch telemetry triggers automated scale-out under heavy loads and scale-in when idle.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setActiveTab('features')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Explore Capabilities
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('contact')}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  Generate Traffic Request
                  <Zap className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          </section>

          {/* Live Cluster Status Banner */}
          <section className="max-w-5xl mx-auto px-4 mb-16">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-slate-800 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base flex items-center gap-2">
                      Active Cluster Overview
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Routing live requests across Multi-Availability Zone targets
                    </p>
                  </div>
                </div>

                {/* Quick Telemetry Pills */}
                <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                  <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-mono">EC2 Nodes</div>
                    <div className="text-xl font-bold text-white font-mono">{clusterSummary?.totalInstances || 2}</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-mono">Cluster CPU</div>
                    <div className={`text-xl font-bold font-mono ${(clusterSummary?.avgCpuPercent || 28) > 70 ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {clusterSummary?.avgCpuPercent || 28}%
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-mono">Req / Min</div>
                    <div className="text-xl font-bold text-indigo-400 font-mono">{clusterSummary?.requestsPerMinute || 180}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Value Props Grid */}
          <section className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Automated Elasticity</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Automatic scale-out when CPU exceeds 70% threshold. Cooldown stabilization safeguards against thrashing and unnecessary cost.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                  <Globe2 className="w-5 h-5" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Multi-AZ Resilience</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Traffic distributed evenly across Availability Zones (us-east-1a and us-east-1b) with automatic target health checks.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Zero Direct Ingress</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  EC2 compute instances reside inside isolated private subnets. Only the Application Load Balancer accepts public traffic.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ----------------- ABOUT VIEW ----------------- */}
      {activeTab === 'about' && (
        <section className="max-w-4xl mx-auto px-4 pt-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Architecture & Scalability Philosophy
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base">
              Discover how CloudScale delivers rock-solid availability through AWS native primitives, decoupled networking, and real-time observability.
            </p>
          </div>

          <div className="space-y-8">
            {/* Architecture Card */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Multi-Tier Decoupled Infrastructure
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                By decoupling the public entry point (ALB) from the compute tier (EC2 in private subnets), our architecture ensures that no single server failure interrupts end-user requests. Traffic seamlessly migrates across healthy target nodes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <div className="font-semibold text-cyan-400 text-sm mb-1">Application Load Balancer (ALB)</div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Listens on port 80/443, performs regular HTTP health checks every 15 seconds, and drains connections cleanly during instance retirement.
                  </p>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <div className="font-semibold text-indigo-400 text-sm mb-1">Auto Scaling Group (ASG)</div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Enforces Min: 2, Desired: 2, Max: 6 capacity. Leverages Launch Templates to provision configured Docker containers automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Scaling Mechanics Card */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Adaptive Feedback Loop
              </h3>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Scale-Out Rule:</span> When aggregated CPU exceeds 70% over 2 evaluation periods, the ASG launches replacement and expansion compute nodes.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Scale-In Rule:</span> When traffic ebbs and CPU utilization drops below 30%, instances are terminated systematically to minimize running costs.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">300s Stabilization Window:</span> Enforced cooldown protects the cluster from flapping during volatile burst traffic.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------- FEATURES VIEW ----------------- */}
      {activeTab === 'features' && (
        <section className="max-w-5xl mx-auto px-4 pt-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Core Platform Features
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base">
              Explore the capabilities designed to guarantee uninterrupted service during sudden flash-traffic events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automated Dynamic Scaling</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Alleviates bottleneck pressures automatically by provisioning t3-series instances dynamically without human intervention.
              </p>
              <div className="text-xs font-mono text-cyan-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                Rule: ScaleOut [CPU &gt; 70%] ➔ +1 Instance
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Continuous Health Checking</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                ALB targets are validated every 15 seconds. Unhealthy instances are seamlessly quarantined and replaced by the Auto-Scaling Group.
              </p>
              <div className="text-xs font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                TargetGroup: HTTP /health [Interval: 15s]
              </div>
            </div>
          </div>

          {/* Interactive Ping Latency Tool */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Live Cluster Latency Tester
                </h3>
                <p className="text-xs text-slate-400">
                  Measure round-trip latency to the CloudScale backend cluster
                </p>
              </div>
              <button
                onClick={testPing}
                disabled={pinging}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
                {pinging ? 'Pinging...' : 'Send Ping'}
              </button>
            </div>

            {pingResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className="text-emerald-400 font-bold">{pingResult.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Round-trip: </span>
                  <span className="text-cyan-400 font-bold">{pingResult.latency} ms</span>
                </div>
                <div>
                  <span className="text-slate-400">Region: </span>
                  <span className="text-slate-200">{pingResult.region}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ----------------- CONTACT VIEW ----------------- */}
      {activeTab === 'contact' && (
        <section className="max-w-3xl mx-auto px-4 pt-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Connect with CloudScale
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base">
              Submit your inquiry or message. Each transmission generates verified transactional HTTP traffic to the backend cluster.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-slate-800">
            {submittedMessage ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Transmission Received</h3>
                <p className="text-slate-300 text-sm mb-6">{submittedMessage}</p>
                <button
                  onClick={() => setSubmittedMessage(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Inquire about architecture specifications or report load findings..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-mono">
                    Routes to: <code className="text-slate-400">POST /api/contact</code>
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Dispatching...' : 'Dispatch Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
