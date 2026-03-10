import { useEffect, useState } from 'react';
import { moderationApi, type ModerationReport, type ReviewModerationReportPayload } from '../services/api';
import './ModerationConsole.css';

type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

const MODERATION_KEY_STORAGE = 'mystme_moderation_key';
const MODERATION_ACTOR_STORAGE = 'mystme_moderation_actor';

function sessionStorageSafe() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Non disponible';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shrinkId(value?: string | null) {
  if (!value) return 'n/a';
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function resolveTargetLabel(report: ModerationReport) {
  if (report.reported_message_sender_id === report.owner_id) {
    return report.owner_pseudo || 'Owner';
  }
  if (report.reported_message_sender_id === report.anonymous_id) {
    return report.anonymous_pseudo || 'Anonymous';
  }
  return report.reported_message_sender_id ? shrinkId(report.reported_message_sender_id) : 'Conversation';
}

export default function ModerationConsole() {
  const storage = sessionStorageSafe();
  const [apiKey, setApiKey] = useState(storage?.getItem(MODERATION_KEY_STORAGE) ?? '');
  const [actor, setActor] = useState(storage?.getItem(MODERATION_ACTOR_STORAGE) ?? 'ops-console');
  const [status, setStatus] = useState<ReportStatus>('pending');
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [decision, setDecision] = useState<'reviewed' | 'dismissed'>('reviewed');
  const [note, setNote] = useState('');
  const [hideMessage, setHideMessage] = useState(true);
  const [blockConversation, setBlockConversation] = useState(true);
  const [banUser, setBanUser] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;

  const loadReports = async (nextStatus = status) => {
    if (!apiKey.trim() || !actor.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const nextReports = await moderationApi.listReports(apiKey.trim(), actor.trim(), nextStatus);
      setReports(nextReports);
      setSelectedReportId((current) => {
        if (current && nextReports.some((report) => report.id === current)) {
          return current;
        }
        return nextReports[0]?.id ?? null;
      });
    } catch (err) {
      setReports([]);
      setSelectedReportId(null);
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!apiKey.trim() || !actor.trim()) return;
    loadReports(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (storage) {
      storage.setItem(MODERATION_KEY_STORAGE, apiKey);
      storage.setItem(MODERATION_ACTOR_STORAGE, actor);
    }
  }, [actor, apiKey, storage]);

  useEffect(() => {
    if (!selectedReport) return;
    setDecision(selectedReport.status === 'dismissed' ? 'dismissed' : 'reviewed');
    setNote(selectedReport.decision_note ?? '');
    setHideMessage(!!selectedReport.message_id);
    setBlockConversation(true);
    setBanUser(false);
    setBanReason('');
  }, [selectedReportId, selectedReport]);

  const handleConnect = async () => {
    await loadReports(status);
  };

  const handleReview = async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: ReviewModerationReportPayload = {
      decision,
      note: note.trim() || undefined,
      hideMessage: decision === 'reviewed' ? hideMessage : false,
      blockConversation: decision === 'reviewed' ? blockConversation : false,
      banUser: decision === 'reviewed' ? banUser : false,
      banReason: decision === 'reviewed' && banUser ? (banReason.trim() || note.trim() || undefined) : undefined,
    };

    try {
      await moderationApi.reviewReport(apiKey.trim(), actor.trim(), selectedReport.id, payload);
      setSuccess(`Signalement ${decision === 'dismissed' ? 'classé' : 'traité'} avec succès.`);
      await loadReports(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="moderation-shell">
      <div className="moderation-hero">
        <div>
          <p className="moderation-eyebrow">MystMe Internal</p>
          <h1>Console de modération</h1>
          <p className="moderation-subtitle">
            Traite les signalements, applique les décisions et garde la clé d’accès en session locale seulement.
          </p>
        </div>
        <div className="moderation-badge">Route interne /moderation</div>
      </div>

      <section className="moderation-auth-card">
        <div className="moderation-field">
          <label htmlFor="moderation-key">Clé API</label>
          <input
            id="moderation-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="x-moderation-api-key"
          />
        </div>
        <div className="moderation-field">
          <label htmlFor="moderation-actor">Opérateur</label>
          <input
            id="moderation-actor"
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            placeholder="ops-console"
          />
        </div>
        <button type="button" className="moderation-primary" onClick={handleConnect} disabled={!apiKey.trim() || !actor.trim() || loading}>
          {loading ? 'Connexion…' : 'Charger les signalements'}
        </button>
      </section>

      <section className="moderation-toolbar">
        <div className="moderation-tabs">
          {(['pending', 'reviewed', 'dismissed'] as ReportStatus[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`moderation-tab${status === item ? ' is-active' : ''}`}
              onClick={() => setStatus(item)}
            >
              {item === 'pending' ? 'En attente' : item === 'reviewed' ? 'Traités' : 'Classés'}
            </button>
          ))}
        </div>
        <button type="button" className="moderation-ghost" onClick={() => loadReports(status)} disabled={!apiKey.trim() || loading}>
          Rafraîchir
        </button>
      </section>

      {error && <div className="moderation-alert is-error">{error}</div>}
      {success && <div className="moderation-alert is-success">{success}</div>}

      <section className="moderation-grid">
        <aside className="moderation-list-panel">
          <div className="moderation-panel-heading">
            <h2>Signalements</h2>
            <span>{reports.length}</span>
          </div>
          <div className="moderation-list">
            {reports.length === 0 && !loading ? (
              <div className="moderation-empty">Aucun signalement pour ce filtre.</div>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  className={`moderation-report-card${selectedReport?.id === report.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedReportId(report.id)}
                >
                  <div className="moderation-report-topline">
                    <span className={`moderation-status status-${report.status}`}>{report.status}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                  <strong>{report.reason}</strong>
                  <p>
                    Reporter: {report.reporter_pseudo || shrinkId(report.reported_by)}
                  </p>
                  <p>
                    Cible: {resolveTargetLabel(report)}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="moderation-detail-panel">
          {selectedReport ? (
            <>
              <div className="moderation-panel-heading">
                <h2>Détails</h2>
                <span>{selectedReport.id.slice(0, 8)}</span>
              </div>

              <div className="moderation-detail-grid">
                <div className="moderation-detail-card">
                  <span className="detail-label">Conversation</span>
                  <strong>{shrinkId(selectedReport.conversation_id)}</strong>
                  <p>
                    Owner: {selectedReport.owner_pseudo || shrinkId(selectedReport.owner_id)}
                  </p>
                  <p>
                    Anonymous: {selectedReport.anonymous_pseudo || shrinkId(selectedReport.anonymous_id)}
                  </p>
                </div>
                <div className="moderation-detail-card">
                  <span className="detail-label">Message signalé</span>
                  <strong>{selectedReport.message_id ? shrinkId(selectedReport.message_id) : 'Aucun message lié'}</strong>
                  <p>{selectedReport.reported_message_content || 'Signalement au niveau conversation.'}</p>
                  <p>{formatDate(selectedReport.reported_message_created_at)}</p>
                </div>
              </div>

              <div className="moderation-form-card">
                <div className="moderation-field">
                  <label htmlFor="decision">Décision</label>
                  <select id="decision" value={decision} onChange={(event) => setDecision(event.target.value as 'reviewed' | 'dismissed')}>
                    <option value="reviewed">Traiter le signalement</option>
                    <option value="dismissed">Classer sans suite</option>
                  </select>
                </div>

                <div className="moderation-options">
                  <label>
                    <input type="checkbox" checked={hideMessage} onChange={(event) => setHideMessage(event.target.checked)} disabled={decision !== 'reviewed' || !selectedReport.message_id} />
                    Masquer le message
                  </label>
                  <label>
                    <input type="checkbox" checked={blockConversation} onChange={(event) => setBlockConversation(event.target.checked)} disabled={decision !== 'reviewed'} />
                    Bloquer la conversation
                  </label>
                  <label>
                    <input type="checkbox" checked={banUser} onChange={(event) => setBanUser(event.target.checked)} disabled={decision !== 'reviewed'} />
                    Bannir l’utilisateur ciblé
                  </label>
                </div>

                {banUser && decision === 'reviewed' && (
                  <div className="moderation-field">
                    <label htmlFor="banReason">Motif de ban</label>
                    <input id="banReason" value={banReason} onChange={(event) => setBanReason(event.target.value)} placeholder="Abusive behavior" />
                  </div>
                )}

                <div className="moderation-field">
                  <label htmlFor="note">Note opérateur</label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={5}
                    placeholder="Décision, contexte, justification"
                  />
                </div>

                <div className="moderation-action-row">
                  <button type="button" className="moderation-primary" onClick={handleReview} disabled={submitting || !apiKey.trim() || !actor.trim()}>
                    {submitting ? 'Application…' : 'Appliquer la décision'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="moderation-empty detail-empty">Sélectionne un signalement pour afficher les détails.</div>
          )}
        </div>
      </section>
    </div>
  );
}