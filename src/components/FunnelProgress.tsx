import { Check, FileText, UserPlus, ShieldCheck, BadgeCheck } from "lucide-react";

export type FunnelStep = "resultado" | "cadastro" | "analise" | "aprovado";

const steps: { key: FunnelStep; label: string; icon: typeof Check }[] = [
  { key: "resultado", label: "Consulta", icon: FileText },
  { key: "cadastro", label: "Cadastro", icon: UserPlus },
  { key: "analise", label: "Análise", icon: ShieldCheck },
  { key: "aprovado", label: "Aprovado", icon: BadgeCheck },
];

interface FunnelProgressProps {
  current: FunnelStep;
}

const FunnelProgress = ({ current }: FunnelProgressProps) => {
  const currentIdx = steps.findIndex((s) => s.key === current);
  const progressPct = (currentIdx / (steps.length - 1)) * 100;

  return (
    <div className="w-full bg-background border-b border-border/40 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          {/* Track */}
          <div className="absolute top-4 md:top-5 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[hsl(36,97%,55%)] to-[hsl(30,95%,50%)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = idx < currentIdx;
              const isActive = idx === currentIdx;

              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                        ? "bg-background border-primary text-primary scale-110 shadow-md"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                    ) : (
                      <StepIcon className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] md:text-xs font-semibold text-center ${
                      isActive
                        ? "text-primary"
                        : isDone
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
        </div>
      </div>
    </div>
  );
};

export default FunnelProgress;
