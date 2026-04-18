import { useEffect, useRef, useState } from "react";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (approved) return;
    startCamera();
    return () => stopCamera();
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

      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() || {}) as any;
      if (capabilities.zoom) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: 1 }] as any,
          });
        } catch {}
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    const image = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(image);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    stopCamera();
    onComplete();
  };

  const handleClose = () => {
    stopCamera();
    onCancel?.();
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
      {!capturedImage ? (
        <>
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
                "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.82) 24%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.96) 100%)",
            }}
          />

          {/* Botão fechar (se onCancel existir) */}
          {onCancel && (
            <button
              onClick={handleClose}
              aria-label="Fechar"
              style={{
                position: "absolute",
                top: 52,
                left: 20,
                width: 40,
                height: 40,
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
              }}
            >
              ×
            </button>
          )}

          {/* Chip topo direito */}
          <div
            style={{
              position: "absolute",
              top: 52,
              left: 20,
              right: 20,
              display: "flex",
              justifyContent: "flex-end",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 8px 20px rgba(0,0,0,0.20)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 10px rgba(34,197,94,0.7)",
                }}
              />
              Pronto para capturar
            </div>
          </div>

          {/* Títulos */}
          <div
            style={{
              position: "absolute",
              top: 145,
              left: 24,
              right: 24,
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 22,
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              Rosto detectado!
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.82)",
                fontSize: 14,
                marginTop: 10,
                lineHeight: 1.4,
                fontWeight: 500,
              }}
            >
              Toque em capturar para continuar
            </div>
          </div>

          {/* Oval verde central */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              height: "100%",
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
                <mask id="bank-face-mask">
                  <rect width="100" height="100" fill="white" />
                  <ellipse cx="50" cy="52" rx="21" ry="33" fill="black" />
                </mask>
              </defs>
              <rect
                width="100"
                height="100"
                fill="rgba(0,0,0,0.42)"
                mask="url(#bank-face-mask)"
              />
              <ellipse
                cx="50"
                cy="52"
                rx="21"
                ry="33"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <ellipse
                cx="50"
                cy="52"
                rx="21"
                ry="33"
                fill="none"
                stroke="rgba(34,197,94,0.25)"
                strokeWidth="2.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Texto acima do botão */}
          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: 128,
              textAlign: "center",
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.35,
            }}
          >
            Enquadramento perfeito — você já pode capturar
          </div>

          {error ? (
            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                bottom: 198,
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
              left: 24,
              right: 24,
              bottom: 34,
            }}
          >
            <button
              onClick={handleCapture}
              style={{
                width: "100%",
                height: 64,
                border: "none",
                borderRadius: 22,
                background: "#22c55e",
                color: "#0a0a0a",
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 12px 28px rgba(34,197,94,0.35)",
              }}
            >
              Capturar agora
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <img
            src={capturedImage}
            alt="captura"
            style={{
              width: "100%",
              height: "calc(100% - 160px)",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              padding: 20,
              display: "grid",
              gap: 12,
              background: "#000",
            }}
          >
            <button
              onClick={handleRetake}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tirar novamente
            </button>
            <button
              onClick={handleConfirm}
              style={{
                width: "100%",
                height: 58,
                borderRadius: 18,
                border: "none",
                background: "#22c55e",
                color: "#0a0a0a",
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Confirmar captura
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default FacialVerification;
