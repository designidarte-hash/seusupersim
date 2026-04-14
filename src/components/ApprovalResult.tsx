import { CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalResultProps {
  open: boolean;
  onClose: () => void;
}

const ApprovalResult = ({ open, onClose }: ApprovalResultProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-extrabold text-foreground">Parabéns!</h2>
            <PartyPopper className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground">Seu crédito foi pré-aprovado!</p>
        </div>

        <div className="bg-primary/5 rounded-2xl p-6 space-y-1">
          <p className="text-sm text-muted-foreground">Valor disponível de até</p>
          <p className="text-4xl font-extrabold text-primary">R$ 8.000</p>
          <p className="text-xs text-muted-foreground">em até 24x no boleto ou Pix</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onClose}
            className="w-full h-14 text-base font-bold rounded-full bg-gradient-to-r from-[hsl(30,95%,55%)] to-[hsl(350,80%,60%)] text-white hover:opacity-90 shadow-lg transition active:scale-[0.98]"
          >
            Solicitar agora
          </Button>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalResult;
