
import React from 'react';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Extract initials from sender name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${message.isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-xs lg:max-w-md`}>
        {/* User Avatar */}
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
          <div className={`px-4 py-3 rounded-2xl ${
            message.isOwn
              ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-br-md'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
          }`}>
            <p className="text-sm leading-relaxed">{message.text}</p>
            <p className={`text-xs mt-1 ${
              message.isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {message.timestamp}
            </p>
          </div>
        </div>

        {/* Own message avatar */}
        {message.isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xs font-semibold ml-2 mb-1">
            {getInitials(message.sender)}
          </div>
        )}
      </div>
    </div>
  );
};
