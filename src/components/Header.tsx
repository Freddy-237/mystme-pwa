import './Header.css';

type Props = {
  name: string;
  countdownLabel?: string;
};

function TimerIcon() {
  return (
    <svg
      className="countdown-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9" />
      <path d="M12 13l3 2" />
      <path d="M9 2h6" />
      <path d="M12 2v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="avatar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

export default function Header({ name, countdownLabel }: Props) {
  return (
    <header className="header">
      <div className="header-top">
        <div className="header-pill" aria-hidden />
      </div>
      <div className="header-bottom">
        <div className="avatar" aria-hidden>
          <UserIcon />
        </div>
        <div className="title-group">
          <div className="name">{name}</div>
        </div>
        <div className="countdown">
          <TimerIcon />
          <span className="countdown-text">{countdownLabel ?? ''}</span>
        </div>
      </div>
    </header>
  );
}
