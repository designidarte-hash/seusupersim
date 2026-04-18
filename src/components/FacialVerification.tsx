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
  const [pressed, setPressed] = useState(false);

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

  if (approved) return null;

  // Cores da marca SuperSim (laranja vibrante + dourado)
  const BRAND_PRIMARY = "hsl(36, 97%, 60%)";
  const BRAND_DEEP = "hsl(30, 95%, 45%)";
  const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_DEEP} 100%)`;
  const BRAND_GRADIENT_PRESSED = `linear-gradient(135deg, ${BRAND_DEEP} 0%, ${BRAND_PRIMARY} 100%)`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
        zIndex: 9999,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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

      {/* Máscara escura com recorte oval + borda em gradiente da marca */}
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
            <linearGradient id="brand-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={BRAND_PRIMARY} />
              <stop offset="100%" stopColor={BRAND_DEEP} />
            </linearGradient>
          </defs>
          <rect
            width="100"
            height="100"
            fill="rgba(0,0,0,0.62)"
            mask="url(#face-cutout-mask)"
          />
          {/* Halo externo suave */}
          <ellipse
            cx="50"
            cy="50"
            rx="22.6"
            ry="30.6"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.4"
          />
          {/* Borda principal em gradiente da marca */}
          <ellipse
            cx="50"
            cy="50"
            rx="22"
            ry="30"
            fill="none"
            stroke="url(#brand-stroke)"
            strokeWidth="0.7"
          />
        </svg>
      </div>

      {/* Topo: logo + chip de segurança */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 2,
        }}
      >
        <img
          src="/supersim-logo.svg"
          alt="SuperSim"
          style={{ height: 22, filter: "brightness(0) invert(1)" }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "6px 10px",
            borderRadius: 9999,
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.2,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: BRAND_PRIMARY,
              boxShadow: `0 0 8px ${BRAND_PRIMARY}`,
            }}
          />
          Verificação segura
        </div>
      </div>

      {/* Botão fechar */}
      {onCancel && (
        <button
          onClick={handleClose}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            width: 36,
            height: 36,
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          ×
        </button>
      )}

      {/* Textos de orientação */}
      <div
        style={{
          position: "absolute",
          top: 96,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          padding: "0 24px",
          textAlign: "center",
          boxSizing: "border-box",
          zIndex: 2,
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 19,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: -0.2,
            textShadow: "0 2px 12px rgba(0,0,0,0.45)",
          }}
        >
          Posicione seu rosto dentro do oval
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: 13.5,
            marginTop: 8,
            lineHeight: 1.45,
            textShadow: "0 1px 8px rgba(0,0,0,0.4)",
          }}
        >
          Mantenha a câmera normal, sem aproximação
        </div>
      </div>

      {error ? (
        <div
          style={{
            position: "absolute",
            top: 170,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(220, 38, 38, 0.95)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            zIndex: 3,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Rodapé: dica + botão Capturar com gradiente da marca */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "20px 20px 28px",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
          zIndex: 2,
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: 12,
            textAlign: "center",
            margin: "0 0 12px",
            lineHeight: 1.4,
          }}
        >
          Boa iluminação ajuda no reconhecimento
        </p>
        <button
          onClick={handleCapture}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          style={{
            width: "100%",
            height: 56,
            border: "none",
            borderRadius: 16,
            background: pressed ? BRAND_GRADIENT_PRESSED : BRAND_GRADIENT,
            color: "#1a1a1a",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 0.3,
            cursor: "pointer",
            boxShadow: pressed
              ? "0 4px 14px rgba(245, 158, 11, 0.35), inset 0 -2px 0 rgba(0,0,0,0.12)"
              : "0 10px 28px rgba(245, 158, 11, 0.45), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.35)",
            transform: pressed ? "translateY(1px)" : "translateY(0)",
            transition: "all 120ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              border: "2px solid #1a1a1a",
              display: "inline-block",
            }}
          />
          Capturar
        </button>
      </div>
    </div>
  );
};

export default FacialVerification;
