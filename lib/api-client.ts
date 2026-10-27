import { ApiResponse, AuthResponse, LoginUrlResponse, UserDto } from './types/auth';
import { ChatMessageDto, ConversationDetailDto, ConversationDto } from './types/chat';

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
    credentials: 'include', // Crucial for HttpOnly cookies (refresh_token)
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
  // 1. Get GitHub OAuth Login URL
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

export const chatApi = {
  // 1. List user's conversations
  listConversations: async (accessToken: string): Promise<ApiResponse<ConversationDto[]>> => {
    return fetchClient<ConversationDto[]>('/api/v1/chat/conversations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  // 2. Create new conversation thread
  createConversation: async (accessToken: string, title?: string): Promise<ApiResponse<ConversationDto>> => {
    return fetchClient<ConversationDto>('/api/v1/chat/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ title }),
    });
  },

  // 3. Get conversation with full message history
  getConversation: async (accessToken: string, id: string): Promise<ApiResponse<ConversationDetailDto>> => {
    return fetchClient<ConversationDetailDto>(`/api/v1/chat/conversations/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  // 4. Delete conversation
  deleteConversation: async (accessToken: string, id: string): Promise<ApiResponse<null>> => {
    return fetchClient<null>(`/api/v1/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  // 5. Send message synchronously
  sendMessageSync: async (accessToken: string, conversationId: string, content: string): Promise<ApiResponse<ChatMessageDto>> => {
    return fetchClient<ChatMessageDto>(`/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content }),
    });
  },

  // 6. Real-time token streaming via SSE ReadableStream
  streamMessage: async (
    accessToken: string,
    conversationId: string,
    content: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/chat/conversations/${conversationId}/stream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content }),
      credentials: 'include',
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to stream response (HTTP ${response.status})`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // In Spring WebMVC SSE, chunks can be "data: <content>\n\n" or raw text chunks
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const dataToken = line.slice(5);
          onChunk(dataToken);
        } else if (line.trim().length > 0 && !line.startsWith('event:') && !line.startsWith('id:')) {
          onChunk(line);
        }
      }
    }
  },
};
