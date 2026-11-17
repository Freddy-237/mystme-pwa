import { useState } from 'react';
import { copyTransferCode } from '../services/helpers';
import './TransferCode.css';

type Props = { code: string | null };

/** Shows the one-time code to type/paste in the app to recover the chat. */
export default function TransferCode({ code }: Props) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const handleCopy = async () => {
    setCopied(await copyTransferCode(code));
  };

  return (
    <div className="transfer-code" aria-live="polite">
      <div className="transfer-code-label">
        Ton code pour retrouver cette conversation dans l&apos;app
      </div>
      <div className="transfer-code-row">
        <span className="transfer-code-value">{code}</span>
        <button type="button" className="transfer-code-copy" onClick={handleCopy}>
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <div className="transfer-code-hint">Valable 30 minutes. Un nouveau code s&apos;affiche ensuite ici.</div>
    </div>
  );
}
