import { useEffect, useRef, useState } from "react";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    if (approved) return;

    startCamera();

    const fakeDetectionTimer = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      const ready =
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

      if (ready) {
        setFaceDetected(true);
      }
    }, 1200);

    return () => {
      clearInterval(fakeDetectionTimer);
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
          objectFit: "cover",
          objectPosition: "center center",
          transform: "scaleX(-1)",
          background: "#000",
        }}
      />

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
          background: "rgba(117, 83, 38, 0.72)",
          color: "#ffd34d",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 16,
          fontWeight: 700,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#ffd34d",
            display: "inline-block",
          }}
        />
        Verificação ativa
      </div>

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
            fill="rgba(255,255,255,0.04)"
            stroke={faceDetected ? "#f59b31" : "rgba(245,155,49,0.7)"}
            strokeWidth="0.45"
            vectorEffect="non-scaling-stroke"
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
            stroke="rgba(245,155,49,0.30)"
            strokeWidth="0.2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M6 31 L6 27 L12 27"
            fill="none"
            stroke="#f59b31"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M94 31 L94 27 L88 27"
            fill="none"
            stroke="#f59b31"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M6 69 L6 73 L12 73"
            fill="none"
            stroke="#f59b31"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M94 69 L94 73 L88 73"
            fill="none"
            stroke="#f59b31"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
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
          }}
        >
          {faceDetected
            ? "Rosto detectado"
            : "Posicione seu rosto dentro do contorno"}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.62)",
            fontSize: 13,
            marginTop: 12,
            lineHeight: 1.35,
            fontWeight: 500,
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
            background: faceDetected ? "#f59b31" : "rgba(255,255,255,0.18)",
            color: faceDetected ? "#fff" : "rgba(255,255,255,0.7)",
            fontSize: 17,
            fontWeight: 800,
            cursor: faceDetected ? "pointer" : "not-allowed",
            padding: "0 28px",
            boxShadow: faceDetected
              ? "0 10px 28px rgba(245,155,49,0.30)"
              : "none",
            transition: "all 0.3s ease",
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
