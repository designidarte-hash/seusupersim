import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import profileImg from "@/assets/profile-s.png";
import verifiedBadge from "@/assets/verified-badge.png";
import { ArrowLeft, Send, Check, CheckCheck, Play, Pause, CreditCard, Smartphone, Mail, KeyRound } from "lucide-react";

interface ChatMessage {
  id: number;
  text?: string;
  audioSrc?: string;
  loanCard?: LoanDetails;
  pixSelector?: boolean;
  pixConfirm?: { type: string; value: string };
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
      <button onClick={onConfirm} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
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
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <p className="font-semibold text-foreground">{value}</p>
        </div>
        <div className="text-center text-xs text-green-600 font-semibold py-1">✅ Chave confirmada!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">Chave Pix ({label}):</p>
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => { onEdit(editValue); setEditing(false); }}
            className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Salvar
          </button>
        </div>
      ) : (
        <>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="font-semibold text-foreground">{value}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
              ✅ Confirmar
            </button>
            {type !== "cpf" && (
              <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors">
                ✏️ Editar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { initialMessage, nome, cpf, email, celular, loanDetails } = (location.state as any) || {};
  const firstName = nome ? nome.split(" ")[0] : "";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loanConfirmed, setLoanConfirmed] = useState(false);
  const [pixStep, setPixStep] = useState<"none" | "selecting" | "confirming" | "done">("none");
  const [pixType, setPixType] = useState("");
  const [pixValue, setPixValue] = useState("");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeTimeout = setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: 1, text: `Olá${firstName ? `, ${firstName}` : ""}! 👋 Seja bem-vindo(a) ao atendimento SuperSim! Estamos aqui para te ajudar com o seu empréstimo. 😊`,
        fromUser: false, time: getNow(), read: true,
      }]);
    }, 500);

    const audioTimeout = setTimeout(() => {
      setMessages((prev) => [...prev, { id: 2, audioSrc: "/audio/welcome.mp3", fromUser: false, time: getNow(), read: true }]);
    }, 2000);

    let userMsgTimeout: ReturnType<typeof setTimeout> | undefined;
    let cardTimeout: ReturnType<typeof setTimeout> | undefined;

    if (initialMessage) {
      userMsgTimeout = setTimeout(() => {
        setMessages((prev) => [...prev, { id: 3, text: initialMessage, fromUser: true, time: getNow(), read: true }]);
      }, 3500);

      if (loanDetails) {
        cardTimeout = setTimeout(() => {
          setMessages((prev) => [...prev,
            { id: 4, text: `Perfeito, ${firstName || "cliente"}! Aqui estão os detalhes da modalidade de crédito que você escolheu. Por favor, confira e confirme: 👇`, fromUser: false, time: getNow(), read: true },
            { id: 5, loanCard: loanDetails, fromUser: false, time: getNow(), read: true },
          ]);
        }, 5500);
      }
    }

    return () => {
      clearTimeout(welcomeTimeout);
      clearTimeout(audioTimeout);
      if (userMsgTimeout) clearTimeout(userMsgTimeout);
      if (cardTimeout) clearTimeout(cardTimeout);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLoanConfirm = () => {
    setLoanConfirmed(true);
    setPixStep("selecting");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Dados corretos! ✅", fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      setMessages((prev) => [...prev,
        { id: Date.now() + 1, text: `Ótimo, ${firstName || "cliente"}! Agora precisamos da sua chave Pix para o recebimento do valor. Escolha o tipo: 👇`, fromUser: false, time: getNow(), read: true },
        { id: Date.now() + 2, pixSelector: true, fromUser: false, time: getNow(), read: true },
      ]);
    }, 2000);
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
      setMessages((prev) => [...prev,
        { id: Date.now() + 1, text: `Confira sua chave Pix (${label}) abaixo${type === "cpf" ? ". Como é CPF, já puxamos automaticamente!" : " e edite se necessário:"} 👇`, fromUser: false, time: getNow(), read: true },
        { id: Date.now() + 2, pixConfirm: { type, value }, fromUser: false, time: getNow(), read: true },
      ]);
    }, 1500);
  };

  const handlePixConfirm = () => {
    setPixConfirmed(true);
    setPixStep("done");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), text: `Chave Pix confirmada: ${pixValue} ✅`, fromUser: true, time: getNow(), read: true }]);
    }, 300);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: `Excelente, ${firstName || "cliente"}! 🎉 Tudo certo! Sua solicitação de empréstimo foi finalizada com sucesso. O valor será enviado para a chave Pix informada. Um consultor entrará em contato em breve. Obrigado por escolher a SuperSim! 🚀`,
        fromUser: false, time: getNow(), read: true,
      }]);
    }, 2000);
  };

  const handlePixEdit = (newVal: string) => {
    setPixValue(newVal);
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
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, text: `Obrigado pela mensagem, ${firstName || "cliente"}! Um consultor responderá em instantes. ⏳`,
        fromUser: false, time: getNow(), read: true,
      }]);
    }, 3000);
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
                <PixConfirmCard
                  type={msg.pixConfirm.type}
                  value={pixValue}
                  onConfirm={handlePixConfirm}
                  onEdit={handlePixEdit}
                  confirmed={pixConfirmed}
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
        <div ref={bottomRef} />
      </main>

      <div className="sticky bottom-0 bg-[#F0F0F0] border-t border-border/30 px-3 py-2 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm text-foreground border-none outline-none shadow-sm placeholder:text-muted-foreground"
        />
        <button onClick={handleSend} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md hover:opacity-90 transition-opacity shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
