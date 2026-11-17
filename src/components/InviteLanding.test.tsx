import { fireEvent, render, screen } from '@testing-library/react';
import InviteLanding from './InviteLanding';

describe('InviteLanding', () => {
  it('renders the anonymous landing content with sender and identity', () => {
    render(
      <InviteLanding
        senderName="Mika"
        anonymousPseudo="GhostNova"
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByText('Envoie un message anonyme à @Mika')).toBeInTheDocument();
    expect(screen.getByText('Ton identité est totalement masquée.')).toBeInTheDocument();
    expect(screen.getByText('Tu écris en tant que')).toBeInTheDocument();
    expect(screen.getByText('GhostNova')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer anonymement' })).toBeDisabled();
  });

  it('forwards textarea changes and allows sending when input is filled', () => {
    const onChange = vi.fn();
    const onSend = vi.fn();

    render(
      <InviteLanding
        senderName="Mika"
        anonymousPseudo="GhostNova"
        value="Bonjour"
        onChange={onChange}
        onSend={onSend}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Écris ton message ici…'), {
      target: { value: 'Bonjour à toi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer anonymement' }));

    expect(onChange).toHaveBeenCalledWith('Bonjour à toi');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('shows sent feedback and friendly error when provided', () => {
    render(
      <InviteLanding
        senderName="Mika"
        anonymousPseudo="GhostNova"
        value="Salut"
        onChange={vi.fn()}
        onSend={vi.fn()}
        sent
        error="Connexion impossible. Verifie ton reseau puis reessaie."
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Message envoyé anonymement')).toBeInTheDocument();
    expect(screen.getByText('@Mika pourra te répondre ici.')).toBeInTheDocument();
    expect(screen.getByText('Connexion impossible. Verifie ton reseau puis reessaie.')).toBeInTheDocument();
  });
});