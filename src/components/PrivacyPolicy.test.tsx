import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacyPolicy from './PrivacyPolicy';

describe('PrivacyPolicy', () => {
  it('renders the policy with deletion and contact information', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { level: 1, name: 'Politique de confidentialité' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Supprimer ton compte' })).toBeInTheDocument();
    expect(screen.getAllByText(/contact@fridevs\.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Dernière mise à jour/)).toBeInTheDocument();
  });
});
