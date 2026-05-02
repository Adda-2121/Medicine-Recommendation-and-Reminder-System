import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, Video, X } from 'lucide-react';

/**
 * LiveSelfie
 * Props:
 *   onCapture(file: File) — called with the captured JPEG File
 *   onClear()             — called when the user retakes
 *   captured: boolean     — true if a photo is already held by the parent
 */
const LiveSelfie = ({ onCapture, onClear, captured }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 'idle' | 'live' | 'captured' | 'denied'
  const [camState, setCamState] = useState(captured ? 'captured' : 'idle');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopStream();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ── Open camera ───────────────────────────────────────────────────────────
  const openCamera = async () => {
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      // videoRef is always in the DOM (just hidden), so this is safe
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().then(() => {
          setCamState('live');
          setStarting(false);
        }).catch(() => {
          setCamState('denied');
          setStarting(false);
        });
      };
    } catch (err) {
      console.error('[LiveSelfie] getUserMedia error:', err.name, err.message);
      setCamState('denied');
      setStarting(false);
    }
  };

  // ── Countdown → capture ───────────────────────────────────────────────────
  const startCountdown = () => {
    let n = 3;
    setCountdown(n);
    countdownRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown(null);
        snap();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  // ── Snap frame from video ─────────────────────────────────────────────────
  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    // Draw mirrored so the saved image matches what the user saw
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    canvas.toBlob(
      blob => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopStream();
        setCamState('captured');
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  // ── Retake ────────────────────────────────────────────────────────────────
  const retake = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    stopStream();
    setCamState('idle');
    onClear();
  };

  const isLive = camState === 'live';

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          Live Selfie <span className="text-red-500">*</span>
        </label>
        {camState === 'captured' && (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle size={13} /> Photo captured
          </span>
        )}
      </div>

      {/* ── Always-mounted video + canvas (hidden when not live) ── */}
      <div className={`relative rounded-xl overflow-hidden bg-black border border-slate-200 ${isLive ? 'block' : 'hidden'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full block"
          style={{ transform: 'scaleX(-1)', minHeight: isLive ? '240px' : '0' }}
        />

        {/* Face-guide oval */}
        {isLive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="border-[3px] border-white/80 rounded-full"
              style={{
                width: '55%',
                height: '80%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }}
            />
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              key={countdown}
              className="text-white font-black drop-shadow-lg"
              style={{ fontSize: '5rem', lineHeight: 1, animation: 'selfie-pop 0.35s ease-out' }}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Bottom bar */}
        {isLive && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-3 flex items-center justify-between">
            <span className="text-white/80 text-xs flex items-center gap-1">
              <Video size={12} /> Centre your face in the oval
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={retake}
                className="text-white/70 hover:text-white text-xs flex items-center gap-1 transition"
              >
                <X size={13} /> Cancel
              </button>
              <button
                type="button"
                onClick={startCountdown}
                disabled={countdown !== null}
                className="bg-white text-slate-800 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-primary-50 transition disabled:opacity-50 flex items-center gap-1.5 shadow"
              >
                <Camera size={13} />
                {countdown !== null ? `${countdown}…` : 'Take Photo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── IDLE state ── */}
      {camState === 'idle' && (
        <button
          type="button"
          onClick={openCamera}
          disabled={starting}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary-300 bg-primary-50 hover:bg-primary-100 rounded-xl py-7 transition disabled:opacity-60"
        >
          {starting ? (
            <RefreshCw size={24} className="animate-spin text-primary-500" />
          ) : (
            <div className="bg-primary-100 p-3 rounded-full">
              <Camera size={24} className="text-primary-600" />
            </div>
          )}
          <span className="text-sm font-semibold text-primary-700">
            {starting ? 'Starting camera…' : 'Open Camera'}
          </span>
          {!starting && (
            <span className="text-xs text-slate-400">Browser will ask for camera permission</span>
          )}
        </button>
      )}

      {/* ── DENIED state ── */}
      {camState === 'denied' && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle size={15} /> Camera access denied
          </p>
          <p className="text-xs text-red-600">
            Allow camera access in your browser's address bar or site settings, then try again.
          </p>
          <button
            type="button"
            onClick={openCamera}
            className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={12} /> Try again
          </button>
        </div>
      )}

      {/* ── CAPTURED state ── */}
      {camState === 'captured' && previewUrl && (
        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400">
          <img src={previewUrl} alt="Your selfie" className="w-full block" />
          <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <CheckCircle size={12} /> Captured
          </div>
          <button
            type="button"
            onClick={retake}
            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1 transition"
          >
            <RefreshCw size={12} /> Retake
          </button>
        </div>
      )}

      {/* Keyframe for countdown pop animation */}
      <style>{`
        @keyframes selfie-pop {
          0%   { transform: scale(1.6); opacity: 0.4; }
          100% { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
};

export default LiveSelfie;
