import { ApiMessage } from '../types';
import { request, requestFormData } from './http';

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

  sendImage: (
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ) => {
    const data = new FormData();
    data.append('conversationId', conversationId);
    data.append('image', file);
    return requestFormData<ApiMessage>('/message/image', data, 'POST', onProgress);
  },

  sendVideo: (
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ) => {
    const data = new FormData();
    data.append('conversationId', conversationId);
    data.append('video', file);
    return requestFormData<ApiMessage>('/message/video', data, 'POST', onProgress);
  },

  sendFile: (
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ) => {
    const data = new FormData();
    data.append('conversationId', conversationId);
    data.append('file', file);
    return requestFormData<ApiMessage>('/message/file', data, 'POST', onProgress);
  },

  sendAudio: (
    conversationId: string,
    file: Blob,
    onProgress?: (progress: number) => void,
  ) => {
    const data = new FormData();
    data.append('conversationId', conversationId);
    data.append('audio', file, `audio_${Date.now()}.webm`);
    return requestFormData<ApiMessage>('/message/audio', data, 'POST', onProgress);
  },
};
