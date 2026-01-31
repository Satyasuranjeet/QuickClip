import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Unable to connect to server'));
    } else {
      return Promise.reject(error);
    }
  }
);

export interface ClipCreateRequest {
  text: string;
  timer: number;
}

export interface ClipCreateResponse {
  code: string;
  expires_at: string;
  timer: number;
  message: string;
}

export interface ClipData {
  code: string;
  text: string;
  expires_at: string;
  remaining_seconds: number;
}

// Create a new clip
export const createClip = async (data: ClipCreateRequest): Promise<ClipCreateResponse> => {
  const response = await api.post<ClipCreateResponse>('/api/clips/', data);
  return response.data;
};

// Get a clip by code
export const getClip = async (code: string): Promise<ClipData> => {
  const response = await api.get<ClipData>(`/api/clips/${code.toUpperCase()}`);
  return response.data;
};

// Delete a clip
export const deleteClip = async (code: string): Promise<void> => {
  await api.delete(`/api/clips/${code.toUpperCase()}`);
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

export default api;
