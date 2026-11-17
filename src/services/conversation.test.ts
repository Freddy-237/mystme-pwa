import { conversationApi } from './conversation';
import { requestFormData } from './http';

vi.mock('./http', () => ({
  request: vi.fn(),
  requestFormData: vi.fn().mockResolvedValue({}),
}));

const mockedRequestFormData = vi.mocked(requestFormData);

describe('conversationApi.sendAudio', () => {
  beforeEach(() => {
    mockedRequestFormData.mockClear();
  });

  it('uses an M4A filename for MP4 audio recordings', async () => {
    const blob = new Blob(['audio'], { type: 'audio/mp4;codecs=mp4a.40.2' });

    await conversationApi.sendAudio('conversation-1', blob);

    const formData = mockedRequestFormData.mock.calls[0][1];
    const audio = formData.get('audio');
    expect(audio).toBeInstanceOf(File);
    if (!(audio instanceof File)) throw new Error('Audio upload was not attached');
    expect(audio.name).toMatch(/\.m4a$/);
  });
});
