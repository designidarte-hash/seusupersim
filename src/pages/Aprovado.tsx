import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { CheckCircle2, PartyPopper } from "lucide-react";
import chamaNoPixImg from "@/assets/chama-no-pix.png";
import iconThumbsUp from "@/assets/icon-thumbsup.png";
import iconPhone from "@/assets/icon-phone.png";

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
  const navigate = useNavigate();
  const cpfData = location.state?.cpfData as Record<string, unknown> | null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      {/* Hero - Approval */}
      <section className="bg-gradient-to-br from-[hsl(30,95%,55%)] to-[hsl(350,80%,60%)] py-12 px-4 text-center text-white">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="w-6 h-6" />
            <h1 className="text-3xl font-extrabold">Parabéns!</h1>
            <PartyPopper className="w-6 h-6" />
          </div>
          <p className="text-white/90 text-lg">Seu crédito foi pré-aprovado!</p>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mt-4 space-y-1">
            <p className="text-white/80 text-sm">Valor disponível de até</p>
            <p className="text-5xl font-extrabold">R$ 8.000</p>
            <p className="text-white/70 text-sm">em até 24x no boleto ou Pix</p>
          </div>
        </div>
      </section>

      {/* CTA - Chama no PIX */}
      <section className="bg-primary py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary-foreground/70 uppercase">
            Chave para o sucesso
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground">
            Aqui sua chance é de verdade
          </h2>
          <img src={chamaNoPixImg} alt="Chama no PIX" className="w-64 md:w-80 mx-auto" />
          <Button
            onClick={() => navigate("/")}
            className="mt-4 px-10 h-14 text-base font-bold rounded-full bg-background text-primary hover:bg-background/90 shadow-lg transition active:scale-[0.98]"
          >
            Receber empréstimo via PIX
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-primary/90 py-12 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-primary-foreground">{b.title}</h3>
                <p className="text-primary-foreground/80 leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Urgente / Negativado */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Dinheiro urgente, até para negativado</h2>
          <p className="text-muted-foreground leading-relaxed">
            O empréstimo da SuperSim tem um dos processos mais rápidos do mercado na concessão de empréstimos pessoais online. E aqui, a chance é para todos, incluindo negativados!
          </p>
          <Button
            onClick={() => navigate("/")}
            className="mt-4 px-12 h-14 text-base font-bold rounded-full bg-gradient-to-r from-[hsl(30,95%,55%)] to-[hsl(350,80%,60%)] text-white hover:opacity-90 shadow-lg transition active:scale-[0.98]"
          >
            Solicitar agora
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Aprovado;
