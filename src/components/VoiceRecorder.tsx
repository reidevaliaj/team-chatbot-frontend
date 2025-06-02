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
      // 1) If we don’t already have a stream, ask for user permission now
      if (!permissionGranted || !streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setPermissionGranted(true);
      }
      if (!streamRef.current) return;

      // 2) Clear any old chunks
      audioChunksRef.current = [];

      // 3) Create a new MediaRecorder on that stream
      const options = { mimeType: 'audio/webm; codecs=opus', audioBitsPerSecond: 96000 };
      const recorder = new MediaRecorder(streamRef.current, options);

      // 4) On dataavailable, collect chunks
      recorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      // 5) On stop, assemble the Blob and fire onSave
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSave(blob);
      };

      // 6) Save to ref and start
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
      // 1) Instruct the recorder to stop and finalize the Blob
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // 2) Now also stop every track in the MediaStream so the mic is released
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
        setPermissionGranted(false);
      }

      // 3) Clear out the MediaRecorder ref
      mediaRecorderRef.current = null;
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
