'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';

/* ---------- Types ---------- */
type MsgKind = 'text' | 'voice' | 'file' | 'typing';

interface Message {
  id:        number | string;
  sender:    string;
  timestamp: string;          // empty for typing stub
  isOwn:     boolean;
  type:      MsgKind;

  text?:      string;
  voiceUrl?:  string;
  fileUrl?:   string;
  filename?:  string;
}

interface Props { message: Message }

/* ---------- Component ---------- */
export const MessageBubble: React.FC<Props> = ({ message }) => {
  /* helpers */
  const initials = (name: string) =>
    name.split(' ').map(w => w[0].toUpperCase()).join('').slice(0, 2);

  const audioRef   = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying(!playing);
  };

  const isVideo = !!message.filename?.match(/\.(mp4|webm|ogg|mov)$/i);
  const isImage = !!message.filename?.match(/\.(png|jpe?g|gif|webp)$/i);

  /* ---------- Render ---------- */
  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex ${message.isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-xs lg:max-w-md`}
      >
        {/* avatar (left) */}
        {!message.isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xs font-semibold mr-2 mb-1">
            {initials(message.sender)}
          </div>
        )}

        {/* bubble */}
        <div className="flex flex-col">
          {!message.isOwn && (
            <span className="text-xs text-gray-600 mb-1 ml-1 font-medium">
              {message.sender}
            </span>
          )}

          <div
            className={`px-4 py-3 rounded-2xl ${
              message.isOwn
                ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-br-md'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
            }`}
          >
            {/* -------- typing stub -------- */}
            {message.type === 'typing' ? (
              <div className="flex space-x-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>

            /* -------- voice -------- */
            ) : message.type === 'voice' && message.voiceUrl ? (
              <div className="flex items-center space-x-2">
                <audio
                  ref={audioRef}
                  src={message.voiceUrl}
                  onEnded={() => setPlaying(false)}
                  className="hidden"
                />
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <span className="text-xs text-gray-500">{message.timestamp}</span>
              </div>

            /* -------- files -------- */
            ) : message.type === 'file' && message.fileUrl ? (
              isImage ? (
                /* image */
                <div className="flex flex-col space-y-2">
                  <img
                    src={message.fileUrl}
                    alt={message.filename ?? 'uploaded'}
                    className="max-w-full rounded-lg"
                  />
                  <span className={`text-xs ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </span>
                </div>
              ) : isVideo ? (
                /* video */
                <div className="flex flex-col space-y-2">
                  <video src={message.fileUrl} controls className="max-w-full rounded-lg" />
                  <span className={`text-xs ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </span>
                </div>
              ) : (
                /* other downloadable doc */
                <div className="flex items-center space-x-2">
                  <a
                    href={message.fileUrl}
                    download={message.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-medium text-blue-600 hover:underline"
                  >
                    <Download size={16} className="mr-1" />
                    {message.filename}
                  </a>
                  <span className={`text-xs ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </span>
                </div>
              )

            /* -------- plain text -------- */
            ) : (
              <>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp}
                </p>
              </>
            )}
          </div>
        </div>

        {/* avatar (right) */}
        {message.isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xs font-semibold ml-2 mb-1">
            {initials(message.sender)}
          </div>
        )}
      </div>
    </div>
  );
};
