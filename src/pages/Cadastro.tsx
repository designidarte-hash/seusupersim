import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTransitionNavigate } from "@/components/PageTransition";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { ArrowLeft, UserPlus } from "lucide-react";

const paymentDays = [5, 10, 15, 20, 25];

type CadastroState = {
  cpfData?: Record<string, unknown> | null;
  cadastro?: Record<string, unknown> | null;
  nomeCompleto?: string;
  cpfDigits?: string;
} | null;

const getAutoFilledName = (source: unknown): string => {
  if (!source || typeof source !== "object") return "";

  const data = source as Record<string, unknown>;
  const match = [data.nomeCompleto, data.nome_da_pf, data.nome, data.nome_completo, data.name].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  if (match) return match.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return getAutoFilledName(data.cpfData) || getAutoFilledName(data.cadastro) || getAutoFilledName(data.result);
};

const getStoredName = () => {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("lead_nome_completo")?.trim() ?? "";
};

const Cadastro = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const transitionNavigate = useTransitionNavigate();
  const routeState = (location.state as CadastroState) ?? null;
  const cpfData = routeState?.cpfData ?? null;
  const cpfDigits = routeState?.cpfDigits;
  const autoFilledName = getAutoFilledName(routeState) || getStoredName();
  const [nameTouched, setNameTouched] = useState(false);

  const [form, setForm] = useState(() => ({
    nomeCompleto: autoFilledName,
    email: "",
    celular: "",
    diaPagamento: 10,
  }));

  useEffect(() => {
    if (!autoFilledName || nameTouched) return;

    setForm((prev) =>
      prev.nomeCompleto === autoFilledName ? prev : { ...prev, nomeCompleto: autoFilledName }
    );
  }, [autoFilledName, nameTouched]);

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid =
    form.nomeCompleto.trim().length > 3 &&
    form.email.includes("@") &&
    form.celular.replace(/\D/g, "").length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    transitionNavigate("/simulacao", { cpfData, cpfDigits, cadastro: form });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="bg-primary py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-md shrink-0">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary-foreground">
              Complete seu cadastro
            </h1>
            <p className="text-base text-primary-foreground/70 mt-0.5">
              Preencha seus dados para continuar com a solicitação.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-6"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome Completo */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-foreground">Nome Completo</label>
              <input
                type="text"
                value={form.nomeCompleto}
                onChange={(e) => {
                  setNameTouched(true);
                  update("nomeCompleto", e.target.value);
                }}
                placeholder="Seu nome completo"
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                maxLength={100}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-foreground">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                maxLength={255}
              />
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-foreground">Celular (WhatsApp)</label>
              <input
                type="tel"
                value={form.celular}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  else if (digits.length <= 2 && digits.length > 0) formatted = `(${digits}`;
                  update("celular", formatted);
                }}
                placeholder="(11) 99999-9999"
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                maxLength={15}
              />
            </div>

            {/* Melhor dia de pagamento */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-foreground">Melhor dia para pagamento</label>
              <div className="flex gap-3 flex-wrap">
                {paymentDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => update("diaPagamento", day)}
                    className={`w-14 h-12 rounded-xl border text-sm font-bold transition ${
                      form.diaPagamento === day
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="btn-3d w-full mt-4"
            >
              Continuar
            </button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cadastro;
