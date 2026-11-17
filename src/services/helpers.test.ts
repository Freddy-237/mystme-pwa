import { copyTransferCode, getStoreLink, getTransferDeepLink } from './helpers';

const setUserAgent = (ua: string) => {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
};

describe('transfer helpers', () => {
  it('Android store link carries the code in the install referrer', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 14)');
    const url = new URL(getStoreLink('ABCD-2345'));
    expect(url.hostname).toBe('play.google.com');
    expect(url.searchParams.get('id')).toBe('com.mystme.app');
    expect(url.searchParams.get('referrer')).toBe('transfer=ABCD-2345');
  });

  it('iOS store link has no referrer (clipboard is used instead)', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(getStoreLink('ABCD-2345')).toContain('apps.apple.com');
  });

  it('deep link opens the app on the transfer', () => {
    expect(getTransferDeepLink('ABCD-2345')).toBe('mystme://transfer?code=ABCD-2345');
    expect(getTransferDeepLink(null)).toBe('mystme://home');
  });

  it('copies a recognizable payload and never throws', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    expect(await copyTransferCode('ABCD-2345')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('MYSTME:ABCD-2345');

    writeText.mockRejectedValueOnce(new Error('denied'));
    expect(await copyTransferCode('ABCD-2345')).toBe(false);
    expect(await copyTransferCode(null)).toBe(false);
  });
});
