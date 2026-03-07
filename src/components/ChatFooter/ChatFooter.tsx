import MessageInput from '../MessageInput';

function FooterIcon({ kind }: { kind: 'clock' | 'limit' }) {
  if (kind === 'clock') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ verticalAlign: 'text-bottom', marginRight: '6px' }}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'text-bottom', marginRight: '6px' }}
      aria-hidden
    >
      <path d="M6 8h12" />
      <path d="M4 12h16" />
      <path d="M8 16h8" />
      <rect x="3" y="5" width="18" height="14" rx="3" />
    </svg>
  );
}

interface ChatFooterProps {
  expired: boolean;
  hardLimitReached: boolean;
  storeLink: string;
  appDeepLink: string;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onRetryUpload: () => void;
  canRetryUpload: boolean;
  uploadProgress: number | null;
  uploadLabel: string | null;
  uploading: boolean;
}

export default function ChatFooter(props: ChatFooterProps) {
  if (props.expired) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#513768', background: '#fff' }}>
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>
          <FooterIcon kind="clock" />
          Cette conversation a expiré après 7 jours.
        </p>
        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
          Pour la rallonger ou débloquer l'envoi, tu peux passer en premium dans l'app MystMe (optionnel).
        </p>
        <a
          href={props.storeLink}
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
    );
  }

  if (props.hardLimitReached) {
    return (
      <div style={{ padding: '1rem 1rem 1.25rem', textAlign: 'center', color: '#513768', background: '#fff', borderTop: '1px solid #efe6ff' }}>
        <p style={{ fontSize: '1rem', fontWeight: 700 }}>
          <FooterIcon kind="limit" />
          Limite du chat web atteinte
        </p>
        <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.45rem' }}>
          Pour continuer cette conversation, ouvre MystMe dans l'application.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '0.8rem', flexWrap: 'wrap' }}>
          <a
            href={props.appDeepLink}
            style={{
              display: 'inline-block',
              padding: '0.7rem 1.1rem',
              borderRadius: '999px',
              background: 'linear-gradient(110deg, #c83ee3, #7c1d92)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Ouvrir dans l'app
          </a>
          <a
            href={props.storeLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.7rem 1.1rem',
              borderRadius: '999px',
              border: '1px solid #d7c5ef',
              color: '#6b3f97',
              fontWeight: 700,
              textDecoration: 'none',
              background: '#fff',
            }}
          >
            Installer MystMe
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <MessageInput
        value={props.input}
        onChange={props.onInputChange}
        onSend={props.onSend}
        onRetryUpload={props.onRetryUpload}
        canRetryUpload={props.canRetryUpload}
        uploadProgress={props.uploadProgress}
        uploadLabel={props.uploadLabel}
        uploading={props.uploading}
        placeholder="Répondre anonymement…"
        reassuranceText="Ton identité ne sera jamais révélée"
      />
    </>
  );
}
