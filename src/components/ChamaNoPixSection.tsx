import { useTransitionNavigate } from "@/components/PageTransition";
import chamaNoPixImg from "@/assets/chama-no-pix.webp";

interface ChamaNoPixSectionProps {
  onCtaClick?: () => void;
}

const ChamaNoPixSection = ({ onCtaClick }: ChamaNoPixSectionProps) => {
  const navigate = useTransitionNavigate();
  const handleClick = () => {
    if (onCtaClick) return onCtaClick();
    navigate("/cadastro");
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto text-center space-y-4">
        <p className="text-sm font-semibold tracking-[0.3em] text-primary-foreground/60 uppercase">
          Chave para o sucesso
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">
          Aqui sua chance é de verdade
        </h2>
        <p className="text-base md:text-lg text-primary-foreground/80">
          Nascemos para democratizar o acesso ao crédito no Brasil e por isso oferecemos as melhores condições para todos os perfis.
        </p>
        <div className="relative inline-block">
          <img src={chamaNoPixImg} alt="Chama no PIX" className="w-64 md:w-80 mx-auto" />
          <button
            onClick={handleClick}
            className="btn-3d absolute -bottom-6 left-1/2 -translate-x-1/2 bg-background text-primary border-b-[5px] border-b-[hsl(220,13%,80%)] whitespace-nowrap relative z-10 shadow-xl"
          >
            Receber empréstimo via PIX
          </button>
        </div>
        <div className="h-8"></div>
      </div>
    </section>
  );
};

export default ChamaNoPixSection;
