import MessageInput from '../MessageInput';

interface ChatFooterProps {
  expired: boolean;
  hardLimitReached: boolean;
  storeLink: string;
  appDeepLink: string;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onMediaClick: () => void;
  onAudioClick: () => void;
  onRetryUpload: () => void;
  canRetryUpload: boolean;
  uploadProgress: number | null;
  uploadLabel: string | null;
  uploading: boolean;
  isRecordingAudio: boolean;
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  onMediaSelected: (file: File | null) => void;
}

export default function ChatFooter(props: ChatFooterProps) {
  if (props.expired) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#513768', background: '#fff' }}>
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>⏰ Cette conversation a expiré après 7 jours.</p>
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
        <p style={{ fontSize: '1rem', fontWeight: 700 }}>⏳ Limite du chat web atteinte</p>
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
        onMediaClick={props.onMediaClick}
        onAudioClick={props.onAudioClick}
        onRetryUpload={props.onRetryUpload}
        canRetryUpload={props.canRetryUpload}
        uploadProgress={props.uploadProgress}
        uploadLabel={props.uploadLabel}
        uploading={props.uploading}
        isRecordingAudio={props.isRecordingAudio}
        placeholder="Répondre anonymement…"
        reassuranceText="🔒 Ton identité ne sera jamais révélée"
      />
      <input
        ref={props.mediaInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          props.onMediaSelected(file);
          e.currentTarget.value = '';
        }}
      />
    </>
  );
}
