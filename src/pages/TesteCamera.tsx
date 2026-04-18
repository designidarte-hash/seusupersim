import { useState } from "react";
import FacialVerification from "@/components/FacialVerification";

const TesteCamera = () => {
  const [open, setOpen] = useState(true);
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
      <h1 className="text-2xl font-bold text-foreground">Teste da Verificação Facial</h1>
      <p className="text-muted-foreground text-center max-w-md">
        {done
          ? "Captura concluída com sucesso!"
          : "A câmera deve abrir automaticamente. Caso feche, clique no botão abaixo."}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
          className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:opacity-90 transition"
        >
          Abrir câmera
        </button>
      </div>

      {open && (
        <FacialVerification
          onComplete={() => {
            setOpen(false);
            setDone(true);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default TesteCamera;
