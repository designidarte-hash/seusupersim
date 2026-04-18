import { useEffect, useRef } from "react";

interface FacialVerificationProps {
  onComplete: () => void;
  onCancel?: () => void;
  approved?: boolean;
}

const FacialVerification = ({ onComplete, onCancel, approved }: FacialVerificationProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (approved) return;
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
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

  return (
    <div className="fixed inset-0 bg-black z-[9999]">
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* OVERLAY OVAL CENTRAL */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <mask id="face-mask">
              <rect width="100" height="100" fill="white" />
              <ellipse cx="50" cy="50" rx="20" ry="35" fill="black" />
            </mask>
          </defs>
          <rect width="100" height="100" fill="rgba(0,0,0,0.65)" mask="url(#face-mask)" />
          <ellipse
            cx="50"
            cy="50"
            rx="20"
            ry="35"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* BOTÃO FECHAR */}
      {onCancel && (
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/50 border border-white/20 text-white text-lg flex items-center justify-center backdrop-blur-md z-10"
        >
          ×
        </button>
      )}

      {/* TEXTO */}
      <div className="absolute top-24 w-full text-center px-6">
        <h1 className="text-white text-xl font-semibold drop-shadow-lg">
          Rosto detectado!
        </h1>
        <p className="text-white/70 mt-2 drop-shadow">
          Posicione seu rosto dentro do oval
        </p>
      </div>

      {/* BOTÃO CAPTURAR */}
      <div className="absolute bottom-10 w-full px-6">
        <button
          onClick={handleCapture}
          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-600 text-black font-bold py-4 rounded-xl text-lg transition-colors shadow-lg"
        >
          Capturar agora
        </button>
      </div>
    </div>
  );
};

export default FacialVerification;
