'use client';
import React, { useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceRecorderProps {
  onSave: (file: Blob) => void;
}

const InnerRecorder: React.FC<VoiceRecorderProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      if (!permissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setPermissionGranted(true);
      }
      if (!streamRef.current) return;

      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm; codecs=opus', audioBitsPerSecond: 96000 };
      const recorder = new MediaRecorder(streamRef.current, options);

      recorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSave(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionGranted(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
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

export const VoiceRecorder = React.memo(InnerRecorder);
