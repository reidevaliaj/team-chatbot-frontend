import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

//
// 1) Extend Message interface to include both text and voice fields
//
interface Message {
  id: number;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'voice';
  text?: string;       // only present when type === 'text'
  voiceUrl?: string;   // only present when type === 'voice'
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Extract initials from sender name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // For voice messages: keep track of playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup on unmount: pause audio if it's still playing
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // When the audio naturally ends, reset to “not playing”
  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${message.isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-xs lg:max-w-md`}>
        {/* Other User’s Avatar */}
        {!message.isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xs font-semibold mr-2 mb-1">
            {getInitials(message.sender)}
          </div>
        )}

        {/* Message Content */}
        <div className="flex flex-col">
          {/* Sender Name (only for others' messages) */}
          {!message.isOwn && (
            <span className="text-xs text-gray-600 mb-1 ml-1 font-medium">
              {message.sender}
            </span>
          )}

          {/* Message Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl ${
              message.isOwn
                ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-br-md'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
            }`}
          >
            {message.type === 'voice' && message.voiceUrl ? (
              <div className="flex items-center space-x-2">
                {/* Hidden <audio> element: playback is controlled via the button below */}
                <audio
                  ref={audioRef}
                  src={message.voiceUrl}
                  onEnded={handleEnded}
                  className="hidden"
                />
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayback}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <span className="text-xs text-gray-600">
                  {message.timestamp}
                </span>
              </div>
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

        {/* Own Avatar */}
        {message.isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xs font-semibold ml-2 mb-1">
            {getInitials(message.sender)}
          </div>
        )}
      </div>
    </div>
  );
};
