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
      {/* Header */}
      <header className="py-4 flex justify-center border-b border-primary-foreground/20">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      {/* Hero - Approval */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <img src={iconCheckCircle} alt="Aprovado" className="w-16 h-16 mx-auto" />
          <h1 className="text-3xl font-extrabold">Parabéns!</h1>
          <p className="text-primary-foreground/80 text-lg">Seu crédito foi pré-aprovado!</p>

          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 mt-4 space-y-1">
            <p className="text-primary-foreground/70 text-sm">Valor disponível de até</p>
            <p className="text-5xl font-extrabold text-primary-foreground">R$ 8.000</p>
            <p className="text-primary-foreground/60 text-sm">em até 24x no boleto ou Pix</p>
          </div>
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
