// ============================================================
// src/pages/StudentDashboard.tsx
// Dashboard shown to logged-in students
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import ResourceComments from '../components/ResourceComments';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [executedTerm, setExecutedTerm] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewResource, setPreviewResource] = useState<any>(null);

  // Fetch all resources on mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [resResources, resNotifs] = await Promise.all([
          api.get('/resources'),
          api.get('/notifications')
        ]);
        if (resResources.data?.success) {
          setResources(resResources.data.data);
        }
        if (resNotifs.data?.success) {
          const unread = resNotifs.data.data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);
  // Track the most recently opened resource
  const [recentResource, setRecentResource] = useState<any>(null);
  
  const handleOpenResource = (r: any) => { 
    setRecentResource(r); 
    setPreviewResource(r);
  };

  const serverRoot = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

  const getFileIconAndColor = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return { emoji: '📄', color: 'bg-red-50 text-red-600 border-red-200', label: 'PDF' };
      case 'doc':
      case 'docx': return { emoji: '📝', color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Word' };
      case 'xls':
      case 'xlsx': return { emoji: '📊', color: 'bg-green-50 text-green-600 border-green-200', label: 'Excel' };
      case 'ppt':
      case 'pptx': return { emoji: '📉', color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Slides' };
      case 'zip':
      case 'rar':
      case '7z': return { emoji: '📦', color: 'bg-purple-50 text-purple-600 border-purple-200', label: 'Archive' };
      case 'mp4':
      case 'mkv':
      case 'avi':
      case 'mov': return { emoji: '🎥', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: 'Video' };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return { emoji: '🖼️', color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Image' };
      default: return { emoji: '📄', color: 'bg-gray-50 text-gray-600 border-gray-200', label: 'File' };
    }
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter resources based on executedTerm (case-insensitive)
  const filteredResources = resources.filter((r: any) => {
    if (!executedTerm) return false;
    const term = executedTerm.toLowerCase().trim();
    
    const title = (r.title || '').toLowerCase();
    const levelStr = `level ${r.level || ''}`.toLowerCase();
    const rawLevel = String(r.level || '').toLowerCase();
    const semesterStr = (r.semester || '').replace(/-/g, ' ').toLowerCase();
    const subjectStr = (r.subject || '').replace(/-/g, ' ').toLowerCase();
    const categoryStr = (r.category || '').replace(/-/g, ' ').toLowerCase();

    return (
      title.includes(term) ||
      levelStr.includes(term) ||
      rawLevel === term ||
      semesterStr.includes(term) ||
      subjectStr.includes(term) ||
      categoryStr.includes(term) ||
      (r.category || '').toLowerCase().includes(term) ||
      (r.semester || '').toLowerCase().includes(term) ||
      (r.subject || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 p-8 bg-gray-50">
          {/* Welcome message */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {user?.full_name}! 👋
              </h1>
              <p className="text-gray-500 mt-1">
                Student ID: {user?.student_id} &nbsp;|&nbsp; Role: {user?.role}
              </p>
            </div>
            <Link to="/student/notifications" className="relative p-2 text-gray-600 hover:text-blue-600">
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search bar */}
          <div className="mb-6 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Search resources by name, level, semester, subject, or folder..." 
              className="w-80 p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setExecutedTerm(searchTerm)}
            />
            <button 
              onClick={() => setExecutedTerm(searchTerm)}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>

          {executedTerm && (
            <div className="mb-8 bg-white p-6 rounded shadow">
              <h2 className="text-lg font-bold mb-4">Search Results for "{executedTerm}"</h2>
              {filteredResources.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {filteredResources.map((r: any) => (
                    <div key={r.id} className="py-2 text-left group border-b border-gray-100 last:border-0 flex items-start justify-between gap-2">
                      <div className="flex-1 cursor-pointer" onClick={() => handleOpenResource(r)}>
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{r.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Level {r.level} • {formatText(r.semester)} • {formatText(r.subject)} • {formatText(r.category)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        <ResourceComments resourceId={r.id} resourceName={r.title || r.original_name} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No resources match your search.</p>
              )}
            </div>
          )}

          {/* Dashboard Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Main Content) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Upcoming Events removed */}

              {/* Recent Resources */}
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Recent Resources</h2>
              {recentResource ? (
                <div className="p-4 border rounded hover:border-blue-500 transition cursor-pointer" onClick={() => handleOpenResource(recentResource)}>
                  <h3 className="font-semibold text-gray-800">{recentResource.title}</h3>
                  <p className="text-sm text-gray-500">{recentResource.level} • {recentResource.semester} • {recentResource.subject} • {recentResource.category}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <p>No resource opened yet.</p>
                </div>
              )}
            </div>
            </div>

            {/* Right Column (Sidebar/Calendar) */}
            <div className="flex flex-col gap-8">
              
              {/* Mini Calendar UI */}
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Event Calendar</h2>
                  <span className="text-sm font-medium text-blue-600 cursor-pointer">May 2026</span>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500 font-medium">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-700">
                  {/* Mock empty days */}
                  <div className="py-2 text-gray-300">26</div>
                  <div className="py-2 text-gray-300">27</div>
                  <div className="py-2 text-gray-300">28</div>
                  <div className="py-2 text-gray-300">29</div>
                  <div className="py-2 text-gray-300">30</div>
                  {/* Active days */}
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">1</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">2</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">3</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">4</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">5</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">6</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">7</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">8</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">9</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">10</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">11</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">12</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">13</div>
                  {/* Highlighted today/event */}
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">14</div>
                  <div className="py-2 bg-blue-600 text-white font-bold rounded shadow cursor-pointer relative">
                    15
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                  </div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">16</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">17</div>
                  <div className="py-2 bg-purple-100 text-purple-700 font-bold rounded cursor-pointer relative">
                    18
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full"></span>
                  </div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">19</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">20</div>
                  <div className="py-2 hover:bg-blue-50 rounded cursor-pointer">21</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span className="text-gray-600">Today: Web Eng Lecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    <span className="text-gray-600">May 18: Project Phase 1</span>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Notifications</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded text-sm text-blue-900">
                    <span>📢</span>
                    <div>
                      <p className="font-semibold">Welcome to UNISpace!</p>
                      <p className="text-blue-700 opacity-90 mt-1">Please complete your student profile setup.</p>
                    </div>
                  </div>
                  <p className="text-center text-gray-400 text-xs mt-2">No older notifications</p>
                </div>
              </div>

            </div>
          </div>

          {/* Preview Modal */}
          {previewResource && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl overflow-hidden max-w-5xl w-full max-h-[95vh] shadow-2xl relative flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 truncate pr-4">
                    {previewResource.title || previewResource.original_name}
                  </h3>
                  <button
                    onClick={() => setPreviewResource(null)}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                    title="Close Preview"
                  >
                    ✖️
                  </button>
                </div>
                <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-gray-100/50">
                  {(() => {
                    const normalizedPath = previewResource.file_path.replace(/\\/g, '/');
                    const fileUrl = `${serverRoot}/${normalizedPath}`;
                    const fileStyle = getFileIconAndColor(previewResource.original_name || previewResource.title);
                    if (fileStyle.label === 'PDF') {
                      return (
                        <iframe
                          src={fileUrl}
                          title={previewResource.title}
                          className="w-full h-[82vh] rounded shadow-sm border border-gray-200"
                        />
                      );
                    } else if (fileStyle.label === 'Image') {
                      return (
                        <img
                          src={fileUrl}
                          alt={previewResource.title}
                          className="max-w-full max-h-[82vh] mx-auto rounded shadow-sm"
                        />
                      );
                    } else if (fileStyle.label === 'Video') {
                      return (
                        <video
                          src={fileUrl}
                          controls
                          className="w-full h-auto max-h-[82vh] rounded shadow-sm bg-black"
                        />
                      );
                    }
                    return (
                      <div className="flex flex-col items-center">
                        <p className="text-center text-gray-600 mb-4">Preview not available for this file type.</p>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                          Download File
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
