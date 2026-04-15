import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, UserCheck, FileText } from "lucide-react";

const frases = [
  { texto: "Conectando ao setor de atendimento...", icon: Loader2 },
  { texto: "Verificando seus dados para liberação...", icon: ShieldCheck },
  { texto: "Confirmando informações cadastrais...", icon: UserCheck },
  { texto: "Preparando seu contrato personalizado...", icon: FileText },
  { texto: "Quase lá! Redirecionando para o atendente...", icon: Loader2 },
];

const RedirecionandoChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= frases.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (index === frases.length - 1) {
      const timeout = setTimeout(() => {
        navigate("/chat", { state: location.state, replace: true });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [index, navigate, location.state]);

  const CurrentIcon = frases[index].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(30,95%,45%)] to-[hsl(var(--primary))] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
        <img
          src="/supersim-logo.svg"
          alt="SuperSim"
          className="h-10 mx-auto"
        />

        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[hsl(30,95%,45%)] flex items-center justify-center">
            <CurrentIcon className="w-9 h-9 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2 min-h-[60px] flex flex-col items-center justify-center">
          <p className="text-lg font-semibold text-gray-800 transition-all duration-500">
            {frases[index].texto}
          </p>
          <p className="text-sm text-gray-500">
            Aguarde enquanto preparamos tudo para você
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {frases.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i <= index
                  ? "w-6 bg-gradient-to-r from-primary to-[hsl(30,95%,45%)]"
                  : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RedirecionandoChat;
