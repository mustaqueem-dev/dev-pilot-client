export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export interface UserDto {
  id: string;
  githubId: number;
  githubUsername: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface LoginUrlResponse {
  loginUrl: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  code: string;
  details?: string;
  validationErrors?: ValidationError[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error?: ApiErrorResponse | null;
  timestamp: string;
}
