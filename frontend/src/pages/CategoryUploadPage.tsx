import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import ResourceComments from '../components/ResourceComments';

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

const CategoryUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { level, semester, subject, category } = useParams<{ level: string; semester: string; subject: string; category: string }>();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const isAdmin = user?.role === 'admin';
  const routePrefix = isAdmin ? '/admin/upload-resources' : '/student/resources';

  // Determine titles based on URL params
  const levelTitle = `Level ${level}`;
  const semesterTitle = semester ? semester.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Semester';
  let subjectTitle = subject ? subject.toUpperCase() : 'Subject';
  if (subject === 'math-stat') {
    subjectTitle = 'MATH & STAT';
  }

  let categoryTitle = category ? category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Category';
  if (category === 'tutes-assignments') categoryTitle = 'Tutes & Assignments';
  if (category === 'quizzes') categoryTitle = 'Quizzes';
  if (category === 'videos') categoryTitle = 'Videos';
  if (category === 'past-papers') categoryTitle = 'Past Papers';

  // Fetch resources
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/resources', {
        params: { level, semester, subject, category }
      });
      if (response.data?.success) {
        setResources(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      showMsg('Failed to load uploaded materials.', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [level, semester, subject, category]);

  const showMsg = (text: string, isError: boolean) => {
    setMessage({ text, isError });
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  // Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showMsg('Please select a file to upload.', true);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('level', level || '');
    formData.append('semester', semester || '');
    formData.append('subject', subject || '');
    formData.append('category', category || '');

    try {
      const response = await api.post('/resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        showMsg('Material uploaded successfully!', false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh resources list
        fetchResources();
      } else {
        showMsg(response.data?.message || 'Upload failed.', true);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showMsg(err.response?.data?.message || 'Error uploading file. Please try again.', true);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await api.delete(`/resources/${id}`);
      if (response.data?.success) {
        showMsg('Resource deleted successfully.', false);
        setResources(prev => prev.filter(r => r.id !== id));
      } else {
        showMsg('Failed to delete resource.', true);
      }
    } catch (err) {
      console.error('Delete error:', err);
      showMsg('Error deleting resource.', true);
    }
  };

  // Rename handler
  const startRename = (resource: Resource) => {
    setRenamingId(resource.id);
    setRenameValue(resource.original_name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRename = async (id: number) => {
    if (!renameValue.trim()) {
      showMsg('Name cannot be empty.', true);
      return;
    }

    setIsRenaming(true);
    try {
      const response = await api.patch(`/resources/${id}/rename`, { name: renameValue.trim() });
      if (response.data?.success) {
        showMsg('Resource renamed successfully.', false);
        setResources(prev =>
          prev.map(r => r.id === id ? { ...r, original_name: renameValue.trim(), title: renameValue.trim() } : r)
        );
        setRenamingId(null);
        setRenameValue('');
      } else {
        showMsg(response.data?.message || 'Failed to rename resource.', true);
      }
    } catch (err: any) {
      console.error('Rename error:', err);
      showMsg(err.response?.data?.message || 'Error renaming resource.', true);
    } finally {
      setIsRenaming(false);
    }
  };

  // Helper for nice file design
  const getFileIconAndColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverRoot = API_BASE_URL.replace('/api', '');

  return (
    <Layout mainClassName="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mt-8 mb-8 border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {categoryTitle} 📚
              </h1>
              <p className="text-gray-500 mt-1">
                {levelTitle} &bull; {semesterTitle} &bull; {subjectTitle}
              </p>
            </div>
            <button
              onClick={() => navigate(`${routePrefix}/${level}/${semester}/${subject}`)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition flex items-center gap-1"
            >
              &larr; Back to {subjectTitle}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Upload Materials card */}
            {isAdmin && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📤</span> Upload Materials
                  </h3>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm mb-4 border font-medium ${
                      message.isError 
                        ? 'bg-red-50 text-red-800 border-red-200' 
                        : 'bg-green-50 text-green-800 border-green-200'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition bg-gray-50/50 cursor-pointer relative group">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-2 pointer-events-none">
                        <span className="text-4xl block group-hover:scale-110 transition duration-200">📂</span>
                        <span className="block text-sm font-semibold text-gray-700">
                          {selectedFile ? 'Change Selected File' : 'Select File from PC'}
                        </span>
                        <span className="block text-xs text-gray-400">
                          Drag and drop or click to browse
                        </span>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Selected File:</span>
                        <span className="text-sm font-medium text-gray-800 truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedFile || isUploading}
                      className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold transition text-sm flex items-center justify-center gap-2 ${
                        !selectedFile || isUploading
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <span>🚀</span> Upload
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Right Column: Files List */}
            <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col`}>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3 flex items-center justify-between">
                  <span>📂 Available Materials</span>
                  <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-500 font-medium">
                    {resources.length} {resources.length === 1 ? 'file' : 'files'}
                  </span>
                </h3>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-medium">Loading materials...</p>
                  </div>
                ) : resources.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/20">
                    <span className="text-5xl block mb-3">📭</span>
                    <h4 className="text-base font-semibold text-gray-700">No materials uploaded yet</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {isAdmin 
                        ? 'Use the upload panel on the left to add notes, past papers, tutes, or videos.'
                        : 'Please check back later when your admin uploads materials.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    // New grid layout for resources with portrait‑style cards and preview functionality
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {resources.map((resource) => {
                    const fileStyle = getFileIconAndColor(resource.original_name);
                    const fileUrl = `${serverRoot}/${resource.file_path}`;
                    const isPreviewable =
                      fileStyle.label === 'PDF' ||
                      fileStyle.label === 'Image' ||
                      fileStyle.label === 'Video';

                    const handlePreview = () => setPreviewResource(resource);

                    return (
                      <div
                        key={resource.id}
                        className="flex flex-col p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group"
                      >
                        {/* Icon / thumbnail */}
                        <div
                          className={`w-full h-40 rounded-md flex items-center justify-center mb-3 ${fileStyle.color}`}
                        >
                          {fileStyle.label === 'Image' ? (
                            <img
                              src={fileUrl}
                              alt={resource.original_name}
                              className="object-cover w-full h-full rounded-md"
                            />
                          ) : (
                            <span className="text-4xl">{fileStyle.emoji}</span>
                          )}
                        </div>
                        {/* File name */}
                        {renamingId === resource.id ? (
                          <div className="mb-1">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(resource.id);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className="w-full text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                              autoFocus
                              disabled={isRenaming}
                            />
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => handleRename(resource.id)}
                                disabled={isRenaming}
                                className="flex-1 px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition disabled:opacity-50"
                              >
                                {isRenaming ? '...' : '✓ Save'}
                              </button>
                              <button
                                onClick={cancelRename}
                                disabled={isRenaming}
                                className="flex-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition disabled:opacity-50"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h4
                            className="text-sm font-medium text-gray-800 truncate mb-1"
                            title={resource.original_name}
                          >
                            {resource.original_name}
                          </h4>
                        )}
                        {/* Date */}
                        <p className="text-xs text-gray-500 mb-2">
                          📅 {new Date(resource.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {/* Action buttons */}
                        <div className="mt-auto flex gap-2">
                          {isPreviewable && (
                            <button
                              onClick={handlePreview}
                              className="flex-1 px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-xs transition"
                            >
                              👁️ Preview
                            </button>
                          )}
                          <a
                            href={fileUrl}
                            download={resource.original_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs transition text-center"
                          >
                            ⬇️ Download
                          </a>
                          <ResourceComments resourceId={resource.id} resourceName={resource.original_name} />
                          {isAdmin && (
                            <button
                              onClick={() => startRename(resource)}
                              className="p-1 text-amber-600 hover:text-white hover:bg-amber-500 rounded"
                              title="Rename material"
                            >
                              ✏️
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="p-1 text-red-600 hover:text-white hover:bg-red-600 rounded"
                              title="Delete material"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preview Modal */}
                {previewResource && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl overflow-hidden max-w-5xl w-full max-h-[95vh] shadow-2xl relative flex flex-col">
                      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 truncate pr-4">
                          {previewResource.original_name}
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
                          const fileUrl = `${serverRoot}/${previewResource.file_path}`;
                          const fileStyle = getFileIconAndColor(previewResource.original_name);
                          if (fileStyle.label === 'PDF') {
                            return (
                              <iframe
                                src={fileUrl}
                                title={previewResource.original_name}
                                className="w-full h-[82vh] rounded shadow-sm border border-gray-200"
                              />
                            );
                          } else if (fileStyle.label === 'Image') {
                            return (
                              <img
                                src={fileUrl}
                                alt={previewResource.original_name}
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
                          return <p className="text-center text-gray-600">Preview not available for this file type.</p>;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Layout>
  );
};

export default CategoryUploadPage;
