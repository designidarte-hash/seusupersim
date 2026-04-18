import { useLocation } from "react-router-dom";
import { useTransitionNavigate } from "@/components/PageTransition";
import Footer from "@/components/Footer";
import ChamaNoPixSection from "@/components/ChamaNoPixSection";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import FunnelProgress from "@/components/FunnelProgress";
import iconCheckCircle from "@/assets/icon-check-circle.png";
import iconThumbsUp from "@/assets/icon-thumbsup.webp";
import iconPhone from "@/assets/icon-phone.webp";
import { formatBRL } from "@/lib/loan-amount";

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
  const loanAmount = 2500;
  const creditScore = (location.state?.creditScore as number) || 500;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* Hero - Approval with sunburst stripes */}
      <section className="relative py-20 px-4 text-center overflow-hidden bg-[hsl(40,40%,95%)]">
        {/* Sunburst stripe rays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-conic-gradient(from 0deg at 50% 50%, hsl(40, 30%, 90%) 0deg 5deg, transparent 5deg 10deg)`,
          }}
        />
        {/* Soft radial overlay to fade edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, hsl(40, 40%, 95%) 75%)`,
          }}
        />

        <div className="max-w-md mx-auto space-y-6 relative z-10">
          <img
            src={iconCheckCircle}
            alt="Aprovado"
            className="w-24 h-24 mx-auto animate-in zoom-in duration-500 drop-shadow-lg"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Parabéns!</h1>
            <p className="text-muted-foreground text-xl mt-3">
              Seu crédito foi <span className="text-primary font-bold">pré-aprovado!</span>
            </p>
          </div>

          <div className="bg-primary rounded-3xl p-8 mt-8 space-y-2 shadow-2xl">
            <p className="text-white/80 text-sm">Valor disponível de até</p>
            <p className="text-5xl md:text-6xl font-black text-white tracking-tight">
              {formatBRL(loanAmount)}
            </p>
            <p className="text-white/70 text-sm">em até <strong>24x</strong> no boleto ou Pix</p>
          </div>

          <button
            onClick={() => navigate("/cadastro", { cpfData, cpfDigits, loanAmount, creditScore })}
            className="btn-3d w-full max-w-sm mx-auto mt-6 relative z-10 shadow-2xl text-xl"
          >
            Solicitar agora
          </button>
        </div>
      </section>

      <ChamaNoPixSection />

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
            onClick={() => navigate("/cadastro", { cpfData, cpfDigits, loanAmount, creditScore })}
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
