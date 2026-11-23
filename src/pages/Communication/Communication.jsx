import React, { useEffect, useRef, useState } from 'react';
import '../../styles/AdminPages.css';
import {
  FiSend,
  FiPaperclip,
  FiUsers,
  FiCheckCircle,
  FiMic,
  FiSquare,
  FiMessageCircle,
  FiEye,
  FiVolume2,
  FiPlay,
  FiPause,
  FiDownload,
  FiFileText,
  FiImage,
} from 'react-icons/fi';
import communicationService from '../../services/communicationService';

const GROUP_ID = 'GROUP-ALL';

const initials = (name) =>
  name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

const formatDuration = (seconds = 0) => {
  const value = Math.max(0, Number(seconds) || 0);

  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(value % 60)
    .toString()
    .padStart(2, '0')}`;
};

const formatFileSize = (bytes = 0) => {
  const value = Number(bytes) || 0;

  if (value < 1024) return `${value} B`;

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const encodeWav = (samples, sampleRate) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  const write16 = (offset, value) =>
    view.setUint16(offset, value, true);

  const write32 = (offset, value) =>
    view.setUint32(offset, value, true);

  writeString(0, 'RIFF');
  write32(4, 36 + samples.length * 2);
  writeString(8, 'WAVE');

  writeString(12, 'fmt ');
  write32(16, 16);
  write16(20, 1);
  write16(22, 1);
  write32(24, sampleRate);
  write32(28, sampleRate * 2);
  write16(32, 2);
  write16(34, 16);

  writeString(36, 'data');
  write32(40, samples.length * 2);

  let offset = 44;

  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));

    view.setInt16(
      offset,
      sample < 0
        ? sample * 0x8000
        : sample * 0x7fff,
      true
    );

    offset += 2;
  }

  return new Blob([buffer], {
    type: 'audio/wav',
  });
};

/* =========================
   VOICE PLAYER
========================= */

const VoicePlayer = ({
  src,
  duration,
  compact = false,
}) => {
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(
    Number(duration) || 0
  );
  const [ready, setReady] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return undefined;

    setReady(false);
    setFailed(false);
    setPlaying(false);
    setCurrent(0);
    setBuffered(0);

    if (Number(duration) > 0) {
      setTotal(Number(duration));
    }

    audio.load();

    return undefined;
  }, [src, duration]);

  const updateBuffered = (audio) => {
    try {
      if (audio.buffered.length) {
        setBuffered(
          audio.buffered.end(
            audio.buffered.length - 1
          )
        );
      }
    } catch (_) {}
  };

  const toggle = async () => {
    const audio = audioRef.current;

    if (!audio || failed) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err) {
      console.error(
        'Audio playback error:',
        err
      );

      setFailed(true);
      setPlaying(false);
    }
  };

  const seek = (event) => {
    const value = Number(event.target.value);

    if (
      audioRef.current &&
      Number.isFinite(value)
    ) {
      audioRef.current.currentTime = value;
    }

    setCurrent(value);
  };

  return (
    <div
      className={`comm-voice-card ${
        compact ? 'compact' : ''
      } ${failed ? 'failed' : ''}`}
    >
      <button
        type="button"
        className="comm-voice-play"
        onClick={toggle}
        disabled={!ready || failed}
        aria-label={
          playing
            ? 'Pause voice message'
            : 'Play voice message'
        }
      >
        {playing ? (
          <FiPause size={17} />
        ) : (
          <FiPlay size={17} />
        )}
      </button>

      <div className="comm-voice-body">
        <div className="comm-voice-track">
          <div
            className="comm-voice-wave"
            aria-hidden="true"
          >
            {Array.from({
              length: 30,
            }).map((_, index) => (
              <span
                key={index}
                style={{
                  height: `${
                    7 +
                    ((index * 17) % 17)
                  }px`,
                }}
              />
            ))}
          </div>

          <div
            className="comm-voice-buffer"
            style={{
              width: `${
                total > 0
                  ? Math.min(
                      100,
                      (buffered / total) *
                        100
                    )
                  : 0
              }%`,
            }}
          />

          <div
            className="comm-voice-progress"
            style={{
              width: `${
                total > 0
                  ? Math.min(
                      100,
                      (current / total) *
                        100
                    )
                  : 0
              }%`,
            }}
          />
        </div>

        <input
          className="comm-voice-range"
          aria-label="Voice message progress"
          type="range"
          min="0"
          max={Math.max(total, 0.01)}
          step="0.01"
          value={Math.min(
            current,
            total || 0
          )}
          onChange={seek}
          disabled={!ready || failed}
        />

        <div className="comm-voice-times">
          <span>
            {formatDuration(current)}
          </span>

          <span>
            {formatDuration(total)}
          </span>
        </div>

        {failed && (
          <div className="comm-voice-error">
            Audio could not be loaded
            completely.
          </div>
        )}
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        playsInline
        onLoadedMetadata={(event) => {
          const value = Number(
            event.currentTarget.duration
          );

          if (
            Number.isFinite(value) &&
            value > 0
          ) {
            setTotal(value);
          }

          setReady(
            Number.isFinite(value) &&
              value > 0
          );
        }}
        onCanPlayThrough={(event) => {
          const value = Number(
            event.currentTarget.duration
          );

          if (
            Number.isFinite(value) &&
            value > 0
          ) {
            setTotal(value);
          }

          setReady(true);

          updateBuffered(
            event.currentTarget
          );
        }}
        onProgress={(event) =>
          updateBuffered(
            event.currentTarget
          )
        }
        onTimeUpdate={(event) => {
          setCurrent(
            event.currentTarget.currentTime ||
              0
          );

          updateBuffered(
            event.currentTarget
          );
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onError={(event) => {
          console.error(
            'Audio load error:',
            event.currentTarget.error
          );

          setFailed(true);
          setReady(false);
          setPlaying(false);
        }}
        style={{
          display: 'none',
        }}
      />
    </div>
  );
};

/* =========================
   FILE CARD
========================= */

const attachmentIcon = (type = '') =>
  type.startsWith('image/') ? (
    <FiImage />
  ) : (
    <FiFileText />
  );

const FileCard = ({
  message,
  onOpen,
}) => {
  const type =
    message.attachmentContentType || '';

  const image =
    type.startsWith('image/');

  return (
    <div
      style={{
        minWidth: 250,
        maxWidth: 330,
      }}
    >
      {image &&
        message.__attachmentUrl && (
          <div
            style={{
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 8,
              background: '#f3f4f6',
            }}
          >
            <img
              src={message.__attachmentUrl}
              alt={
                message.attachmentName ||
                'image'
              }
              style={{
                display: 'block',
                width: '100%',
                maxHeight: 240,
                objectFit: 'cover',
                cursor: 'pointer',
              }}
              onClick={onOpen}
            />
          </div>
        )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          background:
            'rgba(0,0,0,.04)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background:
              'rgba(37,99,235,.12)',
            color: '#2563eb',
          }}
        >
          {attachmentIcon(type)}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {message.attachmentName ||
              'Attachment'}
          </div>

          <div
            style={{
              fontSize: 11,
              opacity: 0.65,
              marginTop: 2,
            }}
          >
            {type || 'File'}

            {message.attachmentSizeBytes
              ? ` • ${formatFileSize(
                  message.attachmentSizeBytes
                )}`
              : ''}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          title="Open / download"
          style={{
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          <FiDownload />
        </button>
      </div>
    </div>
  );
};

/* =========================
   COMMUNICATION
========================= */

const Communication = () => {
  const currentUser = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  const [activeChat, setActiveChat] =
    useState(GROUP_ID);

  const [viewMode, setViewMode] =
    useState('chat');

  const [participants, setParticipants] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [
    monitorConversations,
    setMonitorConversations,
  ] = useState([]);

  const [monitorActive, setMonitorActive] =
    useState(null);

  const [draft, setDraft] = useState('');

  const [announcement, setAnnouncement] =
    useState('');

  const [showAnnounce, setShowAnnounce] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState('');

  const [isRecording, setIsRecording] =
    useState(false);

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  const [voicePreview, setVoicePreview] =
    useState(null);

  const [
    voiceUrls,
    setVoiceUrls,
  ] = useState({});

  const [
    attachmentUrls,
    setAttachmentUrls,
  ] = useState({});

  const recordingSecondsRef = useRef(0);

  const bottomRef = useRef(null);

  const streamRef = useRef(null);

  const timerRef = useRef(null);

  const audioContextRef = useRef(null);

  const audioSourceRef = useRef(null);

  const audioProcessorRef = useRef(null);

  const audioSinkRef = useRef(null);

  const audioSamplesRef = useRef([]);

  const attachmentUrlCacheRef =
    useRef(new Map());

  /* =========================
     LOAD PARTICIPANTS
  ========================= */

  const loadParticipants = async () => {
    try {
      const data =
        await communicationService.getParticipants();

      setParticipants(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        'Communication participants error:',
        err
      );

      setError(
        err.message ||
          'Failed to load participants'
      );
    }
  };

  const loadMonitorConversations =
    async () => {
      try {
        const data =
          await communicationService.getMonitorConversations();

        setMonitorConversations(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          'Monitor conversations error:',
          err
        );

        setError(
          err.message ||
            'Failed to load monitored conversations'
        );
      }
    };

  const loadMessages = async (
    chatId = activeChat
  ) => {
    try {
      const data =
        await communicationService.getMessages(
          chatId
        );

      const list = Array.isArray(data)
        ? data
        : [];

      setMessages(list);

      const unread = list.filter(
        (message) =>
          message.senderUsername !==
            currentUser.username &&
          !(
            message.readBy || []
          ).includes(
            currentUser.username
          )
      );

      for (const message of unread) {
        try {
          await communicationService.markRead(
            message.id
          );
        } catch (readError) {
          console.warn(
            'Read update failed:',
            readError
          );
        }
      }
    } catch (err) {
      console.error(
        'Communication messages error:',
        err
      );

      setError(
        err.message ||
          'Failed to load messages'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMonitorMessages = async (
    conversation
  ) => {
    if (!conversation) return;

    try {
      setLoading(true);

      const data =
        await communicationService.getMonitorMessages(
          conversation.firstUsername,
          conversation.secondUsername
        );

      setMessages(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        'Monitor messages error:',
        err
      );

      setError(
        err.message ||
          'Failed to load monitored chat'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadParticipants();
    loadMonitorConversations();
    loadMessages(GROUP_ID);

    const timer = setInterval(() => {
      loadParticipants();
      loadMonitorConversations();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewMode !== 'chat') {
      return undefined;
    }

    loadMessages(activeChat);

    const timer = setInterval(
      () => loadMessages(activeChat),
      2000
    );

    return () => clearInterval(timer);
  }, [activeChat, viewMode]);

  useEffect(() => {
    if (
      viewMode !== 'monitor' ||
      !monitorActive
    ) {
      return undefined;
    }

    loadMonitorMessages(
      monitorActive
    );

    const timer = setInterval(
      () =>
        loadMonitorMessages(
          monitorActive
        ),
      2000
    );

    return () => clearInterval(timer);
  }, [monitorActive, viewMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages.length]);

  /* =========================
     LOAD ATTACHMENTS
  ========================= */

  useEffect(() => {
    let cancelled = false;

    const loadAttachments = async () => {
      const nextVoice = {};
      const nextFiles = {};
      const neededIds = new Set();

      for (const message of messages) {
        if (!message.attachmentId) continue;

        const type =
          message.attachmentContentType || '';

        if (
          message.type !== 'VOICE' &&
          !type.startsWith('image/')
        ) {
          continue;
        }

        neededIds.add(
          message.attachmentId
        );

        try {
          let url =
            attachmentUrlCacheRef.current.get(
              message.attachmentId
            );

          if (!url) {
            url =
              await communicationService.getAttachmentBlobUrl(
                message.attachmentId,
                message.attachmentSizeBytes
              );

            attachmentUrlCacheRef.current.set(
              message.attachmentId,
              url
            );
          }

          if (message.type === 'VOICE') {
            nextVoice[message.id] = url;
          } else {
            nextFiles[message.id] = url;
          }
        } catch (err) {
          console.warn(
            'Attachment preview failed:',
            err
          );
        }
      }

      for (const [
        id,
        url,
      ] of attachmentUrlCacheRef.current.entries()) {
        if (!neededIds.has(id)) {
          URL.revokeObjectURL(url);

          attachmentUrlCacheRef.current.delete(
            id
          );
        }
      }

      if (!cancelled) {
        setVoiceUrls(nextVoice);
        setAttachmentUrls(nextFiles);
      }
    };

    loadAttachments();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  /* =========================
     CLEANUP
  ========================= */

  useEffect(() => {
    return () => {
      for (const url of attachmentUrlCacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }

      attachmentUrlCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      audioProcessorRef.current?.disconnect();

      audioSourceRef.current?.disconnect();

      audioSinkRef.current?.disconnect();

      audioContextRef.current
        ?.close()
        .catch(() => {});

      if (voicePreview?.url) {
        URL.revokeObjectURL(
          voicePreview.url
        );
      }
    };
  }, []);

  /* =========================
     SEND TEXT
  ========================= */

  const send = async () => {
    if (
      !draft.trim() ||
      sending ||
      isRecording ||
      viewMode !== 'chat'
    ) {
      return;
    }

    try {
      setSending(true);
      setError('');

      const isGroup =
        activeChat === GROUP_ID;

      await communicationService.sendMessage({
        recipientType: isGroup
          ? 'GROUP'
          : 'DIRECT',

        recipientUsername: isGroup
          ? null
          : activeChat,

        text: draft.trim(),

        type: 'CHAT',
      });

      setDraft('');

      await loadMessages(activeChat);

      await loadParticipants();
    } catch (err) {
      console.error(
        'Send communication error:',
        err
      );

      setError(
        err.message ||
          'Failed to send message'
      );
    } finally {
      setSending(false);
    }
  };

  /* =========================
     ANNOUNCEMENT
  ========================= */

  const sendAnnouncement = async () => {
    if (
      !announcement.trim() ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError('');

      await communicationService.sendAnnouncement(
        announcement.trim()
      );

      setAnnouncement('');

      setShowAnnounce(false);

      setViewMode('chat');

      setActiveChat(GROUP_ID);

      await loadMessages(GROUP_ID);

      await loadParticipants();
    } catch (err) {
      console.error(
        'Announcement error:',
        err
      );

      setError(
        err.message ||
          'Failed to send announcement'
      );
    } finally {
      setSending(false);
    }
  };

  /* =========================
     SEND FILE
  ========================= */

  const sendFile = async (event) => {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (
      !file ||
      sending ||
      isRecording ||
      viewMode !== 'chat'
    ) {
      return;
    }

    try {
      setSending(true);
      setError('');

      if (
        file.size >
        50 * 1024 * 1024
      ) {
        throw new Error(
          'Maximum file size is 50 MB.'
        );
      }

      const uploaded =
        await communicationService.uploadAttachment(
          file
        );

      const storedSize = Number(
        uploaded?.sizeBytes || 0
      );

      if (storedSize !== file.size) {
        throw new Error(
          `File upload is incomplete (${storedSize} of ${file.size} bytes).`
        );
      }

      const isGroup =
        activeChat === GROUP_ID;

      await communicationService.sendMessage({
        recipientType: isGroup
          ? 'GROUP'
          : 'DIRECT',

        recipientUsername: isGroup
          ? null
          : activeChat,

        text: file.name,

        type: 'FILE',

        attachmentId:
          uploaded.attachmentId,

        attachmentName:
          uploaded.fileName,

        attachmentContentType:
          uploaded.contentType,

        attachmentSizeBytes:
          uploaded.sizeBytes,
      });

      await loadMessages(activeChat);

      await loadParticipants();
    } catch (err) {
      console.error(
        'File send error:',
        err
      );

      setError(
        err.message ||
          'Failed to send file'
      );
    } finally {
      setSending(false);
    }
  };

  /* =========================
     DISCARD VOICE PREVIEW
     FIXED FUNCTION
  ========================= */

  const discardVoicePreview = () => {
    setVoicePreview((previous) => {
      if (previous?.url) {
        URL.revokeObjectURL(
          previous.url
        );
      }

      return null;
    });

    setRecordingSeconds(0);

    recordingSecondsRef.current = 0;
  };

  /* =========================
     SEND VOICE
  ========================= */

  const finishVoiceSend = async (
    blob,
    duration
  ) => {
    try {
      setSending(true);
      setError('');

      const mimeType =
        blob.type || 'audio/wav';

      const extension =
        mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('mp4')
          ? 'm4a'
          : mimeType.includes('wav')
          ? 'wav'
          : 'webm';

      const file = new File(
        [blob],
        `voice-${Date.now()}.${extension}`,
        {
          type: mimeType,
        }
      );

      if (
        file.size >
        50 * 1024 * 1024
      ) {
        throw new Error(
          'Maximum file size is 50 MB.'
        );
      }

      const uploaded =
        await communicationService.uploadAttachment(
          file
        );

      const storedSize = Number(
        uploaded?.sizeBytes || 0
      );

      if (storedSize !== file.size) {
        throw new Error(
          `Voice upload is incomplete (${storedSize} of ${file.size} bytes). Please record again.`
        );
      }

      const isGroup =
        activeChat === GROUP_ID;

      await communicationService.sendMessage({
        recipientType: isGroup
          ? 'GROUP'
          : 'DIRECT',

        recipientUsername: isGroup
          ? null
          : activeChat,

        text: 'Voice message',

        type: 'VOICE',

        attachmentId:
          uploaded.attachmentId,

        attachmentName:
          uploaded.fileName,

        attachmentContentType:
          uploaded.contentType,

        durationSeconds: duration,

        attachmentSizeBytes:
          uploaded.sizeBytes,
      });

      discardVoicePreview();

      await loadMessages(activeChat);

      await loadParticipants();
    } catch (err) {
      console.error(
        'Voice send error:',
        err
      );

      setError(
        err.message ||
          'Failed to send voice message'
      );
    } finally {
      setSending(false);
    }
  };

  /* =========================
     START RECORDING
  ========================= */

  const startRecording = async () => {
    if (
      isRecording ||
      sending
    ) {
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioContext ===
        'undefined'
    ) {
      setError(
        'Voice recording is not supported in this browser.'
      );

      return;
    }

    try {
      setError('');

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        );

      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      const context =
        new AudioCtx();

      await context.resume();

      const source =
        context.createMediaStreamSource(
          stream
        );

      const processor =
        context.createScriptProcessor(
          4096,
          1,
          1
        );

      const sink =
        context.createGain();

      sink.gain.value = 0;

      audioSamplesRef.current = [];

      processor.onaudioprocess = (
        event
      ) => {
        const input =
          event.inputBuffer.getChannelData(
            0
          );

        audioSamplesRef.current.push(
          new Float32Array(input)
        );
      };

      source.connect(processor);

      processor.connect(sink);

      sink.connect(
        context.destination
      );

      streamRef.current = stream;

      audioContextRef.current =
        context;

      audioSourceRef.current =
        source;

      audioProcessorRef.current =
        processor;

      audioSinkRef.current =
        sink;

      setRecordingSeconds(0);

      recordingSecondsRef.current = 0;

      setIsRecording(true);

      timerRef.current = setInterval(
        () => {
          recordingSecondsRef.current += 1;

          setRecordingSeconds(
            recordingSecondsRef.current
          );
        },
        1000
      );
    } catch (err) {
      console.error(
        'Recording start error:',
        err
      );

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;

      setError(
        err.message ||
          'Microphone permission is required.'
      );

      setIsRecording(false);
    }
  };

  /* =========================
     STOP RECORDING
  ========================= */

  const stopRecording = async () => {
    if (!isRecording) return;

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );
    }

    timerRef.current = null;

    const samples =
      audioSamplesRef.current;

    const context =
      audioContextRef.current;

    const sampleRate =
      context?.sampleRate || 48000;

    try {
      audioProcessorRef.current?.disconnect();

      audioSourceRef.current?.disconnect();

      audioSinkRef.current?.disconnect();
    } catch (_) {}

    streamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    streamRef.current = null;

    try {
      await context?.close();
    } catch (_) {}

    audioContextRef.current = null;

    audioSourceRef.current = null;

    audioProcessorRef.current = null;

    audioSinkRef.current = null;

    audioSamplesRef.current = [];

    setIsRecording(false);

    const totalSamples =
      samples.reduce(
        (sum, chunk) =>
          sum + chunk.length,
        0
      );

    if (!totalSamples) {
      setError(
        'No audio was captured. Please record again.'
      );

      return;
    }

    const merged =
      new Float32Array(
        totalSamples
      );

    let offset = 0;

    for (const chunk of samples) {
      merged.set(chunk, offset);

      offset += chunk.length;
    }

    const blob = encodeWav(
      merged,
      sampleRate
    );

    const duration =
      Math.max(
        1,
        merged.length / sampleRate
      );

    const url =
      URL.createObjectURL(blob);

    setVoicePreview((previous) => {
      if (previous?.url) {
        URL.revokeObjectURL(
          previous.url
        );
      }

      return {
        blob,
        url,
        duration,
      };
    });

    setRecordingSeconds(
      Math.round(duration)
    );

    recordingSecondsRef.current =
      Math.round(duration);

    setError('');
  };

  /* =========================
     VOICE PREVIEW ACTIONS
  ========================= */

  const sendVoicePreview = async () => {
    if (
      !voicePreview ||
      sending
    ) {
      return;
    }

    await finishVoiceSend(
      voicePreview.blob,
      voicePreview.duration
    );
  };

  const recordAgain = () => {
    discardVoicePreview();

    setTimeout(() => {
      startRecording();
    }, 0);
  };

  /* =========================
     RENDER MESSAGE
  ========================= */

  const renderMessage = (
    message
  ) => {
    const mine =
      message.senderUsername ===
      currentUser.username;

    const read =
      (message.readBy || [])
        .length > 1;

    return (
      <div
        key={message.id}
        className={`comm-msg ${
          mine ? 'out' : 'in'
        }`}
      >
        {!mine && (
          <div
            style={{
              fontWeight: 700,
              fontSize: 11,
              marginBottom: 3,
            }}
          >
            {message.senderName}
          </div>
        )}

        {message.type ===
          'ANNOUNCEMENT' && (
          <div
            style={{
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            📢 Announcement
          </div>
        )}

        {message.type ===
        'VOICE' ? (
          <div
            style={{
              padding: '4px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 5,
              }}
            >
              <FiVolume2 size={15} />
              Voice message
            </div>

            {voiceUrls[
              message.id
            ] ? (
              <VoicePlayer
                src={
                  voiceUrls[
                    message.id
                  ]
                }
                duration={
                  message.durationSeconds
                }
              />
            ) : (
              <span
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                Loading audio...
              </span>
            )}
          </div>
        ) : message.type ===
            'FILE' &&
          message.attachmentId ? (
          <FileCard
            message={{
              ...message,
              __attachmentUrl:
                attachmentUrls[
                  message.id
                ],
            }}
            onOpen={() =>
              communicationService
                .openAttachment(
                  message.attachmentId
                )
                .catch((err) =>
                  setError(
                    err.message
                  )
                )
            }
          />
        ) : (
          message.text && (
            <div
              style={{
                whiteSpace:
                  'pre-wrap',
                wordBreak:
                  'break-word',
              }}
            >
              {message.text}
            </div>
          )
        )}

        <div className="comm-msg-meta">
          {message.createdAt
            ? new Date(
                message.createdAt
              ).toLocaleTimeString(
                'en-IN',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )
            : ''}

          {mine && (
            <span
              style={{
                marginLeft: 5,
              }}
            >
              {read ? (
                <FiCheckCircle
                  size={11}
                />
              ) : (
                '· sent'
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  const activeChatInfo =
    participants.find(
      (participant) =>
        participant.id ===
        activeChat
    );

  const telecallers =
    participants.filter(
      (participant) =>
        participant.chatCategory ===
        'TELECALLER'
    );

  const monitorTitle =
    monitorActive
      ? `${monitorActive.firstName} ↔ ${monitorActive.secondName}`
      : 'Telecaller Monitoring';

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <div className="ap-title">
            Communication
          </div>

          <div className="ap-subtitle">
            Group chat, direct
            conversations, voice messages
            and Super Admin monitoring.
          </div>
        </div>

        <button
          className="ap-btn-primary"
          onClick={() =>
            setShowAnnounce(true)
          }
        >
          <FiUsers />
          Send Announcement
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      <div className="comm-layout">
        <div className="comm-list">
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 10,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setViewMode('chat')
              }
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 7,
                border:
                  '1px solid #ddd',
                background:
                  viewMode === 'chat'
                    ? '#f3f4f6'
                    : '#fff',
                fontWeight: 700,
              }}
            >
              <FiMessageCircle />
              Chats
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode('monitor')
              }
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 7,
                border:
                  '1px solid #ddd',
                background:
                  viewMode ===
                  'monitor'
                    ? '#f3f4f6'
                    : '#fff',
                fontWeight: 700,
              }}
            >
              <FiEye />
              Monitor
            </button>
          </div>

          {viewMode ===
          'chat' ? (
            <>
              <div
                style={{
                  padding:
                    '10px 12px',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#666',
                }}
              >
                GROUP
              </div>

              {participants
                .filter(
                  (participant) =>
                    participant.group
                )
                .map(
                  (participant) => (
                    <ChatListItem
                      key={
                        participant.id
                      }
                      participant={
                        participant
                      }
                      activeChat={
                        activeChat
                      }
                      setActiveChat={
                        setActiveChat
                      }
                    />
                  )
                )}

              <div
                style={{
                  padding:
                    '14px 12px 8px',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#666',
                }}
              >
                TELECALLERS
              </div>

              {telecallers.map(
                (participant) => (
                  <ChatListItem
                    key={
                      participant.id
                    }
                    participant={
                      participant
                    }
                    activeChat={
                      activeChat
                    }
                    setActiveChat={
                      setActiveChat
                    }
                  />
                )
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  padding:
                    '10px 12px',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#666',
                }}
              >
                ONE-TO-ONE TELECALLER
                CHATS
              </div>

              {monitorConversations.length ===
                0 && (
                <div
                  className="ap-empty"
                  style={{
                    padding: 20,
                  }}
                >
                  No Telecaller-to-Telecaller
                  conversations yet.
                </div>
              )}

              {monitorConversations.map(
                (conversation) => (
                  <div
                    key={
                      conversation.id
                    }
                    className={`comm-list-item ${
                      monitorActive?.id ===
                      conversation.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setMonitorActive(
                        conversation
                      );

                      setViewMode(
                        'monitor'
                      );
                    }}
                  >
                    <div className="comm-avatar">
                      <FiUsers
                        size={15}
                      />
                    </div>

                    <div className="comm-list-info">
                      <div className="comm-name">
                        {
                          conversation.firstName
                        }
                        {' ↔ '}
                        {
                          conversation.secondName
                        }
                      </div>

                      <div className="comm-sub">
                        {conversation.lastMessageType ===
                        'VOICE'
                          ? '🎙 Voice message'
                          : conversation.lastMessageText ||
                            'Conversation'}
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>

        <div className="comm-window">
          <div className="comm-window-head">
            <span>
              {viewMode === 'monitor'
                ? monitorTitle
                : activeChatInfo?.name ||
                  'Communication'}
            </span>

            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                marginLeft: 10,
                color: '#666',
              }}
            >
              {viewMode === 'monitor'
                ? 'Read-only monitoring'
                : activeChatInfo?.group
                  ? 'Group Chat'
                  : 'One-to-One Chat'}
            </span>
          </div>

          <div className="comm-messages">
            {loading &&
              messages.length === 0 && (
                <div className="ap-empty">
                  Loading messages...
                </div>
              )}

            {!loading &&
              messages.length === 0 && (
                <div className="ap-empty">
                  No messages yet.
                </div>
              )}

            {messages.map(
              renderMessage
            )}

            <div ref={bottomRef} />
          </div>

          {viewMode ===
          'chat' ? (
            <div
              className="comm-input-row"
              style={{
                background: '#f0f2f5',
                borderRadius: 14,
                padding: 8,
                gap: 7,
              }}
            >
              <label
                className="ap-btn-icon"
                style={{
                  cursor:
                    sending ||
                    isRecording
                      ? 'not-allowed'
                      : 'pointer',
                }}
                title="Attach file"
              >
                <FiPaperclip
                  size={16}
                />

                <input
                  type="file"
                  accept="*/*"
                  disabled={
                    sending ||
                    isRecording
                  }
                  style={{
                    display: 'none',
                  }}
                  onChange={sendFile}
                />
              </label>

              {voicePreview ? (
                <div className="comm-voice-preview">
                  <VoicePlayer
                    src={
                      voicePreview.url
                    }
                    duration={
                      voicePreview.duration
                    }
                  />

                  <button
                    type="button"
                    className="comm-preview-action danger"
                    onClick={
                      discardVoicePreview
                    }
                    disabled={sending}
                    title="Discard recording"
                  >
                    ✕
                  </button>

                  <button
                    type="button"
                    className="comm-preview-action"
                    onClick={recordAgain}
                    disabled={sending}
                    title="Record again"
                  >
                    <FiMic
                      size={15}
                    />
                  </button>

                  <button
                    type="button"
                    className="comm-preview-send"
                    onClick={
                      sendVoicePreview
                    }
                    disabled={sending}
                    title="Send voice message"
                  >
                    <FiSend
                      size={15}
                    />
                  </button>
                </div>
              ) : isRecording ? (
                <div className="comm-recording-live">
                  <span className="comm-recording-dot" />

                  <strong>
                    {formatDuration(
                      recordingSeconds
                    )}
                  </strong>

                  <span>
                    Recording voice
                    message…
                  </span>

                  <button
                    type="button"
                    className="comm-stop-recording"
                    onClick={
                      stopRecording
                    }
                    disabled={sending}
                    title="Stop recording"
                  >
                    <FiSquare
                      size={14}
                    />
                    Stop
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={
                      startRecording
                    }
                    disabled={sending}
                    title="Record voice message"
                  >
                    <FiMic
                      size={16}
                    />
                  </button>

                  <input
                    placeholder="Type a message..."
                    value={draft}
                    disabled={sending}
                    onChange={(event) =>
                      setDraft(
                        event.target.value
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          'Enter' &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();

                        send();
                      }
                    }}
                  />

                  <button
                    onClick={send}
                    disabled={
                      sending ||
                      !draft.trim()
                    }
                  >
                    <FiSend
                      size={15}
                    />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: 10,
                fontSize: 12,
                color: '#666',
                borderTop:
                  '1px solid #eee',
              }}
            >
              Monitoring mode is
              read-only. Telecallers
              continue communicating
              from their own chat
              screens.
            </div>
          )}
        </div>
      </div>

      {showAnnounce && (
        <div
          className="ap-modal-overlay"
          onClick={() =>
            setShowAnnounce(false)
          }
        >
          <div
            className="ap-modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="ap-modal-title">
              <span>
                Send Announcement to
                All Telecallers
              </span>

              <button
                className="ap-btn-icon"
                onClick={() =>
                  setShowAnnounce(false)
                }
              >
                ✕
              </button>
            </div>

            <div className="ap-form-group">
              <label>
                Message
              </label>

              <textarea
                rows={4}
                value={announcement}
                onChange={(event) =>
                  setAnnouncement(
                    event.target.value
                  )
                }
                placeholder="Write your announcement..."
              />
            </div>

            <div className="ap-form-actions">
              <button
                className="ap-btn-outline"
                onClick={() =>
                  setShowAnnounce(false)
                }
              >
                Cancel
              </button>

              <button
                className="ap-btn-primary"
                onClick={
                  sendAnnouncement
                }
                disabled={sending}
              >
                {sending
                  ? 'Sending...'
                  : 'Send to All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================
   CHAT LIST ITEM
========================= */

const ChatListItem = ({
  participant,
  activeChat,
  setActiveChat,
}) => {
  const unread = Number(
    participant.unreadCount || 0
  );

  return (
    <div
      className={`comm-list-item ${
        activeChat === participant.id
          ? 'active'
          : ''
      }`}
      onClick={() =>
        setActiveChat(
          participant.id
        )
      }
    >
      <div className="comm-avatar">
        {participant.group ? (
          <FiUsers size={15} />
        ) : (
          initials(
            participant.name
          )
        )}
      </div>

      <div className="comm-list-info">
        <div className="comm-name">
          {participant.name}

          {unread > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: '#dc2626',
                color: '#fff',
                borderRadius: 10,
                padding: '2px 7px',
                fontSize: 10,
              }}
            >
              {unread}
            </span>
          )}
        </div>

        <div className="comm-sub">
          {participant.group
            ? 'Group Chat'
            : 'Telecaller'}
        </div>
      </div>
    </div>
  );
};

export default Communication;