import { useLocation } from "react-router-dom";
import { useTransitionNavigate } from "@/components/PageTransition";
import Footer from "@/components/Footer";
import ChamaNoPixSection from "@/components/ChamaNoPixSection";
import Header from "@/components/Header";
import FunnelProgress from "@/components/FunnelProgress";
import { useFunnelUser } from "@/hooks/use-funnel-user";
import iconThumbsUp from "@/assets/icon-thumbsup.webp";
import iconPhone from "@/assets/icon-phone.webp";

import { CheckCircle2, ShieldCheck, Zap, Lock, ArrowRight, Sparkles } from "lucide-react";

const benefits = [
  {
    image: iconThumbsUp,
    title: "Taxa de aprovação",
    description:
      "Maior taxa de aprovação do mercado de crédito! Desenvolvemos métodos flexíveis e decisões baseadas em inteligência artificial para oferecer empréstimos descomplicados para todos que precisam.",
  },
  {
    image: iconPhone,
    title: "Online e para todos",
    description:
      'Fácil, rápido e inclusivo. A nossa missão é dizer cada vez mais "sim" para a população brasileira através de um processo online e sem burocracia.',
  },
];

const Aprovado = () => {
  const location = useLocation();
  const navigate = useTransitionNavigate();
  const cpfData = location.state?.cpfData as Record<string, unknown> | null;
  const cpfDigits = location.state?.cpfDigits as string | undefined;
  const { userName, userCpf } = useFunnelUser();
  const loanAmount = 2500;
  const creditScore = (location.state?.creditScore as number) || 500;

  // Dados de contrato (estáveis, baseados no CPF)
  const proposalNumber = (cpfDigits ? cpfDigits.slice(-6) : "482917").padStart(6, "0");
  const validade = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const firstName = (userName || "Cliente").split(" ")[0];
  const goSimulacao = () =>
    navigate("/simulacao", { cpfData, cpfDigits, cadastro: location.state?.cadastro, loanAmount, creditScore });

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(220,20%,97%)] text-foreground">
      <Header userName={userName} userCpf={userCpf} />
      <FunnelProgress current="aprovado" />

      {/* Hero — estilo bank */}
      <section className="relative px-4 pt-8 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          {/* Status pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              PROPOSTA APROVADA
            </div>
          </div>

          <div className="text-center mb-8 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Parabéns, {firstName}!
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Seu crédito foi pré-aprovado. Confira sua proposta abaixo.
            </p>
          </div>

          {/* Card de proposta — cartão bancário */}
          <div className="relative rounded-3xl bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,15%)] to-[hsl(222,47%,11%)] p-7 md:p-9 shadow-2xl ring-1 ring-white/10 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-start justify-between mb-8">
              <div>
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Crédito Pessoal
                </p>
                <p className="text-white/90 text-sm mt-1 font-medium">SuperSim Bank</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[10px] font-bold text-white tracking-wider">SEGURO</span>
              </div>
            </div>

            <div className="relative">
              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">
                Valor liberado
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-white/60 text-2xl font-light">R$</span>
                <span className="text-white text-5xl md:text-6xl font-black tracking-tight">
                  {loanAmount.toLocaleString("pt-BR")}
                </span>
                <span className="text-white/60 text-2xl font-light">,00</span>
              </div>
              <p className="text-white/60 text-sm mt-2">
                em até <strong className="text-white">24x</strong> · a partir de{" "}
                <strong className="text-white">R$ 137,50/mês</strong>
              </p>
            </div>

            {/* Divisor pontilhado */}
            <div className="relative my-7 flex items-center">
              <div className="absolute -left-9 w-5 h-5 rounded-full bg-[hsl(220,20%,97%)]" />
              <div className="absolute -right-9 w-5 h-5 rounded-full bg-[hsl(220,20%,97%)]" />
              <div className="flex-1 border-t border-dashed border-white/20" />
            </div>

            {/* Detalhes do contrato */}
            <div className="relative grid grid-cols-2 gap-5 text-left">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">
                  Proposta nº
                </p>
                <p className="text-white text-sm font-mono font-semibold mt-1">
                  #{proposalNumber}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">
                  Válida até
                </p>
                <p className="text-white text-sm font-semibold mt-1">{fmtDate(validade)}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">
                  Taxa de juros
                </p>
                <p className="text-white text-sm font-semibold mt-1">
                  1,32% <span className="text-white/50 font-normal">a.m.</span>
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">
                  Score de crédito
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white text-sm font-semibold">{creditScore}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    BOM
                  </span>
                </div>
              </div>
            </div>

            {/* Chip PIX */}
            <div className="relative mt-7 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold leading-tight">
                  Receba via PIX em até 5 minutos
                </p>
                <p className="text-white/50 text-xs mt-0.5">Após confirmar a contratação</p>
              </div>
            </div>
          </div>

          {/* CTA principal */}
          <button
            onClick={goSimulacao}
            className="group mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Solicitar agora
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Conexão criptografada</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sem consulta ao SPC/Serasa</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Regulado pelo Bacen</span>
            </div>
          </div>
        </div>
      </section>

      <ChamaNoPixSection
        onCtaClick={() =>
          navigate("/simulacao", { cpfData, cpfDigits, cadastro: location.state?.cadastro, loanAmount, creditScore })
        }
      />

      {/* Benefits */}
      <section className="py-12 px-4 bg-sunburst">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {benefits.map((b, idx) => (
            <div key={idx} className="space-y-3">
              <img src={b.image} alt={b.title} className="w-16 h-16" />
              <h3 className="text-2xl font-bold text-white">{b.title}</h3>
              <p className="text-base md:text-lg text-white/80 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Urgente / Negativado */}
      <section className="py-12 px-4 bg-sunburst">
        <div className="max-w-lg mx-auto text-center space-y-4 relative z-10">
          <h2 className="text-3xl font-bold text-white">Dinheiro urgente, até para negativado</h2>
          <p className="text-base md:text-lg text-white/80 leading-relaxed">
            O empréstimo da SuperSim tem um dos processos mais rápidos do mercado na concessão de empréstimos pessoais online. E aqui, a chance é para todos, incluindo negativados!
          </p>
          <button
            onClick={goSimulacao}
            className="btn-3d mt-4 bg-background text-primary border-b-[5px] border-b-[hsl(220,13%,80%)] relative z-10 shadow-xl"
          >
            Solicitar agora
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Aprovado;
