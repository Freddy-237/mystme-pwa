import './UpsellBanner.css';
import { copyTransferCode } from '../services/helpers';

type Props = {
  visible: boolean;
  deepLink: string;
  installLink: string;
  onDismiss?: () => void;
  transferCode?: string | null;
};

export default function UpsellBanner({ visible, deepLink, installLink, onDismiss, transferCode }: Props) {
  if (!visible) return null;

  const handleOpen = () => {
    void copyTransferCode(transferCode);
    const timeout = setTimeout(() => {
      window.location.href = installLink;
    }, 1500);
    window.addEventListener(
      'blur',
      () => clearTimeout(timeout),
      { once: true },
    );
    window.location.href = deepLink;
  };

  return (
    <div className="upsell-banner">
      {onDismiss && (
        <button className="upsell-close" onClick={onDismiss} aria-label="Fermer">
          ✕
        </button>
      )}

      <p className="upsell-title">🚀 Continue la conversation dans l'app MystMe</p>
      <ul className="upsell-points">
        <li>Notifications instantanées</li>
        <li>Historique conservé</li>
        <li>Anonymat garanti</li>
      </ul>

      <div className="upsell-actions">
        <button className="upsell-cta" onClick={handleOpen}>
          Ouvrir dans l'app
        </button>
        <a
          className="upsell-secondary"
          href={installLink}
          onClick={() => { void copyTransferCode(transferCode); }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Installer l'app
        </a>
      </div>
    </div>
  );
}
