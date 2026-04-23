import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ProcessoCompletoPopupProps {
  open: boolean;
  firstName?: string;
  onContinue: () => void;
}

/**
 * Popup informativo exibido logo após o pagamento do Seguro Prestamista.
 * Avisa o cliente que o processo de liberação SÓ é concretizado quando
 * todas as etapas (taxas regulatórias) forem pagas — protegendo a
 * conversão dos upsells subsequentes (taxa, IOF, SCR, liberação, antifraude).
 */
const ProcessoCompletoPopup = ({ open, firstName, onContinue }: ProcessoCompletoPopupProps) => {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header com gradiente de alerta */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-primary px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-base leading-tight">
              Atenção, {firstName || "cliente"}!
            </p>
            <p className="text-white/90 text-xs font-semibold">
              Leia antes de continuar
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Seu <strong>Seguro Prestamista</strong> foi ativado com sucesso! ✅
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3">
            <p className="text-sm text-amber-900 font-bold leading-snug">
              ⚠️ O depósito do seu crédito SÓ será liberado após a conclusão de TODAS as 5 etapas regulatórias obrigatórias.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Faltam 5 etapas para receber:
            </p>
            <ul className="space-y-1.5">
              {[
                "Taxa de Transferência Interbancária",
                "IOF Federal (Banco Central)",
                "Registro SCR/Bacen",
                "Liberação Imediata",
                "Seguro Antifraude",
              ].map((etapa, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium">{etapa}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-800 leading-snug">
                Todos os valores são descontados do seu contrato.
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                Não é custo a mais — é adiantamento de taxas que já estavam previstas. Se você parar no meio, perde o que já pagou e a aprovação expira.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            ⏱️ Sua proposta tem prazo. Conclua hoje para garantir o depósito.
          </p>

          <button
            onClick={onContinue}
            className="btn-3d w-full !py-3.5 !rounded-xl !text-sm font-black"
          >
            Entendi, vou concluir todas as etapas →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessoCompletoPopup;
