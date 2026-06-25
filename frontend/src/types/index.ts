// ============================================================
// src/types/index.ts
// Shared TypeScript types for the UNISpace frontend
// ============================================================

// User roles
export type UserRole = 'student' | 'admin';

// User object returned by the API (no password)
export interface User {
  id: number;
  full_name: string;
  email: string;
  student_id: string;
  mobile_number: string;
  role: UserRole;
  created_at: string;
}

// Registration form data
export interface RegisterFormData {
  full_name: string;
  email: string;
  student_id: string;
  mobile_number: string;
  password: string;
  confirmPassword: string;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Standard API response shape (mirrors backend)
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

// Auth response from login/register
export interface AuthData {
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

// ============================================================
// Quiz types
// ============================================================

export type QuizType = 'mcq' | 'document';

export interface Quiz {
  id: number;
  title: string;
  type: QuizType;
  level: string;
  semester: string;
  edu_stream: string;
  time_limit: number;
  created_by: number;
  created_at: string;
  creator_name?: string;
  submitted?: boolean;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_num: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: string; // hidden from students before submission
}

// Shape used when authoring quiz questions in the create form
export interface QuestionInput {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

export interface QuizSubmission {
  id: number;
  quiz_id: number;
  student_id: number;
  answers_json: string | null;
  score: number | null;
  total: number | null;
  file_path: string | null;
  original_name: string | null;
  submitted_at: string;
  student_name?: string;
  student_reg_id?: string;
  student_email?: string;
}

// ============================================================
// Session (live study meeting) types
// ============================================================

export type SessionStatus = 'scheduled' | 'active' | 'ended';

export interface Session {
  id: number;
  title: string;
  description: string | null;
  host_id: number;
  scheduled_at: string;
  max_participants: number;
  jitsi_room_name: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  host_name?: string;
  participant_count?: number;
}

export interface SessionParticipant {
  id: number;
  session_id: number;
  user_id: number;
  joined_at: string;
  user_name?: string;
}

export interface SessionDetail extends Session {
  participants: SessionParticipant[];
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
  scheduled_at: string;
  max_participants?: number;
}

