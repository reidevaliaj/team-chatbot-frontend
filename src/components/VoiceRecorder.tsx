'use client';
import React, { useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceRecorderProps {
  onSave: (file: Blob) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Refs can start as null
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // If we haven't yet obtained permission, ask now
      if (!permissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setPermissionGranted(true);
      }

      // At this point, streamRef.current should be set
      if (!streamRef.current) return;

      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm; codecs=opus', audioBitsPerSecond: 96000 };
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSave(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionGranted(false);
      // Optionally show a user-facing message here
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={toggleRecording}
      className={`p-2 rounded-full transition-all duration-200 ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};
