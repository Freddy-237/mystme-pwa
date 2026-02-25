import React from 'react';
import './MessageInput.css';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
};

export default function MessageInput({ value, onChange, onSend, placeholder }: Props) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="input-bar">
      <textarea
        className="input-field"
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
      />
      <button className="send-btn" onClick={onSend} disabled={!value.trim()}>
        ▶
      </button>
    </div>
  );
}
