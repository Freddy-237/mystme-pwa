import { useEffect, useMemo, useRef, useState } from 'react';
import { Message } from '../types';
import './MessageList.css';

type Props = {
  messages: Message[];
  loading: boolean;
  selfId: string;
  activeReplyId?: string | null;
  onReplySelect: (message: Message) => void;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function replyLabel(message: Message): string {
  if (message.mediaType === 'image') return 'Image';
  if (message.mediaType === 'video') return 'Vidéo';
  if (message.mediaType === 'audio') return 'Audio';
  if (message.mediaType === 'file') return 'Fichier';
  return message.text || 'Message';
}

export default function MessageList({ messages, loading, activeReplyId, onReplySelect }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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

  const jumpToMessage = (messageId?: string) => {
    if (!messageId) return;
    const node = messageRefs.current.get(messageId);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    window.setTimeout(() => {
      setHighlightedId((current) => (current === messageId ? null : current));
    }, 1800);
  };

  return (
    <div className="message-list">
      {showTodayDivider && (
        <div className="day-separator">
          <span>Aujourd'hui</span>
        </div>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          ref={(node) => {
            if (node) {
              messageRefs.current.set(m.id, node);
            } else {
              messageRefs.current.delete(m.id);
            }
          }}
          className={`bubble ${m.sender}${highlightedId === m.id ? ' is-highlighted' : ''}${activeReplyId === m.id ? ' is-reply-target' : ''}`}
        >
          {m.replyToContent && (
            <button
              type="button"
              className={`reply-preview ${m.sender}`}
              onClick={() => jumpToMessage(m.replyToMessageId)}
            >
              <span className="reply-preview-author">
                {m.replyToSender === 'self' ? 'Toi' : 'Message cité'}
              </span>
              <span className="reply-preview-text">{m.replyToContent}</span>
            </button>
          )}
          {m.mediaType === 'image' && m.mediaUrl ? (
            <img className="bubble-image" src={m.mediaUrl} alt="image" />
          ) : m.mediaType === 'video' && m.mediaUrl ? (
            <video className="bubble-video" src={m.mediaUrl} controls preload="metadata" />
          ) : m.mediaType === 'audio' && m.mediaUrl ? (
            <audio className="bubble-audio" src={m.mediaUrl} controls preload="metadata" />
          ) : m.mediaType === 'file' && m.mediaUrl ? (
            <a className="bubble-file" href={m.mediaUrl} target="_blank" rel="noreferrer">
              Ouvrir le fichier
            </a>
          ) : (
            <p>{m.text}</p>
          )}
          <div className="bubble-footer">
            <button type="button" className="reply-action" onClick={() => onReplySelect(m)}>
              Répondre
            </button>
            <span className="time">{formatTime(m.timestamp)}</span>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
