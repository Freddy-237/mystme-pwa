import './MyLink.css';

type Props = {
  pseudo: string;
  avatarUrl: string;
  linkCode: string | null;
  linkLoading: boolean;
  copied: boolean;
  onCreateLink: () => void;
  onCopyLink: () => void;
  onDeactivateLink: () => void;
};

/**
 * Main screen for an authenticated user without an invite.
 * Shows their anonymous profile and their personal link.
 */
export default function MyLink({
  pseudo,
  avatarUrl,
  linkCode,
  linkLoading,
  copied,
  onCreateLink,
  onCopyLink,
  onDeactivateLink,
}: Props) {
  return (
    <div className="mylink">
      <div className="mylink-card">
        {/* ─── Profile ─── */}
        <img className="mylink-avatar" src={avatarUrl} alt="avatar" />
        <h2 className="mylink-pseudo">{pseudo}</h2>
        <p className="mylink-subtitle">Ton identité anonyme</p>

        {/* ─── Link section ─── */}
        <div className="mylink-section">
          <h3>Ton lien personnel</h3>
          <p className="mylink-desc">
            Partage ce lien pour recevoir des messages anonymes.
          </p>

          {linkLoading ? (
            <div className="mylink-loader">Chargement…</div>
          ) : linkCode ? (
            <>
              <div className="mylink-url-row">
                <input
                  className="mylink-url"
                  type="text"
                  readOnly
                  value={`${window.location.origin}/c/${linkCode}`}
                />
                <button className="mylink-copy-btn" onClick={onCopyLink}>
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>

              <div className="mylink-actions">
                <button className="mylink-share-btn" onClick={onCopyLink}>
                  📤 Partager mon lien
                </button>
                <button
                  className="mylink-deactivate-btn"
                  onClick={onDeactivateLink}
                >
                  Désactiver
                </button>
              </div>
            </>
          ) : (
            <button className="mylink-create-btn" onClick={onCreateLink}>
              🔗 Générer mon lien
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
