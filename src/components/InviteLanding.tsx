import './InviteLanding.css';

type Props = {
  senderName?: string;
  onJoin: () => void;
  loading?: boolean;
  error?: string | null;
};

export default function InviteLanding({ senderName, onJoin, loading, error }: Props) {
  return (
    <div className="landing">
      <div className="landing-card">
        <div className="avatar-circle" aria-hidden>
          <span role="img" aria-label="user">👤</span>
        </div>

        <div className="landing-name">{senderName ?? 'MystMe user'}</div>
        <p className="landing-subtitle">
          envoie un message anonyme à @{senderName ?? 'MystMe'}
        </p>

        {error && <p className="landing-error">{error}</p>}

        <button className="landing-cta" onClick={onJoin} disabled={loading}>
          {loading ? 'Chargement…' : 'Envoyer un message'}
        </button>
      </div>
    </div>
  );
}
