import React from 'react';
import './MessageInput.css';

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
          📎
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
          ▶
        </button>
        <button
          className={`icon-btn audio-btn ${isRecordingAudio ? 'recording' : ''}`}
          onClick={onAudioClick}
          type="button"
          title={isRecordingAudio ? 'Arrêter l’enregistrement' : 'Enregistrer un audio'}
          disabled={uploading}
        >
          {isRecordingAudio ? '⏺' : '🎤'}
        </button>
      </div>
      {reassuranceText && <p className="input-reassurance">{reassuranceText}</p>}
    </div>
  );
}
