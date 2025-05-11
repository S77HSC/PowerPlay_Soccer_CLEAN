'use client';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function WebcamDetection({ onTouchDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [touches, setTouches] = useState(0);
  const lastTouchesRef = useRef(0);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    const interval = setInterval(() => {
      captureFrame();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        const res = await axios.post('http://localhost:8000/detect-football/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const newTouches = res.data.touches || 0;

        if (newTouches > lastTouchesRef.current) {
          if (onTouchDetected) {
            onTouchDetected();
          }
        }

        lastTouchesRef.current = newTouches;
        setTouches(newTouches);
      } catch (error) {
        console.error('Detection request failed:', error.message);
      }
    }, 'image/jpeg');
  };

  const resetTouches = async () => {
    try {
      await axios.post('http://localhost:8000/reset-touches/');
      setTouches(0);
    } catch (error) {
      console.error('Failed to reset touches:', error.message);
    }
  };

  return (
    <div style={{ width: 320, textAlign: 'center', fontSize: '16px' }}>
      <video
        ref={videoRef}
        width="320"
        height="240"
        autoPlay
        muted
        playsInline
        style={{ borderRadius: '8px', marginBottom: '0.5rem' }}
      />
      <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
      <div>
        <strong>Touches:</strong> {touches}
      </div>
      <button
        onClick={resetTouches}
        style={{ marginTop: 8, padding: '6px 12px', fontSize: '14px', cursor: 'pointer' }}
      >
        Reset Touches
      </button>
    </div>
  );
}
