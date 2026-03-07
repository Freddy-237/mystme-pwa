import { getStoreLink } from '../services/helpers';
import './NoInvite.css';

function GhostIcon() {
  return (
    <svg
      className="no-invite-logo-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 9V8a5 5 0 0 1 10 0v1" />
      <path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7Z" />
      <path d="M9 13h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

/**
 * Shown when someone visits the PWA domain directly (no invite link).
 * Redirects them to download the app.
 */
export default function NoInvite() {
  const storeLink = getStoreLink();

  return (
    <div className="no-invite">
      <div className="no-invite-card">
        <div className="no-invite-logo">
          <GhostIcon />
        </div>
        <h1>MystMe</h1>
        <p>Envoie et reçois des messages anonymes.</p>
        <a className="no-invite-cta" href={storeLink} target="_blank" rel="noopener noreferrer">
          Télécharger l'app
        </a>
      </div>
    </div>
  );
}
