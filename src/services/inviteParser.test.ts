import { parseInvite } from './inviteParser';

function setUrl(url: string) {
  window.history.replaceState({}, '', url);
}

describe('parseInvite', () => {
  it('parses invite code from /c path with sender name', () => {
    setUrl('/c/ABC123?name=SilentFox');

    expect(parseInvite()).toEqual({
      inviteCode: 'ABC123',
      senderName: 'SilentFox',
    });
  });

  it('parses invite code from query string fallback', () => {
    setUrl('/?invite=XYZ789&name=Nova');

    expect(parseInvite()).toEqual({
      inviteCode: 'XYZ789',
      senderName: 'Nova',
    });
  });

  it('returns null when no invite is present', () => {
    setUrl('/');

    expect(parseInvite()).toBeNull();
  });
});