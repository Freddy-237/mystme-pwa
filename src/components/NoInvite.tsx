import './NoInvite.css';

/**
 * Shown when someone visits the PWA domain directly (no invite link).
 * Redirects them to download the app.
 */
export default function NoInvite() {
  const storeLink =
    /android/i.test(navigator.userAgent)
      ? 'https://play.google.com/store/apps/details?id=com.mystme.app'
      : 'https://apps.apple.com/app/mystme/id000000000';

  return (
    <div className="no-invite">
      <div className="no-invite-card">
        <div className="no-invite-logo">👻</div>
        <h1>MystMe</h1>
        <p>Envoie et reçois des messages anonymes.</p>
        <a className="no-invite-cta" href={storeLink} target="_blank" rel="noopener noreferrer">
          Télécharger l'app
        </a>
      </div>
    </div>
  );
}
