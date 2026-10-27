import { ApiResponse, AuthResponse, LoginUrlResponse, UserDto } from './types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: string;

  constructor(message: string, statusCode: number, errorCode?: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HttpOnly cookies (refresh_token, oauth2_auth_state)
  };

  try {
    const response = await fetch(url, config);
    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(
        result.message || 'Request failed',
        result.statusCode || response.status,
        result.error?.code,
        result.error?.details
      );
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network connection failure',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const authApi = {
  // 1. Get GitHub OAuth Login URL (Sets oauth2_auth_state HttpOnly cookie)
  getLoginUrl: async (): Promise<ApiResponse<LoginUrlResponse>> => {
    return fetchClient<LoginUrlResponse>('/api/v1/auth/login-url', {
      method: 'GET',
    });
  },

  // 2. Exchange OAuth code & state for tokens
  githubCallback: async (code: string, state: string): Promise<ApiResponse<AuthResponse>> => {
    return fetchClient<AuthResponse>('/api/v1/auth/github/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  },

  // 3. Refresh Access Token using HttpOnly refresh_token cookie
  refreshToken: async (): Promise<ApiResponse<AuthResponse>> => {
    return fetchClient<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
    });
  },

  // 4. Logout and clear HttpOnly cookie
  logout: async (): Promise<ApiResponse<null>> => {
    return fetchClient<null>('/api/v1/auth/logout', {
      method: 'POST',
    });
  },

  // 5. Fetch current user profile with Bearer Access Token
  getMe: async (accessToken: string): Promise<ApiResponse<UserDto>> => {
    return fetchClient<UserDto>('/api/v1/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  // 6. Role-based Authorization Check (Admin only)
  adminCheck: async (accessToken: string): Promise<ApiResponse<string>> => {
    return fetchClient<string>('/api/v1/auth/admin-check', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};
