// ============================================================
// src/components/DaySessionsModal.tsx
// Popup listing the sessions scheduled on a clicked calendar day
// ============================================================

import React from 'react';
import { Users, ArrowRight, Plus } from 'lucide-react';
import type { Session } from '../types';

interface DaySessionsModalProps {
  date: Date;
  sessions: Session[];      // already filtered to this day
  onClose: () => void;
  onSchedule: () => void;   // open CreateSessionModal for this day
  onJoin: (id: number) => void;
}

const statusBadge = (status: Session['status']) => {
  const map: Record<Session['status'], string> = {
    scheduled: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    ended: 'bg-gray-100 text-gray-500',
  };
  return map[status];
};

const DaySessionsModal: React.FC<DaySessionsModalProps> = ({ date, sessions, onClose, onSchedule, onJoin }) => {
  const dayLabel = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{dayLabel}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-medium">
              No sessions this day — schedule one.
            </div>
          )}

          {sessions.map((s) => (
            <div
              key={s.id}
              className="border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hosted by {s.host_name || 'Unknown'} •{' '}
                    {new Date(s.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(s.status)}`}>
                  {s.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={16} /> {s.participant_count ?? 0} / {s.max_participants} joined
                </span>
                <button
                  onClick={() => onJoin(s.id)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1"
                >
                  Join <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onSchedule}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={20} /> Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default DaySessionsModal;
