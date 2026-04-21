import { useEffect, useRef, useState } from "react";
import { Sparkles, Gift, ShieldCheck, X, Ticket, CalendarDays, CheckCircle2, Trophy, MapPin } from "lucide-react";
import contratoPremiadoLogo from "@/assets/contrato-premiado-logo.png";

interface ContratoPremiadoModalProps {
  open: boolean;
  firstName?: string;
  onContinue: () => void;
}

type Stage = "offer" | "spinning" | "revealed";

// Generate a 6-digit lucky number
const generateLuckyNumber = (): string => {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
};

// Next month name in pt-BR
const nextMonthLabel = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  const month = d.toLocaleDateString("pt-BR", { month: "long" });
  return month.charAt(0).toUpperCase() + month.slice(1);
};

// Lista de ganhadores fictícios para o marquee de prova social
const WINNERS = [
  { name: "Maria Silva", city: "Recife - PE", month: "Mar/2025", prize: "R$ 1.000" },
  { name: "João Pereira", city: "São Paulo - SP", month: "Fev/2025", prize: "R$ 1.000" },
  { name: "Ana Lima", city: "Salvador - BA", month: "Jan/2025", prize: "R$ 1.000" },
  { name: "Carlos Mendes", city: "Belo Horizonte - MG", month: "Dez/2024", prize: "R$ 1.000" },
  { name: "Fernanda Souza", city: "Curitiba - PR", month: "Nov/2024", prize: "R$ 1.000" },
  { name: "Ricardo Alves", city: "Fortaleza - CE", month: "Out/2024", prize: "R$ 1.000" },
  { name: "Juliana Costa", city: "Porto Alegre - RS", month: "Set/2024", prize: "R$ 1.000" },
  { name: "Pedro Henrique", city: "Manaus - AM", month: "Ago/2024", prize: "R$ 1.000" },
  { name: "Camila Rocha", city: "Goiânia - GO", month: "Jul/2024", prize: "R$ 1.000" },
  { name: "Lucas Martins", city: "Natal - RN", month: "Jun/2024", prize: "R$ 1.000" },
  { name: "Patrícia Gomes", city: "Belém - PA", month: "Mai/2024", prize: "R$ 1.000" },
  { name: "Rafael Oliveira", city: "Florianópolis - SC", month: "Abr/2024", prize: "R$ 1.000" },
];

// Lightweight confetti using DOM
const fireConfetti = (container: HTMLElement) => {
  const colors = ["#F97316", "#FBBF24", "#10B981", "#3B82F6", "#EF4444", "#A855F7"];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("span");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const duration = 1.8 + Math.random() * 1.6;
    const rotate = Math.random() * 360;
    piece.style.cssText = `
      position:absolute;
      top:-20px;
      left:${left}%;
      width:${6 + Math.random() * 6}px;
      height:${10 + Math.random() * 8}px;
      background:${color};
      transform:rotate(${rotate}deg);
      opacity:0;
      animation: confetti-fall ${duration}s ${delay}s ease-in forwards;
      border-radius:2px;
      pointer-events:none;
      z-index:60;
    `;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + delay) * 1000 + 200);
  }
};

export default function ContratoPremiadoModal({ open, firstName, onContinue }: ContratoPremiadoModalProps) {
  const [stage, setStage] = useState<Stage>("offer");
  const [displayNumber, setDisplayNumber] = useState("------");
  const [finalNumber, setFinalNumber] = useState("");
  const confettiRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStage("offer");
      setDisplayNumber("------");
      setFinalNumber("");
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [open]);

  const handleParticipate = () => {
    setStage("spinning");
    const target = generateLuckyNumber();
    setFinalNumber(target);

    // Roulette effect: cycle digits fast for ~2.5s
    let ticks = 0;
    const totalTicks = 28;
    intervalRef.current = window.setInterval(() => {
      ticks += 1;
      // Reveal digits progressively in the last third
      const revealCount = Math.max(0, ticks - (totalTicks - 6));
      const random = generateLuckyNumber();
      const blended =
        target.slice(0, revealCount) + random.slice(revealCount);
      setDisplayNumber(blended);

      if (ticks >= totalTicks) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        setDisplayNumber(target);
        setStage("revealed");
        setTimeout(() => {
          if (confettiRef.current) fireConfetti(confettiRef.current);
        }, 50);
      }
    }, 90);
  };

  if (!open) return null;

  return (
    <div
      ref={confettiRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.9; }
        }
        @keyframes shimmer-bg {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .premiado-shimmer {
          background: linear-gradient(135deg, #F97316 0%, #FBBF24 25%, #F97316 50%, #FB923C 75%, #FBBF24 100%);
          background-size: 200% 200%;
          animation: shimmer-bg 4s ease infinite;
        }
        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .trophy-anim { animation: trophy-bounce 1.6s ease-in-out infinite; }
        @keyframes ticket-spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .ticket-spin { animation: ticket-spin 1.5s linear infinite; }
        @keyframes number-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7), 0 0 30px rgba(249, 115, 22, 0.3); }
          50% { box-shadow: 0 0 0 16px rgba(251, 191, 36, 0), 0 0 60px rgba(249, 115, 22, 0.6); }
        }
        .number-glow { animation: number-glow 2s ease-out infinite; }
      `}</style>

      <div className="relative w-full h-full md:h-auto md:max-h-[92vh] md:max-w-md md:rounded-3xl bg-white overflow-hidden flex flex-col animate-scale-in shadow-2xl">
        {/* Header — premiado */}
        <div className="premiado-shimmer text-white px-6 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)"
          }} />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/25 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Sorteio autorizado SECAP/ME</span>
              </div>
            </div>
          </div>

          <div className="relative mt-3 text-center">
            <img
              src={contratoPremiadoLogo}
              alt="Contrato Premiado SuperSim"
              className="h-20 md:h-24 w-auto object-contain block mx-auto drop-shadow-lg"
            />
            <p className="text-white/95 text-sm mt-3 font-medium">
              {firstName ? `${firstName}, seu contrato concorre!` : "Seu contrato concorre!"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {stage === "offer" && (
            <div className="space-y-5 animate-fade-in">
              {/* Prize highlight */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-200/40 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-orange-200/40 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Gift className="w-3 h-3" /> Prêmio Mensal
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Sorteio mensal de</p>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-600 to-amber-500 my-1 tracking-tight">
                    R$ 1.000
                  </p>
                  <p className="text-xs text-gray-600 font-medium">via Pix, na sua conta</p>
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-gray-700 bg-white/70 rounded-lg py-1.5 px-3 border border-amber-200">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                    <span>Próximo sorteio: <strong>{nextMonthLabel()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2.5">
                {[
                  { icon: Ticket, text: "Número da sorte gerado automaticamente" },
                  { icon: ShieldCheck, text: "Sorteio realizado pela Loteria Federal" },
                  { icon: Gift, text: "Participação 100% gratuita e sem custo extra" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                      <b.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-tight">{b.text}</p>
                  </div>
                ))}
              </div>

              {/* Ganhadores recentes — auto scroll */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 leading-tight">Ganhadores recentes</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Sorteios mensais via Pix</p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase">Ao vivo</span>
                  </div>
                </div>

                <div className="relative h-[180px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
                  <div className="winners-marquee space-y-2">
                    {[
                      ...WINNERS,
                      ...WINNERS, // duplicado para loop infinito
                    ].map((w, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {w.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{w.name}</p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-0.5 truncate leading-tight">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              {w.city}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-bold text-emerald-600 leading-tight">{w.prize}</p>
                          <p className="text-[9px] text-gray-500 leading-tight">{w.month}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 text-center leading-relaxed px-2">
                Promoção autorizada SECAP/ME. A participação é opcional e não altera o valor do seu contrato.
              </p>
            </div>
          )}

          {stage === "spinning" && (
            <div className="space-y-6 animate-fade-in py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-3">
                  <Ticket className="w-9 h-9 text-white ticket-spin" style={{ transformStyle: "preserve-3d" }} />
                </div>
                <p className="text-sm font-semibold text-gray-700">Gerando seu número da sorte...</p>
                <p className="text-xs text-gray-500 mt-1">Validando participação no sistema</p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "repeating-linear-gradient(45deg, #FBBF24 0, #FBBF24 1px, transparent 1px, transparent 12px)"
                }} />
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 relative">Seu número</p>
                <p className="text-5xl font-black text-white tabular-nums tracking-[0.2em] relative font-mono">
                  {displayNumber}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Conectando ao sistema da Loteria Federal...</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Reservando seu número exclusivo...</span>
                </div>
              </div>
            </div>
          )}

          {stage === "revealed" && (
            <div className="space-y-5 animate-fade-in py-2">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Participação Confirmada
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  {firstName ? `Boa sorte, ${firstName}!` : "Boa sorte!"}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">Esse é o seu número exclusivo:</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-6 text-center border-2 border-amber-300 relative">
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">Cupom da Sorte</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-6 number-glow rounded-xl bg-white py-4 border border-amber-200">
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-600 to-amber-500 tabular-nums tracking-[0.25em] font-mono">
                    {finalNumber}
                  </p>
                </div>
                <p className="text-[10px] text-gray-600 mt-3 font-medium flex items-center justify-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  Sorteio em {nextMonthLabel()} · R$ 1.000 via Pix
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-snug">
                  <strong>Cupom registrado!</strong> Você concorre automaticamente em todos os sorteios mensais enquanto seu contrato estiver ativo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — sticky CTA */}
        <div className="border-t border-gray-100 bg-white px-6 py-4">
          {stage === "offer" && (
            <button
              onClick={handleParticipate}
              className="w-full py-3.5 rounded-xl premiado-shimmer text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Ticket className="w-4 h-4" />
              Quero participar do sorteio
            </button>
          )}
          {stage === "spinning" && (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Gerando número...
            </button>
          )}
          {stage === "revealed" && (
            <button
              onClick={onContinue}
              className="w-full py-3.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Continuar para ativação
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
