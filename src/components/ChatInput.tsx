// components/ChatInput.tsx
'use client';

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendVoice: (file: Blob) => void;
  onSendFile: (file: File) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendVoice,
  onSendFile,
}) => {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
    // reset so same file can be re-selected next time
    e.target.value = '';
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Hidden file input */}
        <input
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* File Upload Button */}
        <button
          type="button"
          onClick={handleFileClick}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Paperclip size={20} />
        </button>

        {/* Text Input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Voice Recorder */}
        <VoiceRecorder onSave={onSendVoice} />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-full hover:from-blue-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
