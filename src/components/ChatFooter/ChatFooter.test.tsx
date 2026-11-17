import { fireEvent, render, screen } from '@testing-library/react';
import ChatFooter from './ChatFooter';
import type { Message } from '../../types';

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    expired: false,
    hardLimitReached: false,
    storeLink: 'https://store.example/app',
    appDeepLink: 'mystme://chat/conv-1',
    input: 'Bonjour',
    onInputChange: vi.fn(),
    onSend: vi.fn(),
    onRetryUpload: vi.fn(),
    canRetryUpload: false,
    uploadProgress: null,
    uploadLabel: null,
    uploading: false,
    replyTo: null,
    onClearReply: vi.fn(),
    ...overrides,
  };
}

describe('ChatFooter', () => {
  it('renders expired state with store CTA', () => {
    render(<ChatFooter {...baseProps({ expired: true, input: '' })} />);

    expect(screen.getByText('Ta période de chat web (7 jours) est terminée.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Télécharger l'app MystMe" })).toHaveAttribute('href', 'https://store.example/app');
  });

  it('renders hard limit state with deep link and install actions', () => {
    render(<ChatFooter {...baseProps({ hardLimitReached: true, input: '' })} />);

    expect(screen.getByText('Limite du chat web atteinte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Ouvrir dans l'app" })).toHaveAttribute('href', 'mystme://chat/conv-1');
    expect(screen.getByRole('link', { name: 'Installer MystMe' })).toHaveAttribute('href', 'https://store.example/app');
  });

  it('renders reply context and lets the user clear it', () => {
    const replyTo: Message = {
      id: 'msg-1',
      text: 'Je te réponds',
      sender: 'peer',
      timestamp: Date.now(),
    };
    const onClearReply = vi.fn();

    render(
      <ChatFooter
        {...baseProps({
          replyTo,
          onClearReply,
        })}
      />,
    );

    expect(screen.getByText('Réponse à ce message')).toBeInTheDocument();
    expect(screen.getByText('Je te réponds')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Répondre anonymement…')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClearReply).toHaveBeenCalledTimes(1);
  });

  it('shows the transfer code in the expired state', () => {
    render(<ChatFooter {...baseProps({ expired: true, input: '', transferCode: 'WXYZ-6789' })} />);
    expect(screen.getByText('WXYZ-6789')).toBeInTheDocument();
  });
});