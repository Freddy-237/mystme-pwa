import { io, Socket } from 'socket.io-client';
import { API_BASE, getAuthToken } from './http';
import { ApiMessage } from '../types';

type MessageCb = (msg: ApiMessage) => void;

export class PwaSocket {
  private socket: Socket | null = null;
  private joinedRooms = new Set<string>();

  connect() {
    if (this.socket?.connected) return;
    const token = getAuthToken();
    this.socket = io(API_BASE, {
      transports: ['websocket'],
      withCredentials: true,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });

    // Re-join rooms after reconnect
    this.socket.on('connect', () => {
      for (const roomId of this.joinedRooms) {
        this.socket?.emit('join_conversation', roomId);
      }
    });
  }

  disconnect() {
    this.joinedRooms.clear();
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string) {
    this.joinedRooms.add(conversationId);
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.joinedRooms.delete(conversationId);
    this.socket?.emit('leave_conversation', conversationId);
  }

  onNewMessage(cb: MessageCb): () => void {
    const handler = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      cb(data as ApiMessage);
    };

    this.socket?.on('new_message', handler);
    return () => this.socket?.off('new_message', handler);
  }
}

export const pwaSocket = new PwaSocket();
