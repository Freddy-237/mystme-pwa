import React from 'react';
import './MessageInput.css';

type IconName = 'attach' | 'mic' | 'stop' | 'send' | 'lock';

function UiIcon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'attach':
      return (
        <svg {...common}>
          <path d="M21.44 11.05 12.25 20.25a5.5 5.5 0 1 1-7.78-7.78l9.19-9.2a3.5 3.5 0 1 1 4.95 4.96l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...common}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <path d="M12 17v5" />
          <path d="M8 22h8" />
        </svg>
      );
    case 'stop':
      return (
        <svg {...common}>
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      );
    case 'send':
      return (
        <svg {...common}>
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onMediaClick: () => void;
  onAudioClick: () => void;
  onRetryUpload?: () => void;
  canRetryUpload?: boolean;
  uploadProgress?: number | null;
  uploadLabel?: string | null;
  uploading?: boolean;
  isRecordingAudio?: boolean;
  placeholder?: string;
  reassuranceText?: string;
};

export default function MessageInput({
  value,
  onChange,
  onSend,
  onMediaClick,
  onAudioClick,
  onRetryUpload,
  canRetryUpload = false,
  uploadProgress = null,
  uploadLabel = null,
  uploading = false,
  isRecordingAudio = false,
  placeholder,
  reassuranceText,
}: Props) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="input-wrap">
      {uploading && uploadProgress !== null && (
        <div className="upload-state">
          <div className="upload-meta">{uploadLabel ?? 'Upload'} {Math.round(uploadProgress * 100)}%</div>
          <div className="upload-track">
            <div className="upload-fill" style={{ width: `${Math.round(uploadProgress * 100)}%` }} />
          </div>
        </div>
      )}
      {canRetryUpload && onRetryUpload && (
        <div className="upload-retry">
          <button type="button" onClick={onRetryUpload}>Réessayer l’upload</button>
        </div>
      )}
      <div className="input-bar">
        <button
          className="icon-btn"
          onClick={onMediaClick}
          type="button"
          title="Envoyer un média ou fichier"
          disabled={uploading}
        >
          <UiIcon name="attach" className="icon-svg" />
        </button>
        <textarea
          className="input-field"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={uploading}
        />
        <button className="send-btn" onClick={onSend} disabled={!value.trim() || uploading}>
          <UiIcon name="send" className="icon-svg send-svg" />
        </button>
        <button
          className={`icon-btn audio-btn ${isRecordingAudio ? 'recording' : ''}`}
          onClick={onAudioClick}
          type="button"
          title={isRecordingAudio ? 'Arrêter l’enregistrement' : 'Enregistrer un audio'}
          disabled={uploading}
        >
          {isRecordingAudio ? (
            <UiIcon name="stop" className="icon-svg" />
          ) : (
            <UiIcon name="mic" className="icon-svg" />
          )}
        </button>
      </div>
      {reassuranceText && (
        <p className="input-reassurance">
          <UiIcon name="lock" className="reassurance-lock" />
          <span>{reassuranceText}</span>
        </p>
      )}
    </div>
  );
}
