import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        if (response.data?.success) {
          setNotifications(response.data.data);
        }
        // Mark as read after fetching
        await api.patch('/notifications/read');
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Build internal website URL from parsed level, semester, subject, category
  const buildResourceUrl = (parts: Record<string, string>): string | null => {
    const level = parts['Level'];
    const semester = parts['Semester'];
    const subject = parts['Subject'];
    const category = parts['Folder'];
    if (level && semester && subject && category) {
      return `/student/resources/${encodeURIComponent(level)}/${encodeURIComponent(semester)}/${encodeURIComponent(subject)}/${encodeURIComponent(category)}`;
    }
    if (level && semester && subject) {
      return `/student/resources/${encodeURIComponent(level)}/${encodeURIComponent(semester)}/${encodeURIComponent(subject)}`;
    }
    if (level && semester) {
      return `/student/resources/${encodeURIComponent(level)}/${encodeURIComponent(semester)}`;
    }
    if (level) {
      return `/student/resources/${encodeURIComponent(level)}`;
    }
    return null;
  };

  return (
    <Layout>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Notifications</h1>

          <div className="bg-white rounded shadow p-6">
            {loading ? (
              <p className="text-gray-500">Loading notifications...</p>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col gap-4">
                {notifications.map((notif) => {
                  // Parse structured message parts
                  const parts: Record<string, string> = {};
                  const msgStr: string = notif.message || '';
                  const titleMatch = msgStr.match(/^New resource uploaded: "([^"]+)"/);
                  if (titleMatch) parts['Resource'] = titleMatch[1];
                  ['Level', 'Semester', 'Subject', 'Folder'].forEach((key) => {
                    const re = new RegExp(`${key}: ([^|]+)`);
                    const m = msgStr.match(re);
                    if (m) parts[key] = m[1].trim();
                  });
                  const hasParts = Object.keys(parts).length > 0;
                  const resourceUrl = buildResourceUrl(parts);

                  return (
                    <div
                      key={notif.id}
                      className={`p-5 rounded-lg border-l-4 shadow-sm ${
                        notif.is_read ? 'bg-white border-gray-300' : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">📢</span>

                        {/* All content is left-aligned */}
                        <div className="flex-1 text-left">

                          {/* Unread badge */}
                          {!notif.is_read && (
                            <span className="inline-block text-xs font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-full mb-2">
                              New
                            </span>
                          )}

                          {/* Main heading */}
                          <p className="font-bold text-gray-800 mb-3">
                            {hasParts ? 'New Resource Available' : msgStr}
                          </p>

                          {/* Left-aligned detail rows */}
                          {hasParts && (
                            <div className="flex flex-col gap-1.5 text-sm text-gray-700 mb-3">
                              {parts['Resource'] && (
                                <div className="flex items-center gap-2">
                                  <span className="w-5 text-center">📄</span>
                                  <span className="font-medium text-gray-500 w-20 shrink-0">File:</span>
                                  <span>{parts['Resource']}</span>
                                </div>
                              )}
                              {parts['Level'] && (
                                <div className="flex items-center gap-2">
                                  <span className="w-5 text-center">🎓</span>
                                  <span className="font-medium text-gray-500 w-20 shrink-0">Level:</span>
                                  <span>{parts['Level']}</span>
                                </div>
                              )}
                              {parts['Semester'] && (
                                <div className="flex items-center gap-2">
                                  <span className="w-5 text-center">📅</span>
                                  <span className="font-medium text-gray-500 w-20 shrink-0">Semester:</span>
                                  <span>{parts['Semester']}</span>
                                </div>
                              )}
                              {parts['Subject'] && (
                                <div className="flex items-center gap-2">
                                  <span className="w-5 text-center">📚</span>
                                  <span className="font-medium text-gray-500 w-20 shrink-0">Subject:</span>
                                  <span>{parts['Subject']}</span>
                                </div>
                              )}
                              {parts['Folder'] && (
                                <div className="flex items-center gap-2">
                                  <span className="w-5 text-center">📁</span>
                                  <span className="font-medium text-gray-500 w-20 shrink-0">Folder:</span>
                                  <span className="capitalize">{parts['Folder']}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Clickable link to navigate to the resource in the website */}
                          {resourceUrl && (
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <span className="w-5 text-center">🔗</span>
                              <span className="font-medium text-gray-500 w-20 shrink-0">Location:</span>
                              <Link
                                to={resourceUrl}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                              >
                                View resource →
                              </Link>
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-gray-400 mt-3">
                            🕐 {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">You have no notifications at this time.</p>
              </div>
            )}
          </div>
        </Layout>
  );
};

export default Notifications;
