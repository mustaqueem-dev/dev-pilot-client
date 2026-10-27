export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatMessageDto {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ConversationDetailDto {
  id: string;
  title: string;
  messages: ChatMessageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  title?: string;
}

export interface SendMessageRequest {
  content: string;
}
