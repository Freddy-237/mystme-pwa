import { useCallback, useEffect, useRef, useState } from 'react';
import { conversationApi } from '../services/conversation';
import { pwaSocket } from '../services/socket';
import { ApiMessage, Message } from '../types';

type PendingUpload =
  | { kind: 'image' | 'video' | 'file'; file: File }
  | { kind: 'audio'; blob: Blob };

export const WEB_MESSAGE_LIMIT = 6;

interface UseChatOptions {
  conversationId: string | null;
  selfId: string | null;
  active: boolean; // only run effects when the chat screen is showing
}

export function useChat({ conversationId, selfId, active }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ── helpers ──

  const mapApiMessage = useCallback(
    (msg: ApiMessage, sid: string): Message => ({
      id: msg.id,
      text: msg.content,
      sender: msg.sender_id === sid ? 'self' : 'peer',
      timestamp: new Date(msg.created_at).getTime(),
      mediaUrl: msg.media_url,
      mediaType: msg.media_type,
      replyToMessageId: msg.reply_to_message_id,
      replyToContent: msg.reply_to_content,
      replyToSender:
        msg.reply_to_sender_id == null
          ? undefined
          : msg.reply_to_sender_id === sid
            ? 'self'
            : 'peer',
    }),
    [],
  );

  const normalizeMessages = useCallback((items: Message[]) => {
    const byId = new Map<string, Message>();
    for (const item of items) byId.set(item.id, item);
    return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, []);

  const beginUpload = (label: string) => {
    setIsUploadingMedia(true);
    setUploadLabel(label);
    setUploadProgress(0);
    setPendingUpload(null);
  };

  const finishUpload = () => {
    setIsUploadingMedia(false);
    setUploadLabel(null);
    setUploadProgress(null);
  };

  const appendMessage = useCallback(
    (msg: ApiMessage) => {
      if (!selfId) return;
      setMessages((prev) => normalizeMessages([...prev, mapApiMessage(msg, selfId)]));
    },
    [selfId, mapApiMessage, normalizeMessages],
  );

  // ── socket realtime ──

  useEffect(() => {
    if (!active || !conversationId || !selfId) return;

    pwaSocket.connect();
    pwaSocket.joinConversation(conversationId);
    const dispose = pwaSocket.onNewMessage((msg) => appendMessage(msg));
    return () => {
      dispose();
      pwaSocket.leaveConversation(conversationId);
    };
  }, [active, conversationId, selfId, appendMessage]);

  useEffect(() => {
    return () => {
      pwaSocket.disconnect();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── send text ──

  const handleSend = async () => {
    const limitReached = messages.filter((m) => m.sender === 'self').length >= WEB_MESSAGE_LIMIT;
    if (!conversationId || !input.trim() || limitReached || isUploadingMedia) return;
    const text = input.trim();
    setInput('');
    try {
      const msg = await conversationApi.sendMessage(
        conversationId,
        text,
        replyTo?.id,
      );
      appendMessage(msg);
      setReplyTo(null);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Erreur envoi');
      setInput(text);
    }
  };

  // ── media ──

  const handleOpenMediaPicker = () => mediaInputRef.current?.click();

  const handleMediaSelected = async (file: File | null) => {
    if (!file || !conversationId || !selfId) return;
    try {
      setChatError(null);
      beginUpload('Upload média');
      let msg: ApiMessage;
      if (file.type.startsWith('image/')) {
        msg = await conversationApi.sendImage(conversationId, file, setUploadProgress);
      } else if (file.type.startsWith('video/')) {
        msg = await conversationApi.sendVideo(conversationId, file, setUploadProgress);
      } else {
        msg = await conversationApi.sendFile(conversationId, file, setUploadProgress);
      }
      appendMessage(msg);
      finishUpload();
    } catch (err) {
      finishUpload();
      const kind: PendingUpload['kind'] = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'file';
      setPendingUpload({ kind, file });
      setChatError(err instanceof Error ? err.message : 'Erreur envoi média');
    }
  };

  const handleAudioClick = async () => {
    if (!conversationId || !selfId) return;
    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      setChatError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsRecordingAudio(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (!blob.size) return;
        try {
          beginUpload('Upload audio');
          const msg = await conversationApi.sendAudio(conversationId, blob, setUploadProgress);
          appendMessage(msg);
          finishUpload();
        } catch (err) {
          finishUpload();
          setPendingUpload({ kind: 'audio', blob });
          setChatError(err instanceof Error ? err.message : 'Erreur envoi audio');
        }
      };

      recorder.start();
    } catch (err) {
      setIsRecordingAudio(false);
      setChatError(err instanceof Error ? err.message : 'Micro indisponible');
    }
  };

  const handleRetryUpload = async () => {
    if (!pendingUpload || !conversationId || !selfId) return;
    try {
      setChatError(null);
      if (pendingUpload.kind === 'audio') {
        beginUpload('Upload audio');
        const msg = await conversationApi.sendAudio(conversationId, pendingUpload.blob, setUploadProgress);
        appendMessage(msg);
      } else if (pendingUpload.kind === 'image') {
        beginUpload('Upload image');
        const msg = await conversationApi.sendImage(conversationId, pendingUpload.file, setUploadProgress);
        appendMessage(msg);
      } else if (pendingUpload.kind === 'video') {
        beginUpload('Upload vidéo');
        const msg = await conversationApi.sendVideo(conversationId, pendingUpload.file, setUploadProgress);
        appendMessage(msg);
      } else {
        beginUpload('Upload fichier');
        const msg = await conversationApi.sendFile(conversationId, pendingUpload.file, setUploadProgress);
        appendMessage(msg);
      }
      setPendingUpload(null);
      finishUpload();
    } catch (err) {
      finishUpload();
      setChatError(err instanceof Error ? err.message : 'Échec du retry upload');
    }
  };

  // ── public ──

  const loadMessages = async (convId: string) => {
    if (!selfId) return;
    setChatLoading(true);
    try {
      const msgs = await conversationApi.getMessages(convId);
      setMessages(normalizeMessages(msgs.map((m) => mapApiMessage(m, selfId))));
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Erreur chargement');
    } finally {
      setChatLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setReplyTo(null);
    setInput('');
    setChatError(null);
    setChatLoading(false);
    setPendingUpload(null);
    setIsRecordingAudio(false);
    setIsUploadingMedia(false);
  };

  return {
    messages,
    setMessages,
    replyTo,
    setReplyTo,
    clearReplyTo: () => setReplyTo(null),
    chatLoading,
    setChatLoading,
    chatError,
    setChatError,
    input,
    setInput,
    isRecordingAudio,
    isUploadingMedia,
    uploadProgress,
    uploadLabel,
    pendingUpload,
    mediaInputRef,
    handleSend,
    handleOpenMediaPicker,
    handleMediaSelected,
    handleAudioClick,
    handleRetryUpload,
    loadMessages,
    reset,
    mapApiMessage,
    normalizeMessages,
    selfMessageCount: messages.filter((m) => m.sender === 'self').length,
    hasPeerReply: messages.some((m) => m.sender === 'peer'),
    hardLimitReached: messages.filter((m) => m.sender === 'self').length >= WEB_MESSAGE_LIMIT,
  };
}
