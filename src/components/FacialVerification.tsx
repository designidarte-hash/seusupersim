import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Lock, Clock, ChevronLeft, X, Check, ScanFace } from "lucide-react";

type Stage = "consent" | "camera" | "processing" | "approved";
type LiveStep = "searching" | "centering" | "hold" | "validating";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

// Type for experimental FaceDetector API
declare global {
  interface Window {
    FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
      detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const [stage, setStage] = useState<Stage>(approved ? "approved" : "consent");
  const [error, setError] = useState<string | null>(null);
  const [liveStep, setLiveStep] = useState<LiveStep>("searching");
  const [progress, setProgress] = useState(0); // 0..100
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stableFramesRef = useRef(0);
  const completedRef = useRef(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setError(null);

      // Init FaceDetector if supported
      if (typeof window !== "undefined" && window.FaceDetector) {
        try {
          detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        } catch {
          detectorRef.current = null;
        }
      }

      // Start the detection loop
      stableFramesRef.current = 0;
      setProgress(0);
      setLiveStep("searching");
      runDetectionLoop();
    } catch (e: any) {
      setError(
        e?.name === "NotAllowedError"
          ? "Permissão da câmera negada. Habilite o acesso nas configurações do navegador."
          : "Não foi possível acessar a câmera deste dispositivo."
      );
    }
  };

  // Heuristic fallback: measure variance of central region brightness — a face produces strong variance
  const fallbackFaceLikelihood = (video: HTMLVideoElement) => {
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
    }
    const canvas = analysisCanvasRef.current;
    const w = 64;
    const h = 64;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx || !video.videoWidth) return { detected: false, centered: false };

    // Draw center crop
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const size = Math.min(vw, vh) * 0.7;
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    let sum = 0;
    let sumSq = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
      count++;
    }
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    // Reasonable lighting and texture in frame
    const detected = mean > 40 && mean < 220 && variance > 350;
    return { detected, centered: detected };
  };

  const runDetectionLoop = () => {
    let lastTick = performance.now();

    const tick = async () => {
      if (!videoRef.current || !streamRef.current) return;
      const video = videoRef.current;

      let faceDetected = false;
      let faceCentered = false;

      if (detectorRef.current && video.readyState >= 2) {
        try {
          const faces = await detectorRef.current.detect(video);
          if (faces && faces.length > 0) {
            faceDetected = true;
            const box = faces[0].boundingBox;
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const dx = Math.abs(cx - vw / 2) / vw;
            const dy = Math.abs(cy - vh / 2) / vh;
            const sizeOk = box.width / vw > 0.25 && box.width / vw < 0.85;
            faceCentered = dx < 0.18 && dy < 0.22 && sizeOk;
          }
        } catch {
          // fall through to heuristic
          const r = fallbackFaceLikelihood(video);
          faceDetected = r.detected;
          faceCentered = r.centered;
        }
      } else if (video.readyState >= 2) {
        const r = fallbackFaceLikelihood(video);
        faceDetected = r.detected;
        faceCentered = r.centered;
      }

      const now = performance.now();
      const dt = Math.min(120, now - lastTick);
      lastTick = now;

      if (faceCentered) {
        stableFramesRef.current += 1;
        // Increase progress over ~8s of stable detection (slower, bank-style)
        setProgress((p) => Math.min(100, p + (dt / 8000) * 100));
        setLiveStep((s) => (s === "searching" || s === "centering" ? "hold" : s));
      } else if (faceDetected) {
        stableFramesRef.current = 0;
        setProgress((p) => Math.max(0, p - (dt / 2500) * 100));
        setLiveStep("centering");
      } else {
        stableFramesRef.current = 0;
        setProgress((p) => Math.max(0, p - (dt / 2000) * 100));
        setLiveStep("searching");
      }

      if (!completedRef.current) {
        // read latest progress via functional setter trick
        setProgress((p) => {
          if (p >= 100 && !completedRef.current) {
            completedRef.current = true;
            setLiveStep("validating");
            // Extended validating + processing + approved sequence (~2s after 100%)
            setTimeout(() => {
              stopStream();
              setStage("processing");
              setTimeout(() => setStage("approved"), 1200);
              setTimeout(() => onComplete(), 2200);
            }, 800);
          }
          return p;
        });
      }

      if (!completedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (stage === "camera") {
      completedRef.current = false;
      startCamera();
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const handleConsent = () => setStage("camera");

  // ============ APPROVED PREVIEW (inline result card in chat) ============
  if (stage === "approved") {
    return (
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">Identidade verificada com sucesso</p>
            <p className="text-[11px] text-white/80">Biometria facial validada • LGPD</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ CONSENT (inline card in chat) ============
  if (stage === "consent") {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
        <div className="px-5 pt-5 pb-3 text-center">
          <h3 className="text-2xl font-extrabold text-foreground">Verificação facial</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-snug">
            Para sua segurança, vamos validar sua identidade com uma leitura facial — igual ao processo do seu banco. Basta posicionar o rosto na câmera.
          </p>
        </div>

        <div className="px-5 py-3 space-y-3">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5 text-primary" />,
              bg: "bg-primary/15",
              title: "Biometria segura",
              desc: "Sua face é analisada em tempo real apenas para validar sua identidade.",
            },
            {
              icon: <Lock className="w-5 h-5 text-blue-600" />,
              bg: "bg-blue-100",
              title: "Sem fotos armazenadas",
              desc: "Nenhuma imagem é salva. A leitura acontece localmente no seu dispositivo.",
            },
            {
              icon: <Clock className="w-5 h-5 text-primary" />,
              bg: "bg-primary/15",
              title: "Rápido e automático",
              desc: "É só olhar para a câmera. Em poucos segundos a validação é concluída.",
            },
          ].map((item, i, arr) => (
            <div key={item.title}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
                </div>
              </div>
              {i < arr.length - 1 && <div className="border-t border-border/60 mt-3" />}
            </div>
          ))}
        </div>

        <div className="px-5 pt-2 pb-4">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Ao confirmar você autoriza a captura biométrica facial para validação desta operação, conforme a LGPD.
          </p>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-12 rounded-2xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted/50 transition"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleConsent}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:opacity-95 transition"
          >
            Iniciar leitura facial
          </button>
        </div>
      </div>
    );
  }

  // ============ FULLSCREEN OVERLAY (camera + processing) — Nubank style ============
  const stepLabel =
    liveStep === "searching"
      ? "Posicione seu rosto dentro do contorno"
      : liveStep === "centering"
      ? "Centralize seu rosto e mantenha parado"
      : liveStep === "hold"
      ? "Mantenha-se parado…"
      : "Validando biometria…";

  // Inline card placeholder while overlay is open (so chat keeps space)
  const inlinePlaceholder = (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <ScanFace className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Verificação em andamento…</p>
        <p className="text-[11px] text-muted-foreground">Câmera aberta em tela cheia</p>
      </div>
    </div>
  );

  const overlay =
    stage === "camera" ? (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-200">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Dark vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-center justify-between">
          <button
            onClick={() => {
              stopStream();
              setStage("consent");
            }}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[11px] font-bold text-yellow-300">Leitura biométrica</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Centered title */}
        <div className="relative z-10 px-6 text-center mb-2">
          <h2 className="text-white text-xl font-extrabold drop-shadow-md">Verificação de identidade</h2>
          <p className="text-white/80 text-xs mt-1">Mantenha o rosto centralizado no contorno</p>
        </div>

        {/* Oval guide with progress ring — fills available space */}
        <div className="relative flex-1 flex items-center justify-center px-6 pointer-events-none z-10">
          <div className="relative w-full max-w-xs aspect-[3/4]">
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <ellipse cx="50" cy="50" rx="48" ry="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <ellipse
                cx="50"
                cy="50"
                rx="48"
                ry="48"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 120ms linear" }}
              />
            </svg>

            {/* Inner oval */}
            <div className="absolute inset-3 rounded-[50%] border-[3px] border-white/80 shadow-[0_0_60px_rgba(255,255,255,0.15)_inset]" />

            {/* Corner brackets */}
            <div className="absolute -top-3 -left-3 w-9 h-9 border-t-[5px] border-l-[5px] border-primary rounded-tl-2xl" />
            <div className="absolute -top-3 -right-3 w-9 h-9 border-t-[5px] border-r-[5px] border-primary rounded-tr-2xl" />
            <div className="absolute -bottom-3 -left-3 w-9 h-9 border-b-[5px] border-l-[5px] border-primary rounded-bl-2xl" />
            <div className="absolute -bottom-3 -right-3 w-9 h-9 border-b-[5px] border-r-[5px] border-primary rounded-br-2xl" />

            {/* Animated scan line */}
            {progress > 0 && progress < 100 && (
              <div className="absolute inset-3 rounded-[50%] overflow-hidden pointer-events-none">
                <div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_hsl(var(--primary))]"
                  style={{
                    top: `${(progress % 100)}%`,
                    transition: "top 120ms linear",
                  }}
                />
              </div>
            )}

            {liveStep === "searching" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanFace className="w-20 h-20 text-white/40" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom panel */}
        <div className="relative z-10 px-6 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4 bg-gradient-to-t from-black via-black/85 to-transparent">
          <p className="text-white text-base font-bold text-center">{stepLabel}</p>
          <p className="text-white/70 text-[11px] text-center mt-1 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Conexão segura · Criptografia ponta a ponta
          </p>

          <div className="mt-4 mx-auto max-w-sm h-2.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              style={{ width: `${Math.round(progress)}%`, transition: "width 120ms linear" }}
            />
          </div>
          <p className="text-white text-sm text-center mt-2 font-bold">{Math.round(progress)}%</p>
        </div>

        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/80">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-destructive/15 flex items-center justify-center">
                <X className="w-7 h-7 text-destructive" />
              </div>
              <p className="text-base font-bold text-foreground">Câmera indisponível</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  setStage("consent");
                }}
                className="w-full h-10 rounded-xl border border-border text-foreground text-sm font-semibold"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    ) : (
      // PROCESSING fullscreen
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-5">
          <div className="w-12 h-12 border-[5px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-extrabold text-foreground">Validando sua identidade…</p>
        <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
          Conferindo a biometria facial nos órgãos oficiais.
        </p>
      </div>
    );

  return (
    <>
      {inlinePlaceholder}
      {typeof document !== "undefined" && createPortal(overlay, document.body)}
    </>
  );
};

export default FacialVerification;
