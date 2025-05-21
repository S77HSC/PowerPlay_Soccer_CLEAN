
'use client';

import { useEffect, useRef, useState } from 'react';

let globalStream = null;

export default function WebcamDetection({ onTouchDetected, active }) {
  const videoRef = useRef(null);
  const lastTouchRef = useRef(Date.now());
  const [showTouch, setShowTouch] = useState(false);
  const touchCooldown = 600;

  const MODEL_ENDPOINT = process.env.NEXT_PUBLIC_MODEL_ENDPOINT || "https://powerplay-api.onrender.com/detect-football/";
  console.log("MODEL_ENDPOINT =", MODEL_ENDPOINT);

  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;
      if (globalStream) {
        videoRef.current.srcObject = globalStream;
        await videoRef.current.play();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        globalStream = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.setAttribute("autoplay", true);
        videoRef.current.setAttribute("muted", true);
        videoRef.current.muted = true;
        await videoRef.current.play();
      } catch (err) {
        console.error("Webcam access error:", err);
      }
    };

    setupCamera();
  }, []);

  useEffect(() => {
    let interval;

    const detect = async () => {
      console.log("[Detect] Running...");
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        try {
          const res = await fetch(MODEL_ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            body: formData
          });

          let result;
          try {
            result = await res.json();
          } catch (err) {
            console.error("Failed to parse JSON:", err);
            return;
          }

          console.log("[Detect] Response:", result);

          const predictions = result.predictions || [];
          const detected = predictions.some(p => p.class === 'sports ball' && p.confidence > 0.4);
          console.log("[Detect] Found:", predictions.length, "Detected?", detected);

          if (detected && Date.now() - lastTouchRef.current > touchCooldown) {
            console.log("[Detect] TOUCH!");
            lastTouchRef.current = Date.now();
            setShowTouch(true);
            if (onTouchDetected) onTouchDetected();
            setTimeout(() => setShowTouch(false), 500);
          }
        } catch (err) {
          console.error("[Detect] Error:", err);
        }
      }, 'image/jpeg');
    };

    if (active) {
      interval = setInterval(detect, 500);
    }

    return () => clearInterval(interval);
  }, [active, onTouchDetected]);

  return (
    <div className="relative">
      <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
      {showTouch && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-green-500 text-white font-bold text-xl px-4 py-2 rounded-xl shadow-lg animate-pulse">
            TOUCH!
          </div>
        </div>
      )}
    </div>
  );
}
