import { fireEvent, render, screen } from '@testing-library/react';
import MessageList from './MessageList';
import type { Message } from '../types';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    text: 'Bonjour',
    sender: 'self',
    timestamp: new Date('2026-04-12T10:30:00.000Z').getTime(),
    ...overrides,
  };
}

describe('MessageList', () => {
  it('renders a loader while messages are loading', () => {
    const { container } = render(
      <MessageList
        messages={[]}
        loading
        selfId="user-1"
        onReplySelect={vi.fn()}
      />,
    );

    expect(container.querySelector('.loader')).not.toBeNull();
  });

  it('renders messages with today separator and forwards reply selection', () => {
    const onReplySelect = vi.fn();
    const messages = [
      makeMessage({ id: 'msg-1', text: 'Premier message' }),
      makeMessage({ id: 'msg-2', sender: 'peer', text: 'Deuxième message' }),
    ];

    render(
      <MessageList
        messages={messages}
        loading={false}
        selfId="user-1"
        onReplySelect={onReplySelect}
      />,
    );

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText('Premier message')).toBeInTheDocument();
    expect(screen.getByText('Deuxième message')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Répondre' })[1]);
    expect(onReplySelect).toHaveBeenCalledWith(messages[1]);
  });

  it('renders reply preview and file media links', () => {
    const messages = [
      makeMessage({
        id: 'msg-file',
        text: '',
        sender: 'peer',
        mediaType: 'file',
        mediaUrl: 'https://cdn.example/file.pdf',
        replyToMessageId: 'msg-1',
        replyToContent: 'Message cité',
        replyToSender: 'self',
      }),
    ];

    render(
      <MessageList
        messages={messages}
        loading={false}
        selfId="user-1"
        activeReplyId="msg-file"
        onReplySelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Toi')).toBeInTheDocument();
    expect(screen.getByText('Message cité')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ouvrir le fichier' })).toHaveAttribute('href', 'https://cdn.example/file.pdf');
  });
});