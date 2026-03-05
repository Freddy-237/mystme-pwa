export type Sender = 'self' | 'peer';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file' | 'audio' | string;
}

// API shape returned by backend for messages
export interface ApiMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deleted?: boolean;
  media_url?: string;
  media_type?: 'image' | 'video' | 'file' | 'audio' | string;
}

/** Parsed from the shared URL */
export interface InvitePayload {
  inviteCode: string;
  /** Display name of the person who shared the link (optional query param) */
  senderName?: string;
}
