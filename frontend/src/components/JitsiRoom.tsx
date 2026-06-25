// ============================================================
// src/components/JitsiRoom.tsx
// Embedded Jitsi Meet room (public meet.jit.si server)
// ============================================================

import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiRoomProps {
  roomName: string;
  displayName: string;
  onLeave: () => void;
}

const JitsiRoom: React.FC<JitsiRoomProps> = ({ roomName, displayName, onLeave }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          Connected as <span className="font-semibold text-gray-700">{displayName}</span>
        </span>
        <button
          onClick={onLeave}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          &larr; Leave Meeting
        </button>
      </div>

      <div className="w-full h-[80vh] rounded-xl overflow-hidden border border-gray-200">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          userInfo={{ displayName, email: '' }}
          onReadyToClose={onLeave}
          getIFrameRef={(node) => {
            node.style.height = '100%';
            node.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
};

export default JitsiRoom;
