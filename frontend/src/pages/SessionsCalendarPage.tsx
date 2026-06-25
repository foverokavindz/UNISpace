// ============================================================
// src/pages/SessionsCalendarPage.tsx
// Month calendar of study sessions — click a day to view / schedule
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Video, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import CreateSessionModal from '../components/CreateSessionModal';
import DaySessionsModal from '../components/DaySessionsModal';
import { useAuth } from '../context/AuthContext';
import { getSessions } from '../services/session.service';
import type { Session } from '../types';

// Local YYYY-MM-DD key (avoids UTC shifting the day)
const dayKey = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const SessionsCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const base = user?.role === 'admin' ? '/admin' : '/student';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await getSessions();
      if (response.success) {
        setSessions(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setErrorMsg('Failed to load sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Group sessions by local day key
  const sessionsByDay: Record<string, Session[]> = {};
  for (const s of sessions) {
    const key = dayKey(new Date(s.scheduled_at));
    (sessionsByDay[key] ||= []).push(s);
  }

  const daySessions = selectedDay ? sessionsByDay[dayKey(selectedDay)] || [] : [];

  const handleClickDay = (date: Date) => {
    setSelectedDay(date);
    setDayModalOpen(true);
  };

  const handleScheduleFromDay = () => {
    setDayModalOpen(false);
    setCreateModalOpen(true);
  };

  const handleScheduleFromHeader = () => {
    setSelectedDay(new Date());
    setCreateModalOpen(true);
  };

  return (
    <Layout>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">Study Sessions <Video size={26} /></h1>
              <p className="text-gray-500 mt-1">Click a day to view or schedule live sessions.</p>
            </div>
            <button
              onClick={handleScheduleFromHeader}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 shadow-sm"
            >
              <Plus size={20} /> Schedule Session
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

          {!isLoading && (
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 unispace-calendar">
              <Calendar
                onClickDay={handleClickDay}
                tileContent={({ date, view }) =>
                  view === 'month' && sessionsByDay[dayKey(date)] ? (
                    <span className="block mx-auto mt-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  ) : null
                }
              />
            </div>
          )}

      {dayModalOpen && selectedDay && (
        <DaySessionsModal
          date={selectedDay}
          sessions={daySessions}
          onClose={() => setDayModalOpen(false)}
          onSchedule={handleScheduleFromDay}
          onJoin={(id) => navigate(`${base}/sessions/${id}`)}
        />
      )}

      {createModalOpen && (
        <CreateSessionModal
          defaultDate={selectedDay ?? undefined}
          onClose={() => setCreateModalOpen(false)}
          onCreated={fetchSessions}
        />
      )}
    </Layout>
  );
};

export default SessionsCalendarPage;
