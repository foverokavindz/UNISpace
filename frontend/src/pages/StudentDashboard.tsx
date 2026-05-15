// ============================================================
// src/pages/StudentDashboard.tsx
// Dashboard shown to logged-in students
// ============================================================

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome back, {user?.full_name}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Student ID: {user?.student_id} &nbsp;|&nbsp; Role: {user?.role}
            </p>
          </div>

          {/* Dashboard Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Main Content) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Upcoming Events Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded shadow-lg p-6 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-blue-100 text-sm font-medium mb-1">Next Class</p>
                    <h3 className="text-xl font-bold mb-2">Web Engineering Lecture</h3>
                    <p className="text-sm text-blue-50 opacity-90">Tomorrow, 10:00 AM - 12:00 PM</p>
                    <p className="text-sm text-blue-50 opacity-90 mt-1">Room: LT-4</p>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 text-8xl transform translate-x-4 translate-y-4">
                    📅
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded shadow-lg p-6 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-purple-100 text-sm font-medium mb-1">Upcoming Deadline</p>
                    <h3 className="text-xl font-bold mb-2">Database Project Phase 1</h3>
                    <p className="text-sm text-purple-50 opacity-90">Due in 3 Days (Friday)</p>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 text-8xl transform translate-x-4 translate-y-4">
                    ⏰
                  </div>
                </div>
              </div>

              {/* Recent Resources */}
              <div className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Recent Resources</h2>
                <div className="text-center py-6 text-gray-400 text-sm">
                  <p>No new resources available yet.</p>
                  <p className="mt-1">Check back later when your admin uploads materials.</p>
                </div>
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
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
