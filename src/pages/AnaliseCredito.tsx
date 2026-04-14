import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import bannerEmprestimo from "@/assets/banner-emprestimo-hd.jpg";
import { ShieldCheck, CheckCircle2, Search, FileCheck, BadgeDollarSign, Loader2 } from "lucide-react";

const analysisSteps = [
  { label: "Consultando CPF nos órgãos de proteção...", icon: Search, duration: 2000 },
  { label: "Analisando histórico de crédito...", icon: FileCheck, duration: 2500 },
  { label: "Verificando score de crédito...", icon: ShieldCheck, duration: 2200 },
  { label: "Calculando limite disponível...", icon: BadgeDollarSign, duration: 1800 },
];

const AnaliseCredito = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cpfData = location.state?.cpfData;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      navigate("/aprovado", { state: { cpfData } });
    }, 800);
  }, [navigate, cpfData]);

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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Icon + Title */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Análise de Crédito</h1>
            <p className="text-muted-foreground">Aguarde enquanto analisamos seu perfil...</p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {analysisSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = completedSteps.includes(idx);
              const isActive = idx === currentStep && !isDone;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 ${
                    isDone
                      ? "bg-green-50 dark:bg-green-950/30"
                      : isActive
                      ? "bg-primary/5"
                      : "opacity-30"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-7 h-7 text-green-500 animate-in zoom-in duration-300" />
                    ) : isActive ? (
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    ) : (
                      <StepIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={`text-base font-medium ${
                      isDone
                        ? "text-green-700 dark:text-green-400"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[hsl(30,95%,55%)] to-[hsl(350,80%,60%)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnaliseCredito;
