import { Message } from '../types';

export interface ChatService {
  fetchConversation: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, text: string, senderId: string) => Promise<Message>;
  subscribe: (conversationId: string, cb: (msg: Message) => void) => () => void;
}

export class MockChatService implements ChatService {
  private store: Record<string, Message[]> = {};

  async fetchConversation(conversationId: string): Promise<Message[]> {
    if (!this.store[conversationId]) {
      this.store[conversationId] = [
        {
          id: 'm1',
          text: "Salut comment tu vas aujourd'hui?\nj'aimerais bien te rencontrer",
          sender: 'peer',
          timestamp: Date.now() - 1000 * 60 * 10,
        },
        {
          id: 'm2',
          text: "Je vais bien merci !\nje serais occuper aujourd'hui",
          sender: 'self',
          timestamp: Date.now() - 1000 * 60 * 9,
        },
      ];
    }
    return this.store[conversationId];
  }

  async sendMessage(conversationId: string, text: string, _senderId: string): Promise<Message> {
    const msg: Message = {
      id: `msg_${Date.now()}`,
      text,
      sender: 'self',
      timestamp: Date.now(),
    };
    this.store[conversationId] = [...(this.store[conversationId] ?? []), msg];
    return msg;
  }

  subscribe(conversationId: string, cb: (msg: Message) => void): () => void {
    const interval = setInterval(() => {
      const incoming: Message = {
        id: `peer_${Date.now()}`,
        text: 'Message reçu 👻',
        sender: 'peer',
        timestamp: Date.now(),
      };
      this.store[conversationId] = [...(this.store[conversationId] ?? []), incoming];
      cb(incoming);
    }, 15000);

    return () => clearInterval(interval);
  }
}
