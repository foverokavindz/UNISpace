// ============================================================
// src/types/index.ts
// Central type definitions for the UNISpace backend
// ============================================================

// User role — matches the 'roles' table in the database
export type UserRole = 'student' | 'admin';

// Represents a row in the 'users' table
export interface User {
  id: number;
  full_name: string;
  email: string;
  student_id: string;
  mobile_number: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

// Data sent when registering a new student
export interface RegisterRequest {
  full_name: string;
  email: string;
  student_id: string;
  mobile_number: string;
  password: string;
}

// Data sent when logging in
export interface LoginRequest {
  email: string;
  password: string;
}

// What we store inside a JWT token
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// Safe user object to return to clients (no password)
export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  student_id: string;
  mobile_number: string;
  role: UserRole;
  created_at: Date;
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

// Data sent when updating profile
export interface UpdateProfileRequest {
  full_name: string;
  email: string;
  mobile_number?: string;
  student_id?: string;
}

// Standard API response shape
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
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
  time_limit: number;      // minutes
  created_by: number;
  created_at: Date;
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
  correct_option: 'A' | 'B' | 'C' | 'D';
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
  submitted_at: Date;
}

export interface CreateQuizRequest {
  title: string;
  type: QuizType;
  level: string;
  semester: string;
  edu_stream: string;
  time_limit?: number;
  questions?: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D';
  }[];
}

export interface SubmitMcqRequest {
  answers: Record<string, string>;  // { "1": "A", "2": "C", ... }
}
