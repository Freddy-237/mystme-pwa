import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import type { ResolveLinkDto } from './services/conversation';

const mockedParseInvite = vi.fn();
const mockedUseIdentity = vi.fn();
const mockedUseChat = vi.fn();
const mockedResolveInvite = vi.fn<(inviteCode: string) => Promise<ResolveLinkDto>>();
const mockedSendMessage = vi.fn<
  (
    conversationId: string,
    content: string,
    replyToMessageId?: string,
  ) => Promise<unknown>
>();
const mockedGetStoreLink = vi.fn(() => 'https://store.example/app');
const mockedFormatCountdown = vi.fn(() => '2j 4h');

vi.mock('./services/inviteParser', () => ({
  parseInvite: () => mockedParseInvite(),
}));

vi.mock('./services/useIdentity', () => ({
  useIdentity: () => mockedUseIdentity(),
}));

vi.mock('./hooks/useChat', () => ({
  useChat: (options: unknown) => mockedUseChat(options),
}));

const mockedFindByInvite = vi.fn<(inviteCode: string) => Promise<ResolveLinkDto>>(
  () => Promise.reject(new Error('404')),
);

vi.mock('./services/conversation', () => ({
  conversationApi: {
    findByInvite: (inviteCode: string) => mockedFindByInvite(inviteCode),
    resolveInvite: (inviteCode: string) => mockedResolveInvite(inviteCode),
    sendMessage: (
      conversationId: string,
      content: string,
      replyToMessageId?: string,
    ) => mockedSendMessage(conversationId, content, replyToMessageId),
  },
}));

vi.mock('./services/helpers', () => ({
  getStoreLink: () => mockedGetStoreLink(),
  formatCountdown: () => mockedFormatCountdown(),
  getTransferDeepLink: (code?: string | null) =>
    (code ? `mystme://transfer?code=${code}` : 'mystme://home'),
  copyTransferCode: vi.fn(async () => true),
}));

const mockedUseTransferCode = vi.fn((_enabled: boolean) => ({ code: 'ABCD-2345', error: false, refresh: vi.fn() }));
vi.mock('./hooks/useTransferCode', () => ({
  useTransferCode: (enabled: boolean) => mockedUseTransferCode(enabled),
}));

function createChatState(overrides: Record<string, unknown> = {}) {
  return {
    messages: [],
    replyTo: null,
    clearReplyTo: vi.fn(),
    setReplyTo: vi.fn(),
    chatLoading: false,
    setChatLoading: vi.fn(),
    chatError: null,
    setChatError: vi.fn(),
    input: '',
    setInput: vi.fn(),
    isRecordingAudio: false,
    isUploadingMedia: false,
    uploadProgress: null,
    uploadLabel: null,
    pendingUpload: null,
    mediaInputRef: { current: null },
    handleSend: vi.fn(),
    handleOpenMediaPicker: vi.fn(),
    handleMediaSelected: vi.fn(),
    handleAudioClick: vi.fn(),
    handleRetryUpload: vi.fn(),
    loadMessages: vi.fn(),
    reset: vi.fn(),
    mapApiMessage: vi.fn(),
    normalizeMessages: vi.fn(),
    selfMessageCount: 0,
    hasPeerReply: false,
    hardLimitReached: false,
    applyServerRule: vi.fn(() => false),
    webLocked: false,
    ...overrides,
  };
}

type MockedChatState = ReturnType<typeof createChatState>;

function createIdentityState(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'user-1',
      pseudo: 'GhostNova',
      avatar_url: 'https://cdn.example/avatar.png',
      origin: 'web',
      web_expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      web_locked: false,
    },
    token: 'token-1',
    loading: false,
    error: null,
    ready: true,
    signOut: vi.fn(),
    transferred: false,
    continueOnWeb: vi.fn(),
    ...overrides,
  };
}

function createResolvedContext(
  overrides: Partial<ResolveLinkDto> = {},
): ResolveLinkDto {
  return {
    conversationId: 'conv-1',
    ownerId: 'owner-1',
    targetPseudo: 'Mika',
    anonymousPseudo: 'GhostNova',
    conversation: {
      id: 'conv-1',
      link_id: 'link-1',
      owner_id: 'owner-1',
      anonymous_id: 'user-1',
      status: 'active',
      started_at: '2026-04-11T10:00:00.000Z',
      blocked_at: null,
      created_at: '2026-04-11T10:00:00.000Z',
      owner_pseudo: 'Mika',
      anonymous_pseudo: 'GhostNova',
    },
    ...overrides,
  };
}

describe('App UI states', () => {
  let chatState: MockedChatState;

  beforeEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, '', '/');
    mockedParseInvite.mockReset();
    mockedUseIdentity.mockReset();
    mockedUseChat.mockReset();
    mockedResolveInvite.mockReset();
    mockedSendMessage.mockReset();
    mockedFormatCountdown.mockClear();
    chatState = createChatState();
    mockedUseChat.mockImplementation(() => chatState);
    mockedUseIdentity.mockReturnValue(createIdentityState());
  });

  it('renders the no-invite screen when no invite is available', async () => {
    mockedParseInvite.mockReturnValue(null);

    render(<App />);

    expect(await screen.findByText('Envoie et reçois des messages anonymes.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Télécharger l'app" })).toHaveAttribute('href', 'https://store.example/app');
  });

  it('takes a returning visitor straight back to their conversation', async () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    mockedFindByInvite.mockResolvedValueOnce(createResolvedContext());

    render(<App />);

    expect(await screen.findByText('Tu es anonyme dans cette conversation')).toBeInTheDocument();
    expect(mockedFindByInvite).toHaveBeenCalledWith('ABC123');
    expect(chatState.loadMessages).toHaveBeenCalledWith('conv-1');
    expect(screen.queryByRole('button', { name: 'Envoyer anonymement' })).not.toBeInTheDocument();
    expect(mockedResolveInvite).not.toHaveBeenCalled();
  });

  it('renders a friendly identity error state', () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    mockedUseIdentity.mockReturnValue(
      createIdentityState({
        user: null,
        token: null,
        ready: false,
        error: 'Connexion impossible. Verifie ton reseau puis reessaie.',
      }),
    );

    render(<App />);

    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
    expect(screen.getByText('La session n a pas pu etre preparee correctement.')).toBeInTheDocument();
    expect(screen.getByText('Connexion impossible. Verifie ton reseau puis reessaie.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reessayer' })).toBeInTheDocument();
  });

  it('renders the invite landing screen with current anonymous identity', async () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    chatState = createChatState({ chatError: 'Connexion impossible. Verifie ton reseau puis reessaie.' });
    mockedUseChat.mockImplementation(() => chatState);

    render(<App />);

    expect(await screen.findByText('Envoie un message anonyme à @Mika')).toBeInTheDocument();
    expect(screen.getByText('GhostNova')).toBeInTheDocument();
    expect(screen.getByText('Connexion impossible. Verifie ton reseau puis reessaie.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer anonymement' })).toBeDisabled();
  });

  it('resolves the invite and transitions to the chat screen after first send', async () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    const resolved = createResolvedContext();
    mockedResolveInvite.mockResolvedValue(resolved);
    mockedSendMessage.mockResolvedValue({ id: 'msg-1' });
    chatState = createChatState();
    mockedUseChat.mockImplementation(() => chatState);

    render(<App />);

    const textarea = await screen.findByPlaceholderText('Écris ton message ici…');
    fireEvent.change(textarea, { target: { value: 'Bonjour depuis le web' } });

    const sendButton = screen.getByRole('button', { name: 'Envoyer anonymement' });
    expect(sendButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(sendButton);
      await Promise.resolve();
    });

    expect(mockedResolveInvite).toHaveBeenCalledWith('ABC123');
    expect(mockedSendMessage).toHaveBeenCalledWith(
      'conv-1',
      'Bonjour depuis le web',
      undefined,
    );
    expect(chatState.loadMessages).toHaveBeenCalledWith('conv-1');
    expect(chatState.setChatLoading).toHaveBeenCalledWith(true);
    expect(chatState.setChatLoading).toHaveBeenLastCalledWith(false);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 1300));
    });

    expect(screen.getByText('Tu es anonyme dans cette conversation')).toBeInTheDocument();
    expect(screen.getByText('Mika')).toBeInTheDocument();
    expect(screen.getByText('Pseudo : GhostNova')).toBeInTheDocument();
    expect(screen.getByText('2j 4h')).toBeInTheDocument();
  });

  it('shows the locked landing (no input) once the web window is over', async () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    mockedUseIdentity.mockReturnValue(
      createIdentityState({
        user: {
          id: 'user-1',
          pseudo: 'GhostNova',
          origin: 'web',
          web_expires_at: new Date(Date.now() - 60_000).toISOString(),
          web_locked: true,
        },
      }),
    );

    render(<App />);

    expect(await screen.findByText('Ta période de chat web (7 jours) est terminée.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Écris ton message ici…')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Télécharger l'app MystMe" })).toHaveAttribute('href', 'https://store.example/app');
  });

  it('routes server web-rule errors to the dedicated UI instead of a raw error', async () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    mockedResolveInvite.mockResolvedValue(createResolvedContext());
    const serverError = Object.assign(new Error('locked'), { code: 'WEB_TRIAL_EXPIRED', statusCode: 403 });
    mockedSendMessage.mockRejectedValue(serverError);
    chatState = createChatState({ applyServerRule: vi.fn(() => true) });
    mockedUseChat.mockImplementation(() => chatState);

    render(<App />);
    fireEvent.change(await screen.findByPlaceholderText('Écris ton message ici…'), {
      target: { value: 'Coucou' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Envoyer anonymement' }));
      await Promise.resolve();
    });

    expect(chatState.applyServerRule).toHaveBeenCalledWith(serverError);
    expect(chatState.setChatError).not.toHaveBeenCalledWith(expect.stringMatching(/.+/));
  });

  it('shows the transferred screen instead of creating a new web identity', () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    const continueOnWeb = vi.fn();
    mockedUseIdentity.mockReturnValue(createIdentityState({ user: null, transferred: true, continueOnWeb }));

    render(<App />);

    expect(screen.getByText("Ta conversation est maintenant dans l'app")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Écris ton message ici…')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Écrire avec une nouvelle identité web' }));
    expect(continueOnWeb).toHaveBeenCalled();
  });

  it('locked landing shows the transfer code and asks for it', async () => {
    mockedParseInvite.mockReturnValue({ inviteCode: 'ABC123', senderName: 'Mika' });
    mockedUseIdentity.mockReturnValue(
      createIdentityState({
        user: { id: 'user-1', pseudo: 'GhostNova', origin: 'web', web_locked: true,
          web_expires_at: new Date(Date.now() - 1000).toISOString() },
      }),
    );

    render(<App />);

    expect(await screen.findByText('ABCD-2345')).toBeInTheDocument();
    expect(mockedUseTransferCode).toHaveBeenLastCalledWith(true);
  });
});