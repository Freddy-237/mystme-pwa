import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unhandled React rendering errors and shows a fallback UI
 * instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f3ff', padding: '2rem', textAlign: 'center' }}>
          <div>
            <h2 style={{ color: '#7c1d92', marginBottom: '0.5rem' }}>Oups, quelque chose a planté</h2>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>{this.state.error?.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                border: 'none',
                borderRadius: '999px',
                padding: '0.6rem 1.2rem',
                background: '#7c1d92',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
