// ============================================================
// src/components/ResourceComments.tsx
// Per-resource discussion popup — chat-style UI with 10s polling
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Comment {
  id: number;
  resource_id: number;
  user_id: number;
  message: string;
  created_at: string;
  full_name: string;
  student_id: string;
}

interface ResourceCommentsProps {
  resourceId: number;
  resourceName: string;
}

const POLL_INTERVAL_MS = 10_000; // 10 seconds

const ResourceComments: React.FC<ResourceCommentsProps> = ({ resourceId, resourceName }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------
  // Fetch comments from backend
  // -----------------------------------------------------------
  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get(`/resources/${resourceId}/comments`);
      if (res.data?.success) {
        setComments(res.data.data || []);
        setCommentCount(res.data.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }, [resourceId]);

  // Fetch count on mount (for the badge), and full data when popup opens
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Poll every 10s while popup is open
  useEffect(() => {
    if (!isOpen) return;

    fetchComments(); // immediate fetch on open
    const interval = setInterval(fetchComments, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isOpen, fetchComments]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // -----------------------------------------------------------
  // Send a new comment
  // -----------------------------------------------------------
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post(`/resources/${resourceId}/comments`, {
        message: newMessage.trim(),
      });
      if (res.data?.success && res.data.data) {
        setComments(prev => [...prev, res.data.data]);
        setCommentCount(prev => prev + 1);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -----------------------------------------------------------
  // Avatar helper — initials from full name
  // -----------------------------------------------------------
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
    ];
    return colors[userId % colors.length];
  };

  // -----------------------------------------------------------
  // Time formatting
  // -----------------------------------------------------------
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (commentUserId: number) => user?.id === commentUserId;

  return (
    <>
      {/* ── Comment Button (trigger) ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-600 text-xs transition flex items-center gap-1"
        title="Discussion"
      >
        💬
        {commentCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {commentCount > 99 ? '99+' : commentCount}
          </span>
        )}
      </button>

      {/* ── Popup Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800 truncate">💬 Discussion</h3>
                <p className="text-xs text-gray-500 truncate" title={resourceName}>{resourceName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-3 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50" style={{ minHeight: '300px' }}>
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <span className="text-4xl mb-2">💭</span>
                  <p className="text-sm font-medium">No comments yet</p>
                  <p className="text-xs mt-1">Be the first to start the discussion!</p>
                </div>
              ) : (
                comments.map(comment => {
                  const isMine = isCurrentUser(comment.user_id);
                  return (
                    <div
                      key={comment.id}
                      className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(comment.user_id)}`}
                        title={comment.full_name}
                      >
                        {getInitials(comment.full_name)}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <p className="text-[10px] text-gray-500 mb-0.5 px-1 font-medium">
                            {comment.full_name}
                          </p>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMine
                              ? 'bg-purple-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {comment.message}
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-0.5 px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                          {formatTime(comment.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50"
                  disabled={isSending}
                  maxLength={2000}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-9 h-9 flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  title="Send"
                >
                  {isSending ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                Press Enter to send
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceComments;
