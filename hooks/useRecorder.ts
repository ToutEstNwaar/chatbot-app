import { useState, useRef, useCallback, useEffect } from 'react';

export const useRecorder = (onRecordingComplete: (blob: Blob) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wasCancelledRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
  }, []);


  const startRecording = useCallback(async () => {
    // Clean up any previous instances before starting
    cleanup();
    wasCancelledRef.current = false; // Reset cancellation flag
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // FIX: Cast `window` to `any` to allow access to the vendor-prefixed `webkitAudioContext` for older browser compatibility.
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0 && !wasCancelledRef.current) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            onRecordingComplete(audioBlob);
        }
        cleanup();
      };
      
      mediaRecorder.onpause = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorder.onresume = () => {
        timerIntervalRef.current = window.setInterval(() => {
            setRecordingTime(prevTime => prevTime + 1);
        }, 1000);
        visualize();
      };

      const visualize = () => {
        if (analyserRef.current) {
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);
            setAudioData(new Uint8Array(dataArray)); // Create new array to trigger re-render
        }
        animationFrameRef.current = requestAnimationFrame(visualize);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

      visualize();

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Microphone access was denied. Please allow microphone access in your browser settings.");
      cleanup();
    }
  }, [onRecordingComplete, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);
  
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      wasCancelledRef.current = true; // Set flag before stopping
      audioChunksRef.current = []; // Discard chunks
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, [cleanup]);

  const togglePauseResume = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
    } else {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(prev => !prev);
  }, [isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (isRecording) {
            cleanup();
        }
    };
  }, [isRecording, cleanup]);

  return { 
    isRecording, 
    isPaused,
    recordingTime,
    audioData,
    startRecording, 
    stopRecording, 
    cancelRecording,
    togglePauseResume 
  };
};