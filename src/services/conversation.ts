import { ApiMessage } from '../types';
import { request } from './http';

// Conversation representation from backend
export interface ConversationDto {
  id: string;
  link_id: string;
  owner_id: string;
  anonymous_id: string;
  status: 'active' | 'blocked' | 'archived';
  started_at: string;
  blocked_at: string | null;
  created_at: string;
}

export const conversationApi = {
  start: (inviteCode: string) =>
    request<ConversationDto>('/conversation/start', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  getMessages: (conversationId: string) =>
    request<ApiMessage[]>(`/message/${conversationId}`),

  sendMessage: (conversationId: string, content: string) =>
    request<ApiMessage>('/message', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content }),
    }),
};
