import { useEffect, useMemo, useState } from 'react';
import { parseInvite } from './services/inviteParser';
import { useIdentity } from './services/useIdentity';
import { conversationApi } from './services/conversation';
import { toFriendlyErrorMessage } from './services/errors';
import { useChat } from './hooks/useChat';
import { getStoreLink, getTransferDeepLink, formatCountdown } from './services/helpers';
import { useTransferCode } from './hooks/useTransferCode';
import InviteLanding from './components/InviteLanding';
import NoInvite from './components/NoInvite';
import Header from './components/Header';
import MessageList from './components/MessageList';
import UpsellBanner from './components/UpsellBanner';
import ChatFooter from './components/ChatFooter';
import ModerationConsole from './components/ModerationConsole';
import PrivacyPolicy from './components/PrivacyPolicy';
import type { ResolveLinkDto } from './services/conversation';

type Screen = 'loading' | 'no-invite' | 'landing' | 'chat';

function App() {
  if (window.location.pathname.startsWith('/privacy')) {
    return <PrivacyPolicy />;
  }
  if (window.location.pathname.startsWith('/moderation')) {
    return <ModerationConsole />;
  }

  return <InviteApp />;
}

function InviteApp() {
  const invite = useMemo(() => parseInvite(), []);
  const identity = useIdentity();

  const [screen, setScreen] = useState<Screen>('loading');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [landingInput, setLandingInput] = useState('');
  const [firstSendSuccess, setFirstSendSuccess] = useState(false);
  const [softCtaDismissed, setSoftCtaDismissed] = useState(false);
  const [resolvedContext, setResolvedContext] = useState<ResolveLinkDto | null>(null);
  const [now, setNow] = useState(Date.now());

  const chat = useChat({
    conversationId,
    selfId: identity.user?.id ?? null,
    active: screen === 'chat',
  });

  // The 7-day window belongs to the web IDENTITY, not to a conversation.
  const webExpiresAtIso = identity.user?.web_expires_at ?? null;
  const expiresAt = webExpiresAtIso ? new Date(webExpiresAtIso).getTime() : null;

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
  // Server state wins: web_locked from /identity/me or a WEB_TRIAL_EXPIRED answer.
  const expired = Boolean(identity.user?.web_locked)
    || chat.webLocked
    || (remainingMs !== null && remainingMs <= 0);
  const countdownLabel = remainingMs !== null ? formatCountdown(remainingMs) : '';
  const softCtaVisible = !expired && !chat.hardLimitReached && !softCtaDismissed && (chat.selfMessageCount >= 3 || chat.hasPeerReply);
  // Transfer code: needed as soon as the user is in a conversation or locked,
  // so every "install / open the app" action carries it.
  const transfer = useTransferCode(Boolean(identity.user) && (screen === 'chat' || expired));
  const storeLink = getStoreLink(transfer.code);
  const targetDisplayName = resolvedContext?.targetPseudo ?? invite?.senderName ?? 'mystme';
  const anonymousDisplayName = resolvedContext?.anonymousPseudo ?? identity.user?.pseudo ?? 'Ghost_92';
  // The app user is a different identity: opening mystme://chat/<id> would be
  // refused. The transfer link makes the app absorb this web identity first.
  const appDeepLink = getTransferDeepLink(transfer.code);

  // -- handlers --

  const handleSendFirstMessage = async () => {
    if (!invite || !identity.user) return;
    const firstMessage = landingInput.trim();
    if (!firstMessage) return;
    try {
      chat.setChatError(null);
      chat.setChatLoading(true);
      const resolved = await conversationApi.resolveInvite(invite.inviteCode);
      setResolvedContext(resolved);
      setConversationId(resolved.conversationId);
      await conversationApi.sendMessage(resolved.conversationId, firstMessage);
      await chat.loadMessages(resolved.conversationId);
      setLandingInput('');
      setFirstSendSuccess(true);
      setTimeout(() => { setScreen('chat'); setFirstSendSuccess(false); }, 1200);
    } catch (err) {
      if (chat.applyServerRule(err)) return; // locked / limit → dedicated UI
      chat.setChatError(toFriendlyErrorMessage(err, 'Impossible de demarrer la conversation.'));
    } finally {
      chat.setChatLoading(false);
    }
  };

  // --- Web identity already moved into the app ---
  if (identity.transferred) {
    return (
      <div className="app">
        <div className="transferred-screen">
          <h1 className="transferred-title">Ta conversation est maintenant dans l&apos;app</h1>
          <p className="transferred-sub">
            Tu l&apos;as transférée vers MystMe. Ouvre l&apos;app pour continuer à discuter.
          </p>
          <a className="transferred-cta" href="mystme://home">Ouvrir l&apos;app MystMe</a>
          <a className="transferred-link" href={storeLink} target="_blank" rel="noopener noreferrer">
            Installer l&apos;app
          </a>
          <button type="button" className="transferred-ghost" onClick={identity.continueOnWeb}>
            Écrire avec une nouvelle identité web
          </button>
        </div>
      </div>
    );
  }

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
          <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>La session n a pas pu etre preparee correctement.</p>
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
          senderName={targetDisplayName}
          anonymousPseudo={anonymousDisplayName}
          anonymousAvatarUrl={identity.user?.avatar_url}
          value={landingInput}
          onChange={setLandingInput}
          onSend={handleSendFirstMessage}
          sent={firstSendSuccess}
          loading={chat.chatLoading}
          error={chat.chatError}
          locked={expired}
          storeLink={storeLink}
          transferCode={transfer.code}
        />
      </div>
    );
  }

  // --- Chat screen (7-day window) ---
  return (
    <div className="app">
      <Header name={targetDisplayName} countdownLabel={countdownLabel} />

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
          <div className="anon-banner-subtitle">Pseudo : {anonymousDisplayName}</div>
        </div>
      </div>

      <div className="chat-body">
        {expiresAt && !expired && remainingMs !== null && (
          <div style={{ fontSize: '0.8rem', opacity: 0.7, padding: '0.5rem 1rem' }}>
            Chat web actif encore {formatCountdown(remainingMs)}
          </div>
        )}
        {chat.chatError && (
          <div style={{ color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>{chat.chatError}</div>
        )}
        <MessageList
          messages={chat.messages}
          loading={chat.chatLoading}
          selfId={identity.user?.id ?? ''}
          activeReplyId={chat.replyTo?.id ?? null}
          onReplySelect={chat.setReplyTo}
        />
      </div>

      <UpsellBanner
        visible={softCtaVisible}
        deepLink={appDeepLink}
        installLink={storeLink}
        transferCode={transfer.code}
        onDismiss={() => setSoftCtaDismissed(true)}
      />

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
        replyTo={chat.replyTo}
        onClearReply={chat.clearReplyTo}
        transferCode={transfer.code}
      />
    </div>
  );
}

export default App;