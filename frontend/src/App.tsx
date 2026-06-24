// ============================================================
// src/App.tsx
// Root component — sets up React Router with all routes
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import Notifications from './pages/Notifications';
import StudentProfilePage from './pages/StudentProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfilePage from './pages/AdminProfilePage';
import UploadResourcesPage from './pages/UploadResourcesPage';
import LevelUploadPage from './pages/LevelUploadPage';
import SemesterUploadPage from './pages/SemesterUploadPage';
import SubjectUploadPage from './pages/SubjectUploadPage';
import CategoryUploadPage from './pages/CategoryUploadPage';
import ManageResourcesPage from './pages/ManageResourcesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Quiz pages
import AdminQuizListPage from './pages/AdminQuizListPage';
import AdminCreateQuizPage from './pages/AdminCreateQuizPage';
import AdminQuizSubmissionsPage from './pages/AdminQuizSubmissionsPage';
import StudentQuizListPage from './pages/StudentQuizListPage';
import StudentTakeQuizPage from './pages/StudentTakeQuizPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Student-only routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRole="student">
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/resources"
            element={
              <ProtectedRoute allowedRole="student">
                <UploadResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/resources/:level"
            element={
              <ProtectedRoute allowedRole="student">
                <LevelUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/resources/:level/:semester"
            element={
              <ProtectedRoute allowedRole="student">
                <SemesterUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/resources/:level/:semester/:subject"
            element={
              <ProtectedRoute allowedRole="student">
                <SubjectUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/resources/:level/:semester/:subject/:category"
            element={
              <ProtectedRoute allowedRole="student">
                <CategoryUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quizzes"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentQuizListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quizzes/:id"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentTakeQuizPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <ProtectedRoute allowedRole="admin">
                <ManageResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-resources"
            element={
              <ProtectedRoute allowedRole="admin">
                <UploadResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-resources/:level"
            element={
              <ProtectedRoute allowedRole="admin">
                <LevelUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-resources/:level/:semester"
            element={
              <ProtectedRoute allowedRole="admin">
                <SemesterUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-resources/:level/:semester/:subject"
            element={
              <ProtectedRoute allowedRole="admin">
                <SubjectUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-resources/:level/:semester/:subject/:category"
            element={
              <ProtectedRoute allowedRole="admin">
                <CategoryUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quizzes"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminQuizListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quizzes/create"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminCreateQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quizzes/:id/submissions"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminQuizSubmissionsPage />
              </ProtectedRoute>
            }
          />

          {/* Default: redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
