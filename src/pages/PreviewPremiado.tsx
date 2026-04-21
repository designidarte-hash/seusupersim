import { useState } from "react";
import ContratoPremiadoModal from "@/components/ContratoPremiadoModal";
import { Button } from "@/components/ui/button";

const PreviewPremiado = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted p-6">
      <h1 className="text-2xl font-bold">Preview — Contrato Premiado</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Tela de teste do modal Contrato Premiado que aparece antes do PIX do seguro no chat.
      </p>
      <Button size="lg" onClick={() => setOpen(true)}>
        Abrir modal
      </Button>
      <ContratoPremiadoModal open={open} firstName="João" onContinue={() => setOpen(false)} />
    </div>
  );
};

export default PreviewPremiado;
