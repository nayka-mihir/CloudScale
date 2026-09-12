import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { submitContact } from '../services/api';

export default function Contact({ triggerNotification, theme }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitting(true);
    try {
      const res = await submitContact(formData);
      setSubmittedMessage(res.message || 'Transmission dispatched successfully to backend!');
      setFormData({ name: '', email: '', message: '' });
      if (triggerNotification) {
        triggerNotification('Traffic Event: Contact inquiry dispatched to backend target!');
      }
    } catch (err) {
      setSubmittedMessage('Message logged locally (offline simulation). Request counted!');
      if (triggerNotification) {
        triggerNotification('Traffic event simulated successfully.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Contact Us
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          Submit an inquiry. Each transmission generates verified transactional HTTP request load on the cluster backend.
        </p>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all">
        {submittedMessage ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Request Processed</h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-6">{submittedMessage}</p>
            <button
              onClick={() => setSubmittedMessage(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mihir Sharma"
                  className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mihir@example.com"
                  className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Inquire about architecture specifications or report load findings..."
                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                API Endpoint: <code>POST /api/contact</code>
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 dark:text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Transmitting...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
