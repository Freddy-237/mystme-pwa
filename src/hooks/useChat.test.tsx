import { act, renderHook, waitFor } from '@testing-library/react';
import { selectAudioMimeType, useChat } from './useChat';
import { conversationApi } from '../services/conversation';
import { pwaSocket } from '../services/socket';
import type { ApiMessage } from '../types';

vi.mock('../services/conversation', () => ({
  conversationApi: {
    sendMessage: vi.fn(),
    getMessages: vi.fn(),
    sendImage: vi.fn(),
    sendVideo: vi.fn(),
    sendFile: vi.fn(),
    sendAudio: vi.fn(),
  },
}));

vi.mock('../services/socket', () => ({
  pwaSocket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    onNewMessage: vi.fn(() => vi.fn()),
  },
}));

const mockedConversationApi = vi.mocked(conversationApi);
const mockedSocket = vi.mocked(pwaSocket);

function makeApiMessage(overrides: Partial<ApiMessage> = {}): ApiMessage {
  return {
    id: 'msg-1',
    sender_id: 'self-1',
    content: 'Bonjour',
    created_at: '2026-04-11T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  mockedConversationApi.sendMessage.mockReset();
  mockedConversationApi.getMessages.mockReset();
  mockedConversationApi.sendImage.mockReset();
  mockedConversationApi.sendVideo.mockReset();
  mockedConversationApi.sendFile.mockReset();
  mockedConversationApi.sendAudio.mockReset();
  mockedSocket.connect.mockReset();
  mockedSocket.disconnect.mockReset();
  mockedSocket.joinConversation.mockReset();
  mockedSocket.leaveConversation.mockReset();
  mockedSocket.onNewMessage.mockReset();
  mockedSocket.onNewMessage.mockReturnValue(vi.fn());
});

describe('useChat', () => {
  it('prefers a supported recording format and falls back to browser defaults', () => {
    expect(
      selectAudioMimeType((mimeType) => mimeType === 'audio/mp4'),
    ).toBe('audio/mp4');
    expect(selectAudioMimeType(() => false)).toBeUndefined();
  });

  it('connects and joins the conversation when chat becomes active', () => {
    renderHook(() => useChat({ conversationId: 'conv-1', selfId: 'self-1', active: true }));

    expect(mockedSocket.connect).toHaveBeenCalledTimes(1);
    expect(mockedSocket.joinConversation).toHaveBeenCalledWith('conv-1');
    expect(mockedSocket.onNewMessage).toHaveBeenCalledTimes(1);
  });

  it('sends a text message and appends it as a self message', async () => {
    mockedConversationApi.sendMessage.mockResolvedValue(makeApiMessage());

    const { result } = renderHook(() => useChat({ conversationId: 'conv-1', selfId: 'self-1', active: true }));

    act(() => {
      result.current.setInput('Bonjour');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(mockedConversationApi.sendMessage).toHaveBeenCalledWith('conv-1', 'Bonjour', undefined);
    expect(result.current.input).toBe('');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      id: 'msg-1',
      text: 'Bonjour',
      sender: 'self',
    });
  });

  it('restores input and shows a friendly error when send fails', async () => {
    mockedConversationApi.sendMessage.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useChat({ conversationId: 'conv-1', selfId: 'self-1', active: true }));

    act(() => {
      result.current.setInput('Message perdu');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.input).toBe('Message perdu');
    expect(result.current.chatError).toBe('Connexion impossible. Verifie ton reseau puis reessaie.');
  });

  it('loads messages sorted and deduplicated', async () => {
    mockedConversationApi.getMessages.mockResolvedValue([
      makeApiMessage({ id: 'msg-2', content: 'Deux', created_at: '2026-04-11T10:02:00.000Z' }),
      makeApiMessage({ id: 'msg-1', content: 'Un', created_at: '2026-04-11T10:01:00.000Z' }),
      makeApiMessage({ id: 'msg-1', content: 'Un', created_at: '2026-04-11T10:01:00.000Z' }),
    ]);

    const { result } = renderHook(() => useChat({ conversationId: 'conv-1', selfId: 'self-1', active: true }));

    await act(async () => {
      await result.current.loadMessages('conv-1');
    });

    await waitFor(() => expect(result.current.chatLoading).toBe(false));

    expect(result.current.messages.map((message) => message.id)).toEqual(['msg-1', 'msg-2']);
    expect(result.current.messages.map((message) => message.text)).toEqual(['Un', 'Deux']);
  });

  it('server WEB_MESSAGE_LIMIT switches to the hard-limit state', async () => {
    mockedConversationApi.sendMessage.mockRejectedValue(
      Object.assign(new Error('limit'), { code: 'WEB_MESSAGE_LIMIT', statusCode: 403 }),
    );
    const { result } = renderHook(() =>
      useChat({ conversationId: 'conv-1', selfId: 'self-1', active: true }),
    );

    act(() => result.current.setInput('encore un'));
    await act(async () => { await result.current.handleSend(); });

    expect(result.current.hardLimitReached).toBe(true);
    expect(result.current.chatError).toBeNull();
    expect(result.current.input).toBe('encore un');
  });

  it('server WEB_TRIAL_EXPIRED locks the web chat', async () => {
    mockedConversationApi.sendMessage.mockRejectedValue(
      Object.assign(new Error('expired'), { code: 'WEB_TRIAL_EXPIRED', statusCode: 403 }),
    );
    const { result } = renderHook(() =>
      useChat({ conversationId: 'conv-1', selfId: 'self-1', active: true }),
    );

    act(() => result.current.setInput('salut'));
    await act(async () => { await result.current.handleSend(); });

    expect(result.current.webLocked).toBe(true);
    expect(result.current.chatError).toBeNull();
  });
});