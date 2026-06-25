// ============================================================
// src/pages/AdminDashboard.tsx
// Dashboard shown to logged-in admins
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardStats {
  totalStudents: number;
  totalResources: number;
  activeQuizzes: number;
  categoryBreakdown: Record<string, number>;
}

// Map category keys to human-readable labels and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; hoverColor: string }> = {
  notes:              { label: 'Notes',              color: '#6366f1', hoverColor: '#818cf8' },
  'past-papers':      { label: 'Past Papers',        color: '#f59e0b', hoverColor: '#fbbf24' },
  'tutes-assignments': { label: 'Tutes & Assignments', color: '#10b981', hoverColor: '#34d399' },
  quizzes:            { label: 'Quizzes',             color: '#8b5cf6', hoverColor: '#a78bfa' },
  videos:             { label: 'Videos',              color: '#ef4444', hoverColor: '#f87171' },
};

// Animated number counter hook
function useAnimatedCount(target: number, duration = 800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }

    let start = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/resources/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to load stats.');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Animated counters
  const animStudents = useAnimatedCount(stats?.totalStudents ?? 0);
  const animResources = useAnimatedCount(stats?.totalResources ?? 0);
  const animQuizzes = useAnimatedCount(stats?.activeQuizzes ?? 0);

  // Build pie chart data
  const breakdown = stats?.categoryBreakdown ?? {};
  const allCategories = Object.keys(CATEGORY_CONFIG);
  const chartLabels: string[] = [];
  const chartData: number[] = [];
  const chartColors: string[] = [];
  const chartHoverColors: string[] = [];

  for (const key of allCategories) {
    const count = breakdown[key] ?? 0;
    const config = CATEGORY_CONFIG[key];
    chartLabels.push(config.label);
    chartData.push(count);
    chartColors.push(config.color);
    chartHoverColors.push(config.hoverColor);
  }

  // Add any unknown categories
  for (const key of Object.keys(breakdown)) {
    if (!CATEGORY_CONFIG[key]) {
      chartLabels.push(key.charAt(0).toUpperCase() + key.slice(1));
      chartData.push(breakdown[key]);
      chartColors.push('#94a3b8');
      chartHoverColors.push('#cbd5e1');
    }
  }

  const totalForChart = chartData.reduce((a, b) => a + b, 0);

  const doughnutData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartData,
        backgroundColor: chartColors,
        hoverBackgroundColor: chartHoverColors,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const pct = totalForChart > 0 ? ((value / totalForChart) * 100).toFixed(1) : '0';
            return ` ${context.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <Layout>
          {/* Welcome message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Admin Dashboard 🛠️
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome, {user?.full_name}. You have full administrative access.
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchStats} className="ml-auto text-red-600 hover:text-red-800 font-semibold text-xs underline">
                Retry
              </button>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Students Card */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-4">
                👨‍🎓
              </div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Total Students</p>
              {isLoading ? (
                <div className="mt-2 h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-5xl font-bold text-gray-800 mt-2 tabular-nums">{animStudents}</p>
              )}
            </div>

            {/* Total Resources Card */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-4xl mb-4">
                📚
              </div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Total Resources</p>
              {isLoading ? (
                <div className="mt-2 h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-5xl font-bold text-gray-800 mt-2 tabular-nums">{animResources}</p>
              )}
            </div>

            {/* Active Quizzes Card */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl mb-4">
                📝
              </div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Active Quizzes</p>
              {isLoading ? (
                <div className="mt-2 h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-5xl font-bold text-gray-800 mt-2 tabular-nums">{animQuizzes}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart - Resource Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Resource Distribution</h2>
              <p className="text-xs text-gray-400 mb-6">Breakdown of uploaded materials by category</p>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-400">Loading chart...</span>
                  </div>
                </div>
              ) : totalForChart === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                  <span className="text-4xl mb-2">📊</span>
                  <p className="text-sm font-medium text-gray-500">No resources uploaded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Upload some materials to see the distribution</p>
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  {/* Chart */}
                  <div className="w-56 h-56 flex-shrink-0">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                  {/* Legend */}
                  <div className="flex flex-col gap-3 flex-1">
                    {chartLabels.map((label, i) => {
                      const pct = totalForChart > 0 ? ((chartData[i] / totalForChart) * 100).toFixed(1) : '0';
                      return (
                        <div key={label} className="flex items-center gap-3 group/legend">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: chartColors[i] }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
                              <span className="text-xs font-semibold text-gray-500 ml-2">{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div
                                className="h-1.5 rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: chartColors[i],
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 font-medium tabular-nums w-6 text-right">{chartData[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions panel */}
            <div className="flex flex-col gap-6">
              {/* Upload Resources */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Upload Resources</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Upload notes, past papers, assignments, tutorials or videos for students.
                </p>
                <button
                  onClick={() => navigate('/admin/upload-resources')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                >
                  <span>📤</span> Upload Resource
                </button>
              </div>

              {/* Manage Resources */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Manage Resources</h2>
                <p className="text-gray-400 text-sm mb-4">
                  View, edit, or remove uploaded study materials and resources.
                </p>
                <button
                  onClick={() => navigate('/admin/resources')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                >
                  <span>⚙️</span> Manage Resources
                </button>
              </div>
            </div>
          </div>
        </Layout>
  );
};

export default AdminDashboard;
