import api from './api';
import type { ApiResponse, AuthData, LoginFormData, RegisterFormData, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest, User } from '../types';

// Data sent when updating profile
export interface UpdateProfileData {
  full_name: string;
  email: string;
  mobile_number?: string;
  student_id?: string;
}

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

  const isMock = import.meta.env.VITE_IS_MOCK === 'true';
  if (isMock) {
    const isAdmin = data.email === 'admin@test.com';

    // Mock data
    const mockUserData: User = {
      id: isAdmin ? 2 : 1,
      full_name: isAdmin ? 'System Admin' : 'John Doe',
      email: data.email,
      student_id: isAdmin ? 'ADMIN001' : 'STU2026001',
      mobile_number: '+94771234567',
      role: isAdmin ? 'admin' : 'student',
      created_at: new Date().toISOString(),
    };

    const mockAuthData: AuthData = {
      token: 'mock-jwt-token-123',
      user: mockUserData,
    };

    // Mock API response
    const mockResponse: ApiResponse<AuthData> = {
      success: true,
      message: 'Login successful',
      data: mockAuthData,
    };

    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockResponse);
      }, 500);
    });

  }
  const response = await api.post<ApiResponse<AuthData>>('/auth/login', data);
  return response.data;
};

// Call GET /api/auth/me
export const getCurrentUser = async (): Promise<ApiResponse<AuthData['user']>> => {
  const response = await api.get<ApiResponse<AuthData['user']>>('/auth/me');
  return response.data;
};

// Call PUT /api/auth/profile
export const updateProfile = async (
  data: UpdateProfileData
): Promise<ApiResponse<User>> => {
  const response = await api.put<ApiResponse<User>>('/auth/profile', data);
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
