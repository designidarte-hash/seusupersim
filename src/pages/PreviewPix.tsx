import { useEffect, useState } from "react";
import { Clock, ShieldCheck, Lock, BadgeCheck, CheckCircle2, Copy } from "lucide-react";

/**
 * Preview da tela de PIX com elementos de conversão:
 * - Timer regressivo 15min + barra "95% concluído"
 * - Selos Allianz + BACEN + SSL + garantia de reembolso
 * - Pop-ups de prova social ao vivo
 *
 * Acesse em /preview-pix
 */

const SOCIAL_PROOFS = [
  { nome: "João S.", cidade: "São Paulo/SP", valor: "R$ 5.000", tempo: "há 2 minutos" },
  { nome: "Maria F.", cidade: "Rio de Janeiro/RJ", valor: "R$ 3.500", tempo: "há 4 minutos" },
  { nome: "Pedro L.", cidade: "Belo Horizonte/MG", valor: "R$ 2.500", tempo: "há 6 minutos" },
  { nome: "Ana C.", cidade: "Porto Alegre/RS", valor: "R$ 8.000", tempo: "há 8 minutos" },
  { nome: "Lucas M.", cidade: "Curitiba/PR", valor: "R$ 4.200", tempo: "agora mesmo" },
  { nome: "Carla R.", cidade: "Salvador/BA", valor: "R$ 1.800", tempo: "há 1 minuto" },
  { nome: "Felipe O.", cidade: "Recife/PE", valor: "R$ 6.500", tempo: "há 3 minutos" },
];

const formatTime = (totalSec: number) => {
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const PreviewPix = () => {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [proofIndex, setProofIndex] = useState(0);
  const [proofVisible, setProofVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Social proof rotation: show for 5s, hide for 15s, next
  useEffect(() => {
    const showTimeout = setTimeout(() => setProofVisible(true), 2000);
    return () => clearTimeout(showTimeout);
  }, []);

  useEffect(() => {
    if (!proofVisible) return;
    const hideTimer = setTimeout(() => setProofVisible(false), 5000);
    return () => clearTimeout(hideTimer);
  }, [proofVisible, proofIndex]);

  useEffect(() => {
    if (proofVisible) return;
    const nextTimer = setTimeout(() => {
      setProofIndex((i) => (i + 1) % SOCIAL_PROOFS.length);
      setProofVisible(true);
    }, 12000);
    return () => clearTimeout(nextTimer);
  }, [proofVisible]);

  const isUrgent = secondsLeft < 5 * 60;
  const proof = SOCIAL_PROOFS[proofIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText("00020101021226940014br.gov.bcb.pix2572qrcode.somossimpay.com.br/v2/qr/cob/6ffbd4a0-f20a-40ba-aeff-90721e2af93d52040000530398");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-12">
      {/* Header chat */}
      <div className="bg-gradient-to-r from-primary to-[hsl(30,95%,45%)] px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-black text-lg">S</div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm leading-tight">Atendimento SuperSim</p>
          <p className="text-white/90 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> online agora
          </p>
        </div>
        <BadgeCheck className="w-5 h-5 text-green-300 fill-green-500" />
      </div>

      {/* TIMER + PROGRESS BAR — Topo da tela */}
      <div className={`sticky top-[60px] z-20 px-4 py-3 transition-colors ${isUrgent ? "bg-red-50 border-b border-red-200" : "bg-amber-50 border-b border-amber-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isUrgent ? "text-red-600 animate-pulse" : "text-amber-600"}`} />
            <span className={`text-xs font-semibold ${isUrgent ? "text-red-700" : "text-amber-800"}`}>
              Sua proposta expira em
            </span>
          </div>
          <span className={`text-base font-black tabular-nums ${isUrgent ? "text-red-600 animate-pulse" : "text-amber-700"}`}>
            {formatTime(secondsLeft)}
          </span>
        </div>
        {/* Progress bar — 95% concluído */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className={isUrgent ? "text-red-700" : "text-amber-800"}>Liberação do crédito</span>
            <span className={`${isUrgent ? "text-red-700" : "text-amber-800"}`}>95% concluído</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-black/5">
            <div
              className="h-full bg-gradient-to-r from-primary via-[hsl(30,95%,50%)] to-[hsl(30,95%,45%)] relative"
              style={{ width: "95%" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Mensagem do bot */}
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm p-3 max-w-[85%]">
          <p className="text-sm text-foreground">Segue o PIX para pagamento da taxa de transferência:</p>
        </div>

        {/* Card PIX */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Valor */}
            <div className="text-center bg-gradient-to-br from-primary/5 to-[hsl(30,95%,45%)]/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Taxa de transferência interbancária</p>
              <p className="text-4xl font-black text-primary mt-1">R$ 28,74</p>
              <p className="text-xs text-gray-500 mt-1">Valor único · Não é mensalidade</p>
            </div>

            {/* SELOS DE CONFIANÇA */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {/* Allianz */}
                <div className="bg-white rounded-lg p-2 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-black text-[#003781] tracking-tight leading-tight">Allianz ⓘ</div>
                  <p className="text-[8px] text-gray-500 mt-0.5 font-semibold">Seguradora</p>
                </div>
                {/* BACEN */}
                <div className="bg-white rounded-lg p-2 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-black text-[#0a4d7c] tracking-tight leading-tight">BACEN</div>
                  <p className="text-[8px] text-gray-500 mt-0.5 font-semibold">Regulado</p>
                </div>
                {/* SSL */}
                <div className="bg-white rounded-lg p-2 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <div className="text-[10px] font-black text-emerald-700 mt-0.5">SSL 256</div>
                  <p className="text-[8px] text-gray-500 mt-0.5 font-semibold">Criptografia</p>
                </div>
              </div>

              {/* Garantia de reembolso */}
              <div className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-800 leading-tight">Garantia de reembolso em 10 minutos</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Se o crédito não for depositado, devolvemos 100% do valor pago.</p>
                </div>
              </div>
            </div>

            {/* QR Code mock */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-200">
                <div
                  className="w-44 h-44 bg-foreground"
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(#000 0% 25%, transparent 0% 50%)",
                    backgroundSize: "12px 12px",
                  }}
                />
              </div>
            </div>

            {/* Copia e cola */}
            <div>
              <p className="text-[11px] text-gray-500 text-center mb-1.5 font-medium">Ou copie o código abaixo:</p>
              <div className="bg-gray-50 rounded-lg p-2 max-h-16 overflow-auto border border-gray-200">
                <p className="text-[10px] text-gray-700 break-all font-mono leading-relaxed">
                  00020101021226940014br.gov.bcb.pix2572qrcode.somossimpay.com.br/v2/qr/cob/6ffbd4a0-f20a-40ba-aeff-90721e2af93d
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="btn-3d w-full mt-2 !py-3 !rounded-xl !text-sm flex items-center justify-center gap-2"
              >
                {copied ? <><CheckCircle2 className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
              </button>
              <p className="text-[10px] text-gray-500 text-center mt-2">
                O QR Code tem validade limitada. Efetue o pagamento o mais rápido possível.
              </p>
            </div>
          </div>
        </div>

        {/* Botão "Já paguei" */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <p className="text-xs text-gray-700 font-medium">Após realizar o pagamento, clique no botão abaixo:</p>
          <button className="btn-3d w-full !py-3 !rounded-xl !text-sm">Já paguei</button>
        </div>
      </div>

      {/* POP-UP DE PROVA SOCIAL — fixo no canto inferior */}
      <div
        className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs z-40 transition-all duration-500 ${
          proofVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-emerald-100 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">
              {proof.nome} · {proof.cidade}
            </p>
            <p className="text-xs text-emerald-700 font-semibold">
              Recebeu {proof.valor} {proof.tempo}
            </p>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PreviewPix;
