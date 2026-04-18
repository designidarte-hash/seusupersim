import { useLocation } from "react-router-dom";
import { useTransitionNavigate } from "@/components/PageTransition";
import Footer from "@/components/Footer";
import ChamaNoPixSection from "@/components/ChamaNoPixSection";
import Header from "@/components/Header";
import FunnelProgress from "@/components/FunnelProgress";
import { useFunnelUser } from "@/hooks/use-funnel-user";
import iconThumbsUp from "@/assets/icon-thumbsup.webp";
import iconPhone from "@/assets/icon-phone.webp";
import supersimLogo from "@/assets/supersim-logo.svg";

import { CheckCircle2, ShieldCheck, Lock } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[hsl(36,60%,97%)] text-foreground">
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

          {/* Card de proposta — mesma identidade do contrato no chat */}
          <div className="relative rounded-3xl bg-gradient-to-br from-primary to-[hsl(30,95%,45%)] p-7 md:p-9 shadow-2xl ring-1 ring-white/20 overflow-hidden text-primary-foreground">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-start justify-between mb-8">
              <div>
                <p className="text-primary-foreground/70 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Crédito Pessoal
                </p>
                <img src={supersimLogo} alt="SuperSim" className="h-7 mt-2" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
                <span className="text-[10px] font-bold text-primary-foreground tracking-wider">SEGURO</span>
              </div>
            </div>

            <div className="relative">
              <p className="text-primary-foreground/70 text-xs uppercase tracking-wider font-semibold">
                Valor liberado
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-primary-foreground/80 text-2xl font-light">R$</span>
                <span className="text-primary-foreground text-5xl md:text-6xl font-black tracking-tight drop-shadow-sm">
                  {loanAmount.toLocaleString("pt-BR")}
                </span>
                <span className="text-primary-foreground/80 text-2xl font-light">,00</span>
              </div>
              <p className="text-primary-foreground/85 text-sm mt-2">
                em até <strong className="text-primary-foreground">24x</strong> · a partir de{" "}
                <strong className="text-primary-foreground">R$ 137,50/mês</strong>
              </p>
            </div>

            {/* Divisor pontilhado */}
            <div className="relative my-7 flex items-center">
              <div className="absolute -left-9 w-5 h-5 rounded-full bg-[hsl(220,20%,97%)]" />
              <div className="absolute -right-9 w-5 h-5 rounded-full bg-[hsl(220,20%,97%)]" />
              <div className="flex-1 border-t border-dashed border-primary-foreground/30" />
            </div>

            {/* Detalhes do contrato */}
            <div className="relative grid grid-cols-3 gap-5 text-left">
              <div>
                <p className="text-primary-foreground/70 text-[10px] uppercase tracking-wider font-semibold">
                  Proposta nº
                </p>
                <p className="text-primary-foreground text-sm font-mono font-semibold mt-1">
                  #{proposalNumber}
                </p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-[10px] uppercase tracking-wider font-semibold">
                  Válida até
                </p>
                <p className="text-primary-foreground text-sm font-semibold mt-1">{fmtDate(validade)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-[10px] uppercase tracking-wider font-semibold">
                  Taxa de juros
                </p>
                <p className="text-primary-foreground text-sm font-semibold mt-1">
                  1,32% <span className="text-primary-foreground/70 font-normal">a.m.</span>
                </p>
              </div>
            </div>
          </div>

          {/* CTA principal — padrão do site */}
          <button onClick={goSimulacao} className="btn-3d w-full mt-6">
            Solicitar agora
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
