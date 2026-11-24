import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import { fetchMetrics } from './services/api';

export default function App() {
  const [activeApp, setActiveApp] = useState('public'); // 'public' or 'admin'
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'about', 'features', 'contact'
  const [metrics, setMetrics] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cloudscale-theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('cloudscale-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const loadMetrics = async () => {
    try {
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (err) {
      setMetrics((prev) => {
        if (prev) return prev;
        return {
          summary: {
            totalInstances: 3,
            healthyInstances: 3,
            avgCpuPercent: 65,
            requestsPerMinute: 250,
            desiredCapacity: 3,
            minCapacity: 2,
            maxCapacity: 6,
            loadTestActive: false
          },
          instances: [
            { id: 'i-0123456789', az: 'ap-southeast-2a', state: 'running', health: 'healthy', cpu: 64, launchTime: new Date().toISOString() },
            { id: 'i-0987654321', az: 'ap-southeast-2b', state: 'running', health: 'healthy', cpu: 66, launchTime: new Date().toISOString() },
            { id: 'i-0456789123', az: 'ap-southeast-2a', state: 'running', health: 'healthy', cpu: 65, launchTime: new Date().toISOString() }
          ],
          history: []
        };
      });
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  return (
    <MainLayout
      activeApp={activeApp}
      setActiveApp={setActiveApp}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      clusterSummary={metrics?.summary}
      toastMessage={toastMessage}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {activeApp === 'admin' ? (
        <AdminDashboard
          metrics={metrics}
          refreshMetrics={loadMetrics}
          triggerNotification={triggerNotification}
          theme={theme}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <Home
              onNavigate={(tab) => setActiveTab(tab)}
              clusterSummary={metrics?.summary}
              theme={theme}
            />
          )}
          {activeTab === 'about' && (
            <About onNavigate={(tab) => setActiveTab(tab)} theme={theme} />
          )}
          {activeTab === 'features' && <Features theme={theme} />}
          {activeTab === 'contact' && (
            <Contact triggerNotification={triggerNotification} theme={theme} />
          )}
        </>
      )}
    </MainLayout>
  );
}
