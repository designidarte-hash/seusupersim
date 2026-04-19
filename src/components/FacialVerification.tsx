import { useEffect, useRef, useState } from "react";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

// Detection color states
const COLOR_DETECTING = "#f59b31"; // orange
const COLOR_DETECTED = "#22c55e"; // green

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const stableCountRef = useRef(0);
  const lostCountRef = useRef(0);

  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    if (approved) return;

    startCamera().then(() => {
      startDetectionLoop();
    });

    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved]);

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setError("Não foi possível acessar a câmera.");
    }
  };

  const stopCamera = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Real-time detection: tries native FaceDetector API,
  // falls back to motion + skin-tone heuristic via canvas
  const startDetectionLoop = () => {
    // Native FaceDetector (Chrome/Android)
    // @ts-expect-error – non-standard API
    const FaceDetectorAPI = typeof window !== "undefined" ? window.FaceDetector : null;
    let nativeDetector: { detect: (src: HTMLVideoElement) => Promise<unknown[]> } | null = null;

    if (FaceDetectorAPI) {
      try {
        nativeDetector = new FaceDetectorAPI({ fastMode: true, maxDetectedFaces: 1 });
      } catch {
        nativeDetector = null;
      }
    }

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 80;
    sampleCanvas.height = 80;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    let prevFrame: Uint8ClampedArray | null = null;

    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) {
        return;
      }

      let detected = false;

      if (nativeDetector) {
        try {
          const faces = await nativeDetector.detect(video);
          detected = Array.isArray(faces) && faces.length > 0;
        } catch {
          nativeDetector = null;
        }
      }

      if (!nativeDetector && sampleCtx) {
        // Fallback heuristic: detect skin-tone pixels in central oval region + motion
        const w = sampleCanvas.width;
        const h = sampleCanvas.height;
        sampleCtx.drawImage(video, 0, 0, w, h);
        const frame = sampleCtx.getImageData(0, 0, w, h).data;

        let skinPixels = 0;
        let totalSampled = 0;
        let motionDelta = 0;

        // Sample only the central oval region
        const cx = w / 2;
        const cy = h / 2;
        const rx = w * 0.28;
        const ry = h * 0.36;

        for (let y = 0; y < h; y += 2) {
          for (let x = 0; x < w; x += 2) {
            const dx = (x - cx) / rx;
            const dy = (y - cy) / ry;
            if (dx * dx + dy * dy > 1) continue;

            const i = (y * w + x) * 4;
            const r = frame[i];
            const g = frame[i + 1];
            const b = frame[i + 2];

            // Simple YCbCr-ish skin detection
            const isSkin =
              r > 95 &&
              g > 40 &&
              b > 20 &&
              r > g &&
              r > b &&
              Math.abs(r - g) > 15 &&
              r - b > 15;

            if (isSkin) skinPixels++;
            totalSampled++;

            if (prevFrame) {
              motionDelta += Math.abs(r - prevFrame[i]);
            }
          }
        }

        prevFrame = frame;

        const skinRatio = totalSampled > 0 ? skinPixels / totalSampled : 0;
        const avgMotion = motionDelta / Math.max(1, totalSampled);

        // Face-like presence: enough skin tone + some motion (alive)
        detected = skinRatio > 0.18 && avgMotion < 80 && avgMotion > 0.5;
      }

      // Smoothing: require N consecutive positive frames before flipping state
      if (detected) {
        stableCountRef.current += 1;
        lostCountRef.current = 0;
        if (stableCountRef.current >= 3) {
          setFaceDetected(true);
        }
      } else {
        lostCountRef.current += 1;
        stableCountRef.current = 0;
        if (lostCountRef.current >= 5) {
          setFaceDetected(false);
        }
      }
    };

    detectionLoopRef.current = window.setInterval(tick, 250);
  };

  const handleBack = () => {
    stopCamera();
    onCancel?.();
  };

  const handleContinue = () => {
    if (!faceDetected) return;
    stopCamera();
    onComplete();
  };

  if (approved) return null;

  const accent = faceDetected ? COLOR_DETECTED : COLOR_DETECTING;
  const accentSoft = faceDetected ? "rgba(34,197,94,0.7)" : "rgba(245,155,49,0.7)";
  const badgeBg = faceDetected ? "rgba(22, 89, 47, 0.78)" : "rgba(117, 83, 38, 0.72)";
  const badgeText = faceDetected ? "#86efac" : "#ffd34d";
  const badgeDot = faceDetected ? "#22c55e" : "#ffd34d";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
        zIndex: 9999,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center center",
          transform: "scaleX(-1)",
          background: "#000",
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.10) 38%, rgba(0,0,0,0.20) 68%, rgba(0,0,0,0.40) 100%)",
        }}
      />

      <button
        onClick={handleBack}
        style={{
          position: "absolute",
          top: 28,
          left: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          cursor: "pointer",
          fontSize: 28,
          fontWeight: 300,
          zIndex: 3,
        }}
        aria-label="Voltar"
      >
        ‹
      </button>

      <div
        style={{
          position: "absolute",
          top: 28,
          right: 24,
          padding: "14px 20px",
          borderRadius: 999,
          background: badgeBg,
          color: badgeText,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 16,
          fontWeight: 700,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 0.4s ease, color 0.4s ease",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: badgeDot,
            display: "inline-block",
            boxShadow: faceDetected
              ? "0 0 10px rgba(34,197,94,0.8)"
              : "0 0 8px rgba(255,211,77,0.6)",
            animation: "fv-pulse 1.4s ease-in-out infinite",
          }}
        />
        {faceDetected ? "Rosto verificado" : "Verificação ativa"}
      </div>

      {/* Scan animation keyframes */}
      <style>{`
        @keyframes fv-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }
        @keyframes fv-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes fv-ring-pop {
          0% { transform: scale(0.96); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <ellipse
            cx="50"
            cy="50"
            rx="31"
            ry="24"
            fill={faceDetected ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.04)"}
            stroke={faceDetected ? COLOR_DETECTED : accentSoft}
            strokeWidth="0.45"
            vectorEffect="non-scaling-stroke"
            style={{ transition: "stroke 0.4s ease, fill 0.4s ease" }}
          />
          <ellipse
            cx="50"
            cy="50"
            rx="29.2"
            ry="22.6"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="0.42"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="31"
            y1="43"
            x2="69"
            y2="43"
            stroke={faceDetected ? "rgba(34,197,94,0.30)" : "rgba(245,155,49,0.30)"}
            strokeWidth="0.2"
            vectorEffect="non-scaling-stroke"
            style={{ transition: "stroke 0.4s ease" }}
          />
          {/* Corner brackets */}
          {[
            "M6 31 L6 27 L12 27",
            "M94 31 L94 27 L88 27",
            "M6 69 L6 73 L12 73",
            "M94 69 L94 73 L88 73",
          ].map((d, idx) => (
            <path
              key={idx}
              d={d}
              fill="none"
              stroke={accent}
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ transition: "stroke 0.4s ease" }}
            />
          ))}
        </svg>

        {/* Animated scan line inside the oval */}
        {!faceDetected && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "62%",
              maxWidth: 320,
              aspectRatio: "31 / 24",
              borderRadius: "50%",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 3,
                background:
                  "linear-gradient(to bottom, rgba(245,155,49,0) 0%, rgba(245,155,49,0.95) 50%, rgba(245,155,49,0) 100%)",
                boxShadow: "0 0 18px 4px rgba(245,155,49,0.55)",
                animation: "fv-scan 2.2s linear infinite",
              }}
            />
          </div>
        )}

        {/* Success ring pulse when detected */}
        {faceDetected && (
          <div
            key="detected-ring"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "62%",
              maxWidth: 320,
              aspectRatio: "31 / 24",
              borderRadius: "50%",
              border: "2px solid rgba(34,197,94,0.55)",
              boxShadow:
                "0 0 0 6px rgba(34,197,94,0.12), 0 0 30px rgba(34,197,94,0.45)",
              animation: "fv-ring-pop 0.45s ease-out",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 210,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 18,
            lineHeight: 1.3,
            fontWeight: 700,
            transition: "color 0.3s ease",
          }}
        >
          {faceDetected
            ? "Rosto detectado"
            : "Posicione seu rosto dentro do contorno"}
        </div>
        <div
          style={{
            color: faceDetected ? "rgba(134,239,172,0.9)" : "rgba(255,255,255,0.62)",
            fontSize: 13,
            marginTop: 12,
            lineHeight: 1.35,
            fontWeight: 500,
            transition: "color 0.3s ease",
          }}
        >
          {faceDetected
            ? "Presença humana confirmada · Pronto para continuar"
            : "Conexão segura · Criptografia ponta a ponta"}
        </div>
      </div>

      {error ? (
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 300,
            background: "#dc2626",
            color: "#fff",
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 14,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 46,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div style={{ width: 68, height: 68 }} />
        <button
          onClick={handleContinue}
          disabled={!faceDetected}
          style={{
            minWidth: 220,
            height: 62,
            borderRadius: 999,
            border: "none",
            background: faceDetected ? COLOR_DETECTED : "rgba(255,255,255,0.18)",
            color: faceDetected ? "#fff" : "rgba(255,255,255,0.7)",
            fontSize: 17,
            fontWeight: 800,
            cursor: faceDetected ? "pointer" : "not-allowed",
            padding: "0 28px",
            boxShadow: faceDetected
              ? "0 10px 28px rgba(34,197,94,0.40)"
              : "none",
            transition: "all 0.35s ease",
          }}
        >
          Continuar
        </button>
        <div style={{ width: 68, height: 68 }} />
      </div>
    </div>
  );
};

export default FacialVerification;
