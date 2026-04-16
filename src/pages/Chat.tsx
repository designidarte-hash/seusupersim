import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import profileImg from "@/assets/profile-s.png";
import verifiedBadge from "@/assets/verified-badge.webp";
import supersimLogo from "@/assets/supersim-logo.svg";
import logo from "@/assets/logo.png";
import bcbLogo from "@/assets/bcb-logo.png";
import { ArrowLeft, Send, Check, CheckCheck, Play, Pause, CreditCard, Smartphone, Mail, KeyRound, ShieldCheck, FileDown, Copy, QrCode, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, any>) => void;
      identify: (params: Record<string, any>) => void;
    };
  }
}

interface ChatMessage {
  id: number;
  text?: string;
  audioSrc?: string;
  loanCard?: LoanDetails;
  pixSelector?: boolean;
  pixConfirm?: { type: string; value: string };
  insuranceAudioConfirm?: boolean;
  insuranceCard?: boolean;
  insurancePdf?: string;
  insuranceInfoPdf?: boolean;
  manualConfirmButton?: boolean;
  pixPayment?: { qrCode: string; qrCodeBase64: string; value: number; label?: string; sublabel?: string };
  pdfConfirmButton?: boolean;
  proceedButton?: boolean;
  pixPaidButton?: boolean;
  taxaButton?: boolean;
  normativoCard?: boolean;
  normativoConfirmButton?: boolean;
  contractCard?: boolean;
  fromUser: boolean;
  time: string;
  read: boolean;
}

interface LoanDetails {
  valor: number;
  parcelas: number;
  valorParcela: number;
  taxa: number;
  diaPagamento: string;
}

const getNow = () => {
  const d = new Date();
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SEG-${code}`;
};

const AudioPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[220px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 cursor-pointer" onClick={toggle}>
        {playing ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {duration > 0 ? formatTime(playing ? (audioRef.current?.currentTime || 0) : duration) : "0:00"}
        </span>
      </div>
      <img src={profileImg} alt="" className="w-8 h-8 rounded-full object-contain shrink-0" />
    </div>
  );
};

const LoanConfirmCard = ({ details, onConfirm, confirmed }: { details: LoanDetails; onConfirm: () => void; confirmed: boolean }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <CreditCard className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-foreground">Modalidade: Crédito Pessoal</span>
    </div>
    <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Valor solicitado</span><span className="font-semibold">{formatCurrency(details.valor)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Parcelas</span><span className="font-semibold">{details.parcelas}x de {formatCurrency(details.valorParcela)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Taxa mensal</span><span className="font-semibold">{details.taxa}%</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Dia de pagamento</span><span className="font-semibold">{details.diaPagamento}</span></div>
    </div>
    {!confirmed ? (
      <button onClick={onConfirm} className="btn-3d w-full !py-2.5 !text-sm !rounded-xl !px-4">
        Confirmar dados
      </button>
    ) : (
      <div className="text-center text-xs text-green-600 font-semibold py-1">Dados confirmados!</div>
    )}
  </div>
);

const PixSelectorCard = ({ onSelect }: { onSelect: (type: string) => void }) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-foreground">Escolha o tipo de chave Pix para recebimento:</p>
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-xs font-semibold text-blue-800">Informação sobre parcelas</span>
      </div>
      <p className="text-[11px] text-blue-700 leading-relaxed">
        O desconto das parcelas será realizado automaticamente na <strong>mesma conta cadastrada</strong> na chave Pix informada abaixo. Certifique-se de que a conta estará ativa e com saldo disponível na data de vencimento.
      </p>
    </div>
    <div className="space-y-2">
      <button onClick={() => onSelect("cpf")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-primary/5 transition-colors text-left">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><KeyRound className="w-4 h-4 text-primary" /></div>
        <div><p className="text-sm font-semibold text-foreground">CPF</p><p className="text-xs text-muted-foreground">Usar o CPF cadastrado</p></div>
      </button>
      <button onClick={() => onSelect("email")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-primary/5 transition-colors text-left">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div>
        <div><p className="text-sm font-semibold text-foreground">E-mail</p><p className="text-xs text-muted-foreground">Usar seu e-mail</p></div>
      </button>
      <button onClick={() => onSelect("telefone")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-primary/5 transition-colors text-left">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Smartphone className="w-4 h-4 text-primary" /></div>
        <div><p className="text-sm font-semibold text-foreground">Telefone</p><p className="text-xs text-muted-foreground">Usar seu número de celular</p></div>
      </button>
    </div>
  </div>
);

const PixConfirmCard = ({ type, value, onConfirm, onEdit, confirmed }: { type: string; value: string; onConfirm: () => void; onEdit: (newVal: string) => void; confirmed: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const label = type === "cpf" ? "CPF" : type === "email" ? "E-mail" : "Telefone";

  if (confirmed) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground">Chave Pix ({label}):</p>
        <div className="bg-muted/50 rounded-xl p-3 text-center"><p className="font-semibold text-foreground">{value}</p></div>
        <div className="text-center text-xs text-green-600 font-semibold py-1">Chave confirmada!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">Chave Pix ({label}):</p>
      {editing ? (
        <div className="space-y-2">
          <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={() => { onEdit(editValue); setEditing(false); }}
            className="btn-3d w-full !py-2 !text-sm !rounded-xl !px-4">Salvar</button>
        </div>
      ) : (
        <>
          <div className="bg-muted/50 rounded-xl p-3 text-center"><p className="font-semibold text-foreground">{value}</p></div>
          <div className="flex gap-2">
            <button onClick={onConfirm} className="btn-3d flex-1 !py-2.5 !text-sm !rounded-xl !px-4">Confirmar</button>
            {type !== "cpf" && (
              <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors">✏️ Editar</button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const InsuranceCard = ({ onAccept, accepted, nome, cpf, dataNascimento, valor, parcelas, valorParcela }: { 
  onAccept: () => void; accepted: boolean | null;
  nome?: string; cpf?: string; dataNascimento?: string;
  valor?: number; parcelas?: number; valorParcela?: number;
}) => {
  const [open, setOpen] = useState(false);
  const today = new Date().toLocaleDateString("pt-BR");
  const codigo = useMemo(() => generateCode(), []);

  if (accepted === true) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" /><span className="text-sm font-semibold text-foreground">Seguro Prestamista</span></div>
        <div className="text-center text-xs text-green-600 font-semibold py-1">Seguro contratado!</div>
      </div>
    );
  }
  if (accepted === false) {
    return null;
  }

  const handleAccept = () => {
    onAccept();
    setTimeout(() => setOpen(false), 1200);
  };

  const coberturas = [
    { nome: "Morte", valor: formatCurrency(valor || 2500) },
    { nome: "IPA - Invalidez Permanente Total por Acidente", valor: formatCurrency(valor || 2500) },
    { nome: "IFPD - Invalidez Funcional Permanente Total por Doença", valor: formatCurrency(valor || 2500) },
    { nome: "PR - Perda de Renda", valor: formatCurrency(valor || 2500) },
  ];

  return (
    <div className="space-y-3">
      {/* Preview card */}
      <div
        onClick={() => setOpen(true)}
        className="bg-gradient-to-br from-[#003366] to-[#005599] rounded-2xl p-5 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">Seguro Prestamista</span>
          </div>
          <img src="/images/allianz-logo.png" alt="Allianz" className="h-8 brightness-0 invert" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-white/70">Pagamento único</p>
            <p className="text-xl font-extrabold">R$ 34,90</p>
            <p className="text-[10px] text-white/70">Não é mensalidade</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Coberturas</p>
            <p className="text-sm font-bold">Morte, IPA, IFPD</p>
          </div>
        </div>
        <div className="mt-3 bg-white/20 rounded-xl py-2 text-center">
          <p className="text-xs font-semibold">Toque para revisar e assinar</p>
        </div>
      </div>

      {/* Full-screen modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg md:rounded-2xl md:max-h-[90vh] h-full md:h-auto overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#003366] to-[#005599] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-white" />
                <div>
                  <p className="text-white font-bold text-sm">Assinatura do Seguro Prestamista</p>
                  <p className="text-white/70 text-[10px]">Allianz Seguros — {today}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <img src="/images/allianz-logo.png" alt="Allianz" className="h-9 brightness-0 invert" />
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
                  ✕
                </button>
              </div>
            </div>

            {/* Dados do Estipulante */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-[#003366] rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Dados do Estipulante</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                {[
                  ["Estipulante", "SuperSim Serviços Financeiros LTDA"],
                  ["Nº Apólice", codigo],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground text-right max-w-[60%] truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dados do Proponente */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-[#003366] rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Dados do Proponente</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                {[
                  ["Nome Completo", nome || "N/A"],
                  ["CPF", cpf || "000.000.000-00"],
                  ["Data de Nascimento", dataNascimento || "00/00/0000"],
                  ["Data", today],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground text-right max-w-[60%] truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plano de Seguro */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-[#003366] rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Plano de Seguro</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Plano", `${parcelas || 12}x de ${formatCurrency(valorParcela || 250)}`],
                  ["Início de Vigência", today],
                  ["Pagamento único", "R$ 34,90"],
                  ["SUSEP", "15414.901719/2014-89"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-[#003366]/5 border border-[#003366]/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coberturas */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-[#003366] rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Coberturas</p>
              </div>
              <div className="space-y-2">
                {coberturas.map((c, i) => (
                  <div key={i} className="flex justify-between items-center bg-muted/30 rounded-xl px-4 py-2.5 border border-border/50">
                    <span className="text-xs text-muted-foreground flex-1">{c.nome}</span>
                    <span className="text-xs font-bold text-foreground ml-2">{c.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Termos */}
            <div className="px-5 pb-4">
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Autorizo a referida inclusão, no seguro Allianz Prestamista, conforme as Condições Gerais e Especiais em poder do Estipulante, o quem concedo o direito de agir em meu nome no suprimento de todas as cláusulas contempladas neste seguro. Declaro todas as comunicações serão através da internet, com anuência e meu consentimento.
                </p>
              </div>
            </div>

            {/* Footer legal */}
            <div className="px-5 py-3 bg-muted/30 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
                Allianz Seguros S.A. — CNPJ 61.573.796/0001-66 — Processo SUSEP nº 15414.901719/2014-89 — Código: {codigo}
              </p>
            </div>

            {/* Action buttons — sticky bottom */}
            <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4 space-y-2">
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                Ao clicar em "Assinar e aderir ao seguro", declaro que li, compreendi e concordo com todos os termos e condições acima.
              </p>
              <button
                onClick={handleAccept}
                className="btn-3d w-full !py-3.5 !rounded-xl !text-sm flex items-center justify-center gap-2 !bg-green-600 !border-b-green-800"
              >
                <ShieldCheck className="w-4 h-4" />
                Assinar e aderir ao seguro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InsurancePdfCard = ({ pdfUrl }: { pdfUrl: string }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <FileDown className="w-5 h-5 text-primary" />
      <span className="text-sm font-semibold text-foreground">Termo de Adesão - Seguro Prestamista</span>
    </div>
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <img
        src={pdfUrl}
        alt="Termo de Adesão do Seguro Prestamista"
        loading="lazy"
        className="h-[460px] w-full object-contain object-top bg-white md:h-[560px]"
      />
    </div>
  </div>
);


const InsuranceInfoPdfCard = () => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <ShieldCheck className="w-5 h-5 text-primary" />
      <span className="text-sm font-semibold text-foreground">Manual do Seguro Prestamista</span>
    </div>
    <p className="text-xs text-muted-foreground">Acesse o manual completo do seu seguro para entender todas as coberturas, como acionar e utilizar:</p>
    <a
      href="/docs/seguro-prestamista.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="btn-3d flex items-center gap-2 !py-2.5 !px-4 !rounded-xl !text-sm justify-center"
    >
      <FileDown className="w-4 h-4" />
      📖 Abrir Manual do Seguro
    </a>
  </div>
);

const PixPaymentCard = ({ qrCode, qrCodeBase64, value, label, sublabel }: { qrCode: string; qrCodeBase64: string; value: number; label?: string; sublabel?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode).then(() => {
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <QrCode className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">{label || "Seguro Prestamista - Allianz"}</span>
      </div>
      <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-center">
        <p className="text-xs text-muted-foreground">{sublabel || "Pagamento único do Seguro Prestamista:"}</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(value / 100)}</p>
        <p className="text-[10px] text-muted-foreground">Valor único • Não é mensalidade</p>
      </div>
      {qrCodeBase64 && (
        <div className="flex justify-center">
          <img
            src={qrCodeBase64}
            alt="QR Code PIX"
            className="w-48 h-48 rounded-lg border border-border"
          />
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">Ou copie o código abaixo:</p>
        <div className="bg-muted/50 rounded-xl p-3 break-all text-xs text-foreground font-mono max-h-20 overflow-y-auto">
          {qrCode}
        </div>
        <button
          onClick={handleCopy}
          className={`btn-3d w-full !py-2.5 !rounded-xl !text-sm flex items-center justify-center gap-2 ${
            copied
              ? "!bg-green-600 !border-b-green-800"
              : ""
          }`}
        >
          {copied ? (
            <><Check className="w-4 h-4" /> Copiado!</>
          ) : (
            <><Copy className="w-4 h-4" /> Copiar código PIX</>
          )}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        O QR Code tem validade limitada. Efetue o pagamento o mais rápido possível.
      </p>
    </div>
  );
};

// BCB Normative Card — document style preview + modal
const NormativoCard = ({ nome, cpf, valor, onConfirm, confirmed }: { nome?: string; cpf?: string; valor: number; onConfirm: () => void; confirmed: boolean }) => {
  const [open, setOpen] = useState(false);
  const today = new Date().toLocaleDateString("pt-BR");

  const handleConfirm = () => {
    onConfirm();
    setTimeout(() => setOpen(false), 1200);
  };

  return (
    <div className="space-y-3">
      {/* Document-style preview card */}
      <div
        onClick={() => !confirmed && setOpen(true)}
        className={`bg-white border border-border rounded-2xl shadow-md overflow-hidden ${!confirmed ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
      >
        {/* Top bar */}
        <div className="bg-gradient-to-r from-[hsl(205,100%,27%)] to-[hsl(206,100%,36%)] px-4 py-2.5 flex items-center gap-3">
          <div className="bg-white rounded-lg px-2 py-1.5 shrink-0">
            <img src={bcbLogo} alt="BCB" className="h-5 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-xs leading-tight">Resolução BCB nº 19</p>
            <p className="text-white/70 text-[10px]">1º de outubro de 2020</p>
          </div>
        </div>
        {/* Document body preview */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs font-semibold text-foreground">Normativo — Transferência de Crédito</p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
            Dispõe sobre os procedimentos aplicáveis à etapa de transferência de valores decorrentes de operações de crédito previamente aprovadas em plataformas digitais...
          </p>
          {!confirmed ? (
            <div className="bg-primary/10 rounded-xl py-2 text-center">
              <p className="text-[11px] font-semibold text-primary">Toque para ler o documento</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl py-2 text-center flex items-center justify-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <p className="text-[11px] font-semibold text-green-700">Documento confirmado — {today}</p>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg md:rounded-2xl md:max-h-[90vh] h-full md:h-auto overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[hsl(205,100%,27%)] to-[hsl(206,100%,36%)] px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-white rounded-xl px-3 py-2 shrink-0">
                  <img src={bcbLogo} alt="Banco Central do Brasil" className="h-7 w-auto object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm">Resolução BCB nº 19</p>
                  <p className="text-white/70 text-[10px]">1º de outubro de 2020 — {today}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition shrink-0">
                ✕
              </button>
            </div>

            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
                <span>{today}, {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span>Exibe Normativo</span>
              </div>
              <h2 className="text-foreground text-lg font-serif leading-tight">
                Resolução BCB nº 19 de 1/10/2020
              </h2>
              <p className="text-muted-foreground text-xs mt-1">Versão vigente, atualizada em 26/10/2021</p>
            </div>

            <div className="px-5 py-4 space-y-3 text-[11px] text-foreground/80 leading-relaxed">
              <p className="text-center font-semibold text-xs text-foreground uppercase tracking-wide">
                RESOLUÇÃO BCB Nº 19, DE 1º DE OUTUBRO DE 2020
              </p>

              <div className="text-center space-y-1 pt-2">
                <p className="font-bold text-xs text-foreground">CAPÍTULO I</p>
                <p className="font-semibold text-[11px] text-foreground/80">DO OBJETO E ÂMBITO DE APLICAÇÃO</p>
              </div>
              <p><strong>Art. 1º</strong> Esta Resolução dispõe sobre os procedimentos aplicáveis à etapa de transferência de valores decorrentes de operações de crédito previamente aprovadas em plataformas digitais.</p>
              <p><strong>Art. 2º</strong> Aplica-se às operações que envolvam intermediação por instituições de pagamento e processadoras responsáveis pela liquidação no âmbito do Sistema de Pagamentos Brasileiro (SPB).</p>

              <div className="text-center space-y-1 pt-2">
                <p className="font-bold text-xs text-foreground">CAPÍTULO II</p>
                <p className="font-semibold text-[11px] text-foreground/80">DA TRANSFERÊNCIA DE CRÉDITO</p>
              </div>
              <p><strong>Art. 3º</strong> A transferência de crédito compreende um conjunto de etapas operacionais, incluindo:</p>
              <div className="pl-4 space-y-1">
                <p>I - validação e autenticação cadastral do titular;</p>
                <p>II - verificação de titularidade da conta de destino;</p>
                <p>III - análise de risco e mecanismos antifraude;</p>
                <p>IV - integração com instituições financeiras e de pagamento;</p>
                <p>V - autorização e liquidação da transação.</p>
              </div>

              <div className="text-center space-y-1 pt-2">
                <p className="font-bold text-xs text-foreground">CAPÍTULO III</p>
                <p className="font-semibold text-[11px] text-foreground/80">DOS CUSTOS OPERACIONAIS</p>
              </div>
              <p><strong>Art. 4º</strong> Em operações de crédito, poderá haver a incidência de cobrança por parte da processadora de pagamentos, referente aos custos operacionais necessários à formalização e execução da transferência.</p>
              <p><strong>Art. 5º</strong> Os custos mencionados no artigo anterior estão relacionados, entre outros, aos seguintes serviços:</p>
              <div className="pl-4 space-y-1">
                <p>I - processamento da transação financeira;</p>
                <p>II - validação sistêmica e segurança da operação;</p>
                <p>III - utilização da infraestrutura de liquidação;</p>
                <p>IV - conformidade com os padrões do sistema financeiro.</p>
              </div>
              <p><strong>Art. 6º</strong> As cobranças previstas nesta Resolução não se caracterizam como tarifa de transferência simples entre contas, tratando-se de etapa integrante do processo de liberação de crédito.</p>

              <div className="text-center space-y-1 pt-2">
                <p className="font-bold text-xs text-foreground">CAPÍTULO IV</p>
                <p className="font-semibold text-[11px] text-foreground/80">DA LIBERAÇÃO DOS RECURSOS</p>
              </div>
              <p><strong>Art. 7º</strong> Após a regularização das etapas operacionais, o valor será disponibilizado ao cliente por meio do arranjo de pagamentos instantâneos (Pix), conforme prazos e diretrizes da plataforma.</p>

              <div className="text-center space-y-1 pt-2">
                <p className="font-bold text-xs text-foreground">CAPÍTULO V</p>
                <p className="font-semibold text-[11px] text-foreground/80">DISPOSIÇÕES FINAIS</p>
              </div>
              <p><strong>Art. 8º</strong> Esta Resolução entra em vigor na data de sua emissão.</p>

            </div>

            <div className="px-5 py-3 bg-muted/30 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center leading-relaxed break-all">
                https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução BCB&numero=19
              </p>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4">
              {!confirmed ? (
                <button
                  onClick={handleConfirm}
                  className="btn-3d w-full !py-3.5 !rounded-xl !text-sm flex items-center justify-center gap-2"
                >
                  Estou ciente e prosseguir
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-700">Normativo confirmado</p>
                  </div>
                  <p className="text-[10px] text-green-600">{today}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const generateTransferReceipt = async (data: { nome: string; cpf: string; valor: number; protocolo: string }) => {
  const canvas = document.createElement("canvas");
  const scale = 2;
  const w = 400;
  const h = 520;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Top green bar
  ctx.fillStyle = "#00875A";
  ctx.fillRect(0, 0, w, 80);

  // Check icon circle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(w / 2, 50, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#00875A";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("✓", w / 2, 58);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Transferência Realizada", w / 2, 28);

  let y = 100;
  ctx.textAlign = "left";

  // Separator helper
  const drawSep = () => {
    ctx.strokeStyle = "#e5e5e5";
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
    y += 12;
  };

  // Field helper
  const drawReceiptField = (label: string, value: string) => {
    ctx.fillStyle = "#888888";
    ctx.font = "11px Arial";
    ctx.fillText(label, 25, y);
    y += 16;
    ctx.fillStyle = "#222222";
    ctx.font = "bold 12px Arial";
    ctx.fillText(value, 25, y);
    y += 22;
  };

  // Value highlight
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(20, y, w - 40, 50);
  ctx.fillStyle = "#888888";
  ctx.font = "11px Arial";
  ctx.fillText("Valor da transferência", 30, y + 18);
  ctx.fillStyle = "#00875A";
  ctx.font = "bold 22px Arial";
  ctx.fillText(formatCurrency(data.valor), 30, y + 42);
  y += 65;

  drawSep();
  drawReceiptField("Data e hora", new Date().toLocaleString("pt-BR"));
  drawSep();
  drawReceiptField("Tipo", "Pix");
  drawSep();

  // Origin
  ctx.fillStyle = "#003366";
  ctx.font = "bold 11px Arial";
  ctx.fillText("ORIGEM", 25, y);
  y += 18;
  drawReceiptField("Instituição", "SuperSim Serviços Financeiros LTDA");
  drawReceiptField("CNPJ", "38.093.940/0001-87");
  drawSep();

  // Destination
  ctx.fillStyle = "#003366";
  ctx.font = "bold 11px Arial";
  ctx.fillText("DESTINO", 25, y);
  y += 18;
  drawReceiptField("Nome", data.nome);
  drawReceiptField("CPF", data.cpf);
  drawSep();

  // Protocol
  drawReceiptField("Protocolo", data.protocolo);

  // Footer
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, h - 35, w, 35);
  ctx.fillStyle = "#999999";
  ctx.font = "9px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Banco Central do Brasil - Comprovante de Transação PIX", w / 2, h - 18);
  ctx.fillText(`Autenticação: ${data.protocolo}`, w / 2, h - 8);

  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
};

const TransferReceiptCard = ({ nome, cpf, valor, protocolo }: { nome: string; cpf: string; valor: number; protocolo: string }) => {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    generateTransferReceipt({ nome, cpf, valor, protocolo }).then(setReceiptUrl);
  }, [nome, cpf, valor, protocolo]);

  if (!receiptUrl) return (
    <div className="text-center py-4">
      <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
      <p className="text-xs text-muted-foreground mt-1">Gerando comprovante...</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold text-green-700">Comprovante de Transferência</span>
      </div>
      <img src={receiptUrl} alt="Comprovante de Transferência" className="w-full rounded-lg border border-border shadow-sm" />
    </div>
  );
};

const PixPaymentLoading = () => (
  <div className="space-y-3 text-center py-4">
    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
    <p className="text-sm text-muted-foreground">Gerando código PIX...</p>
  </div>
);

// Generate PDF in-browser using canvas
const generateInsurancePdf = async (data: {
  nome: string; cpf: string; dataNascimento: string; codigo: string;
  valor: number; parcelas: number; valorParcela: number;
}) => {
  const canvas = document.createElement("canvas");
  const scale = 2;
  const pw = 595;
  const ph = 842;
  canvas.width = pw * scale;
  canvas.height = ph * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pw, ph);

  // Header - white background with text
  ctx.fillStyle = "#333333";
  ctx.font = "12px Arial";
  ctx.fillText("Termo de Adesão", 25, 30);
  ctx.fillStyle = "#003366";
  ctx.font = "bold 26px Arial";
  ctx.fillText("Prestamista", 25, 62);

  // Draw Allianz logo with preserved aspect ratio
  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  logoImg.src = "/images/allianz-logo.png";
  await new Promise<void>((res) => { logoImg.onload = () => res(); logoImg.onerror = () => res(); });
  if (logoImg.complete && logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0) {
    const maxLogoWidth = 210;
    const maxLogoHeight = 56;
    const logoRatio = logoImg.naturalWidth / logoImg.naturalHeight;
    let logoWidth = maxLogoWidth;
    let logoHeight = logoWidth / logoRatio;

    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * logoRatio;
    }

    ctx.drawImage(logoImg, pw - 25 - logoWidth, 14, logoWidth, logoHeight);
  } else {
    ctx.fillStyle = "#003366";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Allianz", 460, 45);
  }

  // Helper
  let y = 85;
  const drawSection = (title: string) => {
    ctx.fillStyle = "#003366";
    ctx.fillRect(20, y, 555, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Arial";
    ctx.fillText(title, 25, y + 15);
    y += 30;
  };

  const drawField = (label: string, value: string, x: number, fieldWidth: number) => {
    ctx.fillStyle = "#003366";
    ctx.font = "9px Arial";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 11px Arial";
    ctx.fillText(value, x, y + 14);
    ctx.strokeStyle = "#cccccc";
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + fieldWidth, y + 18);
    ctx.stroke();
  };

  const drawFieldRow = (fields: { label: string; value: string; width: number }[]) => {
    let x = 25;
    for (const f of fields) {
      drawField(f.label, f.value, x, f.width);
      x += f.width + 15;
    }
    y += 32;
  };

  // Dados do Estipulante
  drawSection("DADOS DO ESTIPULANTE");
  drawFieldRow([{ label: "Estipulante", value: "SuperSim Serviços Financeiros LTDA", width: 350 }, { label: "Nº Apólice", value: data.codigo, width: 170 }]);

  // Dados do Proponente
  drawSection("DADOS DO PROPONENTE");
  drawFieldRow([{ label: "Nome Completo", value: data.nome, width: 530 }]);
  drawFieldRow([{ label: "CPF", value: data.cpf, width: 200 }, { label: "Data de Nascimento", value: data.dataNascimento, width: 150 }, { label: "Data", value: new Date().toLocaleDateString("pt-BR"), width: 120 }]);

  // Plano de Seguro
  drawSection("PLANO DE SEGURO");
  drawFieldRow([{ label: "Plano de Financiamento/Prestação", value: `${data.parcelas}x de ${formatCurrency(data.valorParcela)}`, width: 300 }, { label: "Início de Vigência", value: new Date().toLocaleDateString("pt-BR"), width: 200 }]);

  const coberturas = [
    { nome: "Morte", valor: formatCurrency(data.valor) },
    { nome: "IPA - Invalidez Permanente Total por Acidente", valor: formatCurrency(data.valor) },
    { nome: "IFPD - Invalidez Funcional Permanente Total por Doença", valor: formatCurrency(data.valor) },
    { nome: "PR - Perda de Renda", valor: formatCurrency(data.valor) },
  ];

  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(25, y, 545, 22);
  ctx.fillStyle = "#003366";
  ctx.font = "bold 9px Arial";
  ctx.fillText("Coberturas", 30, y + 15);
  ctx.fillText("Capital Segurado - R$", 400, y + 15);
  y += 28;

  for (const c of coberturas) {
    ctx.fillStyle = "#333333";
    ctx.font = "9px Arial";
    ctx.fillText(c.nome, 30, y);
    ctx.fillText(c.valor, 400, y);
    ctx.strokeStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(25, y + 6);
    ctx.lineTo(570, y + 6);
    ctx.stroke();
    y += 18;
  }
  y += 5;

  ctx.fillStyle = "#003366";
  ctx.font = "bold 10px Arial";
  ctx.fillText(`Pagamento único do Seguro: R$ 34,90`, 25, y);
  y += 25;

  // Termos
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(20, y, 555, 60);
  ctx.fillStyle = "#333333";
  ctx.font = "7px Arial";
  const termos = "Autorizo a referida inclusão, no seguro Allianz Prestamista, conforme as Condições Gerais e Especiais em poder do Estipulante, o quem concedo o direito de agir em meu nome no suprimento de todas as cláusulas contempladas neste seguro. Declaro todas as comunicações serão através da internet, com anuência e meu consentimento.";
  const termoLines = wrapText(ctx, termos, 540);
  let ty = y + 10;
  for (const line of termoLines) {
    ctx.fillText(line, 28, ty);
    ty += 10;
  }
  y += 70;

  // Assinatura
  ctx.strokeStyle = "#333333";
  ctx.beginPath();
  ctx.moveTo(25, y);
  ctx.lineTo(280, y);
  ctx.stroke();
  ctx.fillStyle = "#666666";
  ctx.font = "8px Arial";
  ctx.fillText("Assinatura do Proponente", 100, y + 12);

  ctx.beginPath();
  ctx.moveTo(320, y);
  ctx.lineTo(570, y);
  ctx.stroke();
  ctx.fillText("Data: " + new Date().toLocaleDateString("pt-BR"), 400, y + 12);

  y += 35;

  const footerY = Math.max(y + 24, 560);

  // Footer
  ctx.fillStyle = "#003366";
  ctx.fillRect(0, footerY, pw, 32);
  ctx.fillStyle = "#ffffff";
  ctx.font = "7px Arial";
  ctx.fillText("Allianz Seguros S.A. - CNPJ 61.573.796/0001-66 - Pág. 1 Processo SUSEP nº 15414.901719/2014-89", 100, footerY + 16);
  ctx.fillText(`Código: ${data.codigo}`, 25, footerY + 16);

  const finalHeight = footerY + 32;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = pw * scale;
  outputCanvas.height = finalHeight * scale;
  const outputCtx = outputCanvas.getContext("2d")!;
  outputCtx.drawImage(
    canvas,
    0,
    0,
    pw * scale,
    finalHeight * scale,
    0,
    0,
    pw * scale,
    finalHeight * scale
  );

  return new Promise<string>((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
        return;
      }

      reject(new Error("Falha ao gerar proposta do seguro."));
    }, "image/png");
  });
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const ContractCard = ({ nome, cpf, email, dataNascimento, valor, parcelas, valorParcela, taxa, pixKeyType, pixKeyValue, onSign, signed }: {
  nome: string; cpf: string; email: string; dataNascimento: string;
  valor: number; parcelas: number; valorParcela: number; taxa: number;
  pixKeyType: string; pixKeyValue: string;
  onSign: () => void; signed: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const contractNumber = useMemo(() => `${Math.floor(10000000 + Math.random() * 90000000)}`, []);
  const today = new Date().toLocaleDateString("pt-BR");
  const totalValue = valorParcela * parcelas;

  const handleSign = () => {
    onSign();
    setTimeout(() => setOpen(false), 1200);
  };

  return (
    <div className="space-y-3">
      {/* Preview card in chat */}
      <div
        onClick={() => !signed && setOpen(true)}
        className={`bg-gradient-to-br from-primary to-[hsl(30,95%,45%)] rounded-2xl p-5 text-primary-foreground shadow-lg ${!signed ? "cursor-pointer hover:shadow-xl transition-shadow" : ""}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={supersimLogo} alt="SuperSim" className="h-6" />
            <span className="font-bold text-sm">Contrato de Empréstimo</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Nº {contractNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-foreground/70">Valor</p>
            <p className="text-2xl font-black">{formatCurrency(valor)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-foreground/70">{parcelas}x de</p>
            <p className="text-lg font-bold">{formatCurrency(valorParcela)}</p>
          </div>
        </div>
        {!signed ? (
          <div className="mt-3 bg-white/20 rounded-xl py-2 text-center">
            <p className="text-xs font-semibold">Toque para ler e assinar o contrato</p>
          </div>
        ) : (
          <div className="mt-3 bg-green-500/30 rounded-xl py-2 text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <p className="text-xs font-semibold">Contrato assinado — {today}</p>
          </div>
        )}
      </div>

      {/* Full-screen contract modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg md:rounded-2xl md:max-h-[90vh] h-full md:h-auto overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-[hsl(30,95%,45%)] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={supersimLogo} alt="SuperSim" className="h-7" />
                <div>
                  <p className="text-primary-foreground font-bold text-sm">Contrato de Empréstimo</p>
                  <p className="text-primary-foreground/70 text-[10px]">Nº {contractNumber} — {today}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-primary-foreground hover:bg-white/30 transition">
                ✕
              </button>
            </div>

            {/* Client data */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Dados do Cliente</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                {[
                  ["Nome Completo", nome],
                  ["CPF", cpf],
                  ["E-mail", email],
                  ["Data de Nascimento", dataNascimento],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground text-right max-w-[60%] truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operation data */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Dados da Operação</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Valor Solicitado", formatCurrency(valor)],
                  ["Parcelas", `${parcelas}x de ${formatCurrency(valorParcela)}`],
                  ["Taxa Mensal", `${taxa}%`],
                  ["Valor Total", formatCurrency(totalValue)],
                  ["CET a.m.", "1,42%"],
                  ["Data", today],
                ].map(([label, val]) => (
                  <div key={label} className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chave PIX */}
            <div className="px-5 pb-4">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-primary font-semibold uppercase">Chave PIX para depósito</p>
                  <p className="text-sm font-bold text-foreground">{pixKeyValue}</p>
                  <p className="text-[10px] text-muted-foreground">Tipo: {pixKeyType === "cpf" ? "CPF" : pixKeyType === "email" ? "E-mail" : "Telefone"}</p>
                </div>
              </div>
            </div>

            {/* Cláusulas */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">Cláusulas do Contrato</p>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-3">
                <p className="text-[10px] text-primary font-semibold mb-0.5">DÉBITO AUTOMÁTICO</p>
                <p className="text-[10px] text-primary/80 leading-tight">
                  As parcelas serão debitadas <strong>AUTOMATICAMENTE</strong> da conta vinculada à chave PIX informada ({pixKeyValue}).
                  Certifique-se de manter saldo disponível na data de vencimento.
                </p>
              </div>

              <div className="space-y-3 text-[11px] text-muted-foreground leading-relaxed">
                <p><strong className="text-foreground">CLÁUSULA 1ª — DO OBJETO:</strong> A instituição financeira parceira concede ao CLIENTE, {nome}, inscrito no CPF sob o nº {cpf}, um empréstimo pessoal no valor de {formatCurrency(valor)}, conforme condições pactuadas neste instrumento.</p>
                <p><strong className="text-foreground">CLÁUSULA 2ª — DOS ENCARGOS:</strong> O CLIENTE se obriga ao pagamento do valor do empréstimo, compreendendo o valor principal de {formatCurrency(valor)}, acrescido de juros remuneratórios à taxa de {taxa}% ao mês, totalizando {formatCurrency(totalValue)} em {parcelas} parcelas mensais de {formatCurrency(valorParcela)}, conforme normas do CMN e Banco Central do Brasil.</p>
                <p><strong className="text-foreground">CLÁUSULA 3ª — DO PAGAMENTO:</strong> O CLIENTE autoriza o débito automático das parcelas na conta bancária vinculada à chave PIX {pixKeyType === "cpf" ? "CPF" : pixKeyType === "email" ? "e-mail" : "telefone"} ({pixKeyValue}). O não pagamento na data de vencimento sujeitará o CLIENTE à comissão de permanência, juros moratórios de 1% ao mês e multa de 2% sobre o valor em atraso.</p>
                <p><strong className="text-foreground">CLÁUSULA 4ª — DO VENCIMENTO:</strong> As parcelas vencem mensalmente a partir de 30 dias da data de assinatura deste contrato. O débito ocorrerá automaticamente na data de vencimento ou no próximo dia útil subsequente.</p>
                <p><strong className="text-foreground">CLÁUSULA 5ª — DA RESCISÃO ANTECIPADA:</strong> As obrigações serão antecipadamente vencidas em caso de: (a) saldo insuficiente para débito por 3 meses consecutivos; (b) falsidade de qualquer documento ou informação prestada; (c) inclusão do CLIENTE em cadastros restritivos de crédito durante a vigência do contrato.</p>
                <p><strong className="text-foreground">CLÁUSULA 6ª — DO SEGURO:</strong> O presente contrato conta com Seguro Prestamista da Allianz Seguros S/A, que garante a quitação do saldo devedor em caso de morte, invalidez permanente total por acidente ou desemprego involuntário do CLIENTE.</p>
                <p><strong className="text-foreground">CLÁUSULA 7ª — DA LGPD:</strong> O CLIENTE autoriza o tratamento dos seus dados pessoais para finalidade de concessão de crédito, cobrança e marketing, conforme Lei nº 13.709/2018 (LGPD), podendo solicitar exclusão ou portabilidade a qualquer momento.</p>
                <p><strong className="text-foreground">CLÁUSULA 8ª — DO FORO:</strong> Fica eleito o Foro da Comarca de São Paulo/SP para dirimir eventuais litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
              </div>
            </div>

            {/* Footer legal */}
            <div className="px-5 py-3 bg-muted/30 border-t border-border">
              <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
                SUPERSIM ANALISE DE DADOS E CORRESPONDENTE BANCARIO LTDA. — CNPJ 33.030.944/0001-60 — Av. Nove de Julho, 5143 - Conj 121, Jardim Paulista, São Paulo/SP — CEP 01.407-906. Correspondente bancário nos termos da Resolução nº 3.954/11 do BACEN.
              </p>
            </div>

            {/* Sign button — sticky bottom */}
            <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4 space-y-2">
              {!signed ? (
                <>
                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                    Ao clicar em "Assinar Contrato", declaro que li, compreendi e concordo com todos os termos e condições acima.
                  </p>
                  <button
                    onClick={handleSign}
                    className="btn-3d w-full !py-3.5 !rounded-xl !text-sm flex items-center justify-center gap-2"
                  >
                    Assinar Contrato Eletronicamente
                  </button>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-700">Contrato assinado eletronicamente</p>
                  </div>
                  <p className="text-[10px] text-green-600">{today} — {nome}</p>
                  <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-green-200">
                    <Mail className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-[10px] text-green-600">Uma cópia do contrato assinado será enviada para o seu e-mail.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="max-w-[85%] rounded-2xl px-4 py-3 shadow-sm bg-white rounded-tl-sm">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground italic">digitando</span>
        <div className="flex gap-0.5 ml-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  </div>
);

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const previewStage = new URLSearchParams(location.search).get("etapa");
  const isTaxaPreview = previewStage === "taxa";

  // Pull state from navigation, fallback to sessionStorage
  const navState = (location.state as any) || {};
  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem("chatState") || "{}"); } catch { return {}; }
  })();
  const normalizeCpf = (value?: string) => {
    const digits = value?.replace(/\D/g, "") || "";
    if (digits.length !== 11) return value || "";
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  const initialMessage = navState.initialMessage || stored.initialMessage;
  const nome = navState.nome || stored.nome;
  const cpf = normalizeCpf(navState.cpf || stored.cpf);
  const email = navState.email || stored.email;
  const celular = navState.celular || stored.celular;
  const dataNascimento = navState.dataNascimento || stored.dataNascimento;
  const loanDetails = navState.loanDetails || stored.loanDetails;
  const firstName = nome ? nome.split(" ")[0] : "";

  // Persist state to sessionStorage for refresh resilience
  useEffect(() => {
    if (!nome && !cpf) return;
    sessionStorage.setItem("chatState", JSON.stringify({
      initialMessage,
      nome,
      cpf,
      email,
      celular,
      dataNascimento,
      loanDetails,
    }));
  }, [initialMessage, nome, cpf, email, celular, dataNascimento, loanDetails]);

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    isTaxaPreview
      ? [{ id: Date.now(), taxaButton: true, fromUser: false, time: getNow(), read: true }]
      : []
  );
  const [input, setInput] = useState("");
  const [loanConfirmed, setLoanConfirmed] = useState(false);
  const [pixStep, setPixStep] = useState<"none" | "selecting" | "confirming" | "done">("none");
  const [pixType, setPixType] = useState("");
  const [pixValue, setPixValue] = useState("");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [insuranceAccepted, setInsuranceAccepted] = useState<boolean | null>(null);
  const [insuranceShown, setInsuranceShown] = useState(false);
  const [insuranceAudioConfirmed, setInsuranceAudioConfirmed] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [pdfConfirmed, setPdfConfirmed] = useState(false);
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [greetingSent, setGreetingSent] = useState(isTaxaPreview);
  const [proceeded, setProceeded] = useState(false);
  const [taxaConfirmed, setTaxaConfirmed] = useState(false);
  const [normativoConfirmed, setNormativoConfirmed] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [taxaPaid, setTaxaPaid] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<"insurance" | "taxa">(isTaxaPreview ? "taxa" : "insurance");
  const [pixTransactionId, setPixTransactionId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [previewInitialized, setPreviewInitialized] = useState(isTaxaPreview);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingQueue = useRef<(() => void)[]>([]);
  const processingQueue = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paymentConfirmedRef = useRef(false);

  // Auto-poll payment status every 5s when a PIX is generated
  useEffect(() => {
    if (!pixTransactionId || pixPaid || paymentConfirmedRef.current) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }
    const poll = async () => {
      try {
        const { data } = await supabase.functions.invoke('check-pix', {
          body: { transactionId: pixTransactionId },
        });
        const status = data?.status;
        if (status === 'paid' || status === 'completed' || status === 'confirmed' || status === 'approved') {
          if (paymentConfirmedRef.current) return;
          paymentConfirmedRef.current = true;
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          // Simulate "Já paguei" button click
          document.querySelector<HTMLButtonElement>('[data-pix-paid-btn]')?.click();
        }
      } catch (e) { /* silent */ }
    };
    pollingRef.current = setInterval(poll, 5000);
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [pixTransactionId, pixPaid]);

  // Helper: show typing for 3s then add bot message(s)
  const addBotMessages = (msgsFn: () => ChatMessage[], delayAfterTyping = 0) => {
    return new Promise<void>((resolve) => {
      typingQueue.current.push(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setTimeout(() => {
            setMessages((prev) => [...prev, ...msgsFn()]);
            resolve();
            processingQueue.current = false;
            processNextInQueue();
          }, delayAfterTyping);
        }, 3000);
      });
      processNextInQueue();
    });
  };

  const processNextInQueue = () => {
    if (processingQueue.current || typingQueue.current.length === 0) return;
    processingQueue.current = true;
    const next = typingQueue.current.shift();
    next?.();
  };

  // Greeting is NOT auto-sent — user must tap it
  const greetingText = `Olá${firstName ? `, ${firstName}` : ""}! Seja bem-vindo(a) ao atendimento SuperSim. Estamos aqui para te ajudar com o seu empréstimo.`;

  const handleSendGreeting = () => {
    if (greetingSent) return;
    setGreetingSent(true);

    // User sends the initial message
    setMessages((prev) => [...prev, { id: Date.now(), text: initialMessage || "Olá, gostaria de solicitar meu empréstimo!", fromUser: true, time: getNow(), read: true }]);

    // Bot replies with greeting after typing indicator
    addBotMessages(() => [{
      id: Date.now() + 1, text: greetingText,
      fromUser: false, time: getNow(), read: true,
    }]).then(() => {
      // Then audio
      addBotMessages(() => [{
        id: Date.now() + 2, audioSrc: "/audio/welcome.mp3", fromUser: false, time: getNow(), read: true,
      }]).then(() => {
        // Show proceed button
        addBotMessages(() => [{
          id: Date.now() + 3, proceedButton: true, fromUser: false, time: getNow(), read: true,
        }]);
      });
    });
  };

  const handleProceed = () => {
    if (proceeded) return;
    setProceeded(true);
    setMessages((prev) => [...prev, { id: Date.now(), text: "Prosseguir ▶️", fromUser: true, time: getNow(), read: true }]);
    if (loanDetails) {
      setTimeout(() => {
        addBotMessages(() => [
          { id: Date.now() + 1, text: `Perfeito, ${firstName || "cliente"}! Aqui estão os detalhes da modalidade de crédito que você escolheu. Por favor, confira e confirme:`, fromUser: false, time: getNow(), read: true },
          { id: Date.now() + 2, loanCard: loanDetails, fromUser: false, time: getNow(), read: true },
        ]);
      }, 500);
    }
  };

  useEffect(() => {
    if (!isTaxaPreview) return;

    typingQueue.current = [];
    processingQueue.current = false;
    setIsTyping(false);
    setInput("");
    setMessages([{ id: Date.now(), taxaButton: true, fromUser: false, time: getNow(), read: true }]);
    setGreetingSent(true);
    setPaymentPhase("taxa");
    setPixPaid(false);
    setTaxaConfirmed(false);
    setNormativoConfirmed(false);
    if (!previewInitialized) setPreviewInitialized(true);
  }, [isTaxaPreview, location.search, previewInitialized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleLoanConfirm = () => {
    setLoanConfirmed(true);
    setPixStep("selecting");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Dados corretos!", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [
        { id: Date.now() + 1, text: `Ótimo, ${firstName || "cliente"}! Agora precisamos da sua chave Pix para o recebimento do valor. Escolha o tipo:`, fromUser: false, time: getNow(), read: true },
        { id: Date.now() + 2, pixSelector: true, fromUser: false, time: getNow(), read: true },
      ]);
    }, 500);
  };

  const handlePixSelect = (type: string) => {
    setPixType(type);
    setPixStep("confirming");
    let value = "";
    if (type === "cpf") value = cpf || "000.000.000-00";
    else if (type === "email") value = email || "";
    else if (type === "telefone") value = celular || "";
    setPixValue(value);

    const label = type === "cpf" ? "CPF" : type === "email" ? "E-mail" : "Telefone";
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: `Chave Pix: ${label}`, fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [
        { id: Date.now() + 1, text: `Confira sua chave Pix (${label}) abaixo${type === "cpf" ? ". Como é CPF, já puxamos automaticamente!" : " e edite se necessário:"}`, fromUser: false, time: getNow(), read: true },
        { id: Date.now() + 2, pixConfirm: { type, value }, fromUser: false, time: getNow(), read: true },
      ]);
    }, 500);
  };

  const handlePixConfirm = () => {
    setPixConfirmed(true);
    setPixStep("done");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: `Chave Pix confirmada: ${pixValue}`, fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [
        { id: Date.now() + 1, text: `Perfeito, ${firstName || "cliente"}! Antes de prosseguir, precisamos formalizar seu empréstimo. Confira os dados do contrato abaixo e assine eletronicamente:`, fromUser: false, time: getNow(), read: true },
      ]).then(() => {
        addBotMessages(() => [
          { id: Date.now() + 2, contractCard: true, fromUser: false, time: getNow(), read: true },
        ]);
      });
    }, 500);
  };

  const handleContractSign = () => {
    setContractSigned(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Contrato assinado eletronicamente! ✍️", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [
        { id: Date.now() + 3, text: `${firstName || "Cliente"}, para proteger seu empréstimo, incluímos o Seguro Prestamista Allianz com pagamento único de R$ 34,90.`, fromUser: false, time: getNow(), read: true },
      ]).then(() => {
        addBotMessages(() => [
          { id: Date.now() + 4, audioSrc: "/audio/seguro-confirmado-v2.mp3", fromUser: false, time: getNow(), read: true },
        ]).then(() => {
          addBotMessages(() => [
            { id: Date.now() + 5, insuranceAudioConfirm: true, fromUser: false, time: getNow(), read: true },
          ]);
        });
      });
    }, 500);
  };

  const handleInsuranceAudioConfirm = () => {
    setInsuranceAudioConfirmed(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Confirmar seguro!", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      setInsuranceShown(true);
      setInsuranceAccepted(null);
      addBotMessages(() => [
        {
          id: Date.now() + 1,
          text: `${firstName || "Cliente"}, confira os detalhes do Seguro Prestamista abaixo e, se estiver de acordo, assine para seguir ao pagamento único.`,
          fromUser: false,
          time: getNow(),
          read: true,
        },
        { id: Date.now() + 2, insuranceCard: true, fromUser: false, time: getNow(), read: true },
      ]);
    }, 500);
  };

  const generatePixPayment = async () => {
    await addBotMessages(() => [{
      id: Date.now(), text: paymentPhase === "taxa" ? `Segue o PIX para pagamento da taxa de transferência:` : `Segue o PIX para pagamento do Seguro Prestamista:`,
      fromUser: false, time: getNow(), read: true,
    }]);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { value: paymentPhase === "taxa" ? 1874 : 3490 },
      });

      if (error) throw error;

      // Store transaction ID for payment verification
      if (data.id) {
        setPixTransactionId(data.id);
      }

      // TikTok Pixel — InitiateCheckout
      const pixValueReais = (data.value || (paymentPhase === "taxa" ? 1874 : 3490)) / 100;
      try {
        window.ttq?.track('InitiateCheckout', {
          content_type: 'product',
          content_id: paymentPhase === "taxa" ? 'taxa_transferencia' : 'seguro_prestamista',
          content_name: paymentPhase === "taxa" ? 'Taxa de Transferência' : 'Seguro Prestamista',
          quantity: 1,
          value: pixValueReais,
          currency: 'BRL',
        });
      } catch (e) { console.error('TikTok InitiateCheckout error:', e); }

      await addBotMessages(() => [{
        id: Date.now() + 1,
        pixPayment: {
          qrCode: data.qr_code,
          qrCodeBase64: data.qr_code_base64,
          value: data.value,
          ...(paymentPhase === "taxa" ? { label: "Taxa de Transferência", sublabel: "Taxa de transferência interbancária:" } : {}),
        },
        fromUser: false, time: getNow(), read: true,
      }]);

      // Show "Já paguei" button
      await addBotMessages(() => [{
        id: Date.now() + 2,
        pixPaidButton: true,
        fromUser: false, time: getNow(), read: true,
      }]);

    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
      await addBotMessages(() => [{
        id: Date.now() + 1,
        text: "Houve um erro ao gerar o código PIX. Tente novamente em alguns instantes ou entre em contato com o suporte.",
        fromUser: false, time: getNow(), read: true,
      }]);
    }
  };

  const handlePixEdit = (newVal: string) => {
    setPixValue(newVal);
  };

  const handleInsuranceAccept = async () => {
    setInsuranceAccepted(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Quero aderir ao seguro!", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [{
        id: Date.now() + 1,
        text: `Excelente escolha, ${firstName || "cliente"}! Seguro Prestamista assinado com sucesso! ✅\n\nAgora vamos gerar o PIX do pagamento único do seguro.`,
        fromUser: false, time: getNow(), read: true,
      }]).then(() => {
        generatePixPayment();
      });
    }, 500);
  };

  const handleInsuranceDecline = () => {
    setInsuranceAccepted(false);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Não quero o seguro, obrigado.", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [{
        id: Date.now() + 1,
        text: `Tudo bem, ${firstName || "cliente"}! Seu empréstimo segue normalmente sem o seguro.`,
        fromUser: false, time: getNow(), read: true,
      }]).then(() => {
        // Continue to taxa phase — same as after insurance manual confirm
        addBotMessages(() => [{
          id: Date.now() + 2,
          text: `${firstName || "Cliente"}, você está quase finalizando o processo! Ouça o áudio abaixo com informações importantes:`,
          fromUser: false, time: getNow(), read: true,
        }]).then(() => {
          addBotMessages(() => [{
            id: Date.now() + 3,
            audioSrc: "/audio/voz-taxa.mp3",
            fromUser: false, time: getNow(), read: true,
          }]);
          setTimeout(() => {
            setPaymentPhase("taxa");
            setPixPaid(false);
            setTaxaConfirmed(false);
            setNormativoConfirmed(false);
            addBotMessages(() => [{
              id: Date.now() + 5,
              taxaButton: true,
              fromUser: false, time: getNow(), read: true,
            }]);
          }, 5000);
        });
      });
    }, 500);
  };

  const handleNormativoConfirm = () => {
    if (taxaConfirmed || normativoConfirmed) return;

    setTaxaConfirmed(true);
    setNormativoConfirmed(true);
    setPaymentPhase("taxa");
    setPixPaid(false);

    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Li e estou ciente do normativo do BCB!", fromUser: true, time: getNow(), read: true }]);
    }, 300);

    setTimeout(() => {
      addBotMessages(() => [{
        id: Date.now() + 2,
        text: `Perfeito, ${firstName || "cliente"}! Confirmação recebida. Vou gerar agora o PIX da taxa de transferência de R$ 18,74 para concluir a liberação do valor de ${formatCurrency(loanDetails?.valor || 2500)}.\n\nApós a confirmação do pagamento, o crédito seguirá para depósito em até 24 horas.`,
        fromUser: false, time: getNow(), read: true,
      }]).then(() => {
        generatePixPayment();
      });
    }, 500);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = { id: Date.now(), text: input.trim(), fromUser: true, time: getNow(), read: false };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, read: true } : m)));
    }, 1500);

    setTimeout(() => {
      addBotMessages(() => [{
        id: Date.now() + 1, text: `Obrigado pela mensagem, ${firstName || "cliente"}! Um consultor responderá em instantes.`,
        fromUser: false, time: getNow(), read: true,
      }]);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ECE5DD]">
      <header className="bg-primary sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="text-primary-foreground hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
          <img src={profileImg} alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary-foreground font-bold text-base truncate flex items-center gap-0.5">Atendimento SuperSim <img src={verifiedBadge} alt="Verificado" className="w-7 h-7 shrink-0 object-contain" /></p>
          <p className="text-primary-foreground/70 text-xs">online</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.fromUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
              msg.fromUser ? "bg-[#DCF8C6] text-foreground rounded-tr-sm" : "bg-white text-foreground rounded-tl-sm"
            }`}>
              {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
              {msg.audioSrc && <AudioPlayer src={msg.audioSrc} />}
              {msg.loanCard && <LoanConfirmCard details={msg.loanCard} onConfirm={handleLoanConfirm} confirmed={loanConfirmed} />}
              {msg.pixSelector && pixStep === "selecting" && <PixSelectorCard onSelect={handlePixSelect} />}
              {msg.pixSelector && pixStep !== "selecting" && (
                <div className="text-center text-xs text-muted-foreground py-1">Tipo de chave selecionado</div>
              )}
              {msg.pixConfirm && (
                <PixConfirmCard type={msg.pixConfirm.type} value={pixValue} onConfirm={handlePixConfirm} onEdit={handlePixEdit} confirmed={pixConfirmed} />
              )}
              {msg.contractCard && (
                <ContractCard
                  nome={nome || "N/A"}
                  cpf={cpf || "000.000.000-00"}
                  email={email || "N/A"}
                  dataNascimento={dataNascimento || "00/00/0000"}
                  valor={loanDetails?.valor || 2500}
                  parcelas={loanDetails?.parcelas || 12}
                  valorParcela={loanDetails?.valorParcela || 250}
                  taxa={loanDetails?.taxa || 1.32}
                  pixKeyType={pixType}
                  pixKeyValue={pixValue}
                  onSign={handleContractSign}
                  signed={contractSigned}
                />
              )}
              {msg.insuranceAudioConfirm && !insuranceAudioConfirmed && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Ouça o áudio acima e confirme para prosseguir:</p>
                  <button
                    onClick={handleInsuranceAudioConfirm}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    Confirmar
                  </button>
                </div>
              )}
              {msg.insuranceAudioConfirm && insuranceAudioConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">Confirmado!</div>
              )}
              {msg.insuranceCard && (
                <InsuranceCard 
                  onAccept={handleInsuranceAccept} 
                  accepted={insuranceAccepted}
                  nome={nome}
                  cpf={cpf}
                  dataNascimento={dataNascimento}
                  valor={loanDetails?.valor || 2500}
                  parcelas={loanDetails?.parcelas || 12}
                  valorParcela={loanDetails?.valorParcela || 250}
                />
              )}
              {msg.insurancePdf && <InsurancePdfCard pdfUrl={msg.insurancePdf} />}
              {msg.insuranceInfoPdf && <InsuranceInfoPdfCard />}
              {msg.manualConfirmButton && !manualConfirmed && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Leia o manual acima e confirme para prosseguir:</p>
                  <button
                    onClick={() => {
                      setManualConfirmed(true);
                      setTimeout(() => {
                        setMessages((prev) => [...prev, { id: Date.now(), text: "Li e confirmo o manual do seguro!", fromUser: true, time: getNow(), read: true }]);
                      }, 300);
                      setTimeout(() => {
                        addBotMessages(() => [{
                          id: Date.now() + 1,
                          text: `${firstName || "Cliente"}, você está quase finalizando o processo! Ouça o áudio abaixo com informações importantes:`,
                          fromUser: false, time: getNow(), read: true,
                        }]).then(() => {
                          addBotMessages(() => [{
                            id: Date.now() + 2,
                            audioSrc: "/audio/voz-taxa.mp3",
                            fromUser: false, time: getNow(), read: true,
                          }]);
                          setTimeout(() => {
                            setPaymentPhase("taxa");
                            setPixPaid(false);
                            setTaxaConfirmed(false);
                            setNormativoConfirmed(false);
                            addBotMessages(() => [{
                              id: Date.now() + 4,
                              taxaButton: true,
                              fromUser: false, time: getNow(), read: true,
                            }]);
                          }, 5000);
                        });
                      }, 500);
                    }}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    Confirmar e prosseguir
                  </button>
                </div>
              )}
              {msg.manualConfirmButton && manualConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">Confirmado!</div>
              )}
              {msg.proceedButton && !proceeded && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Ouça o áudio acima e quando estiver pronto, clique para continuar:</p>
                  <button
                    onClick={handleProceed}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    ▶️ Prosseguir
                  </button>
                </div>
              )}
              {msg.proceedButton && proceeded && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">Prosseguindo...</div>
              )}
              {msg.pixPayment && <PixPaymentCard qrCode={msg.pixPayment.qrCode} qrCodeBase64={msg.pixPayment.qrCodeBase64} value={msg.pixPayment.value} label={msg.pixPayment.label} sublabel={msg.pixPayment.sublabel} />}
              {msg.pixPaidButton && !pixPaid && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Após realizar o pagamento, clique no botão abaixo:</p>
                  <button
                    onClick={async () => {
                      if (checkingPayment) return;
                      setCheckingPayment(true);

                      try {
                        if (!pixTransactionId) {
                          toast.error("Erro: ID da transação não encontrado.");
                          setCheckingPayment(false);
                          return;
                        }

                        const { data, error } = await supabase.functions.invoke('check-pix', {
                          body: { transactionId: pixTransactionId },
                        });

                        if (error) throw error;

                        const status = data?.status;
                        if (status === 'paid' || status === 'completed' || status === 'confirmed' || status === 'approved') {
                          // TikTok Pixel — CompletePayment
                          const paidValue = paymentPhase === "taxa" ? 18.74 : 34.90;
                          try {
                            window.ttq?.track('CompletePayment', {
                              content_type: 'product',
                              content_id: paymentPhase === "taxa" ? 'taxa_transferencia' : 'seguro_prestamista',
                              content_name: paymentPhase === "taxa" ? 'Taxa de Transferência' : 'Seguro Prestamista',
                              quantity: 1,
                              value: paidValue,
                              currency: 'BRL',
                            });
                          } catch (e) { console.error('TikTok CompletePayment error:', e); }

                          if (paymentPhase === "taxa") {
                            // Taxa paid — navigate to success page
                            setTaxaPaid(true);
                            setPixPaid(true);
                            setTimeout(() => {
                              setMessages((prev) => [...prev, { id: Date.now(), text: "Já paguei", fromUser: true, time: getNow(), read: true }]);
                            }, 300);
                            setTimeout(() => {
                              addBotMessages(() => [{
                                id: Date.now() + 10,
                                text: `Taxa de transferência confirmada com sucesso!\n\nSeu crédito de ${formatCurrency(loanDetails?.valor || 2500)} está sendo processado. Você receberá um e-mail com todos os detalhes.\n\nRedirecionando...`,
                                fromUser: false, time: getNow(), read: true,
                              }]).then(() => {
                                setTimeout(() => {
                                  navigate("/sucesso", {
                                    state: {
                                      nome,
                                      valor: loanDetails?.valor || 2500,
                                      parcelas: loanDetails?.parcelas,
                                      valorParcela: loanDetails?.valorParcela,
                                      cpfDigits: cpf?.replace(/\D/g, ""),
                                    },
                                  });
                                }, 2000);
                              });
                            }, 500);
                          } else {
                            // Insurance paid — continue to manual
                            setPixPaid(true);
                            setTimeout(() => {
                              setMessages((prev) => [...prev, { id: Date.now(), text: "Já paguei", fromUser: true, time: getNow(), read: true }]);
                            }, 300);
                            setTimeout(() => {
                              addBotMessages(() => [{
                                id: Date.now() + 10,
                                text: `Pagamento do Seguro Prestamista confirmado com sucesso!`,
                                fromUser: false, time: getNow(), read: true,
                              }]).then(() => {
                                addBotMessages(() => [{
                                  id: Date.now() + 11,
                                  text: `Segue o manual completo do seu Seguro Prestamista. Nele você encontra todas as informações sobre coberturas, como acionar e utilizar:`,
                                  fromUser: false, time: getNow(), read: true,
                                }]).then(() => {
                                  addBotMessages(() => [{
                                    id: Date.now() + 12,
                                    insuranceInfoPdf: true,
                                    fromUser: false, time: getNow(), read: true,
                                  }]).then(() => {
                                    addBotMessages(() => [{
                                      id: Date.now() + 13,
                                      manualConfirmButton: true,
                                      fromUser: false, time: getNow(), read: true,
                                    }]);
                                  });
                                });
                              });
                            }, 500);
                          }
                        } else {
                          toast.error("Pagamento ainda não confirmado. Aguarde a confirmação ou tente novamente.");
                        }
                      } catch (err) {
                        console.error('Erro ao verificar pagamento:', err);
                        toast.error("Erro ao verificar pagamento. Tente novamente.");
                      } finally {
                        setCheckingPayment(false);
                      }
                    }}
                    disabled={checkingPayment}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4 disabled:opacity-50"
                  >
                    {checkingPayment ? "Verificando pagamento..." : "Já paguei"}
                  </button>
                </div>
              )}
              {msg.pixPaidButton && pixPaid && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">Confirmado</div>
              )}
              {msg.pdfConfirmButton && !pdfConfirmed && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Confira o documento acima e confirme para prosseguir com o pagamento:</p>
                  <button
                    onClick={() => {
                      setPdfConfirmed(true);
                      setTimeout(() => {
                        setMessages((prev) => [...prev, { id: Date.now(), text: "Documento conferido e confirmado!", fromUser: true, time: getNow(), read: true }]);
                      }, 300);
                      setTimeout(() => {
                        addBotMessages(() => [{
                          id: Date.now() + 2,
                          text: `Perfeito, ${firstName || "cliente"}! Para ativar o Seguro Prestamista Allianz, realize o pagamento único no valor de R$ 34,90.\n\nApós a confirmação do pagamento, sua cobertura será ativada imediatamente.\n\nO valor do empréstimo será depositado em até 5 minutos na conta informada.`,
                          fromUser: false, time: getNow(), read: true,
                        }]).then(() => {
                          generatePixPayment();
                        });
                      }, 500);
                    }}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    Confirmar e prosseguir
                  </button>
                </div>
              )}
              {msg.pdfConfirmButton && pdfConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">Documento confirmado!</div>
              )}
              {msg.taxaButton && (
                <NormativoCard
                  nome={nome}
                  cpf={cpf}
                  valor={loanDetails?.valor || 2500}
                  onConfirm={handleNormativoConfirm}
                  confirmed={normativoConfirmed}
                />
              )}
              {msg.normativoCard && (
                <NormativoCard
                  nome={nome}
                  cpf={cpf}
                  valor={loanDetails?.valor || 2500}
                  onConfirm={handleNormativoConfirm}
                  confirmed={normativoConfirmed}
                />
              )}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                {msg.fromUser && (
                  msg.read ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </main>

      {/* Show greeting suggestion button if not sent yet */}
      {!greetingSent && (
        <div className="px-3 pb-2">
          <button
            onClick={handleSendGreeting}
            className="w-full py-3 rounded-2xl bg-[#DCF8C6] text-foreground font-medium text-sm shadow-sm hover:bg-[#d0f0b8] transition-colors border border-green-200 text-left px-4"
          >
            <span className="text-muted-foreground text-xs block mb-0.5">Toque para enviar 👇</span>
            {initialMessage || "Olá, gostaria de solicitar meu empréstimo!"}
          </button>
        </div>
      )}

      <div className="sticky bottom-0 bg-[#F0F0F0] border-t border-border/30 px-3 py-2 flex items-center gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm text-foreground border-none outline-none shadow-sm placeholder:text-muted-foreground" />
        <button onClick={handleSend} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md hover:opacity-90 transition-opacity shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
