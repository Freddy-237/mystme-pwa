import './InviteLanding.css';

type Props = {
  senderName?: string;
  anonymousPseudo?: string;
  anonymousAvatarUrl?: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sent?: boolean;
  loading?: boolean;
  error?: string | null;
};

export default function InviteLanding({
  senderName,
  anonymousPseudo,
  anonymousAvatarUrl,
  value,
  onChange,
  onSend,
  sent,
  loading,
  error,
}: Props) {
  const targetName = senderName ?? 'mystme';

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">MystMe</div>
      </header>

      <main className="landing-content">
        <h1 className="landing-title">👻 Envoie un message anonyme à @{targetName}</h1>
        <p className="landing-subtitle">Ton identité est totalement masquée.</p>

        <div className="identity-card">
          <div className="avatar-circle" aria-hidden>
            {anonymousAvatarUrl ? (
              <img src={anonymousAvatarUrl} alt="Avatar anonyme" className="avatar-image" />
            ) : (
              <span role="img" aria-label="ghost">👻</span>
            )}
          </div>
          <div className="identity-content">
            <div className="identity-label">Tu écris en tant que</div>
            <div className="identity-name">{anonymousPseudo ?? 'Ghost_92'}</div>
          </div>
        </div>
      </main>

      <section className="landing-action">
        <textarea
          className="landing-input"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Écris ton message ici…"
          disabled={loading}
        />

        {sent && (
          <div className="landing-feedback" role="status" aria-live="polite">
            <div className="landing-feedback-title">✅ Message envoyé anonymement</div>
            <div className="landing-feedback-sub">@{targetName} pourra te répondre ici.</div>
          </div>
        )}

        {error && <p className="landing-error">{error}</p>}

        <button className="landing-cta" onClick={onSend} disabled={loading || !value.trim()}>
          {loading ? 'Envoi…' : 'Envoyer anonymement'}
        </button>
      </section>
    </div>
  );
}
