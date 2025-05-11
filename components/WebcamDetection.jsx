'use client';

import { useEffect, useRef, useState } from 'react';

export default function WebcamDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStarted(true);
        console.log('✅ Camera started successfully');
      }
    } catch (err) {
      console.error('🚫 Camera error:', err);
      setErrorMsg('Unable to access camera. Please allow permissions or try another browser.');
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const response = await fetch('/api/detect-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      const result = await response.json();
      console.log('📸 Frame sent. Detection result:', result);
    } catch (error) {
      console.error('📉 Frame detection error:', error);
    }
  };

  useEffect(() => {
    if (!isIOS) {
      startCamera();
      const interval = setInterval(captureFrame, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-md border border-white/20"
      />
      <canvas ref={canvasRef} className="hidden" />

      {isIOS && !cameraStarted && (
        <div className="text-center mt-4">
          <button
            onClick={startCamera}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
          >
            📷 Start Camera
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 text-sm text-red-400 text-center">{errorMsg}</div>
      )}
    </div>
  );
}
