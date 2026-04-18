import { useEffect, useRef, useState } from "react";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

declare global {
  interface Window {
    FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
      detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stableFramesRef = useRef(0);
  const [error, setError] = useState("");
  const [pressed, setPressed] = useState(false);
  const [faceReady, setFaceReady] = useState(false);

  useEffect(() => {
    if (approved) return;
    startCamera();
    return () => {
      stopCamera();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
          } catch {
            // ignore
          }
        }
      }

      // Inicia detecção
      try {
        if (window.FaceDetector) {
          detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        }
      } catch {
        detectorRef.current = null;
      }

      // Canvas off-screen para análise por brilho (fallback)
      analysisCanvasRef.current = document.createElement("canvas");
      analysisCanvasRef.current.width = 80;
      analysisCanvasRef.current.height = 100;

      // Aguarda o vídeo estar pronto antes de iniciar o loop
      const v = videoRef.current;
      if (v) {
        if (v.readyState >= 2) {
          startDetectionLoop();
        } else {
          v.onloadeddata = () => startDetectionLoop();
        }
      }
    } catch (err) {
      console.error(err);
      setError("Não foi possível acessar a câmera.");
    }
  };

  const startDetectionLoop = () => {
    const tick = async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      let inFrame = false;

      // Estratégia 1: FaceDetector nativo (Chrome Android)
      if (detectorRef.current) {
        try {
          const faces = await detectorRef.current.detect(v);
          if (faces && faces.length > 0) {
            const f = faces[0].boundingBox;
            const vw = v.videoWidth || 1;
            const vh = v.videoHeight || 1;
            const cx = (f.x + f.width / 2) / vw; // 0..1
            const cy = (f.y + f.height / 2) / vh;
            const sizeRatio = (f.width * f.height) / (vw * vh);

            // Centro: tolerância ±18% horizontal, ±18% vertical
            const centered = Math.abs(cx - 0.5) < 0.18 && Math.abs(cy - 0.5) < 0.18;
            // Tamanho: rosto deve ocupar entre 8% e 45% da imagem
            const goodSize = sizeRatio > 0.06 && sizeRatio < 0.5;
            inFrame = centered && goodSize;
          }
        } catch {
          // se falhar, cai no fallback
        }
      } else {
        // Estratégia 2 (fallback): analisa contraste/brilho na zona central
        const canvas = analysisCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            try {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              // Zona oval central (≈ 44% largura × 60% altura)
              const cw = Math.floor(canvas.width * 0.44);
              const ch = Math.floor(canvas.height * 0.6);
              const cx0 = Math.floor((canvas.width - cw) / 2);
              const cy0 = Math.floor((canvas.height - ch) / 2);
              const data = ctx.getImageData(cx0, cy0, cw, ch).data;

              let sum = 0;
              let sumSq = 0;
              const total = (data.length / 4) | 0;
              for (let i = 0; i < data.length; i += 4) {
                const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                sum += lum;
                sumSq += lum * lum;
              }
              const mean = sum / total;
              const variance = sumSq / total - mean * mean;
              const stdev = Math.sqrt(Math.max(0, variance));

              // Heurística: precisa ter alguma luz E variação (presença de algo, não parede lisa)
              inFrame = mean > 55 && mean < 220 && stdev > 22;
            } catch {
              inFrame = false;
            }
          }
        }
      }

      // Suaviza com janela de estabilidade (~6 frames ≈ 100ms)
      if (inFrame) {
        stableFramesRef.current = Math.min(stableFramesRef.current + 1, 10);
      } else {
        stableFramesRef.current = Math.max(stableFramesRef.current - 1, 0);
      }
      const ready = stableFramesRef.current >= 5;
      setFaceReady((prev) => (prev !== ready ? ready : prev));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
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

  // Cores da marca SuperSim
  const BRAND_PRIMARY = "hsl(36, 97%, 60%)";
  const BRAND_DEEP = "hsl(30, 95%, 45%)";
  const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_DEEP} 100%)`;
  const BRAND_GRADIENT_PRESSED = `linear-gradient(135deg, ${BRAND_DEEP} 0%, ${BRAND_PRIMARY} 100%)`;

  // Cores de feedback
  const SUCCESS_PRIMARY = "hsl(142, 71%, 45%)";
  const SUCCESS_DEEP = "hsl(142, 76%, 36%)";
  const SUCCESS_GRADIENT = `linear-gradient(135deg, ${SUCCESS_PRIMARY} 0%, ${SUCCESS_DEEP} 100%)`;

  const orientationTitle = faceReady
    ? "Rosto detectado!"
    : "Posicione seu rosto dentro do oval";
  const orientationSub = faceReady
    ? "Toque em capturar para continuar"
    : "Mantenha a câmera normal, sem aproximação";

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

      {/* Máscara escura com recorte oval + borda dinâmica */}
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
            <linearGradient id="success-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={SUCCESS_PRIMARY} />
              <stop offset="100%" stopColor={SUCCESS_DEEP} />
            </linearGradient>
          </defs>
          <rect
            width="100"
            height="100"
            fill="rgba(0,0,0,0.62)"
            mask="url(#face-cutout-mask)"
          />
          {/* Halo externo */}
          <ellipse
            cx="50"
            cy="50"
            rx="22.6"
            ry="30.6"
            fill="none"
            stroke={faceReady ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.18)"}
            strokeWidth="0.4"
            style={{ transition: "stroke 200ms ease" }}
          />
          {/* Borda principal — laranja (padrão) ou verde (rosto OK) */}
          <ellipse
            cx="50"
            cy="50"
            rx="22"
            ry="30"
            fill="none"
            stroke={faceReady ? "url(#success-stroke)" : "url(#brand-stroke)"}
            strokeWidth={faceReady ? 1 : 0.7}
            style={{ transition: "stroke-width 200ms ease" }}
          />
        </svg>
      </div>

      {/* Topo: logo + chip */}
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
            transition: "all 200ms ease",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: faceReady ? SUCCESS_PRIMARY : BRAND_PRIMARY,
              boxShadow: `0 0 8px ${faceReady ? SUCCESS_PRIMARY : BRAND_PRIMARY}`,
              transition: "all 200ms ease",
            }}
          />
          {faceReady ? "Pronto para capturar" : "Verificação segura"}
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
            transition: "all 200ms ease",
          }}
        >
          {orientationTitle}
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
          {orientationSub}
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

      {/* Rodapé: dica + botão Capturar (muda para verde quando pronto) */}
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
          {faceReady
            ? "Enquadramento perfeito — você já pode capturar"
            : "Boa iluminação ajuda no reconhecimento"}
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
            background: faceReady
              ? SUCCESS_GRADIENT
              : pressed
              ? BRAND_GRADIENT_PRESSED
              : BRAND_GRADIENT,
            color: "#1a1a1a",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 0.3,
            cursor: "pointer",
            boxShadow: faceReady
              ? "0 10px 28px rgba(34, 197, 94, 0.5), inset 0 -3px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)"
              : pressed
              ? "0 4px 14px rgba(245, 158, 11, 0.35), inset 0 -2px 0 rgba(0,0,0,0.12)"
              : "0 10px 28px rgba(245, 158, 11, 0.45), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.35)",
            transform: pressed ? "translateY(1px)" : "translateY(0)",
            transition: "background 250ms ease, box-shadow 250ms ease, transform 120ms ease",
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
          {faceReady ? "Capturar agora" : "Capturar"}
        </button>
      </div>
    </div>
  );
};

export default FacialVerification;
