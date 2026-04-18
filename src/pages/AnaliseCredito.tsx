import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import bannerEmprestimo from "@/assets/banner-emprestimo-hd.webp";
import { ShieldCheck, CheckCircle2, Search, FileCheck, BadgeDollarSign, Loader2, Lock, XCircle, AlertTriangle } from "lucide-react";
import logoSupersim from "@/assets/logo-supersim.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateLoanAmount, formatBRL } from "@/lib/loan-amount";

const analysisSteps = [
  { label: "Consultando CPF nos órgãos de proteção...", icon: Search, duration: 4000 },
  { label: "Analisando histórico de crédito...", icon: FileCheck, duration: 5000 },
  { label: "Verificando score de crédito...", icon: ShieldCheck, duration: 4500 },
  { label: "Calculando limite disponível...", icon: BadgeDollarSign, duration: 3500 },
];

const professions = [
  "Assalariado(a) CLT",
  "Autônomo(a)",
  "Servidor(a) Público(a)",
  "Empresário(a)",
  "Aposentado(a) / Pensionista",
  "Profissional Liberal",
  "Microempreendedor Individual (MEI)",
  "Trabalhador(a) Informal",
  "Estudante",
  "Outro",
];

const AnaliseCredito = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cpfData = location.state?.cpfData;
  const cpfDigits = location.state?.cpfDigits;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [pulse, setPulse] = useState(false);
  const [phase, setPhase] = useState<"analyzing" | "rejected" | "reanalyzing">("analyzing");

  // Generate stable random values on mount
  const loanAmount = useMemo(() => generateLoanAmount(), []);
  const creditScore = useMemo(() => Math.floor(Math.random() * 451) + 350, []); // 350-800

  // Form state
  const [profissao, setProfissao] = useState("");
  const [renda, setRenda] = useState("");

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      navigate("/aprovado", { state: { cpfData, cpfDigits, loanAmount, creditScore } });
    }, 800);
  }, [navigate, cpfData, cpfDigits, loanAmount, creditScore]);

  // Analysis steps effect
  useEffect(() => {
    if (phase !== "analyzing") return;

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
  }, [handleComplete, phase]);

  // Re-analysis effect
  useEffect(() => {
    if (phase !== "reanalyzing") return;

    setCurrentStep(0);
    setCompletedSteps([]);
    let stepIndex = 0;

    const runStep = () => {
      if (stepIndex >= analysisSteps.length) {
        setTimeout(() => {
          navigate("/aprovado", { state: { cpfData, cpfDigits, loanAmount, creditScore } });
        }, 800);
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
  }, [phase, navigate, cpfData, cpfDigits]);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  const progress = (completedSteps.length / analysisSteps.length) * 100;

  const formatRenda = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (!nums) return "";
    const reais = parseInt(nums, 10);
    return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
  };

  const handleRendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRenda(raw);
  };

  const handleSubmitRenda = () => {
    if (!profissao || !renda) return;
    setPhase("reanalyzing");
  };

  // Rejected phase - show form
  if (phase === "rejected") {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f7f7]">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md space-y-5">
            <div className="bg-white rounded-3xl shadow-lg p-7 md:p-9 space-y-7">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-red-100">
                  <XCircle className="w-9 h-9 text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-center text-2xl md:text-[28px] font-extrabold text-foreground leading-tight">
                Análise não aprovada
              </h1>

              {/* Warning box */}
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-bold text-sm">Renda incompatível</span>
                </div>
                <p className="text-gray-500 text-sm text-center leading-relaxed">
                  Não foi possível aprovar seu crédito pois não identificamos renda compatível no seu CPF. Preencha os dados abaixo para uma nova análise.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="profissao" className="text-sm font-bold text-foreground">Profissão</Label>
                  <Select value={profissao} onValueChange={setProfissao}>
                    <SelectTrigger className="h-13 rounded-xl border-2 border-[hsl(36,90%,70%)] focus:border-[hsl(36,97%,55%)] text-sm bg-white shadow-none">
                      <SelectValue placeholder="Selecione sua profissão" />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="renda" className="text-sm font-bold text-foreground">Renda mensal</Label>
                  <Input
                    id="renda"
                    placeholder="Ex: R$ 2.000"
                    value={renda ? formatRenda(renda) : ""}
                    onChange={handleRendaChange}
                    className="h-13 rounded-xl border-2 border-border/40 focus:border-[hsl(36,97%,55%)] text-sm bg-white shadow-none"
                  />
                </div>

                <Button
                  onClick={handleSubmitRenda}
                  disabled={!profissao || !renda}
                  className="w-full h-13 rounded-xl text-base font-bold bg-gradient-to-r from-[hsl(36,90%,72%)] to-[hsl(30,90%,65%)] hover:from-[hsl(36,97%,55%)] hover:to-[hsl(30,95%,50%)] text-white shadow-md border-0 transition-all duration-200"
                >
                  Analisar novamente
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span>Seus dados estão protegidos por criptografia SSL</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Analyzing / Reanalyzing phase
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

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
                {phase === "reanalyzing" ? "Nova Análise de Crédito" : "Análise de Crédito"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {phase === "reanalyzing" 
                  ? "Reanalisando com os novos dados informados..." 
                  : "Aguarde enquanto analisamos seu perfil de forma segura..."}
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

            {/* Credit Score Gauge - shows after step 3 completes */}
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
