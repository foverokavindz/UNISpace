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
