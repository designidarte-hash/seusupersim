import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, ShieldCheck, BadgeDollarSign, Search, FileCheck } from "lucide-react";

const analysisSteps = [
  { label: "Consultando CPF nos órgãos de proteção...", icon: Search, duration: 1800 },
  { label: "Analisando histórico de crédito...", icon: FileCheck, duration: 2200 },
  { label: "Verificando score de crédito...", icon: ShieldCheck, duration: 2000 },
  { label: "Calculando limite disponível...", icon: BadgeDollarSign, duration: 1500 },
];

interface CreditAnalysisModalProps {
  open: boolean;
  onComplete: () => void;
}

const CreditAnalysisModal = ({ open, onComplete }: CreditAnalysisModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>([]);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setCompleted([]);
      return;
    }

    let stepIndex = 0;
    setCompleted([]);
    setCurrentStep(0);

    const runStep = () => {
      if (stepIndex >= analysisSteps.length) {
        setTimeout(onComplete, 600);
        return;
      }
      setCurrentStep(stepIndex);
      const timer = setTimeout(() => {
        setCompleted((prev) => [...prev, true]);
        stepIndex++;
        runStep();
      }, analysisSteps[stepIndex].duration);
      return timer;
    };

    const timer = setTimeout(() => runStep(), 400);
    return () => clearTimeout(timer);
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Análise de Crédito</h2>
          <p className="text-sm text-muted-foreground">Aguarde enquanto analisamos seu perfil...</p>
        </div>

        <div className="space-y-4">
          {analysisSteps.map((step, idx) => {
            const StepIcon = step.icon;
            const isDone = idx < completed.length;
            const isActive = idx === currentStep && !isDone;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                  isDone
                    ? "bg-green-50 dark:bg-green-950/30"
                    : isActive
                    ? "bg-primary/5"
                    : "opacity-40"
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in duration-300" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <StepIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isDone ? "text-green-700 dark:text-green-400" : isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((completed.length) / analysisSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreditAnalysisModal;
