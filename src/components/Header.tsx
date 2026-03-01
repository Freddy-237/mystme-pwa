import './Header.css';

type Props = {
  name: string;
  countdownLabel?: string;
  onResetIdentity?: () => void;
};

export default function Header({ name, countdownLabel, onResetIdentity }: Props) {
  return (
    <header className="header">
      <div className="header-top">
        <div className="header-pill" aria-hidden />
      </div>
      <div className="header-bottom">
        <div className="avatar" aria-hidden>
          <span role="img" aria-label="user">👤</span>
        </div>
        <div className="title-group">
          <div className="name">{name}</div>
        </div>
        <div className="countdown">
          <span role="img" aria-label="timer">⏲️</span>
          <span className="countdown-text">{countdownLabel ?? ''}</span>
        </div>
        {onResetIdentity && (
          <button
            className="reset-btn"
            type="button"
            onClick={onResetIdentity}
            title="Créer une nouvelle identité"
          >
            Nouvelle identité
          </button>
        )}
      </div>
    </header>
  );
}
