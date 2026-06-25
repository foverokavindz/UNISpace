// ============================================================
// src/pages/SessionPage.tsx
// Single session — details + participants, then embedded Jitsi room
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import JitsiRoom from '../components/JitsiRoom';
import { useAuth } from '../context/AuthContext';
import { getSession, joinSession, deleteSession } from '../services/session.service';
import type { SessionDetail } from '../types';

const SessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const base = user?.role === 'admin' ? '/admin' : '/student';

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const fetchSession = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await getSession(parseInt(id, 10));
      if (response.success && response.data) {
        setSession(response.data);
      } else {
        setErrorMsg(response.message || 'Session not found.');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setErrorMsg('Failed to load session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async () => {
    if (!session) return;
    setIsJoining(true);
    setErrorMsg(null);
    try {
      const response = await joinSession(session.id);
      if (response.success) {
        setJoined(true);
      } else {
        setErrorMsg(response.message || 'Could not join session.');
      }
    } catch (err: any) {
      console.error('Join session error:', err);
      setErrorMsg(err.response?.data?.message || 'Could not join session.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancel = async () => {
    if (!session) return;
    if (!window.confirm('Cancel this session? This cannot be undone.')) return;
    try {
      const response = await deleteSession(session.id);
      if (response.success) {
        navigate(`${base}/sessions`);
      } else {
        setErrorMsg(response.message || 'Could not cancel session.');
      }
    } catch (err: any) {
      console.error('Cancel session error:', err);
      setErrorMsg(err.response?.data?.message || 'Could not cancel session.');
    }
  };

  const isHost = !!(session && user && session.host_id === user.id);
  const isFuture = !!(session && new Date(session.scheduled_at).getTime() > Date.now());

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(`${base}/sessions`)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
            >
              &larr; Back to Sessions
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {!isLoading && session && joined && (
            <JitsiRoom
              roomName={session.jitsi_room_name}
              displayName={user?.full_name || 'Guest'}
              onLeave={() => navigate(`${base}/sessions`)}
            />
          )}

          {!isLoading && session && !joined && (
            <div className="max-w-2xl">
              {/* Details card */}
              <div className="bg-white rounded-xl shadow p-6 border border-gray-100 mb-6">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
                  {isHost && (
                    <button
                      onClick={handleCancel}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold transition whitespace-nowrap"
                    >
                      Cancel session
                    </button>
                  )}
                </div>
                {session.description && (
                  <p className="text-gray-600 mt-2">{session.description}</p>
                )}
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>👤 Host: {session.host_name || 'Unknown'}</p>
                  <p>🕒 {new Date(session.scheduled_at).toLocaleString()}</p>
                  <p>👥 {session.participant_count ?? session.participants.length} / {session.max_participants} joined</p>
                </div>

                {isFuture && (
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-sm">
                    This session is scheduled for the future — you can still join early.
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isJoining ? 'Joining…' : 'Join Meeting →'}
                </button>
              </div>

              {/* Participants */}
              <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Participants ({session.participants.length})
                </h2>
                {session.participants.length === 0 ? (
                  <p className="text-sm text-gray-400">No one has joined yet — be the first!</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {session.participants.map((p) => (
                      <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                        <span className="text-gray-700">{p.user_name || `User #${p.user_id}`}</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(p.joined_at).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SessionPage;
