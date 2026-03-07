import { useEffect, useMemo, useState } from 'react';
import { parseInvite } from './services/inviteParser';
import { useIdentity } from './services/useIdentity';
import { conversationApi } from './services/conversation';
import { useChat } from './hooks/useChat';
import { getStoreLink, formatCountdown } from './services/helpers';
import InviteLanding from './components/InviteLanding';
import NoInvite from './components/NoInvite';
import Header from './components/Header';
import MessageList from './components/MessageList';
import UpsellBanner from './components/UpsellBanner';
import ChatFooter from './components/ChatFooter';

type Screen = 'loading' | 'no-invite' | 'landing' | 'chat';

function App() {
  const invite = useMemo(() => parseInvite(), []);
  const identity = useIdentity();

  const [screen, setScreen] = useState<Screen>('loading');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [landingInput, setLandingInput] = useState('');
  const [firstSendSuccess, setFirstSendSuccess] = useState(false);
  const [softCtaDismissed, setSoftCtaDismissed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const chat = useChat({
    conversationId,
    selfId: identity.user?.id ?? null,
    active: screen === 'chat',
  });

  // -- Live countdown tick (every 30s) --
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Decide initial screen when identity is ready
  useEffect(() => {
    if (identity.loading) return;
    if (!invite) { setScreen('no-invite'); return; }
    if (identity.error) { setScreen('loading'); return; }
    setScreen('landing');
  }, [identity.loading, identity.error, invite]);

  // -- derived values --
  const remainingMs = expiresAt ? expiresAt - now : null;
  const expired = remainingMs !== null ? remainingMs <= 0 : false;
  const countdownLabel = remainingMs !== null ? formatCountdown(remainingMs) : '';
  const softCtaVisible = !expired && !chat.hardLimitReached && !softCtaDismissed && (chat.selfMessageCount >= 3 || chat.hasPeerReply);
  const storeLink = getStoreLink();
  const appDeepLink = conversationId
    ? `mystme://chat/${conversationId}?source=pwa&pseudo=${encodeURIComponent(identity.user?.pseudo ?? 'Ghost_92')}&target=${encodeURIComponent(invite?.senderName ?? 'mystme')}`
    : 'mystme://home';

  // -- handlers --

  const handleSendFirstMessage = async () => {
    if (!invite || !identity.user) return;
    const firstMessage = landingInput.trim();
    if (!firstMessage) return;
    try {
      chat.setChatError(null);
      chat.setChatLoading(true);
      const conv = await conversationApi.start(invite.inviteCode);
      setConversationId(conv.id);
      setExpiresAt(new Date(conv.started_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      await conversationApi.sendMessage(conv.id, firstMessage);
      await chat.loadMessages(conv.id);
      setLandingInput('');
      setFirstSendSuccess(true);
      setTimeout(() => { setScreen('chat'); setFirstSendSuccess(false); }, 1200);
    } catch (err) {
      chat.setChatError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      chat.setChatLoading(false);
    }
  };

  // --- Loading / bootstrap ---
  if (identity.loading || (screen === 'loading' && !identity.error)) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f3ff', color: '#7c1d92' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  // --- No invite ---
  if (screen === 'no-invite' || !invite) {
    return <div className="app"><NoInvite /></div>;
  }

  // --- Error ---
  if (identity.error) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f3ff', color: '#ef4444', textAlign: 'center', padding: '2rem' }}>
        <div>
          <p>Erreur de connexion</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{identity.error}</p>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: '0.75rem', border: 'none', borderRadius: '999px', padding: '0.6rem 1rem', background: '#7c1d92', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  // --- Landing ---
  if (screen === 'landing') {
    return (
      <div className="app">
        <InviteLanding
          senderName={invite.senderName}
          anonymousPseudo={identity.user?.pseudo}
          anonymousAvatarUrl={identity.user?.avatar_url}
          value={landingInput}
          onChange={setLandingInput}
          onSend={handleSendFirstMessage}
          sent={firstSendSuccess}
          loading={chat.chatLoading}
          error={chat.chatError}
        />
      </div>
    );
  }

  // --- Chat screen (7-day window) ---
  return (
    <div className="app">
      <Header name={invite.senderName ?? 'Anonyme'} countdownLabel={countdownLabel} />

      <div className="anon-banner">
        <div className="anon-banner-title">Tu es anonyme dans cette conversation</div>
        <div className="anon-banner-subtitle-row">
          <div className="anon-mini-avatar" aria-hidden>
            {identity.user?.avatar_url ? (
              <img src={identity.user.avatar_url} alt="" className="anon-mini-avatar-image" />
            ) : (
              <svg
                className="anon-mini-avatar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            )}
          </div>
          <div className="anon-banner-subtitle">Pseudo : {identity.user?.pseudo ?? 'Ghost'}</div>
        </div>
      </div>

      <div className="chat-body">
        {expiresAt && !expired && (
          <div style={{ fontSize: '0.8rem', opacity: 0.7, padding: '0.5rem 1rem' }}>
            Chat actif encore {formatCountdown(remainingMs!)}
          </div>
        )}
        {chat.chatError && (
          <div style={{ color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>{chat.chatError}</div>
        )}
        <MessageList messages={chat.messages} loading={chat.chatLoading} selfId={identity.user?.id ?? ''} />
      </div>

      <UpsellBanner visible={softCtaVisible} deepLink={appDeepLink} installLink={storeLink} onDismiss={() => setSoftCtaDismissed(true)} />

      <ChatFooter
        expired={expired}
        hardLimitReached={chat.hardLimitReached}
        storeLink={storeLink}
        appDeepLink={appDeepLink}
        input={chat.input}
        onInputChange={chat.setInput}
        onSend={chat.handleSend}
        onRetryUpload={chat.handleRetryUpload}
        canRetryUpload={chat.pendingUpload !== null}
        uploadProgress={chat.uploadProgress}
        uploadLabel={chat.uploadLabel}
        uploading={chat.isUploadingMedia}
      />
    </div>
  );
}

export default App;