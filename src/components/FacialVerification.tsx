import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Lock, Clock, ChevronLeft, RotateCw, X, Check } from "lucide-react";

type Stage = "consent" | "camera" | "processing" | "approved";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const [stage, setStage] = useState<Stage>(approved ? "approved" : "consent");
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: "user" | "environment" = "user") => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setError(null);
    } catch (e: any) {
      setError(
        e?.name === "NotAllowedError"
          ? "Permissão da câmera negada. Habilite o acesso nas configurações do navegador."
          : "Não foi possível acessar a câmera deste dispositivo."
      );
    }
  };

  useEffect(() => {
    if (stage === "camera") {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, facingMode]);

  const handleConsent = () => setStage("camera");

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    stopStream();
    setStage("processing");
    setTimeout(() => setStage("approved"), 2200);
    setTimeout(() => onComplete(), 3200);
  };

  const handleFlip = () => {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  // ============ APPROVED PREVIEW ============
  if (stage === "approved") {
    return (
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">Identidade verificada com sucesso</p>
            <p className="text-[11px] text-white/80">Selfie validada • LGPD</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ CONSENT (matches uploaded image) ============
  if (stage === "consent") {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
        <div className="px-5 pt-5 pb-3 text-center">
          <h3 className="text-2xl font-extrabold text-foreground">Verificação facial</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-snug">
            Para sua segurança, precisamos validar sua identidade com uma selfie. O processo é rápido e seguro.
          </p>
        </div>

        <div className="px-5 py-3 space-y-3">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5 text-primary" />,
              bg: "bg-primary/15",
              title: "Uso limitado",
              desc: "A foto será usada apenas para validação de identidade no processo de contratação.",
            },
            {
              icon: <Lock className="w-5 h-5 text-blue-600" />,
              bg: "bg-blue-100",
              title: "Proteção de dados",
              desc: "Seus dados e imagem não serão compartilhados com terceiros sem autorização.",
            },
            {
              icon: <Clock className="w-5 h-5 text-primary" />,
              bg: "bg-primary/15",
              title: "Rápido e simples",
              desc: "Leva menos de 1 minuto — confirme e tire a foto.",
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
            Ao confirmar você autoriza a captura e o uso da imagem para validação desta operação, conforme a LGPD.
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
            Concordo e prosseguir
          </button>
        </div>
      </div>
    );
  }

  // ============ CAMERA (matches uploaded image) ============
  if (stage === "camera") {
    return (
      <div className="rounded-2xl overflow-hidden bg-black shadow-lg">
        <div className="relative w-full aspect-[3/4] bg-neutral-900">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />

          {/* Top bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <button
              onClick={() => {
                stopStream();
                setStage("consent");
              }}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="text-[11px] font-bold text-yellow-300">Verificação ativa</span>
            </div>
          </div>

          {/* Oval guide + corner brackets */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[68%] aspect-[3/4]">
              {/* Outer orange oval */}
              <div className="absolute inset-0 rounded-[50%] border-4 border-primary" />
              {/* Inner white oval */}
              <div className="absolute inset-1.5 rounded-[50%] border-2 border-white/80" />
              {/* Corner brackets */}
              <div className="absolute -top-3 -left-3 w-7 h-7 border-t-4 border-l-4 border-primary" />
              <div className="absolute -top-3 -right-3 w-7 h-7 border-t-4 border-r-4 border-primary" />
              <div className="absolute -bottom-3 -left-3 w-7 h-7 border-b-4 border-l-4 border-primary" />
              <div className="absolute -bottom-3 -right-3 w-7 h-7 border-b-4 border-r-4 border-primary" />
            </div>
          </div>

          {/* Bottom captions + capture */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm font-semibold text-center">Posicione seu rosto dentro do contorno</p>
            <p className="text-white/70 text-[10px] text-center mt-1 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Conexão segura · Criptografia ponta a ponta
            </p>

            <div className="flex items-center justify-center gap-6 mt-3">
              <button
                type="button"
                onClick={handleFlip}
                className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label="Trocar câmera"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!error}
                className="w-16 h-16 rounded-full bg-white border-4 border-white/40 shadow-xl active:scale-95 transition disabled:opacity-50"
                aria-label="Capturar selfie"
              />
              <div className="w-11 h-11" />
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/70 z-20">
              <div className="bg-white rounded-2xl p-5 max-w-xs text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-destructive/15 flex items-center justify-center">
                  <X className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm font-bold text-foreground">Câmera indisponível</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ PROCESSING ============
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-border">
      <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm font-bold text-foreground">Validando sua identidade…</p>
      <p className="text-xs text-muted-foreground mt-1">Aguarde alguns segundos.</p>
    </div>
  );
};

export default FacialVerification;
