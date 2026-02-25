import { request } from './http';

// ─── Types mirroring backend responses ───

export interface UserResponse {
  id: string;
  anonymous_uid: string;
  pseudo: string;
  avatar_url: string;
  last_seen_at: string;
  created_at: string;
}

export interface InitResponse {
  user: UserResponse;
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

// ─── Identity ───

export const identityApi = {
  /** Create a brand-new anonymous identity. */
  init: () => request<InitResponse>('/identity/init', { method: 'POST' }),

  /** Retrieve the current user from the stored JWT. */
  me: () => request<UserResponse>('/identity/me'),
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
