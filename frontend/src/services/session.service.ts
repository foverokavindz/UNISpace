import api from './api';
import type { ApiResponse, Session, SessionDetail, CreateSessionRequest } from '../types';

// Call GET /api/sessions — list upcoming / active sessions
export const getSessions = async (): Promise<ApiResponse<Session[]>> => {
  const response = await api.get<ApiResponse<Session[]>>('/sessions');
  return response.data;
};

// Call GET /api/sessions/:id — single session with participants
export const getSession = async (id: number): Promise<ApiResponse<SessionDetail>> => {
  const response = await api.get<ApiResponse<SessionDetail>>(`/sessions/${id}`);
  return response.data;
};

// Call POST /api/sessions — create a session
export const createSession = async (
  data: CreateSessionRequest
): Promise<ApiResponse<{ id: number; jitsi_room_name: string }>> => {
  const response = await api.post<ApiResponse<{ id: number; jitsi_room_name: string }>>('/sessions', data);
  return response.data;
};

// Call POST /api/sessions/:id/join — join a session
export const joinSession = async (id: number): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(`/sessions/${id}/join`, {});
  return response.data;
};

// Call DELETE /api/sessions/:id — host cancels their session
export const deleteSession = async (id: number): Promise<ApiResponse> => {
  const response = await api.delete<ApiResponse>(`/sessions/${id}`);
  return response.data;
};
