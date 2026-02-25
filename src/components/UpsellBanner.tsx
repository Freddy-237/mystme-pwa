import './UpsellBanner.css';

type Props = {
  visible: boolean;
  onClose: () => void;
  deepLink: string;
};

export default function UpsellBanner({ visible, onClose, deepLink }: Props) {
  if (!visible) return null;

  const storeLink =
    /android/i.test(navigator.userAgent)
      ? 'https://play.google.com/store/apps/details?id=com.mystme.app'
      : 'https://apps.apple.com/app/mystme/id000000000';

  const handleOpen = () => {
    // Try deep link first, fallback to store
    const timeout = setTimeout(() => {
      window.location.href = storeLink;
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
      <button className="upsell-close" onClick={onClose}>✕</button>
      <p className="upsell-text">
        Télécharge <strong>MystMe</strong> pour continuer la conversation et débloquer toutes les fonctionnalités !
      </p>
      <button className="upsell-cta" onClick={handleOpen}>
        Ouvrir l'app
      </button>
    </div>
  );
}
