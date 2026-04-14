import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import profileImg from "@/assets/profile-s.png";
import { ArrowLeft, Send, Check, CheckCheck, BadgeCheck, Play, Pause } from "lucide-react";

interface ChatMessage {
  id: number;
  text?: string;
  audioSrc?: string;
  fromUser: boolean;
  time: string;
  read: boolean;
}

const getNow = () => {
  const d = new Date();
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const AudioPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
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
        {playing
          ? <Pause className="w-4 h-4 text-primary-foreground" />
          : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
        }
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {duration > 0 ? formatTime(playing ? (audioRef.current?.currentTime || 0) : duration) : "0:00"}
        </span>
      </div>
      <img src={profileImg} alt="" className="w-8 h-8 rounded-full object-contain shrink-0" />
    </div>
  );
};

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { initialMessage, nome } = (location.state as any) || {};
  const firstName = nome ? nome.split(" ")[0] : "";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeTimeout = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 1,
          text: `Olá${firstName ? `, ${firstName}` : ""}! 👋 Seja bem-vindo(a) ao atendimento SuperSim! Estamos aqui para te ajudar com o seu empréstimo. 😊`,
          fromUser: false,
          time: getNow(),
          read: true,
        },
      ]);
    }, 500);

    const audioTimeout = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 2,
          audioSrc: "/audio/welcome.mp3",
          fromUser: false,
          time: getNow(),
          read: true,
        },
      ]);
    }, 2000);

    let userMsgTimeout: ReturnType<typeof setTimeout> | undefined;
    let replyTimeout: ReturnType<typeof setTimeout> | undefined;

    if (initialMessage) {
      userMsgTimeout = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: 3, text: initialMessage, fromUser: true, time: getNow(), read: true },
        ]);
      }, 3500);

      replyTimeout = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 4,
            text: `Recebemos sua solicitação de empréstimo, ${firstName || "cliente"}! ✅ Um de nossos consultores irá analisar e retornar em breve. Fique à vontade para enviar qualquer dúvida aqui!`,
            fromUser: false,
            time: getNow(),
            read: true,
          },
        ]);
      }, 5500);
    }

    return () => {
      clearTimeout(welcomeTimeout);
      clearTimeout(audioTimeout);
      if (userMsgTimeout) clearTimeout(userMsgTimeout);
      if (replyTimeout) clearTimeout(replyTimeout);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now(),
      text: input.trim(),
      fromUser: true,
      time: getNow(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, read: true } : m))
      );
    }, 1500);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `Obrigado pela mensagem, ${firstName || "cliente"}! Um consultor responderá em instantes. ⏳`,
          fromUser: false,
          time: getNow(),
          read: true,
        },
      ]);
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
          <p className="text-primary-foreground font-bold text-base truncate flex items-center gap-1">Atendimento SuperSim <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" /></p>
          <p className="text-primary-foreground/70 text-xs">online</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.fromUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                msg.fromUser
                  ? "bg-[#DCF8C6] text-foreground rounded-tr-sm"
                  : "bg-white text-foreground rounded-tl-sm"
              }`}
            >
              {msg.text && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              )}
              {msg.audioSrc && <AudioPlayer src={msg.audioSrc} />}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                {msg.fromUser && (
                  msg.read
                    ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    : <Check className="w-3.5 h-3.5 text-muted-foreground" />
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
        <button
          onClick={handleSend}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md hover:opacity-90 transition-opacity shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
