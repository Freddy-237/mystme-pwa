import React from 'react';
import './MessageInput.css';

type IconName = 'send' | 'lock';

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
  onRetryUpload?: () => void;
  canRetryUpload?: boolean;
  uploadProgress?: number | null;
  uploadLabel?: string | null;
  uploading?: boolean;
  placeholder?: string;
  reassuranceText?: string;
};

export default function MessageInput({
  value,
  onChange,
  onSend,
  onRetryUpload,
  canRetryUpload = false,
  uploadProgress = null,
  uploadLabel = null,
  uploading = false,
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
