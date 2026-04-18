import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FunnelProgress from "@/components/FunnelProgress";
import { useFunnelUser } from "@/hooks/use-funnel-user";
import bannerEmprestimo from "@/assets/banner-emprestimo-hd.webp";
import { ShieldCheck, CheckCircle2, Search, FileCheck, BadgeDollarSign, Loader2, Lock } from "lucide-react";
import logoSupersim from "@/assets/logo-supersim.png";
import { generateLoanAmount } from "@/lib/loan-amount";

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
  const { userName, userCpf } = useFunnelUser();
  const cadastro = location.state?.cadastro;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [pulse, setPulse] = useState(false);

  const loanAmount = useMemo(() => generateLoanAmount(), []);
  const creditScore = useMemo(() => Math.floor(Math.random() * 451) + 350, []);

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      navigate("/aprovado", { state: { cpfData, cpfDigits, cadastro, loanAmount, creditScore } });
    }, 800);
  }, [navigate, cpfData, cpfDigits, cadastro, loanAmount, creditScore]);

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
      <Header userName={userName} userCpf={userCpf} />
      <FunnelProgress current="analise" />

      <div className="w-full">
        <img src={bannerEmprestimo} alt="Empréstimo rápido e fácil" className="w-full h-auto" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="bg-card rounded-3xl shadow-xl border border-border/40 p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center transition-all duration-700 bg-white ${
                pulse ? "scale-110" : "scale-100"
              }`}
              style={{
                boxShadow: pulse 
                  ? "0 0 30px hsl(0 0% 0% / 0.08), 0 0 60px hsl(0 0% 0% / 0.04)" 
                  : "0 0 10px hsl(0 0% 0% / 0.05)"
              }}>
                <img 
                  src={logoSupersim} 
                  alt="SuperSim" 
                  className={`w-16 h-16 object-contain transition-transform duration-700 ${pulse ? "scale-110" : "scale-100"}`} 
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Análise de Crédito
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Aguarde enquanto analisamos seu perfil de forma segura...
              </p>
            </div>

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

            {completedSteps.includes(2) && (
              <div className="bg-muted/30 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-sm font-semibold text-muted-foreground text-center uppercase tracking-wider">Score de Crédito</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={creditScore >= 700 ? "hsl(142,71%,45%)" : creditScore >= 500 ? "hsl(36,97%,55%)" : "hsl(0,84%,60%)"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(creditScore / 1000) * 264} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-foreground">{creditScore}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">de 1000</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-lg font-bold ${creditScore >= 700 ? "text-green-600" : creditScore >= 500 ? "text-amber-500" : "text-red-500"}`}>
                      {creditScore >= 700 ? "Excelente" : creditScore >= 500 ? "Bom" : "Regular"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {creditScore >= 700
                        ? "Ótimas chances de aprovação"
                        : creditScore >= 500
                        ? "Boas chances de aprovação"
                        : "Analisando alternativas..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
