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

  useEffect(() => {
    if (approved) return;
    startCamera();
    return () => {
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
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
          zoom?: { min?: number; max?: number };
        };
        if (capabilities?.zoom) {
          try {
            await track.applyConstraints({
              advanced: [{ zoom: 1 } as any],
            });
          } catch (zoomError) {
            console.log("Zoom não suportado neste dispositivo.");
          }
        }
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

  const handleCapture = () => {
    stopCamera();
    onComplete();
  };

  const handleClose = () => {
    stopCamera();
    onCancel?.();
  };

  // Quando já está aprovado, não renderiza a câmera (mantém compatibilidade)
  if (approved) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
        zIndex: 9999,
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
          background: "#000",
        }}
      />

      {/* Máscara escura com recorte oval */}
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
          <defs>
            <mask id="face-cutout-mask">
              <rect width="100" height="100" fill="white" />
              <ellipse cx="50" cy="50" rx="22" ry="30" fill="black" />
            </mask>
          </defs>
          <rect
            width="100"
            height="100"
            fill="rgba(0,0,0,0.55)"
            mask="url(#face-cutout-mask)"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="22"
            ry="30"
            fill="none"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="0.6"
          />
        </svg>
      </div>

      {/* Botão de fechar (se houver onCancel) */}
      {onCancel && (
        <button
          onClick={handleClose}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: 9999,
            border: "none",
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      )}

      {/* Textos de orientação */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          padding: "0 24px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          Posicione seu rosto dentro do oval
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 14,
            marginTop: 8,
            lineHeight: 1.4,
          }}
        >
          Mantenha a câmera normal, sem aproximação
        </div>
      </div>

      {error ? (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#dc2626",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Botão Capturar fixo no rodapé */}
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 28,
        }}
      >
        <button
          onClick={handleCapture}
          style={{
            width: "100%",
            height: 54,
            border: "none",
            borderRadius: 14,
            background: "#d71920",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Capturar
        </button>
      </div>
    </div>
  );
};

export default FacialVerification;
