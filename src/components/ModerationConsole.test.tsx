import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModerationConsole from './ModerationConsole';
import { moderationApi, type ModerationReport } from '../services/api';

vi.mock('../services/api', () => ({
  moderationApi: {
    listReports: vi.fn(),
    reviewReport: vi.fn(),
  },
}));

const mockedModerationApi = vi.mocked(moderationApi);

function makeReport(overrides: Partial<ModerationReport> = {}): ModerationReport {
  return {
    id: 'report-1',
    conversation_id: 'conv-1',
    message_id: 'msg-1',
    reported_by: 'reporter-1',
    reporter_pseudo: 'Aurore',
    reason: 'spam',
    status: 'pending',
    created_at: '2026-04-16T10:00:00.000Z',
    owner_id: 'owner-1',
    anonymous_id: 'anon-1',
    owner_pseudo: 'Mika',
    anonymous_pseudo: 'GhostNova',
    reported_message_sender_id: 'anon-1',
    reported_message_content: 'Message abusif',
    reported_message_created_at: '2026-04-16T09:58:00.000Z',
    auto_flagged: false,
    ...overrides,
  };
}

describe('ModerationConsole', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mockedModerationApi.listReports.mockReset();
    mockedModerationApi.reviewReport.mockReset();
  });

  it('loads reports after entering credentials and shows the selected details', async () => {
    mockedModerationApi.listReports.mockResolvedValue([
      makeReport(),
      makeReport({
        id: 'report-2',
        reason: 'harcelement',
        reporter_pseudo: 'Lina',
        reported_message_sender_id: 'owner-1',
      }),
    ]);

    render(<ModerationConsole />);

    fireEvent.change(screen.getByLabelText('Clé API'), {
      target: { value: 'secret-key' },
    });
    fireEvent.change(screen.getByLabelText('Opérateur'), {
      target: { value: 'mod-ops' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Charger les signalements' }));

    await waitFor(() => {
      expect(mockedModerationApi.listReports).toHaveBeenCalledWith('secret-key', 'mod-ops', 'pending');
    });

    expect(await screen.findByText('spam')).toBeInTheDocument();
    expect(screen.getByText('harcelement')).toBeInTheDocument();
    expect(screen.getByText('Message abusif')).toBeInTheDocument();
    expect(screen.getByText('Anonyme: GhostNova')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('mystme_moderation_key')).toBe('secret-key');
    expect(window.sessionStorage.getItem('mystme_moderation_actor')).toBe('mod-ops');
  });

  it('shows a friendly error when report loading fails', async () => {
    mockedModerationApi.listReports.mockRejectedValue(new Error('Network Error'));

    render(<ModerationConsole />);

    fireEvent.change(screen.getByLabelText('Clé API'), {
      target: { value: 'secret-key' },
    });
    fireEvent.change(screen.getByLabelText('Opérateur'), {
      target: { value: 'mod-ops' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Charger les signalements' }));

    expect(await screen.findByText('Connexion impossible. Verifie ton reseau puis reessaie.')).toBeInTheDocument();
  });

  it('submits a reviewed decision with the expected moderation payload', async () => {
    mockedModerationApi.listReports.mockResolvedValue([
      makeReport({ id: 'report-9', reason: 'insulte' }),
    ]);
    mockedModerationApi.reviewReport.mockResolvedValue(makeReport({ id: 'report-9', status: 'reviewed' }));

    render(<ModerationConsole />);

    fireEvent.change(screen.getByLabelText('Clé API'), {
      target: { value: 'secret-key' },
    });
    fireEvent.change(screen.getByLabelText('Opérateur'), {
      target: { value: 'mod-ops' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Charger les signalements' }));

    expect(await screen.findByText('insulte')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Bannir l’utilisateur ciblé'));
    fireEvent.change(screen.getByLabelText('Motif de ban'), {
      target: { value: 'Abus répété' },
    });
    fireEvent.change(screen.getByLabelText('Note opérateur'), {
      target: { value: 'Historique confirmé' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer la décision' }));

    await waitFor(() => {
      expect(mockedModerationApi.reviewReport).toHaveBeenCalledWith(
        'secret-key',
        'mod-ops',
        'report-9',
        {
          decision: 'reviewed',
          note: 'Historique confirmé',
          hideMessage: true,
          blockConversation: true,
          banUser: true,
          banReason: 'Abus répété',
        },
      );
    });

    expect(await screen.findByText('Signalement traité avec succès.')).toBeInTheDocument();
  });
});