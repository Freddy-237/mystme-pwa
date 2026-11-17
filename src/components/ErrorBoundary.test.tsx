import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import ErrorBoundary from './ErrorBoundary';

function ThrowingChild(): ReactElement {
  throw new Error('Network Error');
}

describe('ErrorBoundary', () => {
  it('shows a friendly fallback message when a child crashes', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Oups, quelque chose a planté')).toBeInTheDocument();
    expect(screen.getByText('Connexion impossible. Verifie ton reseau puis reessaie.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recharger' }));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});