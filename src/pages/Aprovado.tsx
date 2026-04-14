import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import iconCheckCircle from "@/assets/icon-check-circle.png";
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
    <div className="min-h-screen flex flex-col bg-primary text-primary-foreground">
      {/* Header — white background */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      {/* Hero - Approval — white background */}
      <section className="py-16 px-4 text-center bg-background">
        <div className="max-w-md mx-auto space-y-6">
          <img src={iconCheckCircle} alt="Aprovado" className="w-24 h-24 mx-auto drop-shadow-lg animate-in zoom-in duration-500" />
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground">🎉 Parabéns!</h1>
            <p className="text-muted-foreground text-xl mt-2">Seu crédito foi <span className="text-primary font-bold">pré-aprovado!</span></p>
          </div>

          <div className="relative bg-gradient-to-br from-primary to-[hsl(var(--primary)/0.85)] rounded-3xl p-10 mt-6 space-y-3 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <p className="text-primary-foreground/80 text-sm relative z-10">Valor disponível de até</p>
            <p className="text-7xl md:text-8xl font-black text-primary-foreground tracking-tighter relative z-10 drop-shadow-md">
              R$ 8.000
            </p>
            <p className="text-primary-foreground/70 text-base relative z-10">em até <strong>24x</strong> no boleto ou Pix</p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full max-w-sm mx-auto mt-4 px-10 py-5 rounded-full bg-gradient-to-r from-[hsl(30,95%,55%)] to-[hsl(350,80%,60%)] text-white font-bold text-xl hover:opacity-90 shadow-xl transition active:scale-[0.97] animate-pulse"
          >
            Solicitar agora! 🚀
          </button>
        </div>
      </section>

      {/* CTA - Chama no PIX */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary-foreground/60 uppercase">
            Chave para o sucesso
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground">
            Aqui sua chance é de verdade
          </h2>
          <p className="text-primary-foreground/80">
            Nascemos para democratizar o acesso ao crédito no Brasil e por isso oferecemos as melhores condições para todos os perfis.
          </p>
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
      <section className="py-12 px-4 border-t border-primary-foreground/10">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, idx) => (
              <div key={idx} className="space-y-3">
                <img src={b.image} alt={b.title} className="w-16 h-16" />
                <h3 className="text-xl font-bold text-primary-foreground">{b.title}</h3>
                <p className="text-primary-foreground/80 leading-relaxed">{b.description}</p>
              </div>
            ))}
        </div>
      </section>

      {/* Urgente / Negativado */}
      <section className="py-12 px-4 border-t border-primary-foreground/10">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary-foreground">Dinheiro urgente, até para negativado</h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            O empréstimo da SuperSim tem um dos processos mais rápidos do mercado na concessão de empréstimos pessoais online. E aqui, a chance é para todos, incluindo negativados!
          </p>
          <Button
            onClick={() => navigate("/")}
            className="mt-4 px-12 h-14 text-base font-bold rounded-full bg-background text-primary hover:bg-background/90 shadow-lg transition active:scale-[0.98]"
          >
            Solicitar agora
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Aprovado;
