import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, UserCheck, FileText, BadgeCheck, Sparkles } from "lucide-react";
import { useFunnelUser } from "@/hooks/use-funnel-user";

const RedirecionandoChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, userCpf } = useFunnelUser();
  const [index, setIndex] = useState(0);

  const firstName = (userName || "Cliente").split(" ")[0];
  const maskedCpf =
    userCpf && userCpf.length === 11
      ? `***.${userCpf.slice(3, 6)}.${userCpf.slice(6, 9)}-**`
      : "***.***.***-**";
  const loanAmount = (location.state?.loanAmount as number) || 2500;

  const frases = [
    { texto: `Olá, ${firstName}! Iniciando seu atendimento...`, icon: Sparkles },
    { texto: "Validando seus dados de identidade...", icon: ShieldCheck },
    { texto: "Confirmando suas informações cadastrais...", icon: UserCheck },
    { texto: `Preparando contrato exclusivo para ${firstName}...`, icon: FileText },
    { texto: "Reservando atendente especializado...", icon: BadgeCheck },
    { texto: "Tudo pronto! Conectando ao chat seguro...", icon: Loader2 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= frases.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1600);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (index === frases.length - 1) {
      const timeout = setTimeout(() => {
        navigate("/chat", { state: location.state, replace: true });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [index, navigate, location.state, frases.length]);

  const CurrentIcon = frases[index].icon;
  const progress = ((index + 1) / frases.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(30,95%,45%)] to-[hsl(var(--primary))] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
        <img src="/supersim-logo.svg" alt="SuperSim" className="h-10 mx-auto" />

        {/* Card de identidade personalizada */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-[hsl(30,95%,45%)]/5 border border-primary/15 p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-[hsl(30,95%,45%)] flex items-center justify-center text-white font-bold text-lg shadow-md">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                Atendimento exclusivo
              </p>
              <p className="text-sm font-bold text-gray-800 truncate">{firstName}</p>
              <p className="text-[11px] text-gray-500 font-mono">CPF {maskedCpf}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                Aprovado
              </p>
              <p className="text-sm font-black text-primary">
                R$ {loanAmount.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[hsl(30,95%,45%)] flex items-center justify-center shadow-lg">
            <CurrentIcon className="w-9 h-9 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2 min-h-[60px] flex flex-col items-center justify-center">
          <p
            key={index}
            className="text-base font-semibold text-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {frases[index].texto}
          </p>
          <p className="text-xs text-gray-500">
            Conexão criptografada · Atendimento seguro
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[hsl(30,95%,45%)] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Etapa {index + 1} de {frases.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RedirecionandoChat;
