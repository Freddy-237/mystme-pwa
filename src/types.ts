export type Sender = 'self' | 'peer';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
}

// API shape returned by backend for messages
export interface ApiMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deleted?: boolean;
}

/** Parsed from the shared URL */
export interface InvitePayload {
  inviteCode: string;
  /** Display name of the person who shared the link (optional query param) */
  senderName?: string;
}
