// ============================================================
// src/services/auth.service.ts
// Functions for calling the auth API endpoints
// ============================================================

import api from './api';
import type { ApiResponse, AuthData, LoginFormData, RegisterFormData, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest } from '../types';

// Call POST /api/auth/register
export const registerUser = async (
  data: Omit<RegisterFormData, 'confirmPassword'>
): Promise<ApiResponse<AuthData>> => {
  const response = await api.post<ApiResponse<AuthData>>('/auth/register', data);
  return response.data;
};

// Call POST /api/auth/login
export const loginUser = async (
  data: LoginFormData
): Promise<ApiResponse<AuthData>> => {
  const response = await api.post<ApiResponse<AuthData>>('/auth/login', data);
  return response.data;
};

// Call GET /api/auth/me
export const getCurrentUser = async (): Promise<ApiResponse<AuthData['user']>> => {
  const response = await api.get<ApiResponse<AuthData['user']>>('/auth/me');
  return response.data;
};

// Call POST /api/auth/forgot-password
export const requestPasswordReset = async (
  data: ForgotPasswordRequest
): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/auth/forgot-password', data);
  return response.data;
};

// Call POST /api/auth/verify-otp
export const verifyOtp = async (
  data: VerifyOtpRequest
): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/auth/verify-otp', data);
  return response.data;
};

// Call POST /api/auth/reset-password
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/auth/reset-password', data);
  return response.data;
};
