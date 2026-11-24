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
            totalInstances: 2,
            healthyInstances: 2,
            avgCpuPercent: 42,
            requestsPerMinute: 180,
            desiredCapacity: 2,
            minCapacity: 2,
            maxCapacity: 6,
            loadTestActive: false
          },
          instances: [
            { id: 'i-07fc1d8338766d3b5', az: 'ap-southeast-2a', state: 'running', health: 'healthy', cpu: 40, launchTime: new Date().toISOString() },
            { id: 'i-0ebf45aadfd8cc5b6', az: 'ap-southeast-2b', state: 'running', health: 'healthy', cpu: 44, launchTime: new Date().toISOString() }
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
