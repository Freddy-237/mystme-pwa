import { request } from './http';

// ─── Types mirroring backend responses ───

export interface UserResponse {
  id: string;
  anonymous_uid: string;
  pseudo: string;
  avatar_url: string;
  last_seen_at: string;
  created_at: string;
  system_warning_message?: string | null;
  system_warning_code?: string | null;
  /** 'web' for PWA identities (7-day write window), 'app' otherwise. */
  origin?: 'web' | 'app';
  /** End of the web write window (ISO), null for app identities. */
  web_expires_at?: string | null;
  /** True once the web window is over: read-only, install the app. */
  web_locked?: boolean;
  /** When a locked web identity becomes eligible for deletion (ISO). */
  web_purge_at?: string | null;
}

export interface InitResponse {
  user: UserResponse;
  token: string;
  csrfToken?: string;
}

export interface SessionTokenResponse {
  token: string;
}

export interface LinkResponse {
  id: string;
  code: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  shareUrl: string;
}

export interface ModerationReport {
  id: string;
  conversation_id: string;
  message_id: string | null;
  reported_by: string;
  reported_user_id?: string | null;
  reporter_pseudo?: string | null;
  reason: string;
  already_reported?: boolean;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  decision_note?: string | null;
  owner_id: string;
  anonymous_id: string | null;
  owner_pseudo?: string | null;
  anonymous_pseudo?: string | null;
  reported_message_sender_id?: string | null;
  reported_message_content?: string | null;
  reported_message_created_at?: string | null;
  total_report_count?: number;
  unique_reporter_count?: number;
  auto_flag_threshold?: number;
  auto_flagged?: boolean;
}

export interface ReviewModerationReportPayload {
  decision: 'reviewed' | 'dismissed';
  note?: string;
  blockConversation?: boolean;
  hideMessage?: boolean;
  banUser?: boolean;
  banReason?: string;
}

// ─── Identity ───

export const identityApi = {
  /** Create a brand-new anonymous identity. */
  init: () => request<InitResponse>('/identity/init', {
    method: 'POST',
    // Tells the backend this is a web identity (7-day window, message cap).
    body: JSON.stringify({ client: 'web' }),
  }),

  /** Retrieve the current user from the stored JWT. */
  me: () => request<UserResponse>('/identity/me'),

  /** Issue a fresh bearer token for the current authenticated session. */
  sessionToken: () => request<SessionTokenResponse>('/identity/session-token'),

  /** Clear current auth session cookie. */
  logout: () => request<{ ok: boolean }>('/identity/logout', { method: 'POST' }),
};

// ─── PWA → app transfer ───

export interface TransferCodeResponse {
  /** Short one-time code, e.g. "ABCD-2345" (valid 30 min). */
  code: string;
  expiresAt: string;
}

export const transferApi = {
  create: () => request<TransferCodeResponse>('/identity/transfer-token', { method: 'POST', body: '{}' }),
};

// ─── Link ───

export const linkApi = {
  /** Create a new shareable link. */
  create: () => request<LinkResponse>('/link', { method: 'POST' }),

  /** Resolve an invite code (public, no auth). */
  resolve: (code: string) => request<LinkResponse>(`/link/code/${code}`),

  /** Get all links owned by the current user. */
  mine: () => request<LinkResponse[]>('/link/mine'),

  /** Deactivate a link. */
  deactivate: (linkId: string) =>
    request<LinkResponse>(`/link/${linkId}`, { method: 'DELETE' }),
};

const moderationHeaders = (apiKey: string, actor: string) => ({
  'x-moderation-api-key': apiKey,
  'x-moderation-actor': actor,
});

export const moderationApi = {
  listReports: (apiKey: string, actor: string, status: string) =>
    request<ModerationReport[]>(`/moderation/reports?status=${encodeURIComponent(status)}`, {
      headers: moderationHeaders(apiKey, actor),
    }),

  reviewReport: (
    apiKey: string,
    actor: string,
    reportId: string,
    payload: ReviewModerationReportPayload,
  ) => request<ModerationReport>(`/moderation/report/${reportId}/review`, {
    method: 'POST',
    headers: moderationHeaders(apiKey, actor),
    body: JSON.stringify(payload),
  }),
};
