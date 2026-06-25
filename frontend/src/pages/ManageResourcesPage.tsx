import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Resource {
  id: number;
  title: string;
  description: string;
  file_path: string;
  original_name: string;
  mime_type: string;
  level: string;
  semester: string;
  subject: string;
  category: string;
  created_at: string;
}

const ManageResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAllResources = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/resources');
      if (response.data?.success) {
        setResources(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching manage resources:', err);
      setErrorMsg('Failed to load resources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllResources();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await api.delete(`/resources/${id}`);
      if (response.data?.success) {
        setResources(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Failed to delete resource.');
      }
    } catch (err) {
      console.error('Delete resource error:', err);
      alert('Error deleting resource.');
    }
  };

  // Filter resources based on search term
  const filteredResources = resources.filter((res) => {
    if (!searchTerm) return true; // Show all if search is empty
    const term = searchTerm.toLowerCase().trim();
    
    const title = (res.original_name || '').toLowerCase();
    const levelStr = `level ${res.level || ''}`.toLowerCase();
    const rawLevel = String(res.level || '').toLowerCase();
    const semesterStr = (res.semester || '').replace(/-/g, ' ').toLowerCase();
    const subjectStr = (res.subject || '').replace(/-/g, ' ').toLowerCase();
    const categoryStr = (res.category || '').replace(/-/g, ' ').toLowerCase();

    return (
      title.includes(term) ||
      levelStr.includes(term) ||
      rawLevel === term ||
      semesterStr.includes(term) ||
      subjectStr.includes(term) ||
      categoryStr.includes(term) ||
      (res.category || '').toLowerCase().includes(term) ||
      (res.semester || '').toLowerCase().includes(term) ||
      (res.subject || '').toLowerCase().includes(term)
    );
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverRoot = API_BASE_URL.replace('/api', '');

  // Helper formatting functions
  const formatCategory = (cat: string) => {
    if (cat === 'tutes-assignments') return 'Tutes & Assignments';
    if (cat === 'past-papers') return 'Past Papers';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const formatSemester = (sem: string) => {
    return sem.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Layout mainClassName="flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                Manage Resources <Settings size={26} />
              </h1>
              <p className="text-gray-500 mt-1">
                View, download, or delete uploaded study materials.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
            >
              &larr; Back to Dashboard
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Search resources by name, level, semester, subject, or folder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-1/3 border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
              />
              <button
                onClick={() => navigate('/admin/upload-resources')}
                className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={20} /> Add New Resource
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm mb-4">
                {errorMsg}
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="p-4 font-bold">Title</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Level / Sem / Sub</th>
                    <th className="p-4 font-bold">Date Uploaded</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">

        {isLoading && (
          <tr>
            <td colSpan={5} className="p-12 text-center text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading resources...</span>
              </div>
            </td>
          </tr>
        )}
        {!isLoading && filteredResources.length === 0 && (
          <tr>
            <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
              No resources found. Try uploading some materials first.
            </td>
          </tr>
        )}
        {!isLoading && filteredResources.length > 0 && filteredResources.map((res) => (
          <tr key={res.id} className="hover:bg-gray-50/50 transition">
            <td className="p-4 font-semibold text-gray-800 max-w-xs truncate" title={res.original_name}>
              {res.original_name}
            </td>
            <td className="p-4 text-gray-500 font-medium">
              {formatCategory(res.category)}
            </td>
            <td className="p-4 text-gray-500 font-medium">
              Level {res.level} / {formatSemester(res.semester)} / <span className="uppercase">{res.subject}</span>
            </td>
            <td className="p-4 text-gray-400 text-xs">
              {new Date(res.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </td>
            <td className="p-4 text-right flex items-center justify-end gap-2.5">
              <a
                href={`${serverRoot}/${res.file_path}`}
                download={res.original_name}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-lg px-3 py-1.5 transition"
              >
                Download
              </a>
              <button
                onClick={() => handleDelete(res.id)}
                className="text-red-600 hover:text-white border border-red-150 hover:bg-red-600 rounded-lg p-1.5 transition"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>


              </table>
            </div>
          </div>
        </Layout>
  );
};

export default ManageResourcesPage;
