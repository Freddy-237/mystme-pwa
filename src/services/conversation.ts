import { ApiMessage } from '../types';
import { request, requestFormData } from './http';

// Conversation representation from backend
export interface ConversationDto {
  id: string;
  link_id: string;
  owner_id: string;
  anonymous_id: string | null;
  status: 'active' | 'blocked' | 'archived';
  /** Null until the first message is sent. */
  started_at: string | null;
  blocked_at: string | null;
  created_at: string;
  owner_pseudo?: string;
  anonymous_pseudo?: string;
}

export interface ResolveLinkDto {
  conversation: ConversationDto;
  conversationId: string;
  ownerId: string;
  targetPseudo: string;
  anonymousPseudo: string;
}

export const conversationApi = {
  resolveInvite: (inviteCode: string) =>
    request<ResolveLinkDto>('/conversation/resolve-link', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  /** My existing conversation through this invite (404 if none). Never creates one. */
  findByInvite: (inviteCode: string) =>
    request<ResolveLinkDto>(`/conversation/by-invite/${encodeURIComponent(inviteCode)}`),

  start: (inviteCode: string) =>
    request<ResolveLinkDto>('/conversation/resolve-link', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }).then((res) => res.conversation),

  getMessages: (conversationId: string) =>
    request<ApiMessage[]>(`/message/${conversationId}`),

  sendMessage: (
    conversationId: string,
    content: string,
    replyToMessageId?: string,
  ) =>
    request<ApiMessage>('/message', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, replyToMessageId }),
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
    const mimeType = file.type.split(';', 1)[0].toLowerCase();
    const extension =
      mimeType === 'audio/mp4'
        ? 'm4a'
        : mimeType.startsWith('audio/')
          ? mimeType.slice('audio/'.length).replace(/^x-/, '')
          : 'audio';
    data.append('audio', file, `audio_${Date.now()}.${extension}`);
    return requestFormData<ApiMessage>('/message/audio', data, 'POST', onProgress);
  },
};
