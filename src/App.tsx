import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseInvite } from './services/inviteParser';
import { useIdentity } from './services/useIdentity';
import { conversationApi } from './services/conversation';
import { ApiMessage, Message } from './types';
import InviteLanding from './components/InviteLanding';
import NoInvite from './components/NoInvite';
import Header from './components/Header';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

type Screen = 'loading' | 'no-invite' | 'landing' | 'chat';

const POLL_INTERVAL = 4000; // 4 seconds

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0j';
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function App() {
  const invite = useMemo(() => parseInvite(), []);
  const identity = useIdentity();
  const [screen, setScreen] = useState<Screen>('loading');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mapApiMessage = useCallback(
    (msg: ApiMessage, selfId: string): Message => ({
      id: msg.id,
      text: msg.content,
      sender: msg.sender_id === selfId ? 'self' : 'peer',
      timestamp: new Date(msg.created_at).getTime(),
    }),
    [],
  );

  // ── Live countdown tick (every 30s) ──
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // ── Polling for new messages ──
  useEffect(() => {
    if (screen !== 'chat' || !conversationId || !identity.user) return;

    const selfId = identity.user.id;

    const poll = async () => {
      try {
        const msgs = await conversationApi.getMessages(conversationId);
        setMessages(msgs.map((m) => mapApiMessage(m, selfId)));
      } catch {
        // silent — don't spam errors on poll failure
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [screen, conversationId, identity.user, mapApiMessage]);

  // Decide initial screen when identity is ready
  useEffect(() => {
    if (identity.loading) return;
    if (!invite) {
      setScreen('no-invite');
      return;
    }
    if (identity.error) {
      setScreen('loading');
      return;
    }
    setScreen('landing');
  }, [identity.loading, identity.error, invite]);

  // Start conversation when user joins chat
  const handleJoin = async () => {
    if (!invite || !identity.user) return;
    try {
      setChatError(null);
      setChatLoading(true);
      const conv = await conversationApi.start(invite.inviteCode);
      setConversationId(conv.id);
      const endTs = new Date(conv.started_at).getTime() + 7 * 24 * 60 * 60 * 1000;
      setExpiresAt(endTs);
      const msgs = await conversationApi.getMessages(conv.id);
      setMessages(msgs.map((m) => mapApiMessage(m, identity.user.id)));
      setScreen('chat');
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async () => {
    if (!conversationId || !input.trim() || (expiresAt && Date.now() > expiresAt)) return;
    const text = input.trim();
    setInput('');
    try {
      const msg = await conversationApi.sendMessage(conversationId, text);
      if (!identity.user) return;
      setMessages((prev) => [...prev, mapApiMessage(msg, identity.user!.id)]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Erreur envoi');
    }
  };

  const remainingMs = expiresAt ? expiresAt - now : null;
  const expired = remainingMs !== null ? remainingMs <= 0 : false;
  const countdownLabel = remainingMs !== null ? formatCountdown(remainingMs) : '';

  // ─── Loading / bootstrap ───
  if (screen === 'loading' || identity.loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f3ff', color: '#7c1d92' }}>
        <p>Chargement…</p>
      </div>
    );
  }

  // ─── Direct access without invite: just show download page ───
  if (screen === 'no-invite' || !invite) {
    return (
      <div className="app">
        <NoInvite />
      </div>
    );
  }

  // ─── Error ───
  if (identity.error) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f3ff', color: '#ef4444', textAlign: 'center', padding: '2rem' }}>
        <div>
          <p>Erreur de connexion</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{identity.error}</p>
        </div>
      </div>
    );
  }

  // ─── Landing: user clicked a shared link ───
  if (screen === 'landing') {
    return (
      <div className="app">
        <InviteLanding
          senderName={invite.senderName}
          onJoin={handleJoin}
          loading={chatLoading}
          error={chatError}
        />
      </div>
    );
  }

  // ─── Chat screen (7-day window) ───
  return (
    <div className="app">
      <Header name={invite.senderName ?? 'Anonyme'} countdownLabel={countdownLabel} />
      <div className="chat-body">
        {expiresAt && !expired && (
          <div style={{ fontSize: '0.8rem', opacity: 0.7, padding: '0.5rem 1rem' }}>
            Chat actif encore {formatCountdown(remainingMs!)}
          </div>
        )}
        {chatError && (
          <div style={{ color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>{chatError}</div>
        )}
        <MessageList
          messages={messages}
          loading={chatLoading}
          selfId={identity.user?.id ?? ''}
        />
      </div>

      {expired ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#513768', background: '#fff' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>⏰ Cette conversation a expiré après 7 jours.</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
            Pour la rallonger ou débloquer l'envoi, tu peux passer en premium dans l'app MystMe (optionnel).
          </p>
          <a
            href={/android/i.test(navigator.userAgent)
              ? 'https://play.google.com/store/apps/details?id=com.mystme.app'
              : 'https://apps.apple.com/app/mystme/id000000000'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '0.75rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              background: 'linear-gradient(110deg, #c83ee3, #7c1d92)',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Télécharger l'app MystMe (optionnel)
          </a>
        </div>
      ) : (
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          placeholder="Envoyer un message anonyme…"
        />
      )}
    </div>
  );
}

export default App;
