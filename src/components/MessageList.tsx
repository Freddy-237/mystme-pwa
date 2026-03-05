import { useEffect, useMemo, useRef } from 'react';
import { Message } from '../types';
import './MessageList.css';

type Props = {
  messages: Message[];
  loading: boolean;
  selfId: string;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ messages, loading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  const showTodayDivider = useMemo(() => messages.length > 0, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="message-list loading">
        <span className="loader" />
      </div>
    );
  }

  return (
    <div className="message-list">
      {showTodayDivider && (
        <div className="day-separator">
          <span>Aujourd'hui</span>
        </div>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`bubble ${m.sender}`}>
          {m.mediaType === 'image' && m.mediaUrl ? (
            <img className="bubble-image" src={m.mediaUrl} alt="image" />
          ) : m.mediaType === 'video' && m.mediaUrl ? (
            <video className="bubble-video" src={m.mediaUrl} controls preload="metadata" />
          ) : m.mediaType === 'audio' && m.mediaUrl ? (
            <audio className="bubble-audio" src={m.mediaUrl} controls preload="metadata" />
          ) : m.mediaType === 'file' && m.mediaUrl ? (
            <a className="bubble-file" href={m.mediaUrl} target="_blank" rel="noreferrer">
              📄 Ouvrir le fichier
            </a>
          ) : (
            <p>{m.text}</p>
          )}
          <span className="time">{formatTime(m.timestamp)}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
