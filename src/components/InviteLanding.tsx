import './InviteLanding.css';

function LandingIcon({ kind, className }: { kind: 'ghost' | 'check'; className?: string }) {
  if (kind === 'check') {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.6 2.6L16 9.5" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 9V8a5 5 0 0 1 10 0v1" />
      <path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7Z" />
      <path d="M9 13h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

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
        <h1 className="landing-title">
          <LandingIcon kind="ghost" className="landing-title-icon" />
          Envoie un message anonyme à @{targetName}
        </h1>
        <p className="landing-subtitle">Ton identité est totalement masquée.</p>

        <div className="identity-card">
          <div className="avatar-circle" aria-hidden>
            {anonymousAvatarUrl ? (
              <img src={anonymousAvatarUrl} alt="Avatar anonyme" className="avatar-image" />
            ) : (
              <LandingIcon kind="ghost" className="avatar-fallback-icon" />
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
            <div className="landing-feedback-title">
              <LandingIcon kind="check" className="landing-feedback-icon" />
              Message envoyé anonymement
            </div>
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
