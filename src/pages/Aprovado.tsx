import { useLocation, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import ChamaNoPixSection from "@/components/ChamaNoPixSection";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import iconCheckCircle from "@/assets/icon-check-circle.png";
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
    <div className="min-h-screen flex flex-col bg-sunburst text-primary-foreground">
      {/* Header — white background */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      {/* Hero - Approval — white background */}
      <section className="py-16 px-4 text-center bg-background">
        <div className="max-w-md mx-auto space-y-6">
          <img src={iconCheckCircle} alt="Aprovado" className="w-20 h-20 mx-auto animate-in zoom-in duration-500" />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Parabéns!</h1>
            <p className="text-muted-foreground text-lg mt-2">Seu crédito foi <span className="text-primary font-bold">pré-aprovado!</span></p>
          </div>

          <div className="bg-primary rounded-3xl p-10 mt-6 space-y-2 shadow-xl">
            <p className="text-primary-foreground/80 text-sm">Valor disponível de até</p>
            <p className="text-6xl md:text-7xl font-black text-primary-foreground tracking-tight">
              R$ 8.000
            </p>
            <p className="text-primary-foreground/70 text-sm">em até <strong>24x</strong> no boleto ou Pix</p>
          </div>

          <button
            onClick={() => navigate("/cadastro", { state: { cpfData } })}
            className="btn-3d w-full max-w-sm mx-auto mt-4"
          >
            Solicitar agora
          </button>
        </div>
      </section>

      <ChamaNoPixSection />

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
          <button
            onClick={() => navigate("/")}
            className="btn-3d mt-4 bg-background text-primary border-b-[5px] border-b-[hsl(220,13%,80%)]"
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
