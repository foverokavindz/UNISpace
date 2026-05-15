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
