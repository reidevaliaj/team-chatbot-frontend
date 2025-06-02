'use client';
import React, { useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceRecorderProps {
  onSave: (file: Blob) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Refs to hold the MediaStream and MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // 1) If no permission yet, ask for microphone
      if (!permissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setPermissionGranted(true);
      }
      if (!streamRef.current) return;

      // 2) Reset any previous chunks
      audioChunksRef.current = [];

      // 3) Create a new MediaRecorder from the stream
      const options = { mimeType: 'audio/webm; codecs=opus', audioBitsPerSecond: 96000 };
      const recorder = new MediaRecorder(streamRef.current, options);

      // 4) When data is available, push it into audioChunksRef
      recorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      // 5) When stopped, combine chunks into one Blob and call onSave
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSave(blob);
      };

      // 6) Save the recorder to ref and start
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionGranted(false);
      // Optionally show an alert/toast here
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();    // this triggers onstop → onSave(blob)
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
