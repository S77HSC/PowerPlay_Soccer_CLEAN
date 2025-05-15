'use client';
import { useEffect, useRef } from 'react';

export default function WebcamDetection({ onTouchDetected }) {
  const videoRef = useRef(null);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('❌ Camera error:', err.message);
      }
    }

    initCamera();
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
    />
  );
}
