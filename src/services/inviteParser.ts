import { InvitePayload } from '../types';

/**
 * Parse the invite from the current URL.
 *
 * Supported formats:
 *   /c/INVITE_CODE
 *   /c/INVITE_CODE?name=SilentFox
 *   /?invite=INVITE_CODE&name=SilentFox
 *
 * Returns null when no invite is found (direct visit without link).
 */
export function parseInvite(): InvitePayload | null {
  const { pathname, searchParams } = new URL(window.location.href);

  // Format 1: /c/INVITE_CODE
  const pathMatch = pathname.match(/^\/c\/([A-Za-z0-9_-]+)/);
  if (pathMatch) {
    const inviteCode = pathMatch[1];
    return {
      inviteCode,
      senderName: searchParams.get('name') ?? undefined,
    };
  }

  // Format 2: /?invite=CODE
  const inviteParam = searchParams.get('invite');
  if (inviteParam) {
    return {
      inviteCode: inviteParam,
      senderName: searchParams.get('name') ?? undefined,
    };
  }

  return null;
}
